from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os
import json
from datetime import datetime
from database import get_db_connection, init_db
from analyzer import analyze_test_paper

app = FastAPI(title="ClassPulse Backend", version="1.1.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Automatically initialize database on start
@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Welcome to ClassPulse API Hub - Diagnostic Assessments & Early Warning Systems"}

# 1. Fetch all collaborating team members
@app.get("/api/users")
def get_users():
    conn = get_db_connection()
    users = conn.execute("SELECT * FROM users").fetchall()
    conn.close()
    return [dict(u) for u in users]

# 2. Fetch all students (with EWS Risk metrics)
@app.get("/api/students")
def get_students():
    conn = get_db_connection()
    students = conn.execute("SELECT * FROM students ORDER BY CASE risk_level WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END").fetchall()
    
    result = []
    for s in students:
        s_dict = dict(s)
        # Add count of learning gaps
        gaps = conn.execute("""
            SELECT status, COUNT(*) as count 
            FROM learning_gaps 
            WHERE student_id = ? 
            GROUP BY status
        """, (s['id'],)).fetchall()
        
        s_dict['gap_summary'] = {g['status']: g['count'] for g in gaps}
        result.append(s_dict)
        
    conn.close()
    return result

# 3. Fetch detailed student profile (with EWS details)
@app.get("/api/students/{student_id}")
def get_student_detail(student_id: int):
    conn = get_db_connection()
    student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
        
    assessments = conn.execute("""
        SELECT a.*, u.name as scanned_by_name 
        FROM assessments a
        LEFT JOIN users u ON a.scanned_by_user_id = u.id
        WHERE a.student_id = ?
        ORDER BY a.assessment_date DESC
    """, (student_id,)).fetchall()
    
    gaps = conn.execute("""
        SELECT * FROM learning_gaps 
        WHERE student_id = ?
    """, (student_id,)).fetchall()
    
    comments = conn.execute("""
        SELECT ta.*, u.name as user_name, u.avatar_url 
        FROM team_activity ta
        JOIN users u ON ta.user_id = u.id
        WHERE ta.student_id = ? AND ta.activity_type = 'comment'
        ORDER BY ta.timestamp DESC
    """, (student_id,)).fetchall()
    
    conn.close()
    
    return {
        "student": dict(student),
        "assessments": [dict(a) for a in assessments],
        "gaps": [dict(g) for g in gaps],
        "comments": [dict(c) for c in comments]
    }

# 4. Upload & Analyze Assessment Sheet + Calculate EWS Risk in Real-time
@app.post("/api/scan")
async def scan_assessment(
    subject: str = Form(...),
    grade: str = Form(...),
    scanned_by_user_id: int = Form(...),
    student_id: int = Form(...),
    file: UploadFile = File(...)
):
    contents = await file.read()
    
    # Run analysis
    try:
        diagnostic = analyze_test_paper(contents, subject, grade)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnostic parsing error: {e}")
        
    conn = get_db_connection()
    try:
        # Check if student exists
        student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Selected student does not exist")
            
        student_data = dict(student)
        
        # 1. Insert into assessments
        cursor = conn.cursor()
        score = diagnostic.get("total_score", 0.0)
        cursor.execute("""
            INSERT INTO assessments (student_id, subject, assessment_date, scanned_by_user_id, total_score, summary)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            student_id,
            subject,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            scanned_by_user_id,
            score,
            diagnostic.get("summary", "")
        ))
        assessment_id = cursor.lastrowid
        
        # 2. Insert learning gaps
        for gap in diagnostic.get("gaps", []):
            cursor.execute("""
                INSERT INTO learning_gaps (assessment_id, student_id, concept, status, misconception_details, remedial_resource)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                assessment_id,
                student_id,
                gap.get("concept", ""),
                gap.get("status", "Needs Improvement"),
                gap.get("misconception_details", ""),
                gap.get("remedial_resource", "")
            ))
            
        # 3. Dynamic Early Warning Risk Engine
        # Algorithm: If score < 5.0 and attendance < 80% -> High Risk
        # If score < 6.0 and attendance < 85% -> Medium Risk
        # Else -> Low Risk
        attendance = student_data.get("attendance_rate", 95.0)
        new_risk = "Low"
        if score < 5.5 and attendance < 80.0:
            new_risk = "High"
        elif score < 7.0 and attendance < 85.0:
            new_risk = "Medium"
        elif score >= 7.5:
            new_risk = "Low"
        else:
            # Fallback to keep existing if unchanged
            new_risk = student_data.get("risk_level", "Low")
            
        cursor.execute("UPDATE students SET risk_level = ? WHERE id = ?", (new_risk, student_id))
        
        # 4. Log collaborative activity
        user = conn.execute("SELECT name FROM users WHERE id = ?", (scanned_by_user_id,)).fetchone()
        user_name = user['name'] if user else "A team member"
        
        cursor.execute("""
            INSERT INTO team_activity (user_id, student_id, activity_type, description)
            VALUES (?, ?, 'scan', ?)
        """, (
            scanned_by_user_id,
            student_id,
            f"{user_name} scanned and analyzed {subject} paper for {student['name']}. Score: {score}/10. Real-time EWS Dropout Risk calculated as '{new_risk}'."
        ))
        
        # Trigger EWS Alert if High Risk
        if new_risk == "High":
            cursor.execute("""
                INSERT INTO team_activity (user_id, student_id, activity_type, description)
                VALUES (?, ?, 'ews_alert', ?)
            """, (
                scanned_by_user_id,
                student_id,
                f"🚨 EARLY WARNING SYSTEM ALERT: {student['name']} is flagged as HIGH DROPOUT RISK. Attendance: {attendance}%, Diagnostic Score: {score}/10."
            ))
            
        conn.commit()
        
        return {
            "success": True,
            "assessment_id": assessment_id,
            "diagnostic": diagnostic,
            "new_risk": new_risk
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 5. Fetch class-level analytics (with EWS Risk distributions)
@app.get("/api/analytics")
def get_analytics():
    conn = get_db_connection()
    # Count of students by gap and concept
    analytics_data = conn.execute("""
        SELECT concept, status, COUNT(*) as student_count 
        FROM learning_gaps
        GROUP BY concept, status
    """).fetchall()
    
    # Calculate average scores per subject
    subject_scores = conn.execute("""
        SELECT subject, AVG(total_score) as avg_score, COUNT(*) as total_scans
        FROM assessments
        GROUP BY subject
    """).fetchall()
    
    # Calculate EWS Risk levels
    risk_counts = conn.execute("""
        SELECT risk_level, COUNT(*) as count 
        FROM students 
        GROUP BY risk_level
    """).fetchall()
    
    conn.close()
    
    # Format learning gap distribution
    formatted_gaps = {}
    for row in analytics_data:
        concept = row['concept']
        if concept not in formatted_gaps:
            formatted_gaps[concept] = {"Mastered": 0, "Needs Improvement": 0, "Critical Gap": 0}
        formatted_gaps[concept][row['status']] = row['student_count']
        
    return {
        "concept_gaps": [{"concept": k, **v} for k, v in formatted_gaps.items()],
        "subject_performances": [dict(s) for s in subject_scores],
        "ews_risks": {r['risk_level']: r['count'] for r in risk_counts}
    }

# 6. Fetch team activities / comments / EWS alerts
@app.get("/api/activity")
def get_activities():
    conn = get_db_connection()
    activities = conn.execute("""
        SELECT ta.*, u.name as user_name, u.avatar_url, s.name as student_name 
        FROM team_activity ta
        JOIN users u ON ta.user_id = u.id
        LEFT JOIN students s ON ta.student_id = s.id
        ORDER BY ta.timestamp DESC
        LIMIT 20
    """).fetchall()
    conn.close()
    return [dict(a) for a in activities]

# 7. Add collaborative comment / assign task
@app.post("/api/comments")
def add_comment(
    user_id: int,
    student_id: int,
    comment_text: str
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    user = conn.execute("SELECT name FROM users WHERE id = ?", (user_id,)).fetchone()
    student = conn.execute("SELECT name FROM students WHERE id = ?", (student_id,)).fetchone()
    
    if not user or not student:
        conn.close()
        raise HTTPException(status_code=404, detail="User or Student not found")
        
    # Log comment activity
    cursor.execute("""
        INSERT INTO team_activity (user_id, student_id, activity_type, description)
        VALUES (?, ?, 'comment', ?)
    """, (
        user_id,
        student_id,
        comment_text
    ))
    
    conn.commit()
    conn.close()
    return {"success": True}

# 8. EWS Trigger Intervention Action (New EWS Collaborative Endpoint)
@app.post("/api/ews/intervene")
def trigger_intervention(
    user_id: int,
    student_id: int,
    intervention_type: str,
    details: str
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    user = conn.execute("SELECT name FROM users WHERE id = ?", (user_id,)).fetchone()
    student = conn.execute("SELECT name FROM students WHERE id = ?", (student_id,)).fetchone()
    
    if not user or not student:
        conn.close()
        raise HTTPException(status_code=404, detail="User or Student not found")
        
    # Log intervention
    description = f"🛠️ COLLABORATIVE EWS INTERVENTION: {user['name']} triggered '{intervention_type}' for {student['name']}. Action Details: {details}."
    cursor.execute("""
        INSERT INTO team_activity (user_id, student_id, activity_type, description)
        VALUES (?, ?, 'intervention', ?)
    """, (
        user_id,
        student_id,
        description
    ))
    
    # Soft reset risk level upon initiating intervention
    cursor.execute("UPDATE students SET risk_level = 'Medium' WHERE id = ? AND risk_level = 'High'", (student_id,))
    
    conn.commit()
    conn.close()
    return {"success": True, "description": description}
