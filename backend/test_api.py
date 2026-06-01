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

def test_get_ews_report():
    # Seed assessments for student 1
    from database import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM assessments WHERE student_id = 1")
    cursor.execute("INSERT INTO assessments (student_id, subject, assessment_date, total_score) VALUES (1, 'Math', '2026-06-01 10:00:00', 8.5)")
    cursor.execute("INSERT INTO assessments (student_id, subject, assessment_date, total_score) VALUES (1, 'Math', '2026-06-01 11:00:00', 7.0)")
    cursor.execute("INSERT INTO assessments (student_id, subject, assessment_date, total_score) VALUES (1, 'Math', '2026-06-01 09:00:00', 6.0)")
    cursor.execute("INSERT INTO assessments (student_id, subject, assessment_date, total_score) VALUES (1, 'Math', '2026-06-01 12:00:00', 9.5)")
    conn.commit()
    conn.close()

    response = client.get("/api/ews/report")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    print("Report Response Data:")
    import json
    print(json.dumps(data, indent=2))
    
    assert isinstance(data, list), "Response should be a list"
    for s in data:
        assert "student_id" in s, "Missing student_id"
        assert "name" in s, "Missing name"
        assert "roll_number" in s, "Missing roll_number"
        assert "grade" in s, "Missing grade"
        assert "section" in s, "Missing section"
        assert "attendance_rate" in s, "Missing attendance_rate"
        assert "risk_level" in s, "Missing risk_level"
        assert "last_3_scores" in s, "Missing last_3_scores"
        assert isinstance(s["last_3_scores"], list), "last_3_scores should be a list"
        assert len(s["last_3_scores"]) <= 3, "last_3_scores should not contain more than 3 elements"
        
    print("\nSUCCESS: All endpoint schema assertions passed!")

def test_get_ews_report_summary():
    response = client.get("/api/ews/report?summary=true")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    assert isinstance(data, dict), "Response should be a dict when summary=true"
    assert "report_date" in data, "Missing report_date in summary"
    assert "total_enrolled" in data, "Missing total_enrolled in summary"
    assert "high_risk_count" in data, "Missing high_risk_count in summary"
    assert "medium_risk_count" in data, "Missing medium_risk_count in summary"
    assert "school_risk_index" in data, "Missing school_risk_index in summary"
    assert "students" in data, "Missing students in summary"
    assert "recent_simulated_alerts" in data, "Missing recent_simulated_alerts in summary"
    
    assert isinstance(data["students"], list), "students should be a list"
    assert isinstance(data["recent_simulated_alerts"], list), "recent_simulated_alerts should be a list"
    
    print("Summary Report Response Data (first student truncated for length):")
    import json
    if data["students"]:
        print(json.dumps({**data, "students": data["students"][:1]}, indent=2))
    else:
        print(json.dumps(data, indent=2))
        
    print("\nSUCCESS: Summary endpoint schema assertions passed!")

if __name__ == "__main__":
    test_get_ews_report()
    test_get_ews_report_summary()
