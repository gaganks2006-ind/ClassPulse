from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path so database etc can be found
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from database import init_db

# Initialize database to make sure tables exist and have mock data
init_db()

client = TestClient(app)

def test_auth_login_educator():
    # 1. Test Class Teacher Login
    payload = {"username": "aarav@shiksha.org", "password": "password123"}
    res = client.post("/api/auth/login", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert data["user"]["role"] == "Class Teacher"
    assert data["user"]["name"] == "Aarav Sharma"
    print("SUCCESS: Educator auth login test passed!")

def test_auth_login_student():
    # 2. Test Student Roll Number Login
    payload = {"username": "G3-01", "password": "password123"}
    res = client.post("/api/auth/login", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert data["user"]["role"] == "Student"
    assert data["user"]["name"] == "Rahul Kumar"
    assert data["user"]["associated_student_id"] == 1
    print("SUCCESS: Student roll-number auth login test passed!")

def test_auth_login_parent():
    # 3. Test Parent Email Login
    payload = {"username": "parent.rahul@shiksha.org", "password": "password123"}
    res = client.post("/api/auth/login", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert data["user"]["role"] == "Parent"
    assert data["user"]["associated_student_id"] == 1
    print("SUCCESS: Parent email auth login test passed!")

def test_student_practice_resolution():
    # 4. Test Student Practice Quiz Score Log & Dynamic Mastery Resolution
    from database import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    # Reset Rahul's Subtract borrowing gap to Critical Gap first
    cursor.execute("""
        UPDATE learning_gaps 
        SET status = 'Critical Gap' 
        WHERE student_id = 1 AND concept LIKE '%Subtraction Borrowing%'
    """)
    conn.commit()
    conn.close()

    # Submit a high score (9.0/10) to trigger auto-mastery resolution
    payload = {
        "student_id": 1,
        "subject": "Mathematics",
        "concept": "Subtraction Borrowing Across Zero",
        "score": 9.0
    }
    res = client.post("/api/students/practice", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert data["gap_resolved"] is True
    
    # Check database to confirm gap status updated to Mastered
    conn = get_db_connection()
    gap = conn.execute("SELECT status FROM learning_gaps WHERE student_id = 1 AND concept LIKE '%Subtraction Borrowing%'").fetchone()
    assert gap['status'] == 'Mastered', f"Expected gap to be Mastered, got {gap['status']}"
    conn.close()
    
    print("SUCCESS: Student practice homework & dynamic concept mastery recovery test passed!")

def test_parent_child_diagnostic_file():
    # 5. Test Consolidated Kid progress profile for Parents
    res = client.get("/api/parent/child/1")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "student" in data
    assert "assessments" in data
    assert "gaps" in data
    assert "attendance_logs" in data
    assert "interventions" in data
    
    assert data["student"]["name"] == "Rahul Kumar"
    assert isinstance(data["attendance_logs"], list)
    assert len(data["attendance_logs"]) > 0
    print("SUCCESS: Parent private kids progress file test passed!")

def test_get_ews_report():
    response = client.get("/api/ews/report")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert isinstance(data, list), "Response should be a list"
    print("SUCCESS: EWS administrative report tests passed!")

if __name__ == "__main__":
    print("===================================================")
    print("          CLASSPULSE ERP SUITE TEST RUN            ")
    print("===================================================\n")
    test_auth_login_educator()
    test_auth_login_student()
    test_auth_login_parent()
    test_student_practice_resolution()
    test_parent_child_diagnostic_file()
    test_get_ews_report()
    print("\n===================================================")
    print("      ALL PROGRAMMATIC INTEGRATION TESTS PASSED!   ")
    print("===================================================")
