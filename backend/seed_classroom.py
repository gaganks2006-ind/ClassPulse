import sqlite3
import os
import random
from datetime import datetime, timedelta

from database import init_db, get_db_connection, DB_PATH

def seed_db():
    # 1. Initialize tables first to make sure they exist
    init_db()
    
    print(f"Connecting to database at: {DB_PATH}")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 2. Clear old data to avoid duplicates
    print("Clearing old classroom data...")
    cursor.execute("DELETE FROM escalations")
    cursor.execute("DELETE FROM parent_alerts")
    cursor.execute("DELETE FROM notifications")
    cursor.execute("DELETE FROM team_activity")
    cursor.execute("DELETE FROM learning_gaps")
    cursor.execute("DELETE FROM assessments")
    cursor.execute("DELETE FROM student_practice_logs")
    cursor.execute("DELETE FROM attendance_records")
    cursor.execute("DELETE FROM classrooms")
    cursor.execute("DELETE FROM students")
    cursor.execute("DELETE FROM users")
    
    # 3. Seed Collaborating Users with exact clean RBAC roles
    print("Seeding team members and mock parent accounts...")
    mock_members = [
        # Staff Members
        (1, "Aarav Sharma", "aarav@shiksha.org", "Class Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav", "password123", None),
        (2, "Priya Patel", "priya@shiksha.org", "Class Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya", "password123", None),
        (3, "Gagan K S", "gagan@shiksha.org", "Subject Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Gagan", "password123", None),
        (4, "Meera Nair", "meera@shiksha.org", "Subject Teacher", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Meera", "password123", None),
        (5, "Vikram Singh", "vikram@shiksha.org", "School Principal", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram", "password123", None),
        # Mock Parent Accounts
        (6, "Ramesh Kumar", "parent.rahul@shiksha.org", "Parent", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Ramesh", "password123", 1), # linked to Rahul Kumar (student 1)
        (7, "Sunitha Rao", "parent.ananya@shiksha.org", "Parent", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Sunitha", "password123", 2), # linked to Ananya Rao (student 2)
        (8, "Vijay Mehta", "parent.kabir@shiksha.org", "Parent", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Vijay", "password123", 8)  # linked to Kabir Mehta (student 8)
    ]
    cursor.executemany("""
        INSERT INTO users (id, name, email, role, status, avatar_url, password, associated_student_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, mock_members)
    
    # 4. Seed Classrooms
    print("Seeding classrooms...")
    mock_classrooms = [
        (1, "Grade 1", "A", 1, "Room 101"),
        (2, "Grade 2", "A", 2, "Room 201"),
        (3, "Grade 3", "A", 1, "Room 301"),  # Aarav Sharma
        (4, "Grade 3", "B", 2, "Room 302"),  # Priya Patel
        (5, "Grade 4", "A", 4, "Room 401"),  # Meera Nair
        (6, "Grade 5", "A", 1, "Room 501"),
        (7, "Grade 6", "A", 2, "Room 601"),
        (8, "Grade 7", "A", 4, "Room 701"),
        (9, "Grade 8", "A", 1, "Room 801"),
        (10, "Grade 9", "A", 2, "Room 901"),
        (11, "Grade 10", "A", 4, "Room 1001")
    ]
    cursor.executemany("""
        INSERT INTO classrooms (id, name, section, class_teacher_id, room_number)
        VALUES (?, ?, ?, ?, ?)
    """, mock_classrooms)
    
    # 5. Seed 26 Students spanning Grades 1 to 10
    print("Seeding 26 students with dynamic EWS risk indicators...")
    mock_students = [
        # Grade 3 Section A (Primary classroom)
        (1, "Rahul Kumar", "G3-01", "Grade 3", "A", 72.5, "High", "password123"),
        (2, "Ananya Rao", "G3-02", "Grade 3", "A", 96.0, "Low", "password123"),
        (3, "Karan Singh", "G3-03", "Grade 3", "A", 81.0, "Medium", "password123"),
        (4, "Diya Sen", "G3-04", "Grade 3", "A", 94.5, "Low", "password123"),
        (5, "Aditya Joshi", "G3-05", "Grade 3", "A", 68.0, "High", "password123"),
        # Grade 3 Section B
        (6, "Rohan Das", "G3-06", "Grade 3", "B", 92.0, "Low", "password123"),
        (7, "Sneha Reddy", "G3-07", "Grade 3", "B", 88.0, "Low", "password123"),
        (8, "Kabir Mehta", "G3-08", "Grade 3", "B", 74.0, "High", "password123"),
        # Grade 4
        (9, "Nisha Nair", "G4-01", "Grade 4", "A", 95.5, "Low", "password123"),
        (10, "Vikram Malhotra", "G4-02", "Grade 4", "A", 83.5, "Medium", "password123"),
        # Grade 1
        (11, "Aanya Sharma", "G1-01", "Grade 1", "A", 95.0, "Low", "password123"),
        (12, "Kavya Goel", "G1-02", "Grade 1", "A", 82.0, "Medium", "password123"),
        # Grade 2
        (13, "Ishaan Patel", "G2-01", "Grade 2", "A", 91.0, "Low", "password123"),
        (14, "Riya Sen", "G2-02", "Grade 2", "A", 74.0, "High", "password123"),
        # Grade 5
        (15, "Aarav Gupta", "G5-01", "Grade 5", "A", 89.0, "Low", "password123"),
        (16, "Tanvi Rao", "G5-02", "Grade 5", "A", 70.0, "High", "password123"),
        # Grade 6
        (17, "Aditi Joshi", "G6-01", "Grade 6", "A", 96.5, "Low", "password123"),
        (18, "Dev Dixit", "G6-02", "Grade 6", "A", 80.5, "Medium", "password123"),
        # Grade 7
        (19, "Siddharth Roy", "G7-01", "Grade 7", "A", 92.0, "Low", "password123"),
        (20, "Khushi Shah", "G7-02", "Grade 7", "A", 77.0, "Medium", "password123"),
        # Grade 8
        (21, "Kabir Kapoor", "G8-01", "Grade 8", "A", 94.0, "Low", "password123"),
        (22, "Prisha Varma", "G8-02", "Grade 8", "A", 69.5, "High", "password123"),
        # Grade 9
        (23, "Ranveer Singh", "G9-01", "Grade 9", "A", 88.0, "Low", "password123"),
        (24, "Meghna Nair", "G9-02", "Grade 9", "A", 81.5, "Medium", "password123"),
        # Grade 10
        (25, "Yash Birla", "G10-01", "Grade 10", "A", 97.0, "Low", "password123"),
        (26, "Shruti Sen", "G10-02", "Grade 10", "A", 65.5, "High", "password123")
    ]
    cursor.executemany("""
        INSERT INTO students (id, name, roll_number, grade, section, attendance_rate, risk_level, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, mock_students)
    
    # 6. Seed Daily Attendance Records (Sync for last 15 school days)
    print("Generating monthly historical attendance logs...")
    school_dates = [
        "2026-05-11", "2026-05-12", "2026-05-13", "2026-05-14", "2026-05-15",
        "2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21", "2026-05-22",
        "2026-05-26", "2026-05-27", "2026-05-28", "2026-05-29", "2026-06-01"
    ]
    
    attendance_inserts = []
    for student in mock_students:
        s_id, name, roll, grade, section, initial_rate, risk, _ = student
        
        # Determine attendance patterns based on risk profile
        for date in school_dates:
            if risk == "High":
                # High risk students are absent 30-40% of the time
                is_present = random.choice([True, False, True, False, True])
            elif risk == "Medium":
                # Medium risk absent ~15-20%
                is_present = random.choice([True, True, True, True, False])
            else:
                # Low risk present >92%
                is_present = random.choice([True, True, True, True, True, True, True, True, True, False])
            
            # Force original preseeded rates for Rahul (s_id=1), Aditya (s_id=5), and Kabir (s_id=8)
            if s_id == 1:
                is_present = date in ["2026-05-11", "2026-05-12", "2026-05-13", "2026-05-14", "2026-05-18", "2026-05-19", "2026-05-21", "2026-05-22", "2026-05-26", "2026-05-27", "2026-06-01"]
            elif s_id == 5:
                is_present = date in ["2026-05-11", "2026-05-12", "2026-05-15", "2026-05-19", "2026-05-20", "2026-05-21", "2026-05-22", "2026-05-28", "2026-06-01"]
            elif s_id == 8:
                is_present = date in ["2026-05-11", "2026-05-12", "2026-05-13", "2026-05-15", "2026-05-18", "2026-05-20", "2026-05-22", "2026-05-26", "2026-05-29", "2026-06-01"]
                
            status = "Present" if is_present else "Absent"
            attendance_inserts.append((s_id, date, status))
            
    cursor.executemany("""
        INSERT INTO attendance_records (student_id, date, status)
        VALUES (?, ?, ?)
    """, attendance_inserts)

    # 7. Seed 3-Month History of Assessments (100+ scans)
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
    start_date = datetime.now() - timedelta(days=60)
    
    # We will generate assessments for all students
    for student in mock_students:
        s_id, s_name, roll, grade, section, rate, risk, _ = student
        
        # Risk modifier
        base_score_modifier = 0
        if risk == "High":
            base_score_modifier = -2.5
        elif risk == "Low":
            base_score_modifier = 2.0
            
        # Create 4 assessments per student
        for i in range(4):
            assess_date = (start_date + timedelta(days=i*15)).strftime("%Y-%m-%d %H:%M:%S")
            subject = subjects[i % 2]
            
            # Determine score
            base_score = 7.0 + base_score_modifier + random.uniform(-1.0, 1.0)
            score = max(2.0, min(10.0, round(base_score, 1)))
            
            # Force preseeded details for Rahul Kumar
            if s_id == 1 and i == 3:
                score = 7.5
                assess_date = "2026-06-01 10:00:00"
                subject = "Mathematics"
                
            scanned_by = random.choice([1, 2, 3]) # Aarav, Priya, or Gagan
            summary = f"Student shows realistic progress. Gaps identified in {subject} logic."
            
            cursor.execute("""
                INSERT INTO assessments (id, student_id, subject, assessment_date, scanned_by_user_id, total_score, summary)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (assessment_id_tracker, s_id, subject, assess_date, scanned_by, score, summary))
            
            # Seed Gaps based on subject
            concepts = concepts_math if subject == "Mathematics" else concepts_eng
            for concept_name, status, desc in concepts:
                actual_status = status
                if risk == "High" and status == "Needs Improvement":
                    actual_status = "Critical Gap"
                elif risk == "Low" and status == "Critical Gap":
                    actual_status = "Mastered"
                    
                # Force specific gaps for Rahul
                if s_id == 1 and i == 3:
                    if concept_name == "Single-digit Addition":
                        actual_status = "Mastered"
                    elif concept_name == "Double-digit Addition with Carry":
                        actual_status = "Needs Improvement"
                    elif concept_name == "Subtraction Borrowing Across Zero":
                        actual_status = "Critical Gap"
                    
                cursor.execute("""
                    INSERT INTO learning_gaps (assessment_id, student_id, concept, status, misconception_details, remedial_resource)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    assessment_id_tracker,
                    s_id,
                    concept_name,
                    actual_status,
                    f"Diagnosed logic misconception: {desc}",
                    "https://diksha.gov.in/resources/fln-bridge-modules"
                ))
                
            assessment_id_tracker += 1

    # 8. Seed Collaborative Team Comments & EWS Alerts
    print("Seeding collaborative comments, parent timeline logs, and active warning warnings...")
    
    # Active high-risk alerts
    for s in mock_students:
        s_id, s_name, roll, grade, section, rate, risk, _ = s
        if risk == "High" and s_id <= 10: # preseeded Grade 3 alerts
            cursor.execute("""
                INSERT INTO team_activity (user_id, student_id, activity_type, description)
                VALUES (?, ?, 'ews_alert', ?)
            """, (
                3, # Gagan K S
                s_id,
                f"🚨 EARLY WARNING SYSTEM ALERT: {s_name} is flagged as HIGH DROPOUT RISK. Attendance: {rate}%, recent test scores indicate high learning regression."
            ))
            
            cursor.execute("""
                INSERT INTO team_activity (user_id, student_id, activity_type, description)
                VALUES (?, ?, 'comment', ?)
            """, (
                1, # Aarav
                s_id,
                f"Class Teacher Aarav Sharma: Let's review {s_name}'s double-digit math worksheets together. Home visit may be necessary."
            ))
            
            cursor.execute("""
                INSERT INTO team_activity (user_id, student_id, activity_type, description)
                VALUES (?, ?, 'comment', ?)
            """, (
                2, # Priya
                s_id,
                f"Co-Teacher Priya Patel: I checked the EWS dashboard. Home Visit plan triggered to talk with parents."
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
    
    # 9. Seed Parent Quiz Practice Logs
    print("Seeding parent quiz practice log timeline...")
    mock_practices = [
        (1, "Mathematics", "Single-digit Addition", 10.0, "2026-05-29 14:10:00"),
        (1, "Mathematics", "Double-digit Addition with Carry", 6.0, "2026-06-01 16:30:00")
    ]
    cursor.executemany("""
        INSERT INTO student_practice_logs (student_id, subject, concept, score, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, mock_practices)
    
    # 10. Seed Escalations for Principal Review
    print("Seeding formal principal escalations...")
    mock_escalations = [
        (1, 1, "Critical dropout risk. Attendance dropped to 72.5% and math test shows severe learning loss.", "Critical", "Open", None),
        (5, 1, "Multiple home absences logged. Reached out to parents but no response. Needs principal home visit.", "High", "Open", None),
        (8, 3, "Attendance boundary alert. Kabir is missing consecutive days in Grade 3-B.", "Medium", "Open", None)
    ]
    for s_id, flagged_by, reason, prio, status, notes in mock_escalations:
        cursor.execute("""
            INSERT INTO escalations (student_id, flagged_by_user_id, reason, priority, status, principal_notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (s_id, flagged_by, reason, prio, status, notes))

    conn.commit()
    conn.close()
    print("Database seeding completed with 100+ assessments, escalations, classrooms, and parent logs!")

if __name__ == "__main__":
    seed_db()
