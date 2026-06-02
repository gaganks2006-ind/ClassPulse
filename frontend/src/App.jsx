import React, { useState, useEffect } from 'react';
import { 
  PrincipalDashboard, 
  ClassTeacherDashboard, 
  SubjectTeacherDashboard, 
  ParentDashboard 
} from './components/RoleDashboards';
import { 
  Users, 
  TrendingUp, 
  BookOpen, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  MessageSquare, 
  User, 
  Activity, 
  Send, 
  Plus, 
  RefreshCw,
  Award,
  Sparkles,
  BookMarked,
  ShieldAlert,
  Calendar,
  PhoneCall,
  Home,
  UserCheck,
  ClipboardList,
  Printer,
  Download,
  Grid3X3,
  BarChart3,
  FileSpreadsheet,
  Bell,
  Mail,
  LogOut
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

const parseAlert = (alertText) => {
  try {
    const lines = alertText.split('\n');
    const timestampLine = lines[0] || "";
    // Format timestamp [2026-06-01 23:27:39]
    const tsMatch = timestampLine.match(/\[(.*?)\]/);
    const timestamp = tsMatch ? tsMatch[1] : "Recent Alert";
    
    const subjectLine = lines.find(l => l.includes("SUBJECT:")) || "";
    const subject = subjectLine.replace("SUBJECT:", "").trim() || "EWS Risk Alert";
    
    const studentLine = lines.find(l => l.includes("Student Name:")) || "";
    const studentName = studentLine.replace("- Student Name:", "").replace("(Grade 3)", "").trim() || "Student";
    
    return {
      timestamp,
      subject,
      studentName,
      content: alertText
    };
  } catch (e) {
    return {
      timestamp: "Recent",
      subject: "EWS Risk Alert",
      studentName: "Student",
      content: alertText
    };
  }
};

function App() {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [loginUsernameInput, setLoginUsernameInput] = useState("");
  const [loginPasswordInput, setLoginPasswordInput] = useState("");
  const [loginErrorMsg, setLoginErrorMsg] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [analytics, setAnalytics] = useState({ concept_gaps: [], subject_performances: [], ews_risks: { Low: 0, Medium: 0, High: 0 } });
  const [activities, setActivities] = useState([]);
  const [ewsReport, setEwsReport] = useState([]);
  
  // Sorting states for Principal Report
  const [sortKey, setSortKey] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const [showDikshaHub, setShowDikshaHub] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const getAverageScore = (scores) => {
    if (!scores || scores.length === 0) return 0;
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    return sum / scores.length;
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'students', 'scanner'
  const [commentText, setCommentText] = useState("");
  
  // Principal Executive EWS Summary Report states
  const [summaryReport, setSummaryReport] = useState(null);
  const [selectedAlertEmail, setSelectedAlertEmail] = useState(null);
  
  // EWS Intervention Modal State
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [interventionStudent, setInterventionStudent] = useState(null);
  const [interventionType, setInterventionType] = useState("Parent Phone Call");
  const [interventionAssignee, setInterventionAssignee] = useState("");
  const [interventionNotes, setInterventionNotes] = useState("");
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);

  // Worksheet and DIKSHA Modal States
  const [showWorksheetModal, setShowWorksheetModal] = useState(false);
  const [activeWorksheetData, setActiveWorksheetData] = useState(null);
  
  const [showDikshaModal, setShowDikshaModal] = useState(false);
  const [activeDikshaData, setActiveDikshaData] = useState(null);

  // Scan Modal / Form States
  const [scanSubject, setScanSubject] = useState("Mathematics");
  const [scanGrade, setScanGrade] = useState("Grade 3");
  const [scanStudentId, setScanStudentId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Advanced AI & Assessment Features States
  const [scannerMode, setScannerMode] = useState("single"); // "single", "batch", "voice"
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchResults, setBatchResults] = useState(null);
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [voiceTranscription, setVoiceTranscription] = useState("");
  const [voiceDiagnostic, setVoiceDiagnostic] = useState(null);
  const [isVoiceAnalyzing, setIsVoiceAnalyzing] = useState(false);

  // Analytics & Reporting States
  const [analyticsTab, setAnalyticsTab] = useState('trends');
  const [progressTrends, setProgressTrends] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [attendanceEws, setAttendanceEws] = useState([]);
  const [compareSections, setCompareSections] = useState([]);
  const [selectedTrendStudent, setSelectedTrendStudent] = useState('');
  const [compareGrade, setCompareGrade] = useState('Grade 3');
  const [isExporting, setIsExporting] = useState(false);

  // Communication & Alerts States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showParentAlertModal, setShowParentAlertModal] = useState(false);
  const [parentAlertStudent, setParentAlertStudent] = useState(null);
  const [parentAlertType, setParentAlertType] = useState("WhatsApp");
  const [parentAlertLog, setParentAlertLog] = useState([]);
  const [alertLogTab, setAlertLogTab] = useState('all');
  const [isSendingParentAlert, setIsSendingParentAlert] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationStudent, setEscalationStudent] = useState(null);
  const [escalationReason, setEscalationReason] = useState("Critical risk alert requiring immediate principal review.");
  const [escalationPriority, setEscalationPriority] = useState("High");
  const [isEscalating, setIsEscalating] = useState(false);
  const [flaggedStudents, setFlaggedStudents] = useState([]);
  const [weeklyDigest, setWeeklyDigest] = useState(null);
  const [teacherEmail, setTeacherEmail] = useState("teacher@school.edu");
  const [isSendingDigest, setIsSendingDigest] = useState(false);

  // Student Portal States
  const [portalMode, setPortalMode] = useState("staff"); // "staff" | "student"
  const [studentActiveTab, setStudentActiveTab] = useState("dashboard"); // "dashboard" | "practice"
  const [studentSession, setStudentSession] = useState(null);
  const [studentDashboardData, setStudentDashboardData] = useState(null);
  const [isLoadingStudentDashboard, setIsLoadingStudentDashboard] = useState(false);
  const [studentRollNumberInput, setStudentRollNumberInput] = useState("");
  const [studentPasswordInput, setStudentPasswordInput] = useState("");
  const [studentLoginError, setStudentLoginError] = useState("");
  const [studentSelectedSubject, setStudentSelectedSubject] = useState("Mathematics");
  const [studentPracticeQuestions, setStudentPracticeQuestions] = useState(null);
  const [studentActiveQuestionIndex, setStudentActiveQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [studentQuizScore, setStudentQuizScore] = useState(null);
  const [studentQuizCompleted, setStudentQuizCompleted] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [showQuizResultModal, setShowQuizResultModal] = useState(false);
  const [studentNewGoalSubject, setStudentNewGoalSubject] = useState("Mathematics");
  const [studentNewGoalTarget, setStudentNewGoalTarget] = useState("9.0");
  const [isSavingGoal, setIsSavingGoal] = useState(false);


  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetail(selectedStudent.id);
    }
  }, [selectedStudent]);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch Collaborating Users
      const usersRes = await fetch(`${API_BASE}/users`);
      const usersData = await usersRes.json();
      setUsers(usersData);
      if (usersData.length > 0) {
        setInterventionAssignee(usersData[0].id.toString());
      }

      // 2. Fetch Students
      const studentsRes = await fetch(`${API_BASE}/students`);
      const studentsData = await studentsRes.json();
      setStudents(studentsData);
      if (studentsData.length > 0 && !selectedStudent) {
        setSelectedStudent(studentsData[0]);
      }

      // 3. Fetch Analytics
      const analyticsRes = await fetch(`${API_BASE}/analytics`);
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);

      // 4. Fetch Activities
      const activitiesRes = await fetch(`${API_BASE}/activity`);
      const activitiesData = await activitiesRes.json();
      setActivities(activitiesData);

      // 5. Fetch EWS Principal Report
      const reportRes = await fetch(`${API_BASE}/ews/report`);
      const reportData = await reportRes.json();
      setEwsReport(reportData);

      // 6. Fetch Notifications & Escalations
      fetchNotifications();
      fetchFlaggedStudents();
    } catch (e) {
      console.error("Failed to fetch initial data, check API connection.", e);
    }
  };

  const fetchStudentDetail = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`);
      const data = await res.json();
      setStudentDetail(data);
    } catch (e) {
      console.error("Failed to fetch student details", e);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeUser || !selectedStudent) return;

    try {
      const res = await fetch(`${API_BASE}/comments?user_id=${activeUser.id}&student_id=${selectedStudent.id}&comment_text=${encodeURIComponent(commentText)}`, {
        method: 'POST'
      });
      if (res.ok) {
        setCommentText("");
        fetchStudentDetail(selectedStudent.id);
        // Refresh shared feed
        const activitiesRes = await fetch(`${API_BASE}/activity`);
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInterventionSubmit = async (e) => {
    e.preventDefault();
    if (!interventionStudent || !activeUser) return;
    
    setIsSubmittingIntervention(true);
    
    const assigneeName = users.find(u => u.id === parseInt(interventionAssignee))?.name || "assigned educator";
    const detailsText = `${interventionNotes} (Assigned to: ${assigneeName})`;

    try {
      const res = await fetch(`${API_BASE}/ews/intervene?user_id=${activeUser.id}&student_id=${interventionStudent.id}&intervention_type=${encodeURIComponent(interventionType)}&details=${encodeURIComponent(detailsText)}`, {
        method: 'POST'
      });
      if (res.ok) {
        setShowInterventionModal(false);
        setInterventionNotes("");
        fetchInitialData();
        if (selectedStudent && selectedStudent.id === interventionStudent.id) {
          fetchStudentDetail(interventionStudent.id);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit intervention alert.");
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!scanStudentId || !activeUser) {
      alert("Please select a student and ensure a team member is active.");
      return;
    }

    setIsScanning(true);
    setScanSuccess(null);

    const formData = new FormData();
    formData.append("subject", scanSubject);
    formData.append("grade", scanGrade);
    formData.append("scanned_by_user_id", activeUser.id);
    formData.append("student_id", scanStudentId);
    
    const fileToUpload = uploadedFile || new File([new Blob(["test"], { type: "image/jpeg" })], "test_sheet.jpg", { type: "image/jpeg" });
    formData.append("file", fileToUpload);

    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        setScanSuccess(data.diagnostic);
        fetchInitialData();
        if (selectedStudent && selectedStudent.id === parseInt(scanStudentId)) {
          fetchStudentDetail(scanStudentId);
        }
      } else {
        alert("Scan failed: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      alert("Scan failed. Ensure backend server is running on localhost:8000.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleBatchScanSubmit = async (e) => {
    e.preventDefault();
    if (batchFiles.length === 0 || !activeUser) {
      alert("Please select worksheets and ensure a team member is active.");
      return;
    }

    setIsBatchScanning(true);
    setBatchResults(null);

    const formData = new FormData();
    formData.append("subject", scanSubject);
    formData.append("grade", scanGrade);
    formData.append("scanned_by_user_id", activeUser.id);
    
    for (let i = 0; i < batchFiles.length; i++) {
      formData.append("files", batchFiles[i]);
    }

    try {
      const res = await fetch(`${API_BASE}/scan/batch`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        setBatchResults(data.results);
        fetchInitialData();
        alert(`Successfully processed ${data.results.length} worksheets!`);
      } else {
        alert("Batch scan failed: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      alert("Batch scan failed. Ensure backend server is running on localhost:8000.");
    } finally {
      setIsBatchScanning(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await handleVoiceAssessmentSubmit(blob);
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTimer(0);
      
      const interval = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);
      window.recordingInterval = interval;
      
    } catch (err) {
      console.error("Failed to start voice recording", err);
      alert("Microphone access blocked. You can use the Direct Text Observation input box instead!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(window.recordingInterval);
    }
  };

  const handleVoiceAssessmentSubmit = async (audioBlobOrString) => {
    setIsVoiceAnalyzing(true);
    setVoiceDiagnostic(null);

    const formData = new FormData();
    formData.append("scanned_by_user_id", activeUser.id);
    
    if (audioBlobOrString instanceof Blob) {
      formData.append("file", audioBlobOrString, "observation.webm");
    } else if (typeof audioBlobOrString === "string") {
      formData.append("transcription", audioBlobOrString);
    } else {
      if (!voiceTranscription.trim()) {
        alert("Please enter spoken or observed text.");
        setIsVoiceAnalyzing(false);
        return;
      }
      formData.append("transcription", voiceTranscription);
    }

    try {
      const res = await fetch(`${API_BASE}/voice-assessment`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        setVoiceDiagnostic(data);
        setVoiceTranscription(data.transcription || "");
      } else {
        alert("Voice diagnostic failed: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      alert("Voice diagnostic failed. Ensure backend server is running on localhost:8000.");
    } finally {
      setIsVoiceAnalyzing(false);
    }
  };

  const handleCommitVoiceDiagnostic = async () => {
    if (!voiceDiagnostic || !activeUser) return;
    
    const studentId = voiceDiagnostic.student_id;
    if (!studentId) {
      alert("No student could be matched. Please assign a student before committing.");
      return;
    }

    try {
      setIsVoiceAnalyzing(true);
      const payload = {
        student_id: studentId,
        subject: voiceDiagnostic.subject || "Mathematics",
        score: voiceDiagnostic.total_score || 8.0,
        summary: voiceDiagnostic.summary || "Voice diagnostic committed.",
        scanned_by_user_id: activeUser.id,
        ai_confidence_score: voiceDiagnostic.ai_confidence_score || 90.0,
        remediation_plan: voiceDiagnostic.remediation_plan || "",
        gaps: voiceDiagnostic.gaps || []
      };

      const res = await fetch(`${API_BASE}/assessments/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`Successfully committed voice observations for ${voiceDiagnostic.student_name}!`);
        setVoiceDiagnostic(null);
        setVoiceTranscription("");
        
        fetchInitialData();
        const matchedStudentObj = students.find(s => s.id === studentId);
        if (matchedStudentObj) {
          setSelectedStudent(matchedStudentObj);
          fetchStudentDetail(studentId);
        }
        setActiveTab('students');
      } else {
        alert("Failed to commit diagnostic: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      alert("Commit failed. Check backend connections.");
    } finally {
      setIsVoiceAnalyzing(false);
    }
  };

  // Analytics & Reporting Fetch Functions
  const fetchProgressTrends = async (studentId = '') => {
    try {
      const url = studentId ? `${API_BASE}/analytics/progress-trends?student_id=${studentId}` : `${API_BASE}/analytics/progress-trends`;
      const res = await fetch(url);
      const data = await res.json();
      setProgressTrends(data);
    } catch (e) { console.error('Failed to fetch progress trends', e); }
  };

  const fetchHeatmapData = async (grade = 'Grade 3', section = 'A') => {
    try {
      const res = await fetch(`${API_BASE}/analytics/heatmap?grade=${encodeURIComponent(grade)}&section=${section}`);
      const data = await res.json();
      setHeatmapData(data);
    } catch (e) { console.error('Failed to fetch heatmap data', e); }
  };

  const fetchAttendanceEws = async (grade = 'Grade 3', section = 'A') => {
    try {
      const res = await fetch(`${API_BASE}/analytics/attendance-ews?grade=${encodeURIComponent(grade)}&section=${section}`);
      const data = await res.json();
      setAttendanceEws(data);
    } catch (e) { console.error('Failed to fetch attendance EWS', e); }
  };

  const fetchCompareSections = async (grade = 'Grade 3') => {
    try {
      const res = await fetch(`${API_BASE}/analytics/compare-sections?grade=${encodeURIComponent(grade)}`);
      const data = await res.json();
      setCompareSections(data);
    } catch (e) { console.error('Failed to fetch compare sections', e); }
  };

  const handleExportReport = async (format = 'csv') => {
    setIsExporting(true);
    try {
      const res = await fetch(`${API_BASE}/reports/export?grade=${encodeURIComponent(compareGrade)}&format=${format}`);
      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ClassPulse_Report_${compareGrade.replace(' ', '_')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ClassPulse_Report_${compareGrade.replace(' ', '_')}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) { console.error('Export failed', e); alert('Export failed. Check backend connection.'); }
    finally { setIsExporting(false); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`);
      const data = await res.json();
      setNotifications(data);
      const countRes = await fetch(`${API_BASE}/notifications/count`);
      const countData = await countRes.json();
      setUnreadCount(countData.unread_count);
    } catch (e) { console.error("Failed to fetch notifications", e); }
  };

  const markNotificationRead = async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id })
      });
      fetchNotifications();
    } catch (e) { console.error("Failed to mark notification read", e); }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true })
      });
      fetchNotifications();
    } catch (e) { console.error("Failed to mark all read", e); }
  };

  const fetchParentAlertLog = async (studentId) => {
    try {
      const res = await fetch(`${API_BASE}/alerts/parent-alert-log?student_id=${studentId}`);
      const data = await res.json();
      setParentAlertLog(data);
    } catch (e) { console.error("Failed to fetch parent alert log", e); }
  };

  const handleSendParentAlert = async (e) => {
    e.preventDefault();
    if (!parentAlertStudent) return;
    setIsSendingParentAlert(true);
    try {
      const res = await fetch(`${API_BASE}/alerts/parent-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: parentAlertStudent.id,
          alert_type: parentAlertType
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Parent alert successfully triggered!\n\nMessage preview:\n${data.alert_preview}`);
        fetchParentAlertLog(parentAlertStudent.id);
        fetchNotifications();
      } else {
        alert("Failed to send parent alert: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      alert("Alert trigger failed.");
    } finally {
      setIsSendingParentAlert(false);
    }
  };

  const fetchFlaggedStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/escalation/flagged?status=Open`);
      const data = await res.json();
      setFlaggedStudents(data);
    } catch (e) { console.error("Failed to fetch flagged students", e); }
  };

  const handleFlagEscalation = async (e) => {
    e.preventDefault();
    if (!escalationStudent || !activeUser) return;
    setIsEscalating(true);
    try {
      const res = await fetch(`${API_BASE}/escalation/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: escalationStudent.id,
          flagged_by_user_id: activeUser.id,
          reason: escalationReason,
          priority: escalationPriority
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setShowEscalationModal(false);
        fetchNotifications();
        fetchFlaggedStudents();
        fetchInitialData();
      } else {
        alert("Failed to escalate: " + data.detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEscalating(false);
    }
  };

  const handleResolveEscalation = async (escalationId, principalNotes) => {
    try {
      const res = await fetch(`${API_BASE}/escalation/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalation_id: escalationId,
          principal_notes: principalNotes
        })
      });
      if (res.ok) {
        alert("Escalation resolved successfully!");
        fetchFlaggedStudents();
        fetchInitialData();
        fetchNotifications();
      } else {
        alert("Failed to resolve escalation.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWeeklyDigest = async (grade = 'Grade 3', section = 'A') => {
    try {
      const res = await fetch(`${API_BASE}/digest/weekly-summary?grade=${encodeURIComponent(grade)}&section=${section}`);
      const data = await res.json();
      setWeeklyDigest(data);
    } catch (e) { console.error("Failed to fetch weekly digest", e); }
  };

  const handleSendDigestEmail = async (e) => {
    e.preventDefault();
    setIsSendingDigest(true);
    try {
      const res = await fetch(`${API_BASE}/digest/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: teacherEmail,
          grade: weeklyDigest?.grade || 'Grade 3',
          section: weeklyDigest?.section || 'A'
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchNotifications();
      } else {
        alert("Failed to send digest: " + data.detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingDigest(false);
    }
  };

  // --- Student Portal Handlers ---
  const fetchStudentDashboard = async (studentId) => {
    setIsLoadingStudentDashboard(true);
    try {
      const res = await fetch(`${API_BASE}/student/dashboard?student_id=${studentId}`);
      const data = await res.json();
      if (res.ok) {
        setStudentDashboardData(data);
      } else {
        console.error("Failed to load student dashboard", data.detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStudentDashboard(false);
    }
  };

  const handleStudentLogin = async (e) => {
    if (e) e.preventDefault();
    setStudentLoginError("");
    if (!studentRollNumberInput.trim() || !studentPasswordInput.trim()) {
      setStudentLoginError("Please enter both Roll Number and Password.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/student/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll_number: studentRollNumberInput.trim(),
          password: studentPasswordInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStudentSession(data.student);
        fetchStudentDashboard(data.student.id);
        setStudentLoginError("");
      } else {
        setStudentLoginError(data.detail || "Invalid Roll Number or Password.");
      }
    } catch (err) {
      console.error(err);
      setStudentLoginError("Server communication failed. Please check backend.");
    }
  };

  const handleQuickStudentLogin = async (rollNumber) => {
    setStudentLoginError("");
    try {
      const res = await fetch(`${API_BASE}/student/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll_number: rollNumber,
          password: "password123"
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStudentSession(data.student);
        fetchStudentDashboard(data.student.id);
        setStudentLoginError("");
      } else {
        setStudentLoginError(data.detail || "Quick login failed.");
      }
    } catch (err) {
      console.error(err);
      setStudentLoginError("Server communication failed.");
    }
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginErrorMsg("");
    if (!loginUsernameInput.trim() || !loginPasswordInput.trim()) {
      setLoginErrorMsg("Please enter both Username/Roll Number and Password.");
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsernameInput.trim(),
          password: loginPasswordInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const loggedUser = data.user;
        setActiveUser(loggedUser);
        
        // If it's a student (role is 'Student'), sync with the student portal
        if (loggedUser.role === 'Student') {
          try {
            const detailRes = await fetch(`${API_BASE}/students/${loggedUser.id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              setStudentSession(detailData.student);
              fetchStudentDashboard(loggedUser.id);
            } else {
              setStudentSession({
                id: loggedUser.id,
                name: loggedUser.name,
                roll_number: loggedUser.email,
                grade: "Grade 3",
                section: "A",
                attendance_rate: 85.0,
                risk_level: "Medium"
              });
              fetchStudentDashboard(loggedUser.id);
            }
          } catch (err) {
            console.error("Error syncing student details", err);
          }
          setPortalMode("student");
        } else {
          setPortalMode("staff");
          setStudentSession(null);
        }
      } else {
        setLoginErrorMsg(data.detail || "Authentication failed.");
      }
    } catch (err) {
      console.error(err);
      setLoginErrorMsg("Network error. Please make sure the backend server is running.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickDemoLogin = async (username, password) => {
    setLoginUsernameInput(username);
    setLoginPasswordInput(password);
    setLoginErrorMsg("");
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const loggedUser = data.user;
        setActiveUser(loggedUser);
        
        if (loggedUser.role === 'Student') {
          try {
            const detailRes = await fetch(`${API_BASE}/students/${loggedUser.id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              setStudentSession(detailData.student);
              fetchStudentDashboard(loggedUser.id);
            } else {
              setStudentSession({
                id: loggedUser.id,
                name: loggedUser.name,
                roll_number: loggedUser.email,
                grade: "Grade 3",
                section: "A",
                attendance_rate: 85.0,
                risk_level: "Medium"
              });
              fetchStudentDashboard(loggedUser.id);
            }
          } catch (err) {
            console.error(err);
          }
          setPortalMode("student");
        } else {
          setPortalMode("staff");
          setStudentSession(null);
        }
      } else {
        setLoginErrorMsg(data.detail || "Demo login failed.");
      }
    } catch (err) {
      console.error(err);
      setLoginErrorMsg("Network error. Please make sure the backend server is running.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setActiveUser(null);
    setPortalMode("staff");
    setStudentSession(null);
    setStudentDashboardData(null);
    setStudentRollNumberInput("");
    setStudentPasswordInput("");
    setStudentPracticeQuestions(null);
    setStudentAnswers({});
    setStudentQuizScore(null);
    setStudentQuizCompleted(false);
  };

  const handleStudentLogout = () => {
    handleLogout();
  };

  const handleGenerateQuiz = async (subject, concept) => {
    if (!studentSession) return;
    setIsGeneratingQuiz(true);
    setStudentPracticeQuestions(null);
    setStudentAnswers({});
    setStudentQuizScore(null);
    setStudentQuizCompleted(false);
    setStudentActiveQuestionIndex(0);
    
    try {
      const conceptParam = concept ? `&concept=${encodeURIComponent(concept)}` : '';
      const res = await fetch(`${API_BASE}/student/practice-questions?student_id=${studentSession.id}&subject=${encodeURIComponent(subject)}${conceptParam}`);
      const data = await res.json();
      if (res.ok) {
        setStudentPracticeQuestions(data.questions);
        setStudentSelectedSubject(subject);
      } else {
        alert("Failed to load questions: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting server to generate quiz.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAnswerQuestion = (qIndex, option) => {
    setStudentAnswers(prev => ({
      ...prev,
      [qIndex]: option
    }));
  };

  const handleSubmitQuiz = async (concept) => {
    if (!studentSession || !studentPracticeQuestions) return;
    setIsSubmittingQuiz(true);

    let correctCount = 0;
    studentPracticeQuestions.forEach((q, idx) => {
      if (studentAnswers[idx] === q.correct_option) {
        correctCount++;
      }
    });

    const finalScore = (correctCount / studentPracticeQuestions.length) * 10.0;
    
    try {
      const res = await fetch(`${API_BASE}/student/practice-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentSession.id,
          subject: studentSelectedSubject,
          concept: concept || "Practice Session",
          score: finalScore
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStudentQuizScore(finalScore);
        setStudentQuizCompleted(true);
        setShowQuizResultModal(true);
        fetchStudentDashboard(studentSession.id);
      } else {
        alert("Failed to submit score: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting score to server.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!studentSession) return;
    setIsSavingGoal(true);
    try {
      const res = await fetch(`${API_BASE}/student/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentSession.id,
          subject: studentNewGoalSubject,
          target_score: parseFloat(studentNewGoalTarget)
        })
      });
      if (res.ok) {
        alert("Your goal has been set successfully!");
        fetchStudentDashboard(studentSession.id);
      } else {
        const data = await res.json();
        alert("Failed to save goal: " + data.detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingGoal(false);
    }
  };

  const renderStudentPortal = () => {
    if (!studentSession) {
      return (
        <div className="flex-1 min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 text-white animate-scale-up">
            
            <div className="text-center space-y-2">
              <div className="inline-flex p-4 bg-indigo-500/20 text-indigo-300 rounded-3xl border border-indigo-500/30">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
              <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
                ClassPulse Student Portal
              </h1>
              <p className="text-xs text-indigo-200 font-medium tracking-wide">
                NEP 2020 Aligned Remediation & Mastery Hub
              </p>
            </div>

            <form onSubmit={handleStudentLogin} className="space-y-4">
              {studentLoginError && (
                <div className="bg-rose-500/20 border border-rose-500/40 text-rose-200 px-4 py-3 rounded-2xl text-xs font-semibold text-center">
                  {studentLoginError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase text-indigo-300 tracking-wider mb-1.5">
                  Roll Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. G3-01"
                  value={studentRollNumberInput}
                  onChange={(e) => setStudentRollNumberInput(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-indigo-400 focus:bg-white/10 rounded-2xl text-sm text-white placeholder-slate-400 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-indigo-300 tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={studentPasswordInput}
                  onChange={(e) => setStudentPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-indigo-400 focus:bg-white/10 rounded-2xl text-sm text-white placeholder-slate-400 outline-none transition-all"
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setPortalMode("staff")}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-indigo-200 border border-white/10 rounded-2xl text-xs font-bold transition-all"
                >
                  Staff Portal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-650 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Enter Portal
                </button>
              </div>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                Assessors: Quick Login
              </span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-center text-slate-400">
                Choose a pre-seeded student to instantly simulate mode:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "Rahul Kumar", roll: "G3-01", desc: "Grade 3 Math Gap" },
                  { name: "Ananya Rao", roll: "G3-02", desc: "Grade 3 Phonics" },
                  { name: "Tanvi Rao", roll: "G5-02", desc: "Grade 5 High Risk" }
                ].map((demo) => (
                  <button
                    key={demo.roll}
                    type="button"
                    onClick={() => handleQuickStudentLogin(demo.roll)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all hover:scale-[1.03]"
                  >
                    <p className="text-[11px] font-black leading-tight text-indigo-200">{demo.name}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{demo.roll}</p>
                    <p className="text-[8px] text-slate-500 mt-1 truncate">{demo.desc}</p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0b1009] text-slate-100 flex flex-col font-sans relative overflow-hidden">
        {/* Signature 'Jade pebble morning' studio light projections */}
        <div className="absolute left-[-10%] top-[25%] w-[500px] h-[500px] bg-gradient-to-br from-[#7B9669]/15 to-[#BAC8B1]/2 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute right-[-10%] top-[10%] w-[550px] h-[550px] bg-gradient-to-bl from-[#6C8480]/18 to-[#BAC8B1]/2 rounded-full blur-[130px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-[20%] w-[35%] h-[20%] bg-gradient-to-b from-[#7B9669]/6 to-transparent blur-md pointer-events-none z-0" />
        <div className="absolute bottom-0 right-[25%] w-[25%] h-[20%] bg-gradient-to-b from-[#6C8480]/6 to-transparent blur-md pointer-events-none z-0" />
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shadow-xl sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs text-indigo-400 font-extrabold uppercase tracking-widest">Student Portal</span>
              <h1 className="text-base font-black text-white leading-none">{studentSession.name}</h1>
            </div>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-850 space-x-1">
            <button
              onClick={() => setStudentActiveTab("dashboard")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                studentActiveTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📊 My Dashboard
            </button>
            <button
              onClick={() => {
                setStudentActiveTab("practice");
                setStudentPracticeQuestions(null);
                setStudentAnswers({});
                setStudentQuizScore(null);
                setStudentQuizCompleted(false);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                studentActiveTab === "practice"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🧠 AI Practice Room
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-slate-800 border border-slate-700 text-slate-300">
              Roll: {studentSession.roll_number} • {studentSession.grade}
            </span>
            <button
              onClick={handleStudentLogout}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Exit Portal
            </button>
          </div>
        </header>

        {isLoadingStudentDashboard ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center space-y-3">
              <RefreshCw className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
              <p className="text-xs text-slate-450 font-bold">Compiling your classroom self-dashboard...</p>
            </div>
          </div>
        ) : (
          <main className="flex-grow overflow-y-auto p-6 max-w-7xl w-full mx-auto space-y-6">
            {studentActiveTab === "dashboard" && studentDashboardData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-indigo-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                    <div className="space-y-1.5 relative z-10">
                      <div className="inline-flex px-2.5 py-1 bg-white/10 rounded-full text-[9px] font-bold tracking-wider text-indigo-200 uppercase">
                        Welcome Back Champ!
                      </div>
                      <h2 className="text-2xl font-black text-white leading-tight">
                        Keep shining, {studentSession.name}!
                      </h2>
                      <p className="text-xs text-indigo-200/90 leading-relaxed max-w-sm">
                        You have completed <strong className="text-white">{studentDashboardData.stats.total_practices} practice sessions</strong>. Review your concepts below and keep learning!
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Attendance Rate</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        studentSession.attendance_rate >= 90 ? "bg-emerald-500/10 text-emerald-400" :
                        studentSession.attendance_rate >= 75 ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {studentSession.attendance_rate >= 90 ? 'Excellent' : 'Watchlist'}
                      </span>
                    </div>
                    <div className="my-2.5">
                      <h3 className="text-3xl font-black text-white">{studentSession.attendance_rate}%</h3>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">
                        {studentSession.attendance_rate >= 85 ? "🎉 Excellent! Keep attending school daily." : "⚠️ Try to attend more classes to cover learning gaps."}
                      </p>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          studentSession.attendance_rate >= 90 ? "bg-emerald-500" :
                          studentSession.attendance_rate >= 75 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${studentSession.attendance_rate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Avg Practice Score</span>
                      <Award className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="my-2.5">
                      <h3 className="text-3xl font-black text-white">
                        {studentDashboardData.stats.avg_practice_score} <span className="text-sm font-bold text-slate-500">/ 10</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">
                        Computed across all generated self-quizzes.
                      </p>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${studentDashboardData.stats.avg_practice_score * 10}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">My Learning Goals</h3>
                        <p className="text-[10px] text-slate-455">Set target scores and track your growth</p>
                      </div>
                      <BookMarked className="w-5 h-5 text-indigo-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3.5 pr-0 md:pr-4 md:border-r border-slate-800/80">
                        {studentDashboardData.goals.length > 0 ? (
                          studentDashboardData.goals.map((g) => {
                            const pct = Math.min((g.current_progress / g.target_score) * 100, 100);
                            return (
                              <div key={g.id} className="p-3 bg-slate-950 border border-slate-850 rounded-2xl space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className="text-slate-300">{g.subject}</span>
                                  <span className={g.status === "Achieved" ? "text-emerald-400 text-[10px] font-black" : "text-amber-400 text-[10px]"}>
                                    {g.status}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-455">
                                  <span>Current Avg: {g.current_progress.toFixed(1)} / 10</span>
                                  <span>Target: {g.target_score.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${g.status === "Achieved" ? "bg-emerald-500" : "bg-indigo-500"}`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-slate-500 text-xs italic">
                            No learning goals defined yet. Set one on the right!
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-center">
                        <h4 className="text-[11px] font-black uppercase text-indigo-300 tracking-wider mb-3">Set New Target Goal</h4>
                        <form onSubmit={handleSaveGoal} className="space-y-3">
                          <div>
                            <label className="block text-[9px] text-slate-455 uppercase mb-1">Subject</label>
                            <select
                              value={studentNewGoalSubject}
                              onChange={(e) => setStudentNewGoalSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white outline-none"
                            >
                              <option value="Mathematics">Mathematics</option>
                              <option value="English">English</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-455 uppercase mb-1">Target Score (out of 10)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="1"
                              max="10"
                              value={studentNewGoalTarget}
                              onChange={(e) => setStudentNewGoalTarget(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSavingGoal}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-650 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                          >
                            {isSavingGoal ? "Setting..." : "Lock Goal Target"}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Achievement Badges</h3>
                        <p className="text-[10px] text-slate-450">Unlock milestones as you practice</p>
                      </div>
                      <Award className="w-5 h-5 text-indigo-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                      {studentDashboardData.badges.length > 0 ? (
                        studentDashboardData.badges.map((b) => (
                          <div 
                            key={b.id} 
                            className="p-3 bg-slate-950 border border-indigo-950/40 rounded-2xl flex flex-col justify-between text-center relative group overflow-hidden transition-all"
                          >
                            <div className="absolute top-0 right-0 w-8 h-8 bg-brand-500/5 rounded-full blur pointer-events-none"></div>
                            <div className="flex justify-center mb-1">
                              <Sparkles className="w-7 h-7 text-indigo-400" />
                            </div>
                            <h4 className="text-[10px] font-black text-white truncate">{b.badge_name}</h4>
                            <p className="text-[8px] text-slate-455 line-clamp-2 mt-1 leading-normal">{b.badge_description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-slate-500 text-xs italic">
                          Solve practice tests to earn badges!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">My Worksheet Diagnostics Timeline</h3>
                      <p className="text-[10px] text-slate-455">Review teacher feedback and weekly study plans</p>
                    </div>
                    <ClipboardList className="w-5 h-5 text-indigo-400" />
                  </div>

                  <div className="space-y-4">
                    {studentDashboardData.assessments.length > 0 ? (
                      studentDashboardData.assessments.map((a) => (
                        <div key={a.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black text-indigo-300">{a.subject} Test</span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                Scanned on: {new Date(a.assessment_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-xs font-black text-slate-200">
                              Score: <strong className="text-white text-sm">{a.total_score}</strong> / {a.max_score}
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                            " {a.summary} "
                          </p>

                          {a.remediation_plan && (
                            <div className="bg-indigo-950/20 border border-indigo-900/30 p-3.5 rounded-xl text-xs space-y-1.5">
                              <h4 className="font-extrabold text-indigo-300 flex items-center">
                                <Sparkles className="w-3.5 h-3.5 mr-1" /> Personalized Remediation Plan
                              </h4>
                              <p className="text-slate-350 leading-relaxed">{a.remediation_plan}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs italic">
                        No worksheet scans recorded yet. Gaps will appear when teacher uploads scans.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {studentActiveTab === "practice" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4 h-fit">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Personalized Practice Hub</h3>
                    <p className="text-[10px] text-slate-455">Remedial loops mapped to your scanned gaps</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-rose-455 tracking-wider">Identified Learning Gaps</h4>
                    {studentDashboardData?.gaps && studentDashboardData.gaps.length > 0 ? (
                      <div className="space-y-2">
                        {studentDashboardData.gaps.map((gap) => (
                          <button
                            key={gap.id}
                            type="button"
                            onClick={() => handleGenerateQuiz(gap.subject, gap.concept)}
                            className="w-full p-3.5 bg-slate-950 border border-slate-850 hover:border-indigo-500 hover:bg-slate-900 text-left rounded-2xl transition-all duration-200 flex justify-between items-center group cursor-pointer"
                          >
                            <div className="space-y-1 truncate pr-2">
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-800 border border-slate-700 text-slate-400">
                                {gap.subject}
                              </span>
                              <h5 className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors truncate">
                                {gap.concept}
                              </h5>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 font-extrabold rounded-full shrink-0">
                              Practice
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs italic">
                        No critical conceptual gaps recorded. Nice job!
                      </div>
                    )}

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-850"></div>
                      <span className="flex-shrink mx-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        Or Practice General
                      </span>
                      <div className="flex-grow border-t border-slate-850"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleGenerateQuiz("Mathematics", "Mathematics General")}
                        className="py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-indigo-500 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer text-indigo-200"
                      >
                        Math Quiz
                      </button>
                      <button
                        onClick={() => handleGenerateQuiz("English", "English General")}
                        className="py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-indigo-500 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer text-indigo-200"
                      >
                        English Phonics
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg min-h-[450px] flex flex-col">
                  {isGeneratingQuiz ? (
                    <div className="flex-1 flex flex-col justify-center items-center space-y-3">
                      <Sparkles className="w-10 h-10 animate-spin text-indigo-400" />
                      <p className="text-xs text-indigo-200 font-bold animate-pulse text-center">
                        ClassPulse AI formulation engine generating 5 tailored practice MCQs...
                      </p>
                    </div>
                  ) : studentPracticeQuestions ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400">
                            Practice Mode
                          </span>
                          <h3 className="text-xs font-extrabold text-white mt-1">Topic: {studentSelectedSubject}</h3>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          Question {studentActiveQuestionIndex + 1} of {studentPracticeQuestions.length}
                        </span>
                      </div>

                      <div className="my-6 space-y-6 flex-grow">
                        <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl">
                          <h4 className="text-sm font-bold text-white leading-relaxed">
                            {studentPracticeQuestions[studentActiveQuestionIndex].question}
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {Object.entries(studentPracticeQuestions[studentActiveQuestionIndex].options).map(([key, optText]) => {
                            const isSelected = studentAnswers[studentActiveQuestionIndex] === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleAnswerQuestion(studentActiveQuestionIndex, key)}
                                className={`w-full p-4 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                                  isSelected 
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-md" 
                                    : "bg-slate-950 border-slate-850 text-slate-350 hover:bg-slate-900"
                                }`}
                              >
                                <span>{key}) {optText}</span>
                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                        <button
                          type="button"
                          disabled={studentActiveQuestionIndex === 0}
                          onClick={() => setStudentActiveQuestionIndex(prev => prev - 1)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-xs font-bold transition-all text-slate-300 cursor-pointer"
                        >
                          Previous
                        </button>

                        {studentActiveQuestionIndex < studentPracticeQuestions.length - 1 ? (
                          <button
                            type="button"
                            disabled={!studentAnswers[studentActiveQuestionIndex]}
                            onClick={() => setStudentActiveQuestionIndex(prev => prev + 1)}
                            className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 rounded-xl text-xs font-bold transition-all text-white cursor-pointer"
                          >
                            Next Question
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={Object.keys(studentAnswers).length < studentPracticeQuestions.length || isSubmittingQuiz}
                            onClick={() => handleSubmitQuiz(studentDashboardData?.gaps?.[0]?.concept || "FLN Practice")}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl text-xs font-bold transition-all text-white cursor-pointer shadow"
                          >
                            {isSubmittingQuiz ? "Evaluating..." : "Evaluate Quiz"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                      <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/10 text-indigo-400">
                        <BookOpen className="w-12 h-12 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Select a Learning Gap to Practice</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-normal">
                          Choose an identified gap card on the left panel, or click one of the general subjects.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        )}

        {showQuizResultModal && studentQuizScore !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-center animate-scale-up">
              <div className="space-y-2">
                <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-3xl border border-emerald-500/20">
                  <Award className="w-10 h-10 animate-bounce" />
                </div>
                <h2 className="text-xl font-black text-white">Remedial Quiz Evaluated!</h2>
                <p className="text-xs text-slate-450">Performance metrics updated successfully</p>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl max-w-xs mx-auto">
                <p className="text-[10px] font-black uppercase text-slate-550 tracking-wider">Your Score</p>
                <h3 className="text-4xl font-black text-emerald-400 my-1">{studentQuizScore.toFixed(0)} <span className="text-base font-bold text-slate-550">/ 10</span></h3>
                <p className="text-[11px] font-bold text-slate-350">
                  {studentQuizScore >= 8.0 ? "🌟 Brilliant! Highly developed mastery." :
                   studentQuizScore >= 6.0 ? "👍 Good effort! Review the explanations." :
                   "💪 Keep practicing to improve!"}
                </p>
              </div>

              <div className="space-y-3 text-left max-h-40 overflow-y-auto pr-1 border-t border-b border-slate-850 py-3">
                {studentPracticeQuestions.map((q, idx) => {
                  const isCorrect = studentAnswers[idx] === q.correct_option;
                  return (
                    <div key={idx} className="p-3 bg-slate-950/50 rounded-xl border border-slate-850 text-[11px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-200">Q{idx+1}: {q.question}</span>
                        <span className={isCorrect ? "text-emerald-400" : "text-rose-400"}>
                          {isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                      <p className="text-indigo-200/90 leading-relaxed font-medium bg-indigo-950/20 p-2 rounded-lg border border-indigo-950/30">
                        {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowQuizResultModal(false);
                  setStudentPracticeQuestions(null);
                  setStudentAnswers({});
                  setStudentQuizScore(null);
                  setStudentActiveTab("dashboard");
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-650 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
              >
                Back to My Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLoginScreen = () => {
    const demoAccounts = [
      {
        role: "School Principal",
        name: "Vikram Singh",
        username: "vikram@shiksha.org",
        password: "password123",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram",
        desc: "High-level overview & EWS Dropout Reports"
      },
      {
        role: "Class Teacher",
        name: "Aarav Sharma",
        username: "aarav@shiksha.org",
        password: "password123",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav",
        desc: "Classroom cockpit, scan exams, parents CRM"
      },
      {
        role: "Subject Teacher",
        name: "Gagan K S",
        username: "gagan@shiksha.org",
        password: "password123",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Gagan",
        desc: "Remediation planning & gap tracking"
      },
      {
        role: "Parent",
        name: "Ramesh Kumar (Parent)",
        username: "parent.rahul@shiksha.org",
        password: "password123",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ramesh",
        desc: "Supervise practice, review alerts & analytics"
      },
      {
        role: "Student",
        name: "Rahul Kumar (Student)",
        username: "G3-01",
        password: "password123",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rahul",
        desc: "Practice Room & mastery milestones"
      }
    ];

    return (
      <div className="bg-[#0b1009] min-h-screen relative overflow-hidden flex flex-col justify-center items-center p-4 md:p-8 font-sans select-none">
        {/* Signature 'Jade pebble morning' studio light projections */}
        
        {/* Left glowing mint-jade spotlight */}
        <div className="absolute left-[-15%] top-[30%] w-[600px] h-[600px] bg-gradient-to-br from-[#7B9669]/25 to-[#BAC8B1]/5 rounded-full blur-[130px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '6s' }} />
        
        {/* Right glowing muted sage/slate spotlight */}
        <div className="absolute right-[-10%] top-[-10%] w-[650px] h-[650px] bg-gradient-to-bl from-[#6C8480]/30 to-[#BAC8B1]/5 rounded-full blur-[140px] pointer-events-none z-0" />

        {/* Ambient bottom floor light floor reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-[22%] bg-gradient-to-t from-[#040803] via-[#091007]/90 to-[#0b1009]/10 pointer-events-none z-0" />
        
        {/* Glowing floor horizon separator line */}
        <div className="absolute bottom-[22%] left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#7B9669]/50 to-transparent shadow-[0_0_20px_rgba(123,150,105,0.45)] pointer-events-none z-0" />

        {/* Diffused reflective floor spotlights */}
        <div className="absolute bottom-0 left-[10%] w-[45%] h-[22%] bg-gradient-to-b from-[#7B9669]/10 to-transparent blur-md pointer-events-none z-0" />
        <div className="absolute bottom-0 right-[15%] w-[35%] h-[22%] bg-gradient-to-b from-[#6C8480]/10 to-transparent blur-md pointer-events-none z-0" />

        <div className="max-w-xl w-full z-10 space-y-6">
          {/* Frosted glassmorphic card */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-6 text-white transition-all duration-300">
            
            {/* Header section with premium AI Sparks logo */}
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-250 to-pink-200 uppercase">
                ClassPulse
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                Unified Learning ERP & EWS Radar
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginErrorMsg && (
                <div className="bg-rose-500/20 border border-rose-500/40 text-rose-250 px-4 py-3 rounded-2xl text-xs font-bold text-center">
                  {loginErrorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                  Username / Unique ID / Email / Roll No
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. gagan@shiksha.org or G3-01"
                    value={loginUsernameInput}
                    onChange={(e) => setLoginUsernameInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-white/10 focus:border-indigo-400 focus:bg-slate-950/60 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPasswordInput}
                    onChange={(e) => setLoginPasswordInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-white/10 focus:border-indigo-400 focus:bg-slate-950/60 rounded-2xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-xl shadow-indigo-950/50 hover:shadow-indigo-500/25 active:scale-98 disabled:opacity-55 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Access Terminal</span>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Accounts Selector Deck */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                Quick Demo Accounts Selector
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                Evaluation Deck
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {demoAccounts.map((acc, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc.username, acc.password)}
                  disabled={isLoggingIn}
                  className="bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 rounded-2xl p-3 flex items-start space-x-3 text-left transition-all duration-200 group cursor-pointer"
                >
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-9 h-9 rounded-full bg-slate-900 border border-white/10 group-hover:border-indigo-400 transition-colors flex-shrink-0"
                  />
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-black uppercase text-brand-300 tracking-wider">
                        {acc.role}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-tight mt-0.5 truncate">
                      {acc.name}
                    </h4>
                    <p className="text-[9px] text-slate-455 mt-1 line-clamp-1 group-hover:text-slate-300 transition-colors">
                      {acc.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!activeUser) {
    return renderLoginScreen();
  }

  if (portalMode === "student") {
    return renderStudentPortal();
  }

  return (
    <>
      <div className={`flex h-screen bg-[#0b1009] overflow-hidden text-slate-800 relative ${showWorksheetModal ? 'no-print' : ''}`}>
        {/* Signature 'Jade pebble morning' studio light projections */}
        <div className="absolute left-[-10%] top-[25%] w-[500px] h-[500px] bg-gradient-to-br from-[#7B9669]/15 to-[#BAC8B1]/2 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute right-[-10%] top-[10%] w-[550px] h-[550px] bg-gradient-to-bl from-[#6C8480]/18 to-[#BAC8B1]/2 rounded-full blur-[130px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-[20%] w-[35%] h-[20%] bg-gradient-to-b from-[#7B9669]/6 to-transparent blur-md pointer-events-none z-0" />
        <div className="absolute bottom-0 right-[25%] w-[25%] h-[20%] bg-gradient-to-b from-[#6C8480]/6 to-transparent blur-md pointer-events-none z-0" />
      
      {/* 1. Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-indigo-950/90 backdrop-blur-2xl text-slate-300 flex-col justify-between shadow-2xl border-r border-indigo-900/50 print:hidden z-20">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center space-x-3 bg-slate-950">
            <Sparkles className="w-8 h-8 text-brand-400 animate-pulse" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-wider m-0 p-0 flex items-center">
                CLASSPULSE <span className="text-xs text-brand-400 ml-1">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">Classroom & EWS Radar</p>
            </div>
          </div>
          
          {/* Nav Items */}
          <nav className="mt-6 px-4 space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'students' ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Student Portfolios</span>
            </button>
            <button 
              onClick={() => setActiveTab('scanner')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'scanner' ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-5 h-5" />
              <span>Scan Exam Paper</span>
            </button>
            {activeUser && activeUser.role === 'School Principal' && (
              <button 
                onClick={() => setActiveTab('report')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'report' ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                <span>Student Dropout Report</span>
              </button>
            )}
            <button 
              onClick={() => { setActiveTab('analytics'); fetchProgressTrends(); fetchHeatmapData(); fetchAttendanceEws(); fetchCompareSections(); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics' ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Class Performance Trends</span>
            </button>
            <button 
              onClick={() => {
                setPortalMode("student");
                setStudentSession(null);
                setStudentRollNumberInput("");
                setStudentPasswordInput("");
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all bg-gradient-to-r from-purple-650 to-indigo-650 text-white shadow-md hover:from-purple-750 hover:to-indigo-750 mt-4 border border-purple-500/20"
            >
              <Users className="w-5 h-5" />
              <span>Switch to Student Portal</span>
            </button>
          </nav>
        </div>

        {/* 5-Member Team Collaboration Widget Refactored to Premium User Switcher Dropdown */}
        <div className="relative p-4 m-4 bg-slate-950 rounded-xl border border-slate-800 no-print">
          {showProfileDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl space-y-1 z-30 animate-scale-up">
              <div className="px-2 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Switch Active Collaborator
              </div>
              {users.filter(u => u.id !== activeUser?.id).map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setActiveUser(user);
                    setShowProfileDropdown(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all duration-150 cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <img src={user.avatar_url} alt={user.name} className="w-6.5 h-6.5 rounded-full bg-slate-850" />
                    <div className="truncate">
                      <p className="text-xs font-bold truncate leading-tight">{user.name}</p>
                      <p className="text-[9px] text-slate-500 leading-none">{user.role}</p>
                    </div>
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-400' : 'bg-slate-600'}`} />
                </button>
              ))}
              <div className="border-t border-slate-800 my-1 pt-1">
                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileDropdown(false);
                  }}
                  className="w-full flex items-center space-x-2.5 p-2 rounded-lg text-left hover:bg-rose-950/40 text-rose-450 hover:text-rose-200 transition-all duration-150 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-extrabold">Sign Out Session</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-all duration-200 hover:bg-slate-900/60 group cursor-pointer"
          >
            <div className="flex items-center space-x-3 truncate">
              {activeUser && (
                <>
                  <div className="relative">
                    <img src={activeUser.avatar_url} alt={activeUser.name} className="w-8 h-8 rounded-full bg-slate-800 ring-2 ring-brand-500/30" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-450 border-2 border-slate-950 rounded-full shadow-md animate-pulse" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-extrabold text-white truncate leading-tight group-hover:text-brand-400 transition-colors">
                      {activeUser.name}
                    </p>
                    <p className="text-[9px] text-slate-400 leading-none font-medium mt-0.5">{activeUser.role}</p>
                  </div>
                </>
              )}
            </div>
            <div className="text-slate-500 group-hover:text-slate-350 transition-colors ml-2">
              <svg className={`w-4 h-4 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-indigo-100/50 px-4 md:px-8 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.02)] z-10 sticky top-0">
          <div className="flex items-center space-x-2.5">
            {/* Mobile Brand Name */}
            <div className="flex items-center space-x-1.5 md:hidden">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">ClassPulse</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 ml-1">Class 3-A</span>
            </div>

            {/* Desktop Brand Title & simplified wording */}
            <div className="hidden md:flex items-center space-x-3">
              <h2 className="text-base font-extrabold text-slate-850 capitalize flex items-center">
                {activeTab === 'dashboard' && "Student Alerts & Progress"}
                {activeTab === 'students' && "Student Portfolios"}
                {activeTab === 'scanner' && "Exam Paper Scanner"}
                {activeTab === 'report' && "Student Dropout Report"}
                {activeTab === 'analytics' && "Class Performance Trends"}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-650 flex items-center border border-slate-200">
                Class 3 • Section A
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  fetchNotifications();
                }}
                className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-full transition-all border border-slate-200 relative cursor-pointer"
                title="In-App Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-scale-up space-y-3 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Teacher Alerts ({unreadCount})</h4>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-[10px] text-brand-600 hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {notifications.length > 0 ? (
                      notifications.map(notif => {
                        const types = {
                          'risk_change': { emoji: '⚠️', bg: 'bg-amber-50 text-amber-700 border-amber-100' },
                          'escalation': { emoji: '🚨', bg: 'bg-rose-50 text-rose-700 border-rose-100' },
                          'parent_alert': { emoji: '📱', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                          'digest': { emoji: '📊', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100' }
                        };
                        const config = types[notif.type] || { emoji: '🔔', bg: 'bg-slate-50 text-slate-700 border-slate-100' };
                        return (
                          <div 
                            key={notif.id}
                            className={`p-2.5 rounded-xl border text-[11px] transition-all flex items-start space-x-2.5 relative ${
                              notif.is_read ? 'bg-white border-slate-100 opacity-60' : 'bg-slate-50 border-slate-200 shadow-sm'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${config.bg}`}>
                              {config.emoji}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="font-extrabold text-slate-800 flex justify-between items-center pr-4">
                                <span className="truncate">{notif.title}</span>
                                {!notif.is_read && (
                                  <button 
                                    onClick={() => markNotificationRead(notif.id)}
                                    className="text-[9px] text-brand-500 hover:text-brand-700 font-bold ml-1"
                                    title="Mark as Read"
                                  >
                                    ✓
                                  </button>
                                )}
                              </div>
                              <p className="text-slate-500 leading-normal">{notif.message}</p>
                              <p className="text-[9px] text-slate-400 font-mono mt-1">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No new notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile User Avatar Switcher */}
            {activeUser && (
              <div className="relative md:hidden flex items-center">
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="w-8 h-8 rounded-full border-2 border-indigo-500/30 overflow-hidden flex items-center justify-center cursor-pointer shadow-sm relative focus:outline-none"
                  title="Switch profile"
                >
                  <img src={activeUser.avatar_url} alt={activeUser.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-450 border border-white rounded-full shadow-sm animate-pulse" />
                </button>
                
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl space-y-1 z-40 animate-scale-up text-left">
                    <div className="px-2 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Switch Role
                    </div>
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setActiveUser(user);
                          setShowProfileDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-155 cursor-pointer ${
                          activeUser?.id === user.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <img src={user.avatar_url} alt={user.name} className="w-5.5 h-5.5 rounded-full bg-slate-850" />
                          <div className="truncate">
                            <p className="text-[11px] font-bold truncate leading-tight">{user.name}</p>
                            <p className="text-[8px] text-slate-550 leading-none">{user.role}</p>
                          </div>
                        </div>
                        <span className={`w-1 h-1 rounded-full ${user.status === 'Active' ? 'bg-green-450' : 'bg-slate-650'}`} />
                      </button>
                    ))}
                    <div className="border-t border-slate-800 my-1 pt-1">
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center space-x-2.5 p-2 rounded-lg text-left hover:bg-rose-950/40 text-rose-450 hover:text-rose-200 transition-all duration-150 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-bold text-rose-400">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={fetchInitialData}
              className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-full transition-all border border-slate-200"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full text-brand-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              SahAI for Shiksha '26
            </div>
          </div>
        </header>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative z-0">
          
          {/* TAB 1: CLASS ANALYTICS & EWS RADAR */}
          {activeTab === 'dashboard' && activeUser && (
            <div className="space-y-6">
              {activeUser.role === 'School Principal' && (
                <PrincipalDashboard 
                  activeUser={activeUser}
                  students={students}
                  flaggedStudents={flaggedStudents}
                  compareSections={compareSections}
                  activities={activities}
                  handleResolveEscalation={handleResolveEscalation}
                />
              )}
              {activeUser.role === 'Class Teacher' && (
                <ClassTeacherDashboard 
                  activeUser={activeUser}
                  students={students}
                  analytics={analytics}
                  activities={activities}
                  setInterventionStudent={setInterventionStudent}
                  setShowInterventionModal={setShowInterventionModal}
                  setEscalationStudent={setEscalationStudent}
                  setShowEscalationModal={setShowEscalationModal}
                  API_BASE={API_BASE}
                  onAttendanceSubmitted={fetchInitialData}
                />
              )}
              {activeUser.role === 'Subject Teacher' && (
                <SubjectTeacherDashboard 
                  activeUser={activeUser}
                  analytics={analytics}
                  activities={activities}
                  setActiveTab={setActiveTab}
                  setScannerMode={setScannerMode}
                />
              )}
              {activeUser.role === 'Parent' && selectedStudent && (
                <ParentDashboard 
                  activeUser={activeUser}
                  selectedStudent={selectedStudent}
                  studentDetail={studentDetail}
                  parentQuizAnswers={parentQuizAnswers}
                  setParentQuizAnswers={setParentQuizAnswers}
                  handleSavePractice={handleSavePractice}
                />
              )}
            </div>
          )}

          {/* TAB 2: STUDENT PORTFOLIOS */}
          {activeTab === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Student Selector List */}
              <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 space-y-4">
                <h3 className="text-base font-bold text-slate-800 mb-2">Class Portfolio Registry</h3>
                <div className="space-y-2">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                        selectedStudent?.id === student.id 
                          ? 'border-brand-500 bg-brand-50/50 shadow-sm' 
                          : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-snug">{student.name}</h4>
                        <div className="flex space-x-2 mt-1 items-center">
                          <p className="text-[10px] text-slate-400 font-mono">Roll: {student.roll_number}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            student.risk_level === 'High' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                            student.risk_level === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            {student.risk_level} Risk
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        {student.gap_summary?.['Critical Gap'] > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                        )}
                        {student.gap_summary?.['Needs Improvement'] > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Detailed Diagnostic Portfolio View */}
              <div className="lg:col-span-2 space-y-6">
                {studentDetail ? (
                  <>
                    {/* Header info */}
                    <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded tracking-wide">
                            Student profile
                          </span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            studentDetail.student.risk_level === 'High' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                            studentDetail.student.risk_level === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            {studentDetail.student.risk_level} Dropout Risk
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mt-2">{studentDetail.student.name}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-1">
                          Attendance: <strong>{studentDetail.student.attendance_rate}%</strong> • ID: {studentDetail.student.roll_number}
                        </p>
                      </div>
                      <div className="mt-4 md:mt-0 flex space-x-2 no-print">
                        <button 
                          onClick={() => {
                            setParentAlertStudent(studentDetail.student);
                            setShowParentAlertModal(true);
                            fetchParentAlertLog(studentDetail.student.id);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center cursor-pointer"
                        >
                          <PhoneCall className="w-4 h-4 mr-1.5" />
                          Alert Parent
                        </button>
                        <button 
                          onClick={() => {
                            setEscalationStudent(studentDetail.student);
                            setShowEscalationModal(true);
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center cursor-pointer"
                        >
                          <ShieldAlert className="w-4 h-4 mr-1.5" />
                          Escalate
                        </button>
                        <button 
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center cursor-pointer"
                        >
                          <Printer className="w-4 h-4 mr-1.5" />
                          Print Diagnostic Report
                        </button>
                        <button 
                          onClick={() => {
                            setScanStudentId(studentDetail.student.id.toString());
                            setActiveTab('scanner');
                          }}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4 mr-1.5" />
                          New Scan
                        </button>
                      </div>
                    </div>

                    {/* Diagnosed gaps and conceptual feedback */}
                    <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                        <Award className="w-4.5 h-4.5 text-brand-600 mr-2" />
                        Diagnosed Learning Gaps (Multimodal AI)
                      </h4>

                      <div className="space-y-4">
                        {studentDetail.gaps.map((gap) => (
                          <div key={gap.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
                            <div className="flex justify-between items-center">
                              <h5 className="text-sm font-bold text-slate-800">{gap.concept}</h5>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center ${
                                gap.status === 'Mastered' ? 'bg-green-50 border-green-200 text-green-700' :
                                gap.status === 'Needs Improvement' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                'bg-rose-50 border-rose-200 text-rose-700'
                              }`}>
                                {gap.status === 'Mastered' && <CheckCircle className="w-3 h-3 mr-1 text-green-600" />}
                                {gap.status === 'Needs Improvement' && <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />}
                                {gap.status === 'Critical Gap' && <XCircle className="w-3 h-3 mr-1 text-rose-600" />}
                                {gap.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {gap.misconception_details}
                            </p>
                            
                            {/* Remedial connection to DIKSHA */}
                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between no-print">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => {
                                    setActiveWorksheetData(gap);
                                    setShowWorksheetModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center"
                                >
                                  <Printer className="w-3 h-3 mr-1.5 text-slate-500" />
                                  Generate Remedial Worksheet
                                </button>
                              </div>
                              {gap.remedial_resource && (
                                <button 
                                  onClick={() => {
                                    setActiveDikshaData(gap);
                                    setShowDikshaModal(true);
                                  }}
                                  className="text-[10px] text-brand-600 hover:text-brand-700 font-bold hover:underline flex items-center"
                                >
                                  <BookOpen className="w-3.5 h-3.5 mr-1 text-brand-500" />
                                  Access Learning Module ➡️
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {studentDetail.gaps.length === 0 && (
                          <div className="text-center py-8 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                            <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs">No scans recorded for {studentDetail.student.name} yet.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NEW SECTION: Weekly AI Remediation Plan Timeline */}
                    {studentDetail.assessments && studentDetail.assessments.length > 0 && studentDetail.assessments[0].remediation_plan && (
                      <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
                        <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center">
                          <Calendar className="w-4.5 h-4.5 text-brand-600 mr-2" />
                          🧠 Weekly AI Remediation Plan Generator
                        </h4>
                        <p className="text-xs text-slate-400 mb-4 font-medium">
                          Auto-generated personalized learning timeline to bridge diagnosed concepts.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(() => {
                            const plan = studentDetail.assessments[0].remediation_plan;
                            const dayParts = plan.split(/(?=Day \d+:)/);
                            const parsedDays = dayParts.map((part) => {
                              const match = part.match(/Day (\d+):\s*(.*)/);
                              if (match) {
                                return { day: `Day ${match[1]}`, task: match[2].trim() };
                              }
                              return { day: "Action Item", task: part.trim() };
                            });

                            return parsedDays.map((dayItem, idx) => (
                              <div key={idx} className="bg-gradient-to-br from-slate-50 to-brand-50/10 border border-slate-100 hover:border-brand-200 rounded-2xl p-4 space-y-3 transition-all hover:shadow-md relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-110" />
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                                    {dayItem.day}
                                  </span>
                                  <input type="checkbox" className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer" />
                                </div>
                                <p className="text-xs font-semibold text-slate-700 leading-relaxed pr-2">
                                  {dayItem.task}
                                </p>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* NEW SECTION: AI Assessment Diagnostics Log & Confidence */}
                    <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                        <Sparkles className="w-4.5 h-4.5 text-brand-600 mr-2" />
                        AI Assessment Diagnostics Log & Confidence
                      </h4>
                      <div className="space-y-3">
                        {studentDetail.assessments && studentDetail.assessments.length > 0 ? (
                          studentDetail.assessments.map((asm) => {
                            const conf = asm.ai_confidence_score || 0;
                            const confColor = conf >= 90 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                                              conf >= 70 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                              'text-rose-600 bg-rose-50 border-rose-200';
                            return (
                              <div key={asm.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-slate-800">{asm.subject}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {new Date(asm.assessment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 line-clamp-1">{asm.summary}</p>
                                </div>

                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Diagnostic Score</span>
                                    <span className="text-sm font-black text-slate-800">{asm.total_score}/10</span>
                                  </div>

                                  <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex flex-col items-center ${confColor}`}>
                                    <span>AI CONFIDENCE</span>
                                    <span className="text-xs font-black">{conf.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-6">No assessments logged yet for this student.</p>
                        )}
                      </div>
                    </div>


                    {/* DIKSHA Learning Hub Section */}
                    <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded tracking-wide">
                            Remedial Pathway
                          </span>
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                        <Award className="w-4.5 h-4.5 text-brand-600 mr-2" />
                        🎓 NEP-Aligned DIKSHA Learning Hub
                      </h4>

                      {studentDetail.gaps.filter(g => g.remedial_resource).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {studentDetail.gaps.filter(g => g.remedial_resource).map((gap) => (
                            <div key={gap.id} className="p-4 rounded-xl border border-slate-200 bg-brand-50/20 hover:bg-brand-50/30 transition-all flex flex-col justify-between space-y-3">
                              <div>
                                <div className="flex justify-between items-center">
                                  <h5 className="text-xs font-extrabold text-slate-800 flex items-center">
                                    <BookOpen className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
                                    {gap.concept}
                                  </h5>
                                  <span className={`text-[9px] font-bold px-2 py-0.2 rounded border ${
                                    gap.status === 'Critical Gap' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                    gap.status === 'Needs Improvement' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                    'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  }`}>
                                    {gap.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                                  Access custom remedial exercises and explanations specifically tailored to resolve the diagnosed learning gaps.
                                </p>
                              </div>
                              
                              <button 
                                onClick={() => {
                                  setActiveDikshaData(gap);
                                  setShowDikshaModal(true);
                                }}
                                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center justify-center no-print"
                              >
                                Open in DIKSHA Hub ➡️
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <p className="text-xs font-bold">All concepts are mastered or stable. No active learning hub actions required!</p>
                        </div>
                      )}
                    </div>

                    {/* Shared Diagnostic Log & Peer Collaborative Discussion */}
                    <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                        <MessageSquare className="w-4.5 h-4.5 text-brand-600 mr-2" />
                        Teacher Diagnostic Notes & Collaboration Hub
                      </h4>

                      <div className="space-y-4 max-h-60 overflow-y-auto mb-4 pr-1">
                        {studentDetail.comments.map((comm) => (
                          <div key={comm.id} className="flex space-x-3 items-start">
                            <img src={comm.avatar_url} alt={comm.user_name} className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" />
                            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
                              <div className="flex justify-between items-baseline">
                                <h5 className="text-xs font-bold text-slate-700">{comm.user_name}</h5>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{comm.description}</p>
                            </div>
                          </div>
                        ))}
                        {studentDetail.comments.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-6">No diagnostic notes yet. Share a comment below!</p>
                        )}
                      </div>

                      <form onSubmit={handlePostComment} className="flex items-center space-x-2">
                        <input 
                          type="text" 
                          placeholder={`Leave a diagnostic note as ${activeUser?.name}...`}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all bg-slate-50"
                        />
                        <button 
                          type="submit"
                          className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition-all"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 p-8 shadow-sm">
                    <User className="w-12 h-12 text-slate-200 mb-3" />
                    <p className="text-sm font-semibold">No student selected</p>
                    <p className="text-xs text-slate-400 mt-1">Select a student from the classroom registry to view details.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: SCAN NEW WORKSHEET */}
          {activeTab === 'scanner' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Top Selector Segmented Controller */}
              <div className="flex border border-slate-200 bg-slate-100/80 p-1.5 rounded-2xl max-w-md mx-auto shadow-sm">
                <button
                  type="button"
                  onClick={() => { setScannerMode('single'); setScanSuccess(null); }}
                  className={`flex-grow py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                    scannerMode === 'single' ? 'bg-white text-brand-600 shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Single Scan</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setScannerMode('batch'); setBatchResults(null); }}
                  className={`flex-grow py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                    scannerMode === 'batch' ? 'bg-white text-brand-600 shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Batch Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setScannerMode('voice'); setVoiceDiagnostic(null); }}
                  className={`flex-grow py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                    scannerMode === 'voice' ? 'bg-white text-brand-600 shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Voice Observation</span>
                </button>
              </div>

              {/* MODE 1: SINGLE SCAN WORKSPACE */}
              {scannerMode === 'single' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-indigo-100/30 space-y-6">
                  <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                    <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 shadow-inner">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-850">Single Worksheet Scanner</h3>
                      <p className="text-xs text-slate-400 font-medium">Upload a handwritten student paper to run immediate cognitive diagnostic mapping.</p>
                    </div>
                  </div>

                  <form onSubmit={handleScanSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Subject Domain</label>
                        <select 
                          value={scanSubject} 
                          onChange={(e) => setScanSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                          <option value="Mathematics">Mathematics (Numeracy)</option>
                          <option value="English">Language (English)</option>
                          <option value="Science">Science</option>
                          <option value="Environmental Studies (EVS)">Environmental Studies (EVS)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Target Grade Level</label>
                        <select 
                          value={scanGrade} 
                          onChange={(e) => setScanGrade(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                          <option value="Grade 1">Grade 1</option>
                          <option value="Grade 2">Grade 2</option>
                          <option value="Grade 3">Grade 3</option>
                          <option value="Grade 4">Grade 4</option>
                          <option value="Grade 5">Grade 5</option>
                          <option value="Grade 6">Grade 6</option>
                          <option value="Grade 7">Grade 7</option>
                          <option value="Grade 8">Grade 8</option>
                          <option value="Grade 9">Grade 9</option>
                          <option value="Grade 10">Grade 10</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Student Record Reference</label>
                      <select 
                        value={scanStudentId} 
                        onChange={(e) => setScanStudentId(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="">-- Choose Student from Classroom Registry --</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name} (Roll: {s.roll_number})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Worksheet Image File</label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-brand-500 bg-slate-50 hover:bg-brand-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setUploadedFile(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                        <p className="text-xs font-bold text-slate-700">
                          {uploadedFile ? uploadedFile.name : "Select or drag & drop handwritten student worksheet sheet"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Supports JPEG, PNG up to 10MB</p>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isScanning}
                      className={`w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center uppercase tracking-wider ${
                        isScanning && "opacity-75 cursor-not-allowed"
                      }`}
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2.5 animate-spin" />
                          ClassPulse AI Analyzing Cognitive Gaps & Calculating Dropout Warning...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2.5" />
                          Evaluate Diagnostic Sheet
                        </>
                      )}
                    </button>
                  </form>

                  {scanSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fadeIn">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-emerald-800">Cognitive Assessment Diagnostics Rendered</h4>
                          <p className="text-xs text-emerald-600">Overall Score: <strong>{scanSuccess.total_score}/10</strong> • Evaluated successfully</p>
                        </div>
                      </div>

                      <div className="bg-white border border-emerald-100 rounded-xl p-4 space-y-2">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Executive Summary</h5>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">{scanSuccess.summary}</p>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnosed Learning Gaps & Linkages</h5>
                        {scanSuccess.gaps.map((gap, i) => (
                          <div key={i} className="p-4 bg-white border border-emerald-100/50 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                              <h6 className="text-xs font-black text-slate-800">{gap.concept}</h6>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                                gap.status === 'Mastered' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                              }`}>
                                {gap.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{gap.misconception_details}</p>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        onClick={() => {
                          setScanSuccess(null);
                          setUploadedFile(null);
                          setActiveTab('students');
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
                      >
                        View Updated Registry Portfolio ➡️
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: BATCH SCAN WORKSPACE */}
              {scannerMode === 'batch' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-indigo-100/30 space-y-6">
                  <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                    <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 shadow-inner">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-850">Batch Worksheet Scanning (NEP 2020 Platform)</h3>
                      <p className="text-xs text-slate-400 font-medium">Upload multiple student papers. ClassPulse extracts handwriting signatures, matches database records, and logs diagnostics.</p>
                    </div>
                  </div>

                  <form onSubmit={handleBatchScanSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Subject Domain</label>
                        <select 
                          value={scanSubject} 
                          onChange={(e) => setScanSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                          <option value="Mathematics">Mathematics (Numeracy)</option>
                          <option value="English">Language (English)</option>
                          <option value="Science">Science</option>
                          <option value="Environmental Studies (EVS)">Environmental Studies (EVS)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Class Level / Grade</label>
                        <select 
                          value={scanGrade} 
                          onChange={(e) => setScanGrade(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                          <option value="Grade 1">Grade 1</option>
                          <option value="Grade 2">Grade 2</option>
                          <option value="Grade 3">Grade 3</option>
                          <option value="Grade 4">Grade 4</option>
                          <option value="Grade 5">Grade 5</option>
                          <option value="Grade 6">Grade 6</option>
                          <option value="Grade 7">Grade 7</option>
                          <option value="Grade 8">Grade 8</option>
                          <option value="Grade 9">Grade 9</option>
                          <option value="Grade 10">Grade 10</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Select Multiple Scanned Sheets</label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-brand-500 bg-slate-50 hover:bg-brand-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative">
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*"
                          onChange={(e) => setBatchFiles(Array.from(e.target.files))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                        <p className="text-xs font-bold text-slate-700">
                          {batchFiles.length > 0 ? `Selected ${batchFiles.length} files to scan in batch` : "Click to select or drag & drop multiple student worksheet scans"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Multi-file processing supports JPEG, PNG sheets</p>
                      </div>
                    </div>

                    {batchFiles.length > 0 && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-44 overflow-y-auto space-y-2">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Queue to Process ({batchFiles.length})</h5>
                        {batchFiles.map((file, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-600 p-2 bg-white rounded-lg border border-slate-100">
                            <span className="font-semibold truncate">{file.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{(file.size / 1024).toFixed(0)} KB</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isBatchScanning || batchFiles.length === 0}
                      className={`w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center uppercase tracking-wider ${
                        (isBatchScanning || batchFiles.length === 0) && "opacity-75 cursor-not-allowed"
                      }`}
                    >
                      {isBatchScanning ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2.5 animate-spin" />
                          Running Multi-sheet Cognitive Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2.5" />
                          Analyze {batchFiles.length} Sheets in Batch
                        </>
                      )}
                    </button>
                  </form>

                  {/* Batch analysis results grid */}
                  {batchResults && (
                    <div className="space-y-4 animate-fadeIn">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Processed Batch Diagnostics Registry</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {batchResults.map((res, i) => (
                          <div key={i} className={`p-4 border rounded-2xl space-y-3 shadow-sm bg-white ${
                            res.success ? 'border-emerald-100 hover:border-emerald-200' : 'border-rose-100'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-xs font-black text-slate-800">{res.filename}</h5>
                                {res.success ? (
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-500">Extracted Name: <strong>{res.student_name}</strong></span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                      res.matched_automatically ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                                    }`}>
                                      {res.matched_automatically ? 'Auto Matched' : 'Fuzzy Fallback'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-rose-500 font-bold">Failed to analyze</span>
                                )}
                              </div>
                              {res.success && (
                                <span className="text-xs font-black px-2 py-0.5 bg-brand-50 border border-brand-100 rounded-lg text-brand-700">
                                  Score: {res.diagnostic.total_score}/10
                                </span>
                              )}
                            </div>

                            {res.success ? (
                              <div className="space-y-2">
                                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{res.diagnostic.summary}</p>
                                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-100">
                                  <span className="text-emerald-600 font-bold">Confidence: {res.diagnostic.ai_confidence_score.toFixed(1)}%</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const matchedS = students.find(s => s.id === res.student_id);
                                      if (matchedS) {
                                        setSelectedStudent(matchedS);
                                        fetchStudentDetail(res.student_id);
                                        setActiveTab('students');
                                      }
                                    }}
                                    className="text-brand-600 hover:text-brand-700 font-black hover:underline"
                                  >
                                    View Student Registry ➡️
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-rose-600 leading-relaxed font-semibold">{res.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: VOICE OBSERVATIONS Dictation Cockpit */}
              {scannerMode === 'voice' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-indigo-100/30 space-y-6">
                  <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                    <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 shadow-inner">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-850">Voice-based Dictation Assessment Center</h3>
                      <p className="text-xs text-slate-400 font-medium">Record spoken classroom notes or type observations directly. ClassPulse transcribes, analyzes learning gaps, and commits diagnostic portfolios.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Panel: Microphone Dictation controls */}
                    <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6 flex flex-col items-center justify-between text-center min-h-[300px] space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Spoken Observations Capture</h4>
                        <p className="text-[10px] text-slate-500">Record a statement (e.g. "Rahul Kumar scored eight out of ten in math...")</p>
                      </div>

                      {/* Microphone animation area */}
                      <div className="relative flex flex-col items-center justify-center">
                        {isRecording && (
                          <div className="absolute w-28 h-28 bg-rose-500/10 rounded-full animate-ping" />
                        )}
                        <button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all focus:ring-4 ${
                            isRecording 
                              ? 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-200' 
                              : 'bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-200 hover:-translate-y-0.5'
                          }`}
                        >
                          {isRecording ? (
                            <div className="w-6 h-6 bg-white rounded-sm animate-pulse" />
                          ) : (
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                            </svg>
                          )}
                        </button>

                        {/* Visual wave mockup during recording */}
                        {isRecording && (
                          <div className="flex space-x-1.5 mt-4 items-center justify-center">
                            <span className="w-1 bg-rose-500 rounded-full animate-bounce h-4" style={{ animationDelay: '0.1s' }} />
                            <span className="w-1 bg-rose-500 rounded-full animate-bounce h-6" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1 bg-rose-500 rounded-full animate-bounce h-8" style={{ animationDelay: '0.3s' }} />
                            <span className="w-1 bg-rose-500 rounded-full animate-bounce h-6" style={{ animationDelay: '0.4s' }} />
                            <span className="w-1 bg-rose-500 rounded-full animate-bounce h-4" style={{ animationDelay: '0.5s' }} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 font-mono">
                        {isRecording ? (
                          <span className="text-xs text-rose-600 font-bold animate-pulse">RECORDING: {recordingTimer}s</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Microphone status: Ready</span>
                        )}
                      </div>
                    </div>

                    {/* Right Panel: Manual / Edit Transcription dictation box */}
                    <div className="border border-slate-100 rounded-2xl p-6 flex flex-col justify-between min-h-[300px] bg-white space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Dictation Observation Workspace</h4>
                        <p className="text-[10px] text-slate-500">Edit recorded transcription or type observations directly.</p>
                      </div>

                      <textarea
                        value={voiceTranscription}
                        onChange={(e) => setVoiceTranscription(e.target.value)}
                        placeholder="Say or type here e.g.: 'Rahul Kumar scored 8.5 out of 10 in math. He mastered single-digit addition but struggles with carryover addition.'"
                        className="flex-1 w-full p-4 border border-slate-200 bg-slate-50 hover:bg-slate-50/50 focus:bg-white rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none resize-none transition-all leading-relaxed font-semibold text-slate-700"
                      />

                      <button
                        type="button"
                        onClick={() => handleVoiceAssessmentSubmit(voiceTranscription)}
                        disabled={isVoiceAnalyzing || !voiceTranscription.trim()}
                        className={`w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                          (isVoiceAnalyzing || !voiceTranscription.trim()) && 'opacity-70 cursor-not-allowed'
                        }`}
                      >
                        {isVoiceAnalyzing ? 'Analyzing Text Insight...' : 'Run Cognitive Observation NLP ➡️'}
                      </button>
                    </div>
                  </div>

                  {/* Dictation Extraction Results Preview */}
                  {voiceDiagnostic && (
                    <div className="bg-gradient-to-br from-emerald-50 to-indigo-50/20 border border-emerald-100 rounded-2xl p-6 shadow-sm space-y-4 animate-fadeIn">
                      <div className="flex items-center space-x-3 pb-3 border-b border-emerald-200/50">
                        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Structured Observation Diagnostics Extracted</h4>
                          <p className="text-[10px] text-slate-500">Confidence Match: <strong>{voiceDiagnostic.ai_confidence_score.toFixed(1)}%</strong></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100/50">
                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Matched Student Details</h5>
                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-slate-800">Name: <span className="text-brand-600">{voiceDiagnostic.student_name}</span></p>
                            <p className="font-mono text-slate-500">Roll No: {voiceDiagnostic.roll_number || 'N/A'}</p>
                            <p className="text-slate-500">Grade: {voiceDiagnostic.grade || 'N/A'} • Section: {voiceDiagnostic.section || 'N/A'}</p>
                            {voiceDiagnostic.matched_automatically === false && (
                              <span className="inline-block px-1.5 py-0.2 bg-amber-50 text-amber-700 text-[8px] font-bold rounded border border-amber-200 mt-1 uppercase">
                                Fuzzy Match Fallback
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100/50">
                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assessment Scope</h5>
                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-slate-800">Subject: <span className="text-slate-700">{voiceDiagnostic.subject}</span></p>
                            <p className="font-bold text-slate-800">Diagnostic Score: <span className="text-brand-600">{voiceDiagnostic.total_score}/10</span></p>
                            <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">{voiceDiagnostic.summary}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Concept Mapping</h5>
                        {voiceDiagnostic.gaps.map((gap, i) => (
                          <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <h6 className="font-black text-slate-850">{gap.concept}</h6>
                              <span className={`text-[9px] font-extrabold px-2 py-0.2 rounded border ${
                                gap.status === 'Mastered' ? 'bg-green-50 border-green-150 text-green-700' : 'bg-amber-50 border-amber-150 text-amber-700'
                              }`}>
                                {gap.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{gap.misconception_details}</p>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleCommitVoiceDiagnostic}
                        disabled={isVoiceAnalyzing}
                        className={`w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                          isVoiceAnalyzing && 'opacity-70 cursor-not-allowed'
                        }`}
                      >
                        {isVoiceAnalyzing ? 'Saving Diagnostic Portfolio...' : 'Commit Structured Diagnostic to Registry Portal ➡️'}
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}


          {/* TAB 4: SCHOOL RISK REPORT - PRINCIPAL VIEW */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              {/* Summary Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
                {/* Card 1: Total Students */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</h4>
                    <p className="text-2xl font-black text-slate-800 mt-1">{ewsReport.length}</p>
                  </div>
                </div>

                {/* Card 2: Average Attendance */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Attendance</h4>
                    <p className="text-2xl font-black text-slate-800 mt-1">
                      {ewsReport.length > 0 
                        ? (ewsReport.reduce((acc, s) => acc + s.attendance_rate, 0) / ewsReport.length).toFixed(1)
                        : "0.0"}%
                    </p>
                  </div>
                </div>

                {/* Card 3: High Risk Students */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider">High Risk</h4>
                    <p className="text-2xl font-black text-rose-800 mt-1">
                      {ewsReport.filter(s => s.risk_level === 'High').length}
                    </p>
                  </div>
                </div>

                {/* Card 4: Medium Risk Students */}
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">Medium Risk</h4>
                    <p className="text-2xl font-black text-amber-800 mt-1">
                      {ewsReport.filter(s => s.risk_level === 'Medium').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* EWS Simulated Alerts Inbox & Collaborative Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
                
                {/* Simulated Email Inbox */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl text-slate-100 flex flex-col justify-between min-h-[350px]">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">📬 EWS High-Priority Notifications</h4>
                      </div>
                      <span className="text-[10px] text-rose-400 bg-rose-950/40 border border-rose-900 px-2 py-0.5 rounded font-mono font-bold uppercase">
                        Secure Logs
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {summaryReport?.recent_simulated_alerts && summaryReport.recent_simulated_alerts.length > 0 ? (
                        summaryReport.recent_simulated_alerts.map((alertText, idx) => {
                          const alert = parseAlert(alertText);
                          return (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => setSelectedAlertEmail(alert)}
                              className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-brand-500/30 transition-all flex items-start space-x-3 group cursor-pointer"
                            >
                              <div className="p-2 bg-rose-950/50 border border-rose-900 text-rose-400 rounded-lg group-hover:bg-rose-900 group-hover:text-white transition-all">
                                <ShieldAlert className="w-4 h-4" />
                              </div>
                              <div className="flex-1 truncate">
                                <div className="flex justify-between items-baseline mb-1">
                                  <h5 className="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-all">
                                    {alert.studentName} flagged as HIGH RISK
                                  </h5>
                                  <span className="text-[9px] text-slate-500 font-mono font-medium ml-2">
                                    {alert.timestamp}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate leading-snug">
                                  {alert.subject}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-center py-10 bg-slate-950 border border-slate-800 rounded-xl">
                          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2.5" />
                          <p className="text-xs text-slate-400 font-semibold">No high-priority alerts logged.</p>
                          <p className="text-[10px] text-slate-600 mt-1">EWS system report is fully clear.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-4 text-center border-t border-slate-800 pt-3">
                    Logger location: <span className="font-mono text-slate-400 bg-slate-950 px-1 py-0.5 rounded border border-slate-850">backend/ews_alerts.log</span>
                  </div>
                </div>

                {/* EWS Collaborative Intervention Feed */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center">
                      <Activity className="w-4.5 h-4.5 text-brand-600 mr-2" />
                      Executive EWS Workspace
                    </h4>
                    <p className="text-xs text-slate-500 leading-normal mb-4">
                      Monitor active intervention status and collaborative tasks triggered by educators.
                    </p>
                    
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-56 pr-1 space-y-3">
                      {activities.filter(a => a.activity_type === 'intervention' || a.activity_type === 'ews_alert').slice(0, 4).map((act) => (
                        <div key={act.id} className="flex items-start space-x-2.5 pt-3 first:pt-0">
                          <img src={act.avatar_url} alt={act.user_name} className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200" />
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                              <h5 className="text-[11px] font-bold text-slate-700">{act.user_name}</h5>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className={`text-[11px] mt-0.5 leading-relaxed font-medium ${
                              act.activity_type === 'ews_alert' ? 'text-rose-600 bg-rose-50/50 p-1.5 rounded border border-rose-100' :
                              'text-emerald-700 bg-emerald-50/50 p-1.5 rounded border border-emerald-100'
                            }`}>{act.description}</p>
                          </div>
                        </div>
                      ))}
                      {activities.filter(a => a.activity_type === 'intervention' || a.activity_type === 'ews_alert').length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-8">No EWS administrative activities recorded.</p>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setActiveTab('students')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all mt-4"
                  >
                    View Student Portfolios ➡️
                  </button>
                </div>
              </div>

              {/* Report Table Card */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center no-print">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Dropout Early Warning & Foundational Registry</h3>
                    <p className="text-xs text-slate-400 font-medium">Real-time academic summaries mapped to individual warning indices</p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    Print Summary Report
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <th onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                          Student Name {sortKey === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="p-4">Roll No</th>
                        <th className="p-4">Grade & Section</th>
                        <th onClick={() => handleSort('attendance_rate')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                          Attendance Rate {sortKey === 'attendance_rate' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th onClick={() => handleSort('risk_level')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                          EWS Risk Level {sortKey === 'risk_level' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th className="p-4">Last 3 Scores</th>
                        <th onClick={() => handleSort('average_score')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                          Average Score {sortKey === 'average_score' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {[...ewsReport].sort((a, b) => {
                        let valA, valB;
                        if (sortKey === 'name') {
                          valA = a.name.toLowerCase();
                          valB = b.name.toLowerCase();
                        } else if (sortKey === 'attendance_rate') {
                          valA = a.attendance_rate;
                          valB = b.attendance_rate;
                        } else if (sortKey === 'risk_level') {
                          const riskMap = { High: 3, Medium: 2, Low: 1 };
                          valA = riskMap[a.risk_level] || 0;
                          valB = riskMap[b.risk_level] || 0;
                        } else if (sortKey === 'average_score') {
                          valA = getAverageScore(a.last_3_scores);
                          valB = getAverageScore(b.last_3_scores);
                        } else {
                          valA = a[sortKey];
                          valB = b[sortKey];
                        }

                        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                        return 0;
                      }).map((student) => {
                        const avgScore = getAverageScore(student.last_3_scores);
                        return (
                          <tr 
                            key={student.student_id} 
                            className={`hover:bg-slate-50/50 transition-colors ${
                              student.risk_level === 'High' ? 'bg-rose-50/10' :
                              student.risk_level === 'Medium' ? 'bg-amber-50/10' :
                              'bg-emerald-50/10'
                            }`}
                          >
                            <td className="p-4 font-bold text-slate-800">{student.name}</td>
                            <td className="p-4 font-mono text-slate-500">{student.roll_number}</td>
                            <td className="p-4">{student.grade} • Section {student.section}</td>
                            <td className="p-4 font-semibold">
                              <span className={student.attendance_rate < 80 ? 'text-rose-600' : student.attendance_rate < 85 ? 'text-amber-600' : 'text-emerald-600'}>
                                {student.attendance_rate}%
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                student.risk_level === 'High' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                student.risk_level === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}>
                                {student.risk_level}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex space-x-1">
                                {student.last_3_scores && student.last_3_scores.length > 0 ? (
                                  student.last_3_scores.map((score, i) => (
                                    <span key={i} className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                                      score >= 7.5 ? 'bg-emerald-100 text-emerald-800' :
                                      score >= 5.5 ? 'bg-amber-100 text-amber-800' :
                                      'bg-rose-100 text-rose-800'
                                    }`}>
                                      {score.toFixed(1)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-bold font-mono">
                              {student.last_3_scores && student.last_3_scores.length > 0 ? (
                                <span className={avgScore >= 7.5 ? 'text-emerald-600' : avgScore >= 5.5 ? 'text-amber-600' : 'text-rose-600'}>
                                  {avgScore.toFixed(1)}/10
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Escalations Hub Card */}
              <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 space-y-4">
                <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">🚨 Principal Escalation Inbox</h3>
                    <p className="text-xs text-slate-400">High priority student situations flagged by teachers for administrative intervention</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {flaggedStudents.length > 0 ? (
                    flaggedStudents.map(esc => (
                      <div key={esc.id} className="p-5 rounded-2xl border border-rose-100 bg-rose-50/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">{esc.student_name}</span>
                            <span className="text-[10px] text-slate-450 font-mono">({esc.roll_number})</span>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-full">
                              {esc.priority} Priority
                            </span>
                            <span className="text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              {esc.risk_level} Risk
                            </span>
                          </div>
                          <p className="text-xs text-slate-650 italic">" {esc.reason} "</p>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                            <span>Flagged by: <strong>{esc.flagged_by_name}</strong></span>
                            <span>•</span>
                            <span>Date: <strong>{new Date(esc.timestamp).toLocaleDateString()}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 w-full md:w-auto">
                          <input 
                            type="text" 
                            id={`notes-${esc.id}`}
                            placeholder="Resolution notes..."
                            className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none flex-grow md:w-48"
                          />
                          <button
                            onClick={() => {
                              const notesInput = document.getElementById(`notes-${esc.id}`);
                              const notes = notesInput ? notesInput.value : "";
                              handleResolveEscalation(esc.id, notes);
                            }}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex-shrink-0 cursor-pointer"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-xs">
                      No active teacher escalations at this time.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: ANALYTICS & REPORTING HUB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Sub-Tab Navigation */}
              <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-2 shadow-xl shadow-indigo-100/40 flex space-x-1">
                {[
                  { key: 'trends', label: 'Progress Trends', icon: '📈' },
                  { key: 'heatmap', label: 'Risk Heatmap', icon: '🗺️' },
                  { key: 'attendance-ews', label: 'Attendance → EWS', icon: '📋' },
                  { key: 'compare', label: 'Compare Sections', icon: '⚖️' },
                  { key: 'export', label: 'Export Reports', icon: '📥' },
                  { key: 'digest', label: 'Weekly Digest', icon: '✉️' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setAnalyticsTab(tab.key);
                      if (tab.key === 'trends') fetchProgressTrends(selectedTrendStudent);
                      if (tab.key === 'heatmap') fetchHeatmapData();
                      if (tab.key === 'attendance-ews') fetchAttendanceEws();
                      if (tab.key === 'compare') fetchCompareSections(compareGrade);
                      if (tab.key === 'digest') fetchWeeklyDigest('Grade 3', 'A');
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      analyticsTab === tab.key
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* SUB-TAB 1: Student Progress Trend Charts */}
              {analyticsTab === 'trends' && (
                <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">📈 Student Progress Trend Charts</h3>
                      <p className="text-xs text-slate-500">Mastery score over weeks/months — not just snapshots</p>
                    </div>
                    <select
                      value={selectedTrendStudent}
                      onChange={(e) => { setSelectedTrendStudent(e.target.value); fetchProgressTrends(e.target.value); }}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      <option value="">All Students</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
                    </select>
                  </div>

                  <div className="h-80">
                    {progressTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={progressTrends} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                          <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#scoreGradient)" dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <TrendingUp className="w-12 h-12 text-slate-300 mb-2" />
                        <p className="text-sm">No assessment history available yet. Scan papers to build trend data.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: Class-wide Risk Heatmap */}
              {analyticsTab === 'heatmap' && (
                <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">🗺️ Class-wide Risk Heatmap</h3>
                      <p className="text-xs text-slate-500">Visual grid showing every student's risk level at a glance</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {heatmapData.map(student => {
                      const riskColors = {
                        'High': 'from-rose-500 to-rose-600 text-white shadow-rose-200',
                        'Medium': 'from-amber-400 to-amber-500 text-white shadow-amber-200',
                        'Low': 'from-emerald-400 to-emerald-500 text-white shadow-emerald-200'
                      };
                      return (
                        <div
                          key={student.student_id}
                          className={`bg-gradient-to-br ${riskColors[student.risk_level] || riskColors['Low']} rounded-2xl p-4 shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer`}
                          onClick={() => { const s = students.find(st => st.id === student.student_id); if (s) { setSelectedStudent(s); setActiveTab('students'); } }}
                        >
                          <h4 className="text-sm font-bold truncate">{student.name}</h4>
                          <p className="text-[10px] opacity-80 font-mono">{student.roll_number}</p>
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="opacity-80">Attendance</span>
                              <span className="font-bold">{student.attendance_rate}%</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="opacity-80">Avg Score</span>
                              <span className="font-bold">{student.avg_score}/10</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="opacity-80">Critical Gaps</span>
                              <span className="font-bold">{student.critical_gap_count}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-[9px] font-black uppercase tracking-wider text-center opacity-90 bg-white/20 rounded-lg py-1">
                            {student.risk_level} Risk
                          </div>
                        </div>
                      );
                    })}
                    {heatmapData.length === 0 && (
                      <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Grid3X3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm">No heatmap data available. Ensure students are enrolled.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: Attendance → EWS Integration */}
              {analyticsTab === 'attendance-ews' && (
                <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">📋 Attendance → EWS Integration</h3>
                      <p className="text-xs text-slate-500">Daily attendance fed directly into the dropout radar</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left p-3 font-bold text-slate-600 rounded-tl-xl">Student</th>
                          <th className="text-center p-3 font-bold text-slate-600">Attendance</th>
                          <th className="text-center p-3 font-bold text-slate-600">Present</th>
                          <th className="text-center p-3 font-bold text-slate-600">Absent</th>
                          <th className="text-center p-3 font-bold text-slate-600">Risk Level</th>
                          <th className="text-center p-3 font-bold text-slate-600 rounded-tr-xl">Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceEws.map(student => (
                          <tr key={student.student_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{student.name}</div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center">
                                <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden mr-2">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      student.attendance_rate >= 90 ? 'bg-emerald-500' :
                                      student.attendance_rate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${student.attendance_rate}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-700">{student.attendance_rate}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-emerald-600">{student.total_present}</td>
                            <td className="p-3 text-center font-bold text-rose-600">{student.total_absent}</td>
                            <td className="p-3 text-center">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                student.risk_level === 'High' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                student.risk_level === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}>
                                {student.risk_level}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex space-x-0.5 justify-center">
                                {(student.attendance_trend || []).slice(-10).map((day, i) => (
                                  <div
                                    key={i}
                                    className={`w-4 h-4 rounded-sm text-[7px] flex items-center justify-center font-bold ${
                                      day.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}
                                    title={`${day.date}: ${day.status}`}
                                  >
                                    {day.status === 'Present' ? '✓' : '✗'}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {attendanceEws.length === 0 && (
                      <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-4">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm">No attendance-EWS data available.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: Comparative Analytics */}
              {analyticsTab === 'compare' && (
                <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">⚖️ Comparative Analytics</h3>
                      <p className="text-xs text-slate-500">Section A vs Section B performance side by side</p>
                    </div>
                    <select
                      value={compareGrade}
                      onChange={(e) => { setCompareGrade(e.target.value); fetchCompareSections(e.target.value); }}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {compareSections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {compareSections.map(sec => (
                        <div key={sec.section} className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-5 border border-slate-100 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-black text-slate-800">Section {sec.section}</h4>
                            <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-50 border border-brand-100 text-brand-700 rounded-full">
                              {sec.student_count} Students
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">Avg Attendance</span>
                              <span className="text-sm font-bold text-slate-800">{sec.avg_attendance}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${sec.avg_attendance >= 90 ? 'bg-emerald-500' : sec.avg_attendance >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${sec.avg_attendance}%` }} />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">Avg Score</span>
                              <span className="text-sm font-bold text-slate-800">{sec.avg_score}/10</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(sec.avg_score / 10) * 100}%` }} />
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <span className="flex-1 text-center text-[10px] font-bold py-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-700">High: {sec.high_risk_count}</span>
                              <span className="flex-1 text-center text-[10px] font-bold py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-700">Med: {sec.medium_risk_count}</span>
                              <span className="flex-1 text-center text-[10px] font-bold py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700">Low: {sec.low_risk_count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm">Select a grade to compare section performance.</p>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 5: Export Reports */}
              {analyticsTab === 'export' && (
                <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">📥 PDF/Excel Report Export</h3>
                      <p className="text-xs text-slate-500">One-click export of student or class reports for admin meetings</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">CSV Spreadsheet Export</h4>
                          <p className="text-[10px] text-slate-500">Compatible with Excel, Google Sheets, LibreOffice</p>
                        </div>
                      </div>
                      <select
                        value={compareGrade}
                        onChange={(e) => setCompareGrade(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs bg-white mb-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleExportReport('csv')}
                        disabled={isExporting}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Download CSV Report'}
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-brand-50 to-indigo-50 rounded-2xl p-6 border border-brand-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                          <Download className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">JSON Data Export</h4>
                          <p className="text-[10px] text-slate-500">Structured data for integrations and dashboards</p>
                        </div>
                      </div>
                      <select
                        value={compareGrade}
                        onChange={(e) => setCompareGrade(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs bg-white mb-3 focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleExportReport('json')}
                        disabled={isExporting}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Download JSON Report'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 6: Weekly Summary Digest */}
              {analyticsTab === 'digest' && (
                <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 space-y-6">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-indigo-600 animate-bounce" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">✉️ Weekly Summary Digest</h3>
                        <p className="text-xs text-slate-500">Classroom health status report compiled and emailed to teachers every Monday morning</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left side: options & settings */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 h-fit">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Digest Dispatch Parameters</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Grade Select</label>
                          <select 
                            value={compareGrade}
                            onChange={(e) => { setCompareGrade(e.target.value); fetchWeeklyDigest(e.target.value, 'A'); }}
                            className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                          >
                            {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10'].map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Recipient Email</label>
                          <input 
                            type="email"
                            value={teacherEmail}
                            onChange={(e) => setTeacherEmail(e.target.value)}
                            placeholder="teacher@school.edu"
                            className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                          />
                        </div>

                        <button
                          onClick={handleSendDigestEmail}
                          disabled={isSendingDigest || !weeklyDigest}
                          className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {isSendingDigest ? "Sending..." : "Email Digest Now"}
                        </button>
                      </div>
                    </div>

                    {/* Right side: high-fidelity Preview */}
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-2xl p-6 text-slate-100 flex flex-col justify-between shadow-xl min-h-[350px]">
                      {weeklyDigest ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <span className="text-[10px] text-brand-400 bg-brand-950/40 border border-brand-900 px-2.5 py-0.5 rounded font-mono font-bold uppercase">
                              Email Digest Preview
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {weeklyDigest.report_date}
                            </span>
                          </div>

                          <div className="space-y-3 font-mono text-xs">
                            <div className="flex text-slate-350">
                              <span className="w-16">Subject:</span>
                              <span className="text-white font-bold">{weeklyDigest.email_subject}</span>
                            </div>
                            <div className="flex text-slate-350">
                              <span className="w-16">To:</span>
                              <span className="text-brand-300 font-bold">{teacherEmail}</span>
                            </div>
                            <hr className="border-slate-800" />
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 text-slate-300 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                              {weeklyDigest.email_body}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                          <Mail className="w-12 h-12 text-slate-650 mb-2" />
                          <p className="text-sm font-bold">Digest preview not generated</p>
                          <p className="text-xs text-slate-650 mt-1">Select a grade and dispatch parameters to generate class digest.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex justify-around items-center z-30 px-2 pb-safe shadow-lg no-print">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-brand-400 scale-105' : 'text-slate-400 hover:text-slate-350'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">Dashboard</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('students')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'students' ? 'text-brand-400 scale-105' : 'text-slate-400 hover:text-slate-350'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">Portfolios</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('scanner')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'scanner' ? 'text-brand-400 scale-105' : 'text-slate-400 hover:text-slate-350'
          }`}
        >
          <UploadCloud className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">Scanner</span>
        </button>
        
        {activeUser && activeUser.role === 'School Principal' && (
          <button 
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              activeTab === 'report' ? 'text-brand-400 scale-105' : 'text-slate-400 hover:text-slate-350'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-1">Report</span>
          </button>
        )}
        
        <button 
          onClick={() => { setActiveTab('analytics'); fetchProgressTrends(); fetchHeatmapData(); fetchAttendanceEws(); fetchCompareSections(); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'analytics' ? 'text-brand-400 scale-105' : 'text-slate-400 hover:text-slate-350'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">Trends</span>
        </button>
      </div>

      </main>

      {/* 3. MODAL FOR EWS INTERVENTIONS */}
      {showInterventionModal && interventionStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Trigger EWS Intervention</h3>
                <p className="text-xs text-slate-400">Initiate team support task for {interventionStudent.name}</p>
              </div>
            </div>

            <form onSubmit={handleInterventionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Intervention Action</label>
                <select 
                  value={interventionType} 
                  onChange={(e) => setInterventionType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="Parent Phone Call">📞 Parent Phone Call (Immediate)</option>
                  <option value="Home Visit">🏡 Home Visit (Community outreach)</option>
                  <option value="Special Tutor Session">🎓 Special Educator 1-on-1 Tutoring</option>
                  <option value="Principal Interview">🏢 Principal Discussion with Child</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Assign to Team Member</label>
                <select 
                  value={interventionAssignee} 
                  onChange={(e) => setInterventionAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Action Plan Notes</label>
                <textarea 
                  rows="3"
                  required
                  placeholder="Describe the action plan for this child..."
                  value={interventionNotes}
                  onChange={(e) => setInterventionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowInterventionModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingIntervention}
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/10 transition-all flex items-center justify-center"
                >
                  {isSubmittingIntervention ? "Triggering..." : "Launch Intervention"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.1. MODAL FOR PARENT ALERTS DISPATCH */}
      {showParentAlertModal && parentAlertStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Parent Alert System</h3>
                  <p className="text-xs text-slate-400">Trigger WhatsApp/SMS early warnings directly to parents</p>
                </div>
              </div>
              <button 
                onClick={() => setShowParentAlertModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendParentAlert} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <strong className="text-slate-800">{parentAlertStudent.name}</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Dropout Risk Level:</span>
                  <strong className={`px-2 py-0.2 rounded text-[10px] font-black uppercase ${
                    parentAlertStudent.risk_level === 'High' ? 'bg-rose-50 text-rose-700' :
                    parentAlertStudent.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>{parentAlertStudent.risk_level} Risk</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Attendance Rate:</span>
                  <strong className="text-slate-800">{parentAlertStudent.attendance_rate}%</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Alert Dispatch Mode</label>
                <div className="flex space-x-3">
                  {[
                    { key: 'WhatsApp', label: '📱 WhatsApp Dispatch', color: 'border-emerald-250 hover:bg-emerald-50 text-emerald-700' },
                    { key: 'SMS', label: '💬 Cellular SMS Text', color: 'border-blue-250 hover:bg-blue-50 text-blue-700' }
                  ].map(mode => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setParentAlertType(mode.key)}
                      className={`flex-1 py-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        parentAlertType === mode.key 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                          : `bg-white ${mode.color}`
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowParentAlertModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Dismiss
                </button>
                <button 
                  type="submit" 
                  disabled={isSendingParentAlert}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all flex items-center justify-center cursor-pointer"
                >
                  {isSendingParentAlert ? "Dispatching..." : "Send Alert"}
                </button>
              </div>
            </form>

            {/* Dispatch Logs */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">History Dispatch Logs</h4>
                
                {/* Tab selector */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'manual', label: 'Manual' },
                    { key: 'auto', label: 'Auto' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setAlertLogTab(tab.key)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                        alertLogTab === tab.key
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {parentAlertLog.filter(log => {
                  if (alertLogTab === 'manual') return log.status === 'Sent';
                  if (alertLogTab === 'auto') return log.status === 'Auto-Sent';
                  return true;
                }).length > 0 ? (
                  parentAlertLog
                    .filter(log => {
                      if (alertLogTab === 'manual') return log.status === 'Sent';
                      if (alertLogTab === 'auto') return log.status === 'Auto-Sent';
                      return true;
                    })
                    .map(log => {
                      const isAuto = log.status === 'Auto-Sent';
                      return (
                        <div key={log.id} className="p-2.5 rounded-xl border border-slate-150 bg-slate-50 text-[10px] space-y-1 hover:border-slate-300 transition-all">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-700 flex items-center gap-1.5">
                              {log.alert_type} to {log.parent_name}
                              {isAuto ? (
                                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                  🔔 Auto Alert
                                </span>
                              ) : (
                                <span className="bg-slate-200 border border-slate-300 text-slate-750 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                  👤 Manual
                                </span>
                              )}
                            </span>
                            <span className={isAuto ? 'text-indigo-600' : 'text-emerald-600'}>{log.status}</span>
                          </div>
                          <p className="text-slate-500 leading-normal font-medium">"{log.message}"</p>
                          <span className="text-[9px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-6 text-slate-400 text-[10px] italic bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    No matching alerts found in the logs.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3.2. MODAL FOR PRINCIPAL ESCALATION */}
      {showEscalationModal && escalationStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Administrative Escalation</h3>
                <p className="text-xs text-slate-400">Flag student status directly to the Principal's Urgent Inbox</p>
              </div>
            </div>

            <form onSubmit={handleFlagEscalation} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Student:</span>
                  <strong className="text-slate-800">{escalationStudent.name}</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Class Status:</span>
                  <strong className="text-slate-800">{escalationStudent.grade} • {escalationStudent.section}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Priority Tier</label>
                <select 
                  value={escalationPriority} 
                  onChange={(e) => setEscalationPriority(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="Critical">🚨 Critical Priority (Immediate Actions)</option>
                  <option value="High">⚠️ High Priority (Normal Review)</option>
                  <option value="Medium">⚡ Medium Priority (Watchlist alert)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Diagnostic Justification Details</label>
                <textarea 
                  rows="3"
                  required
                  placeholder="Please supply explicit justification reason for this administrative escalation..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEscalationModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Abort
                </button>
                <button 
                  type="submit" 
                  disabled={isEscalating}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/10 transition-all flex items-center justify-center cursor-pointer"
                >
                  {isEscalating ? "Flagging..." : "Confirm Escalation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>

      {/* 4. WORKSHEET GENERATOR MODAL */}
      {showWorksheetModal && activeWorksheetData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl print:shadow-none print:border-none print:w-full print:h-auto print:max-w-none print:rounded-none">
            {/* Modal Header (No Print) */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl no-print">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-800">Printable Remedial Worksheet</h3>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center">
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print Now
                </button>
                <button onClick={() => setShowWorksheetModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Printable Content Area */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible worksheet-content">
              {/* Worksheet Document Header */}
              <div className="border-b-4 border-slate-800 pb-4 mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">ClassPulse Practice</h1>
                  <h2 className="text-lg font-bold text-slate-600 mt-1">Focus Area: {activeWorksheetData.concept}</h2>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center space-x-2 text-sm justify-end">
                    <span className="font-bold text-slate-700">Name:</span>
                    <div className="w-48 border-b-2 border-slate-400 font-mono text-center text-slate-800">{studentDetail?.student?.name}</div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm justify-end">
                    <span className="font-bold text-slate-700">Date:</span>
                    <div className="w-48 border-b-2 border-slate-400 font-mono text-center text-slate-800">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-8 print:bg-white print:border-slate-800 print:rounded-none">
                <h3 className="font-bold text-slate-800 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-brand-600 print:text-slate-800" /> Teacher's Advice
                </h3>
                <p className="text-sm text-slate-600 mt-2 print:text-slate-800">{activeWorksheetData.misconception_details}</p>
              </div>

              {/* Practice Area */}
              <div className="grid grid-cols-2 gap-8 print:gap-12 worksheet-grid">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <div key={num} className="border-2 border-slate-300 rounded-xl p-4 min-h-[160px] flex flex-col print:border-slate-800 print:rounded-none">
                    <span className="font-bold text-slate-400 text-sm mb-4 print:text-slate-600">Q{num}.</span>
                    <div className="flex-1 border-dashed border-2 border-slate-200 bg-slate-50/50 print:bg-white print:border-slate-300"></div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 text-center text-xs text-slate-400 font-mono print:text-slate-500">
                Generated by ClassPulse AI • Designed for {studentDetail?.student?.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DIKSHA EDUCATIONAL HUB OVERLAY */}
      {showDikshaModal && activeDikshaData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowDikshaModal(false)}></div>
          
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/50 w-full max-w-5xl h-[85vh] flex shadow-2xl overflow-hidden animate-scale-up z-10">
            {/* Sidebar with modules */}
            <div className="w-72 bg-brand-900/95 backdrop-blur-md text-white p-6 flex flex-col">
              <div className="flex items-center space-x-2 mb-8">
                <Award className="w-8 h-8 text-brand-300" />
                <div>
                  <h3 className="text-lg font-black tracking-wider leading-none">DIKSHA Hub</h3>
                  <p className="text-[10px] text-brand-300 uppercase tracking-widest mt-1">NEP 2020 Aligned</p>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="px-3 py-2 bg-brand-800 rounded-xl border border-brand-700/50 cursor-pointer">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-brand-300" /> Topic Review
                  </h4>
                </div>
                <div className="px-3 py-2 hover:bg-brand-800/50 rounded-xl cursor-pointer transition-colors text-brand-100">
                  <h4 className="text-sm font-bold flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-brand-300/70" /> Activity Steps
                  </h4>
                </div>
                <div className="px-3 py-2 hover:bg-brand-800/50 rounded-xl cursor-pointer transition-colors text-brand-100">
                  <h4 className="text-sm font-bold flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-brand-300/70" /> Study Notes (EN/HI)
                  </h4>
                </div>
              </div>
              
              <div className="pt-4 border-t border-brand-800 text-xs text-brand-300/80">
                Targeting: <strong className="text-white">{activeDikshaData.concept}</strong>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-slate-50/50">
              <div className="p-4 border-b border-slate-200/50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <Sparkles className="w-5 h-5 text-brand-600 mr-2" /> Play-Based Learning Module
                </h3>
                <button onClick={() => setShowDikshaModal(false)} className="p-2 text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 rounded-xl transition-all">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                
                {/* Simulated Play-based Card */}
                <div className="bg-white/80 backdrop-blur-md border border-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-brand-200 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-200 rounded-full blur-3xl -ml-10 -mb-10 opacity-30 pointer-events-none"></div>
                  
                  <h4 className="text-2xl font-black text-slate-800 mb-2 relative z-10">Concept: {activeDikshaData.concept}</h4>
                  <p className="text-slate-600 text-sm mb-8 relative z-10">Use these visual analogies and manipulatives to clarify the misconception in the classroom.</p>
                  
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/90 border border-amber-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <h5 className="font-bold text-amber-800 mb-3 text-sm flex items-center">
                        <UserCheck className="w-4 h-4 mr-2" /> Classroom Activity Steps
                      </h5>
                      <ul className="list-disc list-inside text-sm text-amber-900/90 space-y-2.5 leading-relaxed">
                        <li>Gather 10 blocks (ones) and 1 long rod (tens).</li>
                        <li>Ask the student to count out 14 blocks.</li>
                        <li>Guide them to trade 10 ones blocks for 1 tens rod.</li>
                        <li>Show how this relates directly to carrying over in addition algorithms.</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border border-blue-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <h5 className="font-bold text-blue-800 mb-3 text-sm flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" /> Bilingual Study Notes
                      </h5>
                      <div className="space-y-4">
                        <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100/50 shadow-sm">
                          <p className="text-sm font-semibold text-slate-800">EN: When you have 10 or more in the ones place, bundle them into a ten.</p>
                        </div>
                        <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100/50 shadow-sm">
                          <p className="text-sm font-semibold text-slate-800 font-sans">HI: जब इकाई के स्थान पर 10 या अधिक हो जाएं, तो उन्हें एक दहाई में बदल दें।</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end relative z-10">
                    {activeDikshaData.remedial_resource && (
                      <a href={activeDikshaData.remedial_resource} target="_blank" rel="noreferrer" className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center hover:scale-[1.02] active:scale-[0.98]">
                        Launch Official DIKSHA Video <Activity className="w-4 h-4 ml-2" />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
