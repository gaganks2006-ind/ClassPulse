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
    
    # 1. Users/Team Members (Supports 5-member collaboration)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'Teacher',
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
    
    # 3. Assessments table
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
    
    # 4. Diagnosed Learning Gaps
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
    
    # 5. Collaborative Team Activity & Interventions (Updated for EWS Alerting)
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
    
    # Seed collaborating team members
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        mock_members = [
            ("Aarav Sharma", "aarav@shiksha.org", "Lead Educator", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav"),
            ("Priya Patel", "priya@shiksha.org", "Co-Teacher", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya"),
            ("Gagan K S", "gagan@shiksha.org", "Assessor", "Active", "https://api.dicebear.com/7.x/adventurer/svg?seed=Gagan"),
            ("Meera Nair", "meera@shiksha.org", "Special Educator", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Meera"),
            ("Vikram Singh", "vikram@shiksha.org", "School Principal", "Offline", "https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram")
        ]
        cursor.executemany("""
            INSERT INTO users (name, email, role, status, avatar_url)
            VALUES (?, ?, ?, ?, ?)
        """, mock_members)
        
    # Seed students with specific EWS indicators (some high risk, some low risk)
    cursor.execute("SELECT COUNT(*) FROM students")
    if cursor.fetchone()[0] == 0:
        mock_students = [
            ("Rahul Kumar", "G3-01", "Grade 3", "A", 72.5, "High"),      # High Risk (Low attendance)
            ("Ananya Rao", "G3-02", "Grade 3", "A", 96.0, "Low"),       # Low Risk
            ("Karan Singh", "G3-03", "Grade 3", "A", 81.0, "Medium"),    # Medium Risk
            ("Diya Sen", "G3-04", "Grade 3", "A", 94.5, "Low"),        # Low Risk
            ("Aditya Joshi", "G3-05", "Grade 3", "A", 68.0, "High")      # High Risk (Very low attendance)
        ]
        cursor.executemany("""
            INSERT INTO students (name, roll_number, grade, section, attendance_rate, risk_level)
            VALUES (?, ?, ?, ?, ?, ?)
        """, mock_students)
        
    conn.commit()
    conn.close()
    print("Database initialized successfully with EWS Risk Schema.")

if __name__ == "__main__":
    init_db()
