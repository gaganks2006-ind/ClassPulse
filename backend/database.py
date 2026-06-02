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
    
    # 1. Users/Team Members (Supports Principal, Class Teacher, Subject Teacher, Parent)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT CHECK(role IN ('School Principal', 'Class Teacher', 'Subject Teacher', 'Parent')),
            status TEXT DEFAULT 'Offline',
            avatar_url TEXT,
            password TEXT NOT NULL DEFAULT 'password123',
            associated_student_id INTEGER NULL
        )
    """)
    
    # 2. Students table (Updated with Attendance & Risk Indicators for EWS + Authentication)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            roll_number TEXT UNIQUE NOT NULL,
            grade TEXT NOT NULL,
            section TEXT NOT NULL,
            attendance_rate REAL DEFAULT 95.0, -- In Percentage (e.g. 74.5)
            risk_level TEXT DEFAULT 'Low', -- 'Low', 'Medium', 'High'
            password TEXT NOT NULL DEFAULT 'password123'
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

    # 5. Student Practice Logs (Logs quizzes solved by student on dashboard for Parent Supervision)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_practice_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            subject TEXT NOT NULL,         -- 'Mathematics' or 'English'
            concept TEXT NOT NULL,         -- e.g. 'Double-digit Addition with Carry'
            score REAL NOT NULL,           -- Practice quiz score (out of 10)
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES students(id)
        )
    """)
    
    # 6. Assessments table
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
            ai_confidence_score REAL DEFAULT 0.0,
            remediation_plan TEXT,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (scanned_by_user_id) REFERENCES users(id)
        )
    """)
    
    # 7. Diagnosed Learning Gaps
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
    
    # 8. Collaborative Team Activity & Interventions (Updated for EWS Alerting)
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
    
    # Seed collaborating team members with cleaned RBAC roles (includes mock parents)
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        mock_members = [
            # Staff Members
            ("Aarav Sharma", "aarav@shiksha.org", "Class Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav", "password123", None),
            ("Priya Patel", "priya@shiksha.org", "Class Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya", "password123", None),
            ("Gagan K S", "gagan@shiksha.org", "Subject Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Gagan", "password123", None),
            ("Meera Nair", "meera@shiksha.org", "Subject Teacher", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Meera", "password123", None),
            ("Vikram Singh", "vikram@shiksha.org", "School Principal", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram", "password123", None),
            # Mock Parent Accounts
            ("Ramesh Kumar", "parent.rahul@shiksha.org", "Parent", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Ramesh", "password123", 1), # linked to Rahul Kumar (student 1)
            ("Sunitha Rao", "parent.ananya@shiksha.org", "Parent", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Sunitha", "password123", 2), # linked to Ananya Rao (student 2)
            ("Vijay Mehta", "parent.kabir@shiksha.org", "Parent", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Vijay", "password123", 8)  # linked to Kabir Mehta (student 8)
        ]
        cursor.executemany("""
            INSERT INTO users (name, email, role, status, avatar_url, password, associated_student_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, mock_members)
        
    # Seed Classrooms (ERP feature)
    cursor.execute("SELECT COUNT(*) FROM classrooms")
    if cursor.fetchone()[0] == 0:
        mock_classrooms = [
            ("Grade 1", "A", 1, "Room 101"),
            ("Grade 2", "A", 2, "Room 201"),
            ("Grade 3", "A", 1, "Room 301"),  # Aarav Sharma
            ("Grade 3", "B", 2, "Room 302"),  # Priya Patel
            ("Grade 4", "A", 4, "Room 401"),  # Meera Nair
            ("Grade 5", "A", 1, "Room 501"),
            ("Grade 6", "A", 2, "Room 601"),
            ("Grade 7", "A", 4, "Room 701"),
            ("Grade 8", "A", 1, "Room 801"),
            ("Grade 9", "A", 2, "Room 901"),
            ("Grade 10", "A", 4, "Room 1001")
        ]
        cursor.executemany("""
            INSERT INTO classrooms (name, section, class_teacher_id, room_number)
            VALUES (?, ?, ?, ?)
        """, mock_classrooms)
        
    # Seed students with specific EWS indicators (extended to multiple classes + passwords)
    cursor.execute("SELECT COUNT(*) FROM students")
    if cursor.fetchone()[0] == 0:
        mock_students = [
            # Keep original 10 students first to maintain 100% test compatibility
            ("Rahul Kumar", "G3-01", "Grade 3", "A", 72.5, "High", "password123"),
            ("Ananya Rao", "G3-02", "Grade 3", "A", 96.0, "Low", "password123"),
            ("Karan Singh", "G3-03", "Grade 3", "A", 81.0, "Medium", "password123"),
            ("Diya Sen", "G3-04", "Grade 3", "A", 94.5, "Low", "password123"),
            ("Aditya Joshi", "G3-05", "Grade 3", "A", 68.0, "High", "password123"),
            ("Rohan Das", "G3-06", "Grade 3", "B", 92.0, "Low", "password123"),
            ("Sneha Reddy", "G3-07", "Grade 3", "B", 88.0, "Low", "password123"),
            ("Kabir Mehta", "G3-08", "Grade 3", "B", 74.0, "High", "password123"),
            ("Nisha Nair", "G4-01", "Grade 4", "A", 95.5, "Low", "password123"),
            ("Vikram Malhotra", "G4-02", "Grade 4", "A", 83.5, "Medium", "password123"),
            
            # Additional Grade-level students to cover all Grades 1 to 10
            # Grade 1
            ("Aanya Sharma", "G1-01", "Grade 1", "A", 95.0, "Low", "password123"),
            ("Kavya Goel", "G1-02", "Grade 1", "A", 82.0, "Medium", "password123"),
            # Grade 2
            ("Ishaan Patel", "G2-01", "Grade 2", "A", 91.0, "Low", "password123"),
            ("Riya Sen", "G2-02", "Grade 2", "A", 74.0, "High", "password123"),
            # Grade 5
            ("Aarav Gupta", "G5-01", "Grade 5", "A", 89.0, "Low", "password123"),
            ("Tanvi Rao", "G5-02", "Grade 5", "A", 70.0, "High", "password123"),
            # Grade 6
            ("Aditi Joshi", "G6-01", "Grade 6", "A", 96.5, "Low", "password123"),
            ("Dev Dixit", "G6-02", "Grade 6", "A", 80.5, "Medium", "password123"),
            # Grade 7
            ("Siddharth Roy", "G7-01", "Grade 7", "A", 92.0, "Low", "password123"),
            ("Khushi Shah", "G7-02", "Grade 7", "A", 77.0, "Medium", "password123"),
            # Grade 8
            ("Kabir Kapoor", "G8-01", "Grade 8", "A", 94.0, "Low", "password123"),
            ("Prisha Varma", "G8-02", "Grade 8", "A", 69.5, "High", "password123"),
            # Grade 9
            ("Ranveer Singh", "G9-01", "Grade 9", "A", 88.0, "Low", "password123"),
            ("Meghna Nair", "G9-02", "Grade 9", "A", 81.5, "Medium", "password123"),
            # Grade 10
            ("Yash Birla", "G10-01", "Grade 10", "A", 97.0, "Low", "password123"),
            ("Shruti Sen", "G10-02", "Grade 10", "A", 65.5, "High", "password123")
        ]
        cursor.executemany("""
            INSERT INTO students (name, roll_number, grade, section, attendance_rate, risk_level, password)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, mock_students)
        
        # Seed daily attendance records for all 26 students
        mock_attendance = []
        students_to_seed = list(range(1, 27))
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

        # Seed 2 baseline practice attempts for Rahul Kumar (for parent supervision visual timeline demo)
        mock_practices = [
            (1, "Mathematics", "Single-digit Addition", 10.0, "2026-05-29 14:10:00"),
            (1, "Mathematics", "Double-digit Addition with Carry", 6.0, "2026-06-01 16:30:00")
        ]
        cursor.executemany("""
            INSERT INTO student_practice_logs (student_id, subject, concept, score, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, mock_practices)
        
        # Seed baseline assessments and learning gaps for Rahul Kumar (student_id = 1) so programmatic tests and dashboard have initial diagnostic content
        cursor.execute("SELECT COUNT(*) FROM assessments")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO assessments (id, student_id, subject, assessment_date, scanned_by_user_id, total_score, summary)
                VALUES (1, 1, 'Mathematics', '2026-06-01 10:00:00', 3, 7.5, 'Rahul is progressing but struggles with double digit addition carryover and subtraction borrowing.')
            """)
            cursor.executemany("""
                INSERT INTO learning_gaps (assessment_id, student_id, concept, status, misconception_details, remedial_resource)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [
                (1, 1, "Single-digit Addition", "Mastered", "Can add single digit numbers reliably.", "https://diksha.gov.in/resources/fln-bridge-modules"),
                (1, 1, "Double-digit Addition with Carry", "Needs Improvement", "Sometimes forgets to carry the 1.", "https://diksha.gov.in/resources/fln-bridge-modules"),
                (1, 1, "Subtraction Borrowing Across Zero", "Critical Gap", "Incorrectly subtracts larger number from smaller in units place when borrowing.", "https://diksha.gov.in/resources/fln-bridge-modules")
            ])
            
            # Seed early warning alerts / collaborative comments
            cursor.executemany("""
                INSERT INTO team_activity (user_id, student_id, activity_type, description)
                VALUES (?, ?, ?, ?)
            """, [
                (3, 1, 'ews_alert', '🚨 EARLY WARNING SYSTEM ALERT: Rahul Kumar is flagged as HIGH DROPOUT RISK. Attendance: 72.5%, recent test scores indicate high learning regression.'),
                (1, 1, 'comment', "Chirag, let's review Rahul's double-digit math worksheets together. We need to assign Rathik to run a customized 1-on-1 tutoring session."),
                (2, 1, 'comment', "I checked the EWS dashboard. I've initiated a Home Visit plan with the parents to discuss Rahul's attendance drop.")
            ])
        
    conn.commit()
    conn.close()
    print("Database initialized successfully with parent logins and student practice logs.")

if __name__ == "__main__":
    init_db()
