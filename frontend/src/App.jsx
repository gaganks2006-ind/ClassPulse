import React, { useState, useEffect } from 'react';
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
  Printer
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

const API_BASE = "http://127.0.0.1:8000/api";

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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [analytics, setAnalytics] = useState({ concept_gaps: [], subject_performances: [], ews_risks: { Low: 0, Medium: 0, High: 0 } });
  const [activities, setActivities] = useState([]);
  const [ewsReport, setEwsReport] = useState([]);
  
  // Sorting states for Principal Report
  const [sortKey, setSortKey] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modal and Interactive Hub States
  const [showWorksheetModal, setShowWorksheetModal] = useState(false);
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
        // Set Gagan K S as default logged-in member
        const defaultUser = usersData.find(u => u.name.includes("Gagan")) || usersData[0];
        setActiveUser(defaultUser);
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

  return (
    <>
      <div className={`flex h-screen bg-slate-50 overflow-hidden text-slate-800 ${showWorksheetModal ? 'no-print' : ''}`}>
      
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shadow-xl">
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
              <span>Class Analytics & EWS</span>
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
              <span>Scan Assessment</span>
            </button>
            {activeUser && activeUser.role === 'School Principal' && (
              <button 
                onClick={() => setActiveTab('report')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'report' ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                <span>Principal Report</span>
              </button>
            )}
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
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-slate-800 capitalize flex items-center">
              {activeTab === 'dashboard' && "Unified Analytics & Dropout Early Warning"}
              {activeTab === 'students' && "Diagnostic Student Portfolios"}
              {activeTab === 'scanner' && "ClassPulse Multimodal Scanner"}
              {activeTab === 'report' && "School Risk Report — Principal View"}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600 flex items-center border border-slate-200">
              Grade 3 • Section A
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchInitialData}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all border border-slate-200"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full text-brand-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              SahAI for Shiksha '26
            </div>
          </div>
        </header>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          
          {/* TAB 1: CLASS ANALYTICS & EWS RADAR */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* EWS Dropout Risk Monitor Panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <ShieldAlert className="w-5 h-5 text-brand-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">🚨 Systemic EWS Dropout Radar</h3>
                      <p className="text-xs text-slate-400">Classroom analytics and early warning dropout alarms</p>
                    </div>
                  </div>
                  <div className="flex space-x-3 text-xs font-bold">
                    <span className="flex items-center px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700">
                      High Risk: {analytics.ews_risks?.High || 0}
                    </span>
                    <span className="flex items-center px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700">
                      Medium Risk: {analytics.ews_risks?.Medium || 0}
                    </span>
                    <span className="flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                      Low Risk: {analytics.ews_risks?.Low || 0}
                    </span>
                  </div>
                </div>

                {/* Alarm Feed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.filter(s => s.risk_level === 'High' || s.risk_level === 'Medium').map(student => (
                    <div 
                      key={student.id} 
                      className={`p-4 rounded-xl border flex flex-col justify-between ${
                        student.risk_level === 'High' 
                          ? 'bg-rose-50/40 border-rose-100' 
                          : 'bg-amber-50/40 border-amber-100'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-bold text-slate-800">{student.name}</h4>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            student.risk_level === 'High' 
                              ? 'bg-rose-50 border-rose-200 text-rose-700' 
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {student.risk_level} Risk
                          </span>
                        </div>
                        <div className="space-y-1 mb-4">
                          <p className="text-xs text-slate-600 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            Attendance Rate: <strong className="ml-1 text-slate-700">{student.attendance_rate}%</strong>
                          </p>
                          <p className="text-xs text-slate-600 flex items-center">
                            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            Math Diagnostic Score: <strong className="ml-1 text-slate-700">Needs Remedial</strong>
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setInterventionStudent(student);
                          setShowInterventionModal(true);
                        }}
                        className={`w-full py-2 rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center justify-center ${
                          student.risk_level === 'High'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                        Trigger Collaborative Intervention
                      </button>
                    </div>
                  ))}
                  {students.filter(s => s.risk_level === 'High' || s.risk_level === 'Medium').length === 0 && (
                    <div className="col-span-2 text-center py-6 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <p className="text-xs font-bold">All student dropout metrics are stable. No active alarms!</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Classroom Stats & Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Foundational Concept Mastery Map</h3>
                      <p className="text-xs text-slate-500">Distribution of diagnosed proficiency levels per conceptual domain</p>
                    </div>
                  </div>

                  <div className="h-64">
                    {analytics.concept_gaps && analytics.concept_gaps.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.concept_gaps} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="concept" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Mastered" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Needs Improvement" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Critical Gap" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <BookMarked className="w-12 h-12 text-slate-300 mb-2" />
                        <p className="text-sm">Scan papers to compile concept mapping.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center">
                    <Activity className="w-5 h-5 text-brand-600 mr-2" />
                    Shared Workspace Feed (EWS & Scan Audits)
                  </h3>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-2 space-y-3">
                    {activities.map((act) => (
                      <div key={act.id} className="flex items-start space-x-3 pt-3 first:pt-0">
                        <img src={act.avatar_url} alt={act.user_name} className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" />
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <h4 className="text-xs font-semibold text-slate-700">{act.user_name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 leading-relaxed ${
                            act.activity_type === 'ews_alert' ? 'text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-100' :
                            act.activity_type === 'intervention' ? 'text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-100' :
                            'text-slate-600'
                          }`}>{act.description}</p>
                          {act.student_name && act.activity_type !== 'ews_alert' && act.activity_type !== 'intervention' && (
                            <span className="inline-block mt-1 text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                              Student: {act.student_name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">No collaborative activities logged yet.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STUDENT PORTFOLIOS */}
          {activeTab === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Student Selector List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
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
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
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
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center"
                        >
                          <Printer className="w-4 h-4 mr-1.5" />
                          Print Diagnostic Report
                        </button>
                        <button 
                          onClick={() => {
                            setScanStudentId(studentDetail.student.id.toString());
                            setActiveTab('scanner');
                          }}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center"
                        >
                          <UploadCloud className="w-4 h-4 mr-1.5" />
                          New Scan
                        </button>
                      </div>
                    </div>

                    {/* Diagnosed gaps and conceptual feedback */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
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

                    {/* DIKSHA Learning Hub Section */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
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
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
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
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="mb-6 flex items-center space-x-3">
                  <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Scan Assessment Sheet</h3>
                    <p className="text-xs text-slate-500 font-medium">Upload a student's handwritten paper to run AI diagnostics and refresh their EWS risk level.</p>
                  </div>
                </div>

                <form onSubmit={handleScanSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Subject Domain</label>
                      <select 
                        value={scanSubject} 
                        onChange={(e) => setScanSubject(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="Mathematics">Mathematics (Foundational Numeracy)</option>
                        <option value="English">English (Foundational Literacy)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Target Grade</label>
                      <select 
                        value={scanGrade} 
                        onChange={(e) => setScanGrade(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="Grade 3">Grade 3</option>
                        <option value="Grade 4">Grade 4</option>
                        <option value="Grade 5">Grade 5</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Target Student</label>
                    <select 
                      value={scanStudentId} 
                      onChange={(e) => setScanStudentId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      <option value="">-- Choose Student from Classroom --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (Roll: {s.roll_number})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Scanned Sheet Image / Photo</label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-brand-500 bg-slate-50 hover:bg-brand-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setUploadedFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                      <p className="text-xs font-bold text-slate-700">
                        {uploadedFile ? uploadedFile.name : "Click to select or drag & drop student worksheet photo"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports JPEG, PNG up to 10MB</p>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isScanning}
                    className={`w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center ${
                      isScanning && "opacity-75 cursor-not-allowed"
                    }`}
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2.5 animate-spin" />
                        Gemini Multimodal Analyzing & Calculating EWS Risk...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2.5" />
                        Run AI Diagnostic & EWS Analysis
                      </>
                    )}
                  </button>
                </form>
              </div>

              {scanSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800">Diagnostic Scanned Successfully</h4>
                      <p className="text-xs text-emerald-600">Score: {scanSuccess.total_score}/10 • Scanned by {activeUser?.name}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-emerald-100 rounded-xl p-4 space-y-2">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Executive Summary</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">{scanSuccess.summary}</p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Learning Gaps</h5>
                    {scanSuccess.gaps.map((gap, i) => (
                      <div key={i} className="p-4 bg-white border border-emerald-100/50 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <h6 className="text-xs font-bold text-slate-800">{gap.concept}</h6>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            gap.status === 'Mastered' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            {gap.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">{gap.misconception_details}</p>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => {
                      setScanSuccess(null);
                      setUploadedFile(null);
                      setActiveTab('students');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    View Updated Student Profile ➡️
                  </button>
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
            </div>
          )}

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
