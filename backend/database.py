import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "nidan.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users/Team Members (Supports 5-member collaboration + CRUD extension)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT CHECK(role IN ('School Principal', 'Class Teacher', 'Subject Teacher')),
            status TEXT DEFAULT 'Offline',
            avatar_url TEXT
        )
    """)
    
    # 2. Students table (Updated with Attendance & Risk Indicators for EWS)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            roll_number TEXT UNIQUE NOT NULL,
            grade TEXT NOT NULL,
            section TEXT NOT NULL,
            attendance_rate REAL DEFAULT 95.0, -- In Percentage (e.g. 74.5)
            risk_level TEXT DEFAULT 'Low' -- 'Low', 'Medium', 'High'
        )
    """)
    
    # 3. Classrooms Table (Core ERP feature)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS classrooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,         -- e.g. 'Grade 3', 'Grade 4'
            section TEXT NOT NULL,      -- e.g. 'A', 'B'
            class_teacher_id INTEGER,   -- Class teacher
            room_number TEXT,
            FOREIGN KEY (class_teacher_id) REFERENCES users(id),
            UNIQUE(name, section)
        )
    """)
    
    # 4. Daily Attendance Records (Core ERP feature)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date TEXT NOT NULL,         -- e.g. '2026-06-02'
            status TEXT NOT NULL CHECK(status IN ('Present', 'Absent')),
            FOREIGN KEY (student_id) REFERENCES students(id),
            UNIQUE(student_id, date)
        )
    """)
    
    # 5. Assessments table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            assessment_date TEXT NOT NULL,
            scanned_by_user_id INTEGER,
            image_path TEXT,
            total_score REAL,
            max_score REAL DEFAULT 10.0,
            summary TEXT,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (scanned_by_user_id) REFERENCES users(id)
        )
    """)
    
    # 6. Diagnosed Learning Gaps
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_gaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assessment_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            concept TEXT NOT NULL,
            status TEXT CHECK(status IN ('Mastered', 'Needs Improvement', 'Critical Gap')),
            misconception_details TEXT,
            remedial_resource TEXT,
            FOREIGN KEY (assessment_id) REFERENCES assessments(id),
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)
    
    # 7. Collaborative Team Activity & Interventions (Updated for EWS Alerting)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS team_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            student_id INTEGER,
            activity_type TEXT NOT NULL, -- 'scan', 'comment', 'ews_alert', 'intervention'
            description TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)
    
    # Seed collaborating team members with cleaned RBAC roles
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        mock_members = [
            ("Aarav Sharma", "aarav@shiksha.org", "Class Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav"),
            ("Priya Patel", "priya@shiksha.org", "Class Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya"),
            ("Gagan K S", "gagan@shiksha.org", "Subject Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Gagan"),
            ("Meera Nair", "meera@shiksha.org", "Subject Teacher", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Meera"),
            ("Vikram Singh", "vikram@shiksha.org", "School Principal", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram")
        ]
        cursor.executemany("""
            INSERT INTO users (name, email, role, status, avatar_url)
            VALUES (?, ?, ?, ?, ?)
        """, mock_members)
        
    # Seed Classrooms (ERP feature)
    cursor.execute("SELECT COUNT(*) FROM classrooms")
    if cursor.fetchone()[0] == 0:
        mock_classrooms = [
            ("Grade 3", "A", 1, "Room 301"),  # Aarav Sharma
            ("Grade 3", "B", 2, "Room 302"),  # Priya Patel
            ("Grade 4", "A", 4, "Room 401")   # Meera Nair
        ]
        cursor.executemany("""
            INSERT INTO classrooms (name, section, class_teacher_id, room_number)
            VALUES (?, ?, ?, ?)
        """, mock_classrooms)
        
    # Seed students with specific EWS indicators (extended to multiple classes)
    cursor.execute("SELECT COUNT(*) FROM students")
    if cursor.fetchone()[0] == 0:
        mock_students = [
            # Grade 3 Section A
            ("Rahul Kumar", "G3-01", "Grade 3", "A", 72.5, "High"),      # High Risk
            ("Ananya Rao", "G3-02", "Grade 3", "A", 96.0, "Low"),       # Low Risk
            ("Karan Singh", "G3-03", "Grade 3", "A", 81.0, "Medium"),    # Medium Risk
            ("Diya Sen", "G3-04", "Grade 3", "A", 94.5, "Low"),        # Low Risk
            ("Aditya Joshi", "G3-05", "Grade 3", "A", 68.0, "High"),     # High Risk
            # Grade 3 Section B
            ("Rohan Das", "G3-06", "Grade 3", "B", 92.0, "Low"),
            ("Sneha Reddy", "G3-07", "Grade 3", "B", 88.0, "Low"),
            ("Kabir Mehta", "G3-08", "Grade 3", "B", 74.0, "High"),
            # Grade 4 Section A
            ("Nisha Nair", "G4-01", "Grade 4", "A", 95.5, "Low"),
            ("Vikram Malhotra", "G4-02", "Grade 4", "A", 83.5, "Medium")
        ]
        cursor.executemany("""
            INSERT INTO students (name, roll_number, grade, section, attendance_rate, risk_level)
            VALUES (?, ?, ?, ?, ?, ?)
        """, mock_students)
        
        # Seed some daily attendance records
        mock_attendance = []
        students_to_seed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        # Seed attendance for last 5 school days
        dates = ["2026-05-26", "2026-05-27", "2026-05-28", "2026-05-29", "2026-06-01"]
        for s_id in students_to_seed:
            for date in dates:
                if s_id == 1:
                    status = "Present" if date in ["2026-05-26", "2026-05-27", "2026-06-01"] else "Absent"
                elif s_id == 5:
                    status = "Present" if date in ["2026-05-28", "2026-06-01"] else "Absent"
                elif s_id == 8:
                    status = "Present" if date in ["2026-05-26", "2026-05-29", "2026-06-01"] else "Absent"
                else:
                    status = "Present"
                mock_attendance.append((s_id, date, status))
                
        cursor.executemany("""
            INSERT OR IGNORE INTO attendance_records (student_id, date, status)
            VALUES (?, ?, ?)
        """, mock_attendance)
        
    conn.commit()
    conn.close()
    print("Database initialized successfully with Classrooms and Attendance Records.")

if __name__ == "__main__":
    init_db()
