from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os
import json
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
from database import get_db_connection, init_db
from analyzer import analyze_test_paper

app = FastAPI(title="ClassPulse Backend - Role-Based ERP & Student Center", version="2.5.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALERTS_LOG_PATH = os.path.join(os.path.dirname(__file__), "ews_alerts.log")

# Automatically initialize database on start
@app.on_event("startup")
def startup_event():
    init_db()

# --- Pydantic Models for Role-Based ERP CRUD & Loggers ---
class StudentCreate(BaseModel):
    name: str
    roll_number: str
    grade: str
    section: str
    attendance_rate: Optional[float] = 95.0
    risk_level: Optional[str] = "Low"

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    roll_number: Optional[str] = None
    grade: Optional[str] = None
    section: Optional[str] = None
    attendance_rate: Optional[float] = None
    risk_level: Optional[str] = None

class UserCreate(BaseModel):
    name: str
    email: str
    role: str
    status: Optional[str] = "Offline"
    avatar_url: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    avatar_url: Optional[str] = None

class ClassroomCreate(BaseModel):
    name: str
    section: str
    class_teacher_id: Optional[int] = None
    room_number: Optional[str] = None

class AttendanceEntry(BaseModel):
    student_id: int
    status: str  # 'Present' or 'Absent'

class AttendanceSubmit(BaseModel):
    date: str  # YYYY-MM-DD
    records: List[AttendanceEntry]
    user_id: int  # Teacher taking attendance

class GapCreate(BaseModel):
    concept: str
    status: str
    misconception_details: Optional[str] = ""
    remedial_resource: Optional[str] = ""

class ManualAssessmentCreate(BaseModel):
    student_id: int
    subject: str
    score: float
    summary: Optional[str] = ""
    scanned_by_user_id: int
    ai_confidence_score: Optional[float] = 0.0
    remediation_plan: Optional[str] = ""
    gaps: Optional[List[GapCreate]] = None


# --- Pydantic Models for Authentication & Student practice ---
class LoginRequest(BaseModel):
    username: str  # Can be email (educators/parents) or Roll Number (students, e.g. G3-01)
    password: str

class PracticeSubmit(BaseModel):
    student_id: int
    subject: str
    concept: str
    score: float

# --- CORE BACKEND ROUTES ---

@app.get("/")
def read_root():
    return {
        "message": "Welcome to ClassPulse Role-Based School ERP, Student Center & Supervision Hub",
        "api_version": "2.5.0"
    }

# 1. Login Authentication Endpoint
@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = get_db_connection()
    try:
        # Check if email-based (contains @) -> educator or parent
        if "@" in req.username:
            user = conn.execute("""
                SELECT * FROM users 
                WHERE email = ? AND password = ?
            """, (req.username.strip(), req.password.strip())).fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="Invalid email or password.")
                
            u_dict = dict(user)
            # Remove password from response
            u_dict.pop("password", None)
            return {
                "success": True,
                "user": u_dict
            }
        
        # Else treat as Student Roll Number
        else:
            student = conn.execute("""
                SELECT * FROM students 
                WHERE roll_number = ? AND password = ?
            """, (req.username.strip(), req.password.strip())).fetchone()
            
            if not student:
                raise HTTPException(status_code=401, detail="Invalid Roll Number or password.")
                
            s_dict = dict(student)
            s_dict.pop("password", None)
            
            # Map student schema to session user structure
            return {
                "success": True,
                "user": {
                    "id": s_dict["id"],
                    "name": s_dict["name"],
                    "email": s_dict["roll_number"],
                    "role": "Student",
                    "status": "Active",
                    "avatar_url": f"https://api.dicebear.com/7.x/adventurer/svg?seed={s_dict['name']}",
                    "associated_student_id": s_dict["id"]
                }
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 2. Student Center: Submit Practice Quiz Score (with dynamic gap resolution & parent supervision logging)
@app.post("/api/students/practice")
def submit_practice(data: PracticeSubmit):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        student = conn.execute("SELECT name FROM students WHERE id = ?", (data.student_id,)).fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
            
        student_name = student['name']
        
        # 1. Insert practice record
        cursor.execute("""
            INSERT INTO student_practice_logs (student_id, subject, concept, score)
            VALUES (?, ?, ?, ?)
        """, (data.student_id, data.subject, data.concept, data.score))
        
        gap_resolved = False
        
        # 2. Dynamic Gap Resolution
        if data.score >= 8.0:
            # Check if there are active (Needs Improvement / Critical) gaps matching this concept
            gap = conn.execute("""
                SELECT id FROM learning_gaps 
                WHERE student_id = ? AND concept LIKE ? AND status != 'Mastered'
            """, (data.student_id, f"%{data.concept}%")).fetchone()
            
            if gap:
                cursor.execute("""
                    UPDATE learning_gaps 
                    SET status = 'Mastered', misconception_details = ? 
                    WHERE id = ?
                """, (f"Misconceptions successfully resolved! Completed practice test with score: {data.score}/10.0", gap['id']))
                gap_resolved = True
                
                # Log workspace activity
                cursor.execute("""
                    INSERT INTO team_activity (user_id, student_id, activity_type, description)
                    VALUES (3, ?, 'intervention', ?)
                """, (data.student_id, f"🎓 STUDENT MASTERY RECOVERY: {student_name} solved a dashboard practice quiz in {data.concept} scoring {data.score}/10. Flagged gap resolved to 'Mastered'!"))
        
        conn.commit()
        return {
            "success": True,
            "gap_resolved": gap_resolved,
            "score": data.score,
            "concept": data.concept
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 3. Parent Portal: Fetch specific student logs for real-time Parent Supervision Feed
@app.get("/api/parent/supervise/{student_id}")
def get_parent_supervision(student_id: int):
    conn = get_db_connection()
    try:
        logs = conn.execute("""
            SELECT * FROM student_practice_logs 
            WHERE student_id = ? 
            ORDER BY timestamp DESC
        """, (student_id,)).fetchall()
        return [dict(l) for l in logs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 4. Parent Portal: Fetch private consolidated student profile with calendar attendance lists
@app.get("/api/parent/child/{student_id}")
def get_parent_child_data(student_id: int):
    conn = get_db_connection()
    try:
        student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student record not found")
            
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
        
        # Calendar attendance logs
        attendance_logs = conn.execute("""
            SELECT date, status 
            FROM attendance_records 
            WHERE student_id = ? 
            ORDER BY date DESC
        """, (student_id,)).fetchall()
        
        # Active counseling interventions
        interventions = conn.execute("""
            SELECT ta.*, u.name as user_name 
            FROM team_activity ta
            JOIN users u ON ta.user_id = u.id
            WHERE ta.student_id = ? AND ta.activity_type = 'intervention'
            ORDER BY ta.timestamp DESC
        """, (student_id,)).fetchall()
        
        return {
            "student": dict(student),
            "assessments": [dict(a) for a in assessments],
            "gaps": [dict(g) for g in gaps],
            "attendance_logs": [dict(al) for al in attendance_logs],
            "interventions": [dict(i) for i in interventions]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 5. Fetch all collaborating staff members
@app.get("/api/users")
def get_users():
    conn = get_db_connection()
    users = conn.execute("SELECT * FROM users ORDER BY name ASC").fetchall()
    conn.close()
    return [dict(u) for u in users]

# 6. Staff CRUD: Create Staff
@app.post("/api/users")
def create_user(user: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO users (name, email, role, status, avatar_url)
            VALUES (?, ?, ?, ?, ?)
        """, (user.name, user.email, user.role, user.status, user.avatar_url or f"https://api.dicebear.com/7.x/adventurer/svg?seed={user.name}"))
        conn.commit()
        new_id = cursor.lastrowid
        return {"success": True, "id": new_id}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Staff email must be unique.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 7. Staff CRUD: Update Staff
@app.put("/api/users/{user_id}")
def update_user(user_id: int, user: UserUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        current = cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Staff member not found")
            
        update_data = dict(current)
        for k, v in user.dict(exclude_unset=True).items():
            update_data[k] = v
            
        cursor.execute("""
            UPDATE users 
            SET name = ?, email = ?, role = ?, status = ?, avatar_url = ?
            WHERE id = ?
        """, (update_data['name'], update_data['email'], update_data['role'], update_data['status'], update_data['avatar_url'], user_id))
        conn.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 8. Staff CRUD: Delete Staff
@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        # Unlink teacher from classrooms
        cursor.execute("UPDATE classrooms SET class_teacher_id = NULL WHERE class_teacher_id = ?", (user_id,))
        conn.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 9. Fetch all students (with EWS Risk metrics)
@app.get("/api/students")
def get_students():
    conn = get_db_connection()
    students = conn.execute("""
        SELECT * FROM students 
        ORDER BY CASE risk_level WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, name ASC
    """).fetchall()
    
    result = []
    for s in students:
        s_dict = dict(s)
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

# 10. Fetch detailed student profile (with EWS and diagnostics)
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

# 11. Student CRUD: Create Student
@app.post("/api/students")
def create_student(student: StudentCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO students (name, roll_number, grade, section, attendance_rate, risk_level)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (student.name, student.roll_number, student.grade, student.section, student.attendance_rate, student.risk_level))
        conn.commit()
        new_id = cursor.lastrowid
        return {"success": True, "id": new_id}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Student roll number must be unique.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 12. Student CRUD: Update Student
@app.put("/api/students/{student_id}")
def update_student(student_id: int, student: StudentUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        current = cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Student not found")
            
        update_data = dict(current)
        for k, v in student.dict(exclude_unset=True).items():
            update_data[k] = v
            
        cursor.execute("""
            UPDATE students 
            SET name = ?, roll_number = ?, grade = ?, section = ?, attendance_rate = ?, risk_level = ?
            WHERE id = ?
        """, (update_data['name'], update_data['roll_number'], update_data['grade'], update_data['section'], update_data['attendance_rate'], update_data['risk_level'], student_id))
        conn.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 13. Student CRUD: Delete/Unenroll Student
@app.delete("/api/students/{student_id}")
def delete_student(student_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
        # Cascade clean assessments, gaps, activities, attendance
        cursor.execute("DELETE FROM assessments WHERE student_id = ?", (student_id,))
        cursor.execute("DELETE FROM learning_gaps WHERE student_id = ?", (student_id,))
        cursor.execute("DELETE FROM attendance_records WHERE student_id = ?", (student_id,))
        cursor.execute("DELETE FROM team_activity WHERE student_id = ?", (student_id,))
        conn.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 14. Classroom Manager: List all Classrooms (with student count & teacher name)
@app.get("/api/classrooms")
def get_classrooms():
    conn = get_db_connection()
    try:
        classrooms = conn.execute("""
            SELECT c.*, u.name as class_teacher_name, u.avatar_url as class_teacher_avatar,
                   (SELECT COUNT(*) FROM students s WHERE s.grade = c.name AND s.section = c.section) as student_count
            FROM classrooms c
            LEFT JOIN users u ON c.class_teacher_id = u.id
            ORDER BY c.name ASC, c.section ASC
        """).fetchall()
        return [dict(c) for c in classrooms]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 15. Classroom Manager: Create Classroom
@app.post("/api/classrooms")
def create_classroom(classroom: ClassroomCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO classrooms (name, section, class_teacher_id, room_number)
            VALUES (?, ?, ?, ?)
        """, (classroom.name, classroom.section, classroom.class_teacher_id, classroom.room_number))
        conn.commit()
        new_id = cursor.lastrowid
        return {"success": True, "id": new_id}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Classroom already exists for this Grade and Section.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 16. Attendance Tracker: Get daily attendance sheet for a class
@app.get("/api/attendance")
def get_attendance(grade: str, section: str, date: str):
    conn = get_db_connection()
    try:
        students = conn.execute("""
            SELECT id, name, roll_number 
            FROM students 
            WHERE grade = ? AND section = ? 
            ORDER BY name ASC
        """, (grade, section)).fetchall()
        
        result = []
        for s in students:
            record = conn.execute("""
                SELECT status 
                FROM attendance_records 
                WHERE student_id = ? AND date = ?
            """, (s['id'], date)).fetchone()
            
            result.append({
                "student_id": s['id'],
                "name": s['name'],
                "roll_number": s['roll_number'],
                "status": record['status'] if record else "Present"
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 17. Attendance Tracker: Submit daily attendance with dynamic EWS risk triggers
@app.post("/api/attendance")
def submit_attendance(data: AttendanceSubmit):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        teacher = conn.execute("SELECT name FROM users WHERE id = ?", (data.user_id,)).fetchone()
        teacher_name = teacher['name'] if teacher else "Class Teacher"
        
        for record in data.records:
            # Insert or replace record
            cursor.execute("""
                INSERT INTO attendance_records (student_id, date, status)
                VALUES (?, ?, ?)
                ON CONFLICT(student_id, date) DO UPDATE SET status=excluded.status
            """, (record.student_id, data.date, record.status))
            
            # Recalculate dynamic overall attendance rate
            stats = conn.execute("""
                SELECT 
                    SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as presents,
                    COUNT(*) as total_days
                FROM attendance_records
                WHERE student_id = ?
            """, (record.student_id,)).fetchone()
            
            new_rate = round((stats['presents'] / stats['total_days']) * 100, 1) if stats and stats['total_days'] > 0 else 100.0
            cursor.execute("UPDATE students SET attendance_rate = ? WHERE id = ?", (new_rate, record.student_id))
            
            # Fetch student risk state
            student = conn.execute("SELECT name, risk_level FROM students WHERE id = ?", (record.student_id,)).fetchone()
            
            # Fetch recent assessment score to dynamically evaluate EWS
            last_assessment = conn.execute("""
                SELECT total_score FROM assessments 
                WHERE student_id = ? 
                ORDER BY assessment_date DESC LIMIT 1
            """, (record.student_id,)).fetchone()
            
            score = last_assessment['total_score'] if last_assessment else 8.0
            
            new_risk = "Low"
            if score < 5.5 and new_rate < 80.0:
                new_risk = "High"
            elif score < 7.0 and new_rate < 85.0:
                new_risk = "Medium"
            elif score >= 7.5:
                new_risk = "Low"
            else:
                new_risk = student['risk_level'] if student else "Low"
                
            cursor.execute("UPDATE students SET risk_level = ? WHERE id = ?", (new_risk, record.student_id))
            
            # Trigger principal alerts if student became High Risk
            if new_risk == "High" and student and student['risk_level'] != "High":
                description = f"🚨 EARLY WARNING SYSTEM ALERT: {student['name']} is flagged as HIGH DROPOUT RISK. Attendance: {new_rate}%, Score: {score}/10."
                cursor.execute("""
                    INSERT INTO team_activity (user_id, student_id, activity_type, description)
                    VALUES (?, ?, 'ews_alert', ?)
                """, (data.user_id, record.student_id, description))
                
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                alert_log_entry = (
                    f"[{timestamp}] HIGH-PRIORITY EMAIL NOTIFICATION\n"
                    f"FROM: ClassPulse EWS Engine <alerts@classpulse.org>\n"
                    f"TO: Principal Vikram Singh <vikram@shiksha.org>, Special Educator Meera Nair <meera@shiksha.org>\n"
                    f"SUBJECT: [URGENT] Critical Attendance Drop Detected for Student: {student['name']}\n"
                    f"DIAGNOSTIC METRICS:\n"
                    f" - Student Name: {student['name']}\n"
                    f" - Attendance Rate: {new_rate}%\n"
                    f" - Diagnostic Score: {score}/10\n"
                    f"RECOMMENDED INTERVENTION: Attendance logged on {data.date} by Class Teacher {teacher_name}. Initiate Parent Consultation.\n"
                    f"--------------------------------------------------------------------------------\n\n"
                )
                with open(ALERTS_LOG_PATH, "a", encoding="utf-8") as f:
                    f.write(alert_log_entry)
        
        # Log attendance activity
        cursor.execute("""
            INSERT INTO team_activity (user_id, activity_type, description)
            VALUES (?, 'comment', ?)
        """, (data.user_id, f"📝 {teacher_name} logged attendance checklist for class on {data.date}."))
        
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 18. Exam Center: Log Manual Assessment Scores with dynamic EWS risk calculations
@app.post("/api/assessments/manual")
def record_manual_assessment(data: ManualAssessmentCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        student = conn.execute("SELECT name, attendance_rate, risk_level FROM students WHERE id = ?", (data.student_id,)).fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
            
        student_data = dict(student)
        
        # 1. Insert assessment record
        cursor.execute("""
            INSERT INTO assessments (student_id, subject, assessment_date, scanned_by_user_id, total_score, summary, ai_confidence_score, remediation_plan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.student_id,
            data.subject,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            data.scanned_by_user_id,
            data.score,
            data.summary or f"Manual test score logged in {data.subject} by Evaluator.",
            data.ai_confidence_score or 0.0,
            data.remediation_plan or ""
        ))
        assessment_id = cursor.lastrowid
        
        # 2. Diagnose or insert learning gaps
        if data.gaps is not None and len(data.gaps) > 0:
            for gap in data.gaps:
                cursor.execute("""
                    INSERT INTO learning_gaps (assessment_id, student_id, concept, status, misconception_details, remedial_resource)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    assessment_id,
                    data.student_id,
                    gap.concept,
                    gap.status,
                    gap.misconception_details or "",
                    gap.remedial_resource or ""
                ))
        else:
            # Diagnose learning gaps based on score thresholds (Simulated evaluator)
            if data.score < 5.5:
                cursor.execute("""
                    INSERT INTO learning_gaps (assessment_id, student_id, concept, status, misconception_details, remedial_resource)
                    VALUES (?, ?, ?, 'Critical Gap', ?, 'https://diksha.gov.in/play-based/zero-borrowing-beads-activity')
                """, (
                    assessment_id,
                    data.student_id,
                    f"{data.subject} Foundational Skills",
                    f"Evaluation score ({data.score}/10) indicates severe foundational learning gaps in {data.subject}."
                ))
            elif data.score < 7.0:
                cursor.execute("""
                    INSERT INTO learning_gaps (assessment_id, student_id, concept, status, misconception_details, remedial_resource)
                    VALUES (?, ?, ?, 'Needs Improvement', ?, 'https://diksha.gov.in/resources/place-value-carryover')
                """, (
                    assessment_id,
                    data.student_id,
                    f"{data.subject} Core Competencies",
                    f"Evaluation score ({data.score}/10) indicates minor slips in {data.subject}. Needs reinforcement exercises."
                ))
            else:
                cursor.execute("""
                    INSERT INTO learning_gaps (assessment_id, student_id, concept, status, misconception_details, remedial_resource)
                    VALUES (?, ?, ?, 'Mastered', ?, '')
                """, (
                    assessment_id,
                    data.student_id,
                    f"{data.subject} Mastery",
                    f"Evaluation score ({data.score}/10) confirms solid understanding and fluency in {data.subject}."
                ))

            
        # 3. Dynamic EWS risk engine recalculations
        attendance = student_data.get("attendance_rate", 95.0)
        new_risk = "Low"
        if data.score < 5.5 and attendance < 80.0:
            new_risk = "High"
        elif data.score < 7.0 and attendance < 85.0:
            new_risk = "Medium"
        elif data.score >= 7.5:
            new_risk = "Low"
        else:
            new_risk = student_data.get("risk_level", "Low")
            
        cursor.execute("UPDATE students SET risk_level = ? WHERE id = ?", (new_risk, data.student_id))
        
        # 4. Log workspace activity
        user = conn.execute("SELECT name FROM users WHERE id = ?", (data.scanned_by_user_id,)).fetchone()
        user_name = user['name'] if user else "Subject Teacher"
        
        cursor.execute("""
            INSERT INTO team_activity (user_id, student_id, activity_type, description)
            VALUES (?, ?, 'comment', ?)
        """, (
            data.scanned_by_user_id,
            data.student_id,
            f"🧪 {user_name} recorded manual {data.subject} grade: {data.score}/10. Real-time EWS Risk: '{new_risk}'."
        ))
        
        # 5. Trigger simulated alert if risk became High
        if new_risk == "High" and student_data.get("risk_level") != "High":
            description = f"🚨 EARLY WARNING SYSTEM ALERT: {student_data['name']} is flagged as HIGH DROPOUT RISK. Attendance: {attendance}%, Score: {data.score}/10."
            cursor.execute("""
                INSERT INTO team_activity (user_id, student_id, activity_type, description)
                VALUES (?, ?, 'ews_alert', ?)
            """, (data.scanned_by_user_id, data.student_id, description))
            
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            alert_log_entry = (
                f"[{timestamp}] HIGH-PRIORITY EMAIL NOTIFICATION\n"
                f"FROM: ClassPulse EWS Engine <alerts@classpulse.org>\n"
                f"TO: Principal Vikram Singh <vikram@shiksha.org>, Special Educator Meera Nair <meera@shiksha.org>\n"
                f"SUBJECT: [URGENT] Academic Failure Warning for Student: {student_data['name']}\n"
                f"DIAGNOSTIC METRICS:\n"
                f" - Student Name: {student_data['name']}\n"
                f" - Attendance Rate: {attendance}%\n"
                f" - Subject Exam: {data.subject}\n"
                f" - Score Registered: {data.score}/10\n"
                f"RECOMMENDED INTERVENTION: Subject Teacher {user_name} entered score. Parent Consultation and 1-on-1 tutoring recommended.\n"
                f"--------------------------------------------------------------------------------\n\n"
            )
            with open(ALERTS_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(alert_log_entry)
                
        conn.commit()
        return {"success": True, "assessment_id": assessment_id, "new_risk": new_risk}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 19. Upload & Analyze Assessment Sheet + Calculate EWS Risk in Real-time + Simulate Email Alert
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
        score = diagnostic.get("total_score", 0.0)
        
        # 1. Insert into assessments
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO assessments (student_id, subject, assessment_date, scanned_by_user_id, total_score, summary, ai_confidence_score, remediation_plan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            student_id,
            subject,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            scanned_by_user_id,
            score,
            diagnostic.get("summary", ""),
            diagnostic.get("ai_confidence_score", 0.0),
            diagnostic.get("remediation_plan", "")
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
            
        # 3. Dynamic EWS Risk Engine
        attendance = student_data.get("attendance_rate", 95.0)
        new_risk = "Low"
        if score < 5.5 and attendance < 80.0:
            new_risk = "High"
        elif score < 7.0 and attendance < 85.0:
            new_risk = "Medium"
        elif score >= 7.5:
            new_risk = "Low"
        else:
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
        
        # 5. EWS Simulated Email Alerts Logger
        if new_risk == "High":
            description = f"🚨 EARLY WARNING SYSTEM ALERT: {student['name']} is flagged as HIGH DROPOUT RISK. Attendance: {attendance}%, Diagnostic Score: {score}/10."
            cursor.execute("""
                INSERT INTO team_activity (user_id, student_id, activity_type, description)
                VALUES (?, ?, 'ews_alert', ?)
            """, (
                scanned_by_user_id,
                student_id,
                description
            ))
            
            # Write to simulated ews_alerts.log
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            alert_log_entry = (
                f"[{timestamp}] HIGH-PRIORITY EMAIL NOTIFICATION\n"
                f"FROM: ClassPulse EWS Engine <alerts@classpulse.org>\n"
                f"TO: Principal Vikram Singh <vikram@shiksha.org>, Special Educator Meera Nair <meera@shiksha.org>\n"
                f"SUBJECT: [URGENT] School Dropout Threat Detected for Student: {student['name']}\n"
                f"DIAGNOSTIC METRICS:\n"
                f" - Student Name: {student['name']} (Grade 3)\n"
                f" - Attendance Rate: {attendance}%\n"
                f" - Recent Math Diagnostic Score: {score}/10\n"
                f" - Misconceptions Flagged: Subtraction Borrowing Across Zero\n"
                f"RECOMMENDED INTERVENTION: Immediate Parent Consultation & 1-on-1 Special Tutoring session.\n"
                f"--------------------------------------------------------------------------------\n\n"
            )
            with open(ALERTS_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(alert_log_entry)
            print(f"EWS Simulated email alert logged successfully for {student['name']}.")
            
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

# 19b. Batch Upload & Analyze Assessment Sheets
@app.post("/api/scan/batch")
async def scan_batch(
    subject: str = Form(...),
    grade: str = Form(...),
    scanned_by_user_id: int = Form(...),
    files: List[UploadFile] = File(...)
):
    results = []
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Load all students for this grade to match them
        students_in_grade = conn.execute("SELECT id, name, roll_number, attendance_rate, risk_level FROM students WHERE grade = ?", (grade,)).fetchall()
        students_list = [dict(s) for s in students_in_grade]
        
        for file in files:
            contents = await file.read()
            # Analyze using Gemini/Fallback
            try:
                diagnostic = analyze_test_paper(contents, subject, grade)
            except Exception as e:
                # Log error and continue with next file
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": f"Failed to analyze: {str(e)}"
                })
                continue
                
            score = diagnostic.get("total_score", 0.0)
            extracted_name = diagnostic.get("student_name", "Unknown Student")
            extracted_roll = diagnostic.get("roll_number", "")
            
            # Fuzzy match student
            matched_student = None
            # 1. Exact match on name
            for s in students_list:
                if s["name"].lower() == extracted_name.lower():
                    matched_student = s
                    break
            # 2. Match on roll number
            if not matched_student and extracted_roll:
                for s in students_list:
                    if s["roll_number"].lower() == extracted_roll.lower():
                        matched_student = s
                        break
            # 3. Substring match on name
            if not matched_student:
                for s in students_list:
                    if extracted_name.lower() in s["name"].lower() or s["name"].lower() in extracted_name.lower():
                        matched_student = s
                        break
            
            # Fallback if no match is found: assign to the first student in the class, but mark matched_automatically=False
            matched_automatically = True
            if not matched_student:
                matched_automatically = False
                if students_list:
                    matched_student = students_list[0] # Fallback to first student in grade
                else:
                    results.append({
                        "filename": file.filename,
                        "success": False,
                        "error": f"No students found in grade '{grade}' to associate this scan."
                    })
                    continue
            
            student_id = matched_student["id"]
            
            # Save to assessments table
            cursor.execute("""
                INSERT INTO assessments (student_id, subject, assessment_date, scanned_by_user_id, total_score, summary, ai_confidence_score, remediation_plan)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                student_id,
                subject,
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                scanned_by_user_id,
                score,
                diagnostic.get("summary", ""),
                diagnostic.get("ai_confidence_score", 0.0),
                diagnostic.get("remediation_plan", "")
            ))
            assessment_id = cursor.lastrowid
            
            # Save learning gaps
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
                
            # Dynamic EWS risk engine update
            attendance = matched_student.get("attendance_rate", 95.0)
            new_risk = "Low"
            if score < 5.5 and attendance < 80.0:
                new_risk = "High"
            elif score < 7.0 and attendance < 85.0:
                new_risk = "Medium"
            elif score >= 7.5:
                new_risk = "Low"
            else:
                new_risk = matched_student.get("risk_level", "Low")
                
            cursor.execute("UPDATE students SET risk_level = ? WHERE id = ?", (new_risk, student_id))
            
            # Log team activity
            evaluator = conn.execute("SELECT name FROM users WHERE id = ?", (scanned_by_user_id,)).fetchone()
            evaluator_name = evaluator['name'] if evaluator else "A team member"
            
            cursor.execute("""
                INSERT INTO team_activity (user_id, student_id, activity_type, description)
                VALUES (?, ?, 'scan', ?)
            """, (
                scanned_by_user_id,
                student_id,
                f"📂 [BATCH] {evaluator_name} scanned {subject} sheet for {matched_student['name']} (auto-matched: {matched_automatically}). Score: {score}/10."
            ))
            
            results.append({
                "filename": file.filename,
                "success": True,
                "assessment_id": assessment_id,
                "student_id": student_id,
                "student_name": matched_student["name"],
                "roll_number": matched_student["roll_number"],
                "matched_automatically": matched_automatically,
                "diagnostic": {
                    "total_score": score,
                    "summary": diagnostic.get("summary", ""),
                    "ai_confidence_score": diagnostic.get("ai_confidence_score", 0.0),
                    "remediation_plan": diagnostic.get("remediation_plan", ""),
                    "gaps": diagnostic.get("gaps", [])
                }
            })
            
        conn.commit()
        return {"success": True, "results": results}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 19c. Voice Assessment Endpoint
@app.post("/api/voice-assessment")
async def voice_assessment(
    scanned_by_user_id: int = Form(...),
    file: Optional[UploadFile] = File(None),
    transcription: Optional[str] = Form(None)
):
    """
    Dictation endpoint: accepts either an audio file or direct text transcription.
    Returns structured student diagnostic data that can be committed to the database.
    """
    if not file and not transcription:
        raise HTTPException(status_code=400, detail="Provide either an audio recording or text transcription.")
        
    try:
        if file:
            audio_bytes = await file.read()
            mime_type = file.content_type or "audio/webm"
            from analyzer import transcribe_and_extract_voice_observation
            diagnostic = transcribe_and_extract_voice_observation(audio_bytes, mime_type)
        else:
            from analyzer import parse_voice_observation_text_nlp
            diagnostic = parse_voice_observation_text_nlp(transcription)
            
        # Match student in the database
        conn = get_db_connection()
        student_name = diagnostic.get("student_name", "")
        student = conn.execute("SELECT id, name, roll_number, grade, section FROM students WHERE LOWER(name) LIKE LOWER(?) LIMIT 1", (f"%{student_name}%",)).fetchone()
        
        student_info = None
        if student:
            student_info = dict(student)
            diagnostic["student_id"] = student_info["id"]
            diagnostic["student_name"] = student_info["name"]
            diagnostic["roll_number"] = student_info["roll_number"]
            diagnostic["grade"] = student_info["grade"]
            diagnostic["section"] = student_info["section"]
            diagnostic["matched_automatically"] = True
        else:
            # Pick a fallback first student if not matched
            first_student = conn.execute("SELECT id, name, roll_number, grade, section FROM students LIMIT 1").fetchone()
            if first_student:
                student_info = dict(first_student)
                diagnostic["student_id"] = student_info["id"]
                diagnostic["student_name"] = student_info["name"]
                diagnostic["roll_number"] = student_info["roll_number"]
                diagnostic["grade"] = student_info["grade"]
                diagnostic["section"] = student_info["section"]
                diagnostic["matched_automatically"] = False
            else:
                diagnostic["student_id"] = None
                diagnostic["matched_automatically"] = False
                
        conn.close()
        return diagnostic
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 20. Fetch class-level analytics
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

# 21. Fetch team activities / comments
@app.get("/api/activity")
def get_activities():
    conn = get_db_connection()
    activities = conn.execute("""
        SELECT ta.*, u.name as user_name, u.avatar_url, s.name as student_name 
        FROM team_activity ta
        JOIN users u ON ta.user_id = u.id
        LEFT JOIN students s ON ta.student_id = s.id
        ORDER BY ta.timestamp DESC
        LIMIT 35
    """).fetchall()
    conn.close()
    return [dict(a) for a in activities]

# 22. Add collaborative comment
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

# 23. EWS Trigger Intervention Action
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

# 24. Principal Executive EWS Risk Reporter Endpoint
@app.get("/api/ews/report")
def get_ews_report(summary: bool = False):
    conn = get_db_connection()
    try:
        students = conn.execute("SELECT id, name, roll_number, grade, section, attendance_rate, risk_level FROM students ORDER BY name ASC").fetchall()
        
        report_list = []
        total_high_risk = 0
        total_medium_risk = 0
        
        for s in students:
            scores = conn.execute("""
                SELECT total_score FROM assessments 
                WHERE student_id = ? 
                ORDER BY assessment_date DESC LIMIT 3
            """, (s['id'],)).fetchall()
            
            avg_score = sum(sc['total_score'] for sc in scores) / len(scores) if scores else 0.0
            last_scores = [sc['total_score'] for sc in scores]
            
            s_dict = {
                "student_id": s['id'],
                "id": s['id'],
                "name": s['name'],
                "roll_number": s['roll_number'],
                "grade": s['grade'],
                "section": s['section'],
                "attendance_rate": s['attendance_rate'],
                "risk_level": s['risk_level'],
                "recent_avg_score": round(avg_score, 1),
                "assessment_count": len(scores),
                "last_3_scores": last_scores
            }
            
            if s['risk_level'] == 'High':
                total_high_risk += 1
            elif s['risk_level'] == 'Medium':
                total_medium_risk += 1
                
            report_list.append(s_dict)
            
        if not summary:
            return report_list
            
        recent_simulated_alerts = []
        if os.path.exists(ALERTS_LOG_PATH):
            with open(ALERTS_LOG_PATH, "r", encoding="utf-8") as f:
                content = f.read().strip()
                recent_simulated_alerts = [alert.strip() for alert in content.split("--------------------------------------------------------------------------------") if alert.strip()]
                
        return {
            "report_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_enrolled": len(students),
            "high_risk_count": total_high_risk,
            "medium_risk_count": total_medium_risk,
            "school_risk_index": round(((total_high_risk * 1.0 + total_medium_risk * 0.5) / len(students)) * 100, 1) if students else 0.0,
            "students": report_list,
            "recent_simulated_alerts": recent_simulated_alerts[-5:]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# =====================================================================
# ANALYTICS & REPORTING ENDPOINTS
# =====================================================================

import io
import csv
from fastapi.responses import StreamingResponse

@app.get("/api/analytics/progress-trends")
def get_progress_trends(student_id: int = None):
    """Student Progress Trend Charts - mastery scores over time"""
    conn = get_db_connection()
    try:
        if student_id:
            rows = conn.execute(
                "SELECT a.id as assessment_id, a.assessment_date as date, a.subject, a.total_score as score "
                "FROM assessments a WHERE a.student_id = ? ORDER BY a.assessment_date ASC",
                (student_id,)
            ).fetchall()
            return [dict(r) for r in rows]
        else:
            rows = conn.execute(
                "SELECT a.student_id, s.name as student_name, a.id as assessment_id, "
                "a.assessment_date as date, a.subject, a.total_score as score "
                "FROM assessments a JOIN students s ON a.student_id = s.id "
                "ORDER BY a.student_id, a.assessment_date ASC"
            ).fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/analytics/heatmap")
def get_class_heatmap(grade: str = "Grade 3", section: str = "A"):
    """Class-wide Risk Heatmap - visual grid of student risk levels"""
    conn = get_db_connection()
    try:
        students = conn.execute(
            "SELECT id, name, roll_number, risk_level, attendance_rate FROM students WHERE grade = ? AND section = ?",
            (grade, section)
        ).fetchall()
        result = []
        for s in students:
            avg_score_row = conn.execute(
                "SELECT AVG(total_score) as avg_score FROM assessments WHERE student_id = ?",
                (s["id"],)
            ).fetchone()
            avg_score = round(avg_score_row["avg_score"], 1) if avg_score_row and avg_score_row["avg_score"] else 0.0

            gap_count_row = conn.execute(
                "SELECT COUNT(*) as cnt FROM learning_gaps WHERE student_id = ?",
                (s["id"],)
            ).fetchone()
            gap_count = gap_count_row["cnt"] if gap_count_row else 0

            critical_gap_row = conn.execute(
                "SELECT COUNT(*) as cnt FROM learning_gaps WHERE student_id = ? AND status = 'Critical Gap'",
                (s["id"],)
            ).fetchone()
            critical_gap_count = critical_gap_row["cnt"] if critical_gap_row else 0

            result.append({
                "student_id": s["id"],
                "name": s["name"],
                "roll_number": s["roll_number"],
                "risk_level": s["risk_level"],
                "attendance_rate": s["attendance_rate"],
                "avg_score": avg_score,
                "gap_count": gap_count,
                "critical_gap_count": critical_gap_count
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/analytics/attendance-ews")
def get_attendance_ews(grade: str = "Grade 3", section: str = "A"):
    """Attendance to EWS Integration - daily attendance fed into dropout radar"""
    conn = get_db_connection()
    try:
        students = conn.execute(
            "SELECT id, name, roll_number, risk_level, attendance_rate FROM students WHERE grade = ? AND section = ?",
            (grade, section)
        ).fetchall()
        result = []
        for s in students:
            records = conn.execute(
                "SELECT date, status FROM attendance_records WHERE student_id = ? ORDER BY date ASC",
                (s["id"],)
            ).fetchall()
            attendance_trend = [{"date": r["date"], "status": r["status"]} for r in records]
            total_present = sum(1 for r in records if r["status"] == "Present")
            total_absent = sum(1 for r in records if r["status"] == "Absent")
            absent_dates = [r["date"] for r in records if r["status"] == "Absent"]

            result.append({
                "student_id": s["id"],
                "name": s["name"],
                "attendance_rate": s["attendance_rate"],
                "risk_level": s["risk_level"],
                "absent_dates": absent_dates,
                "total_present": total_present,
                "total_absent": total_absent,
                "attendance_trend": attendance_trend
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/analytics/compare-sections")
def compare_sections(grade: str = "Grade 3"):
    """Comparative Analytics - section A vs B performance side by side"""
    conn = get_db_connection()
    try:
        sections = conn.execute(
            "SELECT DISTINCT section FROM students WHERE grade = ? ORDER BY section",
            (grade,)
        ).fetchall()
        result = []
        for sec in sections:
            section = sec["section"]
            students = conn.execute(
                "SELECT id, attendance_rate, risk_level FROM students WHERE grade = ? AND section = ?",
                (grade, section)
            ).fetchall()
            student_count = len(students)
            if student_count == 0:
                continue
            avg_attendance = round(sum(s["attendance_rate"] for s in students) / student_count, 1)
            high_risk = sum(1 for s in students if s["risk_level"] == "High")
            medium_risk = sum(1 for s in students if s["risk_level"] == "Medium")
            low_risk = sum(1 for s in students if s["risk_level"] == "Low")

            total_score_sum = 0
            total_score_count = 0
            for s in students:
                scores = conn.execute(
                    "SELECT total_score FROM assessments WHERE student_id = ?",
                    (s["id"],)
                ).fetchall()
                for sc in scores:
                    total_score_sum += sc["total_score"]
                    total_score_count += 1
            avg_score = round(total_score_sum / total_score_count, 1) if total_score_count > 0 else 0.0

            result.append({
                "section": section,
                "student_count": student_count,
                "avg_attendance": avg_attendance,
                "avg_score": avg_score,
                "high_risk_count": high_risk,
                "medium_risk_count": medium_risk,
                "low_risk_count": low_risk
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/reports/export")
def export_report(grade: str = "Grade 3", section: str = "A", format: str = "json"):
    """PDF/Excel Report Export - one-click export of class reports"""
    conn = get_db_connection()
    try:
        students = conn.execute(
            "SELECT id, name, roll_number, grade, section, attendance_rate, risk_level FROM students WHERE grade = ? AND section = ?",
            (grade, section)
        ).fetchall()
        report_data = []
        for s in students:
            avg_score_row = conn.execute(
                "SELECT AVG(total_score) as avg_score FROM assessments WHERE student_id = ?",
                (s["id"],)
            ).fetchone()
            avg_score = round(avg_score_row["avg_score"], 1) if avg_score_row and avg_score_row["avg_score"] else 0.0

            critical_gap_row = conn.execute(
                "SELECT COUNT(*) as cnt FROM learning_gaps WHERE student_id = ? AND status = 'Critical Gap'",
                (s["id"],)
            ).fetchone()
            critical_gaps = critical_gap_row["cnt"] if critical_gap_row else 0

            recent_scores_rows = conn.execute(
                "SELECT total_score FROM assessments WHERE student_id = ? ORDER BY assessment_date DESC LIMIT 3",
                (s["id"],)
            ).fetchall()
            recent_scores = ", ".join([str(r["total_score"]) for r in recent_scores_rows]) if recent_scores_rows else "N/A"

            report_data.append({
                "Name": s["name"],
                "Roll Number": s["roll_number"],
                "Grade": s["grade"],
                "Section": s["section"],
                "Attendance Rate": s["attendance_rate"],
                "Risk Level": s["risk_level"],
                "Avg Score": avg_score,
                "Critical Gaps": critical_gaps,
                "Recent Scores": recent_scores
            })

        if format == "csv":
            output = io.StringIO()
            if report_data:
                writer = csv.DictWriter(output, fieldnames=report_data[0].keys())
                writer.writeheader()
                writer.writerows(report_data)
            output.seek(0)
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=ClassPulse_Report_{grade.replace(' ', '_')}_{section}.csv"}
            )
        else:
            return report_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# =====================================================================
# COMMUNICATION & ALERTS ENDPOINTS
# =====================================================================

@app.post("/api/alerts/parent-alert")
def send_parent_alert(data: dict):
    """Parent Alert System - WhatsApp/SMS alert when student enters High Risk"""
    conn = get_db_connection()
    try:
        student_id = data.get("student_id")
        alert_type = data.get("alert_type", "WhatsApp")

        student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Find parent user associated with this student
        parent = conn.execute(
            "SELECT * FROM users WHERE role = 'Parent' AND associated_student_id = ?",
            (student_id,)
        ).fetchone()
        parent_name = parent["name"] if parent else "Parent/Guardian"

        message = (
            f"🚨 CLASSPULSE ALERT: Dear {parent_name}, your child {student['name']} "
            f"(Roll: {student['roll_number']}) has been flagged as {student['risk_level']} Risk. "
            f"Current attendance: {student['attendance_rate']}%. "
            f"Please contact the school for a detailed discussion. "
            f"— ClassPulse EWS System"
        )

        conn.execute(
            "INSERT INTO parent_alerts (student_id, parent_name, alert_type, message, status) VALUES (?, ?, ?, ?, ?)",
            (student_id, parent_name, alert_type, message, "Sent")
        )

        # Also create a notification for the teacher
        conn.execute(
            "INSERT INTO notifications (student_id, type, title, message) VALUES (?, ?, ?, ?)",
            (student_id, "parent_alert",
             f"Parent Alert Sent for {student['name']}",
             f"{alert_type} alert sent to {parent_name} about {student['name']}'s {student['risk_level']} risk status.")
        )

        conn.commit()
        return {
            "status": "success",
            "message": f"{alert_type} alert sent to {parent_name}",
            "alert_preview": message,
            "delivery_status": "Sent"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/alerts/parent-alert-log")
def get_parent_alert_log(student_id: int = None):
    """Get parent alert history"""
    conn = get_db_connection()
    try:
        if student_id:
            rows = conn.execute(
                "SELECT pa.*, s.name as student_name FROM parent_alerts pa JOIN students s ON pa.student_id = s.id WHERE pa.student_id = ? ORDER BY pa.timestamp DESC",
                (student_id,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT pa.*, s.name as student_name FROM parent_alerts pa JOIN students s ON pa.student_id = s.id ORDER BY pa.timestamp DESC"
            ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/notifications")
def get_notifications(unread_only: bool = False):
    """Teacher Notifications - in-app alerts for risk level changes"""
    conn = get_db_connection()
    try:
        if unread_only:
            rows = conn.execute(
                "SELECT n.*, s.name as student_name FROM notifications n LEFT JOIN students s ON n.student_id = s.id WHERE n.is_read = 0 ORDER BY n.timestamp DESC"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT n.*, s.name as student_name FROM notifications n LEFT JOIN students s ON n.student_id = s.id ORDER BY n.timestamp DESC LIMIT 50"
            ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/notifications/mark-read")
def mark_notification_read(data: dict):
    """Mark notification as read"""
    conn = get_db_connection()
    try:
        notification_id = data.get("notification_id")
        mark_all = data.get("mark_all", False)
        if mark_all:
            conn.execute("UPDATE notifications SET is_read = 1 WHERE is_read = 0")
        elif notification_id:
            conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/notifications/count")
def get_notification_count():
    """Get unread notification count"""
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT COUNT(*) as count FROM notifications WHERE is_read = 0").fetchone()
        return {"unread_count": row["count"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/digest/weekly-summary")
def get_weekly_summary(grade: str = "Grade 3", section: str = "A"):
    """Weekly Summary Digest - class health overview for teacher emails"""
    conn = get_db_connection()
    try:
        students = conn.execute(
            "SELECT id, name, roll_number, attendance_rate, risk_level FROM students WHERE grade = ? AND section = ?",
            (grade, section)
        ).fetchall()

        total = len(students)
        high_risk = [s for s in students if s["risk_level"] == "High"]
        medium_risk = [s for s in students if s["risk_level"] == "Medium"]
        low_risk = [s for s in students if s["risk_level"] == "Low"]
        avg_attendance = round(sum(s["attendance_rate"] for s in students) / total, 1) if total > 0 else 0

        # Recent assessments this week
        recent_assessments = conn.execute(
            "SELECT COUNT(*) as cnt FROM assessments a JOIN students s ON a.student_id = s.id WHERE s.grade = ? AND s.section = ? AND a.assessment_date >= date('now', '-7 days')",
            (grade, section)
        ).fetchone()

        # Recent interventions
        recent_interventions = conn.execute(
            "SELECT COUNT(*) as cnt FROM team_activity WHERE activity_type = 'intervention' AND timestamp >= datetime('now', '-7 days')"
        ).fetchone()

        summary = {
            "grade": grade,
            "section": section,
            "report_date": datetime.now().strftime("%Y-%m-%d"),
            "total_students": total,
            "avg_attendance": avg_attendance,
            "high_risk_count": len(high_risk),
            "high_risk_students": [{"name": s["name"], "attendance": s["attendance_rate"]} for s in high_risk],
            "medium_risk_count": len(medium_risk),
            "low_risk_count": len(low_risk),
            "assessments_this_week": recent_assessments["cnt"] if recent_assessments else 0,
            "interventions_this_week": recent_interventions["cnt"] if recent_interventions else 0,
            "health_score": round(((len(low_risk) * 100) / total) if total > 0 else 0, 1),
            "email_subject": f"ClassPulse Weekly Digest — {grade} Section {section} — {datetime.now().strftime('%B %d, %Y')}",
            "email_body": f"Dear Teacher,\n\nHere is your weekly class health summary for {grade}, Section {section}.\n\n"
                         f"📊 Total Students: {total}\n"
                         f"📈 Average Attendance: {avg_attendance}%\n"
                         f"🔴 High Risk: {len(high_risk)} students\n"
                         f"🟡 Medium Risk: {len(medium_risk)} students\n"
                         f"🟢 Low Risk: {len(low_risk)} students\n\n"
                         f"Please review the ClassPulse dashboard for detailed analytics.\n\n"
                         f"— ClassPulse AI System"
        }
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/digest/send-email")
def send_weekly_email(data: dict):
    """Simulate sending weekly digest email"""
    conn = get_db_connection()
    try:
        recipient = data.get("recipient_email", "teacher@school.edu")
        grade = data.get("grade", "Grade 3")
        section = data.get("section", "A")

        # Log it as a notification
        conn.execute(
            "INSERT INTO notifications (type, title, message) VALUES (?, ?, ?)",
            ("digest",
             f"Weekly Digest Sent — {grade} Section {section}",
             f"Weekly summary digest emailed to {recipient} for {grade}, Section {section}.")
        )
        conn.commit()

        return {
            "status": "success",
            "message": f"Weekly digest email sent to {recipient}",
            "simulated": True,
            "note": "In production, this would integrate with SendGrid/SMTP for actual email delivery."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/escalation/flag")
def flag_student_escalation(data: dict):
    """Escalation Workflow - flag a student to the principal"""
    conn = get_db_connection()
    try:
        student_id = data.get("student_id")
        flagged_by = data.get("flagged_by_user_id", 3)
        reason = data.get("reason", "Critical risk level requires principal attention")
        priority = data.get("priority", "High")

        student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        # Check if already escalated and open
        existing = conn.execute(
            "SELECT id FROM escalations WHERE student_id = ? AND status = 'Open'",
            (student_id,)
        ).fetchone()
        if existing:
            return {"status": "already_flagged", "message": f"{student['name']} is already flagged for principal review."}

        conn.execute(
            "INSERT INTO escalations (student_id, flagged_by_user_id, reason, priority) VALUES (?, ?, ?, ?)",
            (student_id, flagged_by, reason, priority)
        )

        # Create notification for principal
        conn.execute(
            "INSERT INTO notifications (user_id, student_id, type, title, message) VALUES (?, ?, ?, ?, ?)",
            (1, student_id, "escalation",
             f"🚨 ESCALATION: {student['name']} flagged for review",
             f"{student['name']} (Roll: {student['roll_number']}) has been escalated with {priority} priority. Reason: {reason}")
        )

        conn.commit()
        return {
            "status": "success",
            "message": f"{student['name']} has been flagged to the principal with {priority} priority."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/escalation/flagged")
def get_flagged_students(status: str = "Open"):
    """Get all escalated/flagged students"""
    conn = get_db_connection()
    try:
        rows = conn.execute(
            "SELECT e.*, s.name as student_name, s.roll_number, s.risk_level, s.attendance_rate, "
            "u.name as flagged_by_name FROM escalations e "
            "JOIN students s ON e.student_id = s.id "
            "JOIN users u ON e.flagged_by_user_id = u.id "
            "WHERE e.status = ? ORDER BY e.timestamp DESC",
            (status,)
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/escalation/resolve")
def resolve_escalation(data: dict):
    """Resolve an escalation"""
    conn = get_db_connection()
    try:
        escalation_id = data.get("escalation_id")
        notes = data.get("principal_notes", "")
        conn.execute(
            "UPDATE escalations SET status = 'Resolved', principal_notes = ?, resolved_at = datetime('now') WHERE id = ?",
            (notes, escalation_id)
        )
        conn.commit()
        return {"status": "success", "message": "Escalation resolved."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
