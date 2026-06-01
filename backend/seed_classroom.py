import sqlite3
import os
import random
from datetime import datetime, timedelta

from database import init_db, get_db_connection, DB_PATH

def seed_db():
    # Initialize tables first to make sure they exist
    init_db()
    
    print(f"Connecting to database at: {DB_PATH}")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Clear old data (Wipe to avoid duplicates)
    print("Clearing old classroom data...")
    cursor.execute("DELETE FROM team_activity")
    cursor.execute("DELETE FROM learning_gaps")
    cursor.execute("DELETE FROM assessments")
    cursor.execute("DELETE FROM students")
    cursor.execute("DELETE FROM users")
    
    # 2. Seed Collaborating Users (The 5 team members)
    print("Seeding 5 active team members...")
    team_members = [
        (1, "Aarav Sharma", "aarav@shiksha.org", "Lead Educator", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav"),
        (2, "Priya Patel", "priya@shiksha.org", "Co-Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya"),
        (3, "Gagan K S", "gagan@shiksha.org", "Assessor", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Gagan"),
        (4, "Meera Nair", "meera@shiksha.org", "Special Educator", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Meera"),
        (5, "Vikram Singh", "vikram@shiksha.org", "School Principal", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram")
    ]
    cursor.executemany("""
        INSERT INTO users (id, name, email, role, status, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?)
    """, team_members)
    
    # 3. Seed 20 Students with diverse attendance and starting risk profiles
    print("Seeding 20 classroom students...")
    students = [
        # Name, Roll, Grade, Sec, Attendance Rate, Initial Risk
        ("Rahul Kumar", "G3-01", "Grade 3", "A", 72.5, "High"),
        ("Ananya Rao", "G3-02", "Grade 3", "A", 96.0, "Low"),
        ("Karan Singh", "G3-03", "Grade 3", "A", 81.0, "Medium"),
        ("Diya Sen", "G3-04", "Grade 3", "A", 94.5, "Low"),
        ("Aditya Joshi", "G3-05", "Grade 3", "A", 68.0, "High"),
        ("Neha Gupta", "G3-06", "Grade 3", "A", 92.0, "Low"),
        ("Arjun Sharma", "G3-07", "Grade 3", "A", 88.5, "Low"),
        ("Sanya Malhotra", "G3-08", "Grade 3", "A", 89.0, "Low"),
        ("Rohan Das", "G3-09", "Grade 3", "A", 78.5, "Medium"),
        ("Pooja Hegde", "G3-10", "Grade 3", "A", 95.0, "Low"),
        ("Vivek Oberoi", "G3-11", "Grade 3", "A", 83.5, "Medium"),
        ("Meenal Jain", "G3-12", "Grade 3", "A", 91.5, "Low"),
        ("Varun Dhawan", "G3-13", "Grade 3", "A", 74.0, "High"),
        ("Kriti Sanon", "G3-14", "Grade 3", "A", 97.5, "Low"),
        ("Siddharth Roy", "G3-15", "Grade 3", "A", 86.0, "Low"),
        ("Tara Sutaria", "G3-16", "Grade 3", "A", 93.0, "Low"),
        ("Ishaan Khatter", "G3-17", "Grade 3", "A", 79.5, "Medium"),
        ("Sara Ali Khan", "G3-18", "Grade 3", "A", 95.5, "Low"),
        ("Kartik Aaryan", "G3-19", "Grade 3", "A", 87.0, "Low"),
        ("Janhvi Kapoor", "G3-20", "Grade 3", "A", 91.0, "Low")
    ]
    
    cursor.executemany("""
        INSERT INTO students (name, roll_number, grade, section, attendance_rate, risk_level)
        VALUES (?, ?, ?, ?, ?, ?)
    """, students)
    
    # Get all student IDs
    cursor.execute("SELECT id, name, attendance_rate, risk_level FROM students")
    student_records = cursor.fetchall()
    
    # 4. Seed 3-Month History of Assessments (80+ scans)
    print("Generating 3-month historical diagnostic assessment scans...")
    subjects = ["Mathematics", "English"]
    concepts_math = [
        ("Single-digit Addition", "Mastered", "Successfully completes arithmetic."),
        ("Double-digit Addition with Carry", "Needs Improvement", "Forgets tens carryover digit."),
        ("Subtraction Borrowing Across Zero", "Critical Gap", "Subtracts smaller digit from larger in ones place.")
    ]
    concepts_eng = [
        ("Sight Word Recognition", "Mastered", "Pronounces all common sight words."),
        ("Consonant Blend Sounding", "Needs Improvement", "Struggles to blend adjacent consonants (e.g. br, str)."),
        ("Reading Fluency", "Critical Gap", "Halts and struggles on multi-syllabic sentences.")
    ]
    
    assessment_id_tracker = 1
    # Run historical scans over last 60 days
    start_date = datetime.now() - timedelta(days=60)
    
    # We will generate ~80 assessments across students
    for student in student_records:
        student_id, student_name, attendance, risk = student
        
        # High Risk students get more low scores, Low Risk gets high scores
        base_score_modifier = 0
        if risk == "High":
            base_score_modifier = -2.5
        elif risk == "Low":
            base_score_modifier = 2.0
            
        # Create 4 assessments per student over history
        for i in range(4):
            days_ago = 60 - (i * 15) - random.randint(0, 3)
            assess_date = (start_date + timedelta(days=i*15)).strftime("%Y-%m-%d %H:%M:%S")
            subject = subjects[i % 2]
            
            # Determine score
            base_score = 7.0 + base_score_modifier + random.uniform(-1.0, 1.0)
            score = max(2.0, min(10.0, round(base_score, 1)))
            
            # Insert assessment
            scanned_by = random.choice([1, 2, 3]) # Aarav, Priya, or Gagan
            summary = f"Student shows realistic progress. Core gaps identified in {subject} logic."
            
            cursor.execute("""
                INSERT INTO assessments (id, student_id, subject, assessment_date, scanned_by_user_id, total_score, summary)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (assessment_id_tracker, student_id, subject, assess_date, scanned_by, score, summary))
            
            # Seed Gaps based on subject
            concepts = concepts_math if subject == "Mathematics" else concepts_eng
            for concept_name, status, desc in concepts:
                # High risk students have critical gaps
                actual_status = status
                if risk == "High" and status == "Needs Improvement":
                    actual_status = "Critical Gap"
                elif risk == "Low" and status == "Critical Gap":
                    actual_status = "Mastered"
                    
                cursor.execute("""
                    INSERT INTO learning_gaps (assessment_id, student_id, concept, status, misconception_details, remedial_resource)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    assessment_id_tracker,
                    student_id,
                    concept_name,
                    actual_status,
                    f"Diagnosed logic misconception: {desc}",
                    "https://diksha.gov.in/resources/fln-bridge-modules"
                ))
                
            assessment_id_tracker += 1
            
    # 5. Seed Collaborative Team Comments & EWS Alerts
    print("Seeding collaborative team comments and active EWS alert logs...")
    
    # Active high-risk alerts
    high_risk_students = [s for s in student_records if s[3] == "High"]
    for s in high_risk_students:
        # 1. Log EWS Alert
        cursor.execute("""
            INSERT INTO team_activity (user_id, student_id, activity_type, description)
            VALUES (?, ?, 'ews_alert', ?)
        """, (
            3, # Gagan K S
            s[0],
            f"🚨 EARLY WARNING SYSTEM ALERT: {s[1]} is flagged as HIGH DROPOUT RISK. Attendance: {s[2]}%, recent test scores indicate high learning regression."
        ))
        
        # 2. Log Collaborative Comments
        cursor.execute("""
            INSERT INTO team_activity (user_id, student_id, activity_type, description)
            VALUES (?, ?, 'comment', ?)
        """, (
            1, # Aarav (Lead)
            s[0],
            f"Chirag, let's review {s[1]}'s double-digit math worksheets together. We need to assign Rathik to run a customized 1-on-1 tutoring session."
        ))
        
        cursor.execute("""
            INSERT INTO team_activity (user_id, student_id, activity_type, description)
            VALUES (?, ?, 'comment', ?)
        """, (
            2, # Priya
            s[0],
            f"I checked the EWS dashboard. I've initiated a Home Visit plan with the parents to discuss {s[1]}'s attendance drop."
        ))
        
    # Standard general activities
    cursor.execute("""
        INSERT INTO team_activity (user_id, student_id, activity_type, description)
        VALUES (3, 1, 'intervention', '🛠️ COLLABORATIVE EWS INTERVENTION: Gagan K S triggered Parent Phone Call for Rahul Kumar. Action Details: Called father; agreed to send Rahul regularly starting Monday.')
    """)
    cursor.execute("""
        INSERT INTO team_activity (user_id, student_id, activity_type, description)
        VALUES (5, 5, 'comment', 'Principal Vikram Singh: I checked the classroom EWS charts today. Excellent work by the teaching team in proactively calling parents.')
    """)
    
    conn.commit()
    conn.close()
    print("Database seeding completed with 80+ assessments and robust EWS records!")

if __name__ == "__main__":
    seed_db()
