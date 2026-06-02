import React from 'react';
import AttendanceLogger from './AttendanceLogger';
import { 
  Users, 
  TrendingUp, 
  BookOpen, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Sparkles, 
  ShieldAlert, 
  Calendar, 
  Bell,
  BookMarked
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// ==================== ROLE 1: SCHOOL PRINCIPAL VIEW ====================
export function PrincipalDashboard({ 
  activeUser, 
  students, 
  flaggedStudents, 
  compareSections, 
  activities, 
  handleResolveEscalation 
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xl font-black tracking-tight mb-1 flex items-center">
          <Sparkles className="w-5.5 h-5.5 text-brand-400 mr-2 animate-pulse" />
          Administrative Command Dashboard
        </h3>
        <p className="text-xs text-slate-405 max-w-xl leading-relaxed">
          Welcome back, Principal {activeUser.name}. This is your real-time institutional overview tracking student risk warnings, teacher comments, and school performance averages.
        </p>
      </div>

      {/* Administrative KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 flex items-center space-x-4">
          <div className="p-4 bg-rose-100 text-rose-700 rounded-2xl">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">High Risk Alarms</p>
            <h4 className="text-2xl font-black text-slate-850">{students.filter(s => s.risk_level === 'High').length} Students</h4>
            <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Urgent home visit action required</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 flex items-center space-x-4">
          <div className="p-4 bg-emerald-100 text-emerald-700 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">School Attendance Avg</p>
            <h4 className="text-2xl font-black text-slate-850">
              {students.length > 0 ? (students.reduce((acc, s) => acc + s.attendance_rate, 0) / students.length).toFixed(1) : 0}%
            </h4>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">NEP target standard is &gt;85%</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 flex items-center space-x-4">
          <div className="p-4 bg-indigo-100 text-indigo-700 rounded-2xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Teacher Escalations</p>
            <h4 className="text-2xl font-black text-slate-850">{flaggedStudents.length} Flagged Cases</h4>
            <p className="text-[10px] text-indigo-650 font-semibold mt-0.5">Awaiting administrative review</p>
          </div>
        </div>
      </div>

      {/* Principal Escalations Review Desk */}
      <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">🚨 Pending Teacher Escalations</h3>
              <p className="text-xs text-slate-400">Verify and resolve student dropout support issues flagged by educators</p>
            </div>
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
                    id={`dashboard-notes-${esc.id}`}
                    placeholder="Resolution notes..."
                    className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none flex-grow md:w-48"
                  />
                  <button
                    onClick={() => {
                      const notesInput = document.getElementById(`dashboard-notes-${esc.id}`);
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
              No active teacher escalations at this time. All cases resolved!
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Attendance Comparison and School Timelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">Grade Section Attendance Comparison</h3>
            <p className="text-xs text-slate-550">Comparing dropout metrics and EWS trends between sections</p>
          </div>
          <div className="h-64">
            {compareSections && compareSections.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareSections} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="section" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Attendance Rate" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs">Select compare sections to load analysis.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 text-brand-600 mr-2" />
            School Activity Log & Audit Feed
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
                    'text-slate-655'
                  }`}>{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== ROLE 2: CLASS TEACHER VIEW ====================
export function ClassTeacherDashboard({ 
  activeUser, 
  students, 
  analytics, 
  activities, 
  setInterventionStudent, 
  setShowInterventionModal, 
  setEscalationStudent, 
  setShowEscalationModal,
  API_BASE,
  onAttendanceSubmitted
}) {
  const section = activeUser.name.includes("Priya") ? "B" : "A";
  const myStudents = students.filter(s => s.section === section);
  const alarms = myStudents.filter(s => s.risk_level === 'High' || s.risk_level === 'Medium');
  const avgAttendance = myStudents.length > 0 ? (myStudents.reduce((acc, s) => acc + s.attendance_rate, 0) / myStudents.length).toFixed(1) : "95.0";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xl font-black tracking-tight mb-1 flex items-center">
          <Users className="w-5.5 h-5.5 text-brand-400 mr-2" />
          Classroom Support Center (EWS Radar)
        </h3>
        <p className="text-xs text-slate-350 max-w-xl leading-relaxed">
          Welcome, Teacher {activeUser.name}. Monitor Grade 3-{section} attendance rates, early-warning alerts, and assign student support plans.
        </p>
      </div>

      {/* Daily Attendance Logger Grid */}
      <AttendanceLogger 
        activeUser={activeUser}
        students={students}
        API_BASE={API_BASE}
        onAttendanceSubmitted={onAttendanceSubmitted}
      />

      {/* Classroom KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 flex items-center space-x-4">
          <div className="p-4 bg-brand-100 text-brand-700 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">My Classroom Attendance</p>
            <h4 className="text-2xl font-black text-slate-850">{avgAttendance}%</h4>
            <p className="text-[10px] text-brand-655 font-semibold mt-0.5">Attendance logs are synced daily</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 flex items-center space-x-4">
          <div className="p-4 bg-rose-100 text-rose-700 rounded-2xl">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Classroom Dropout Risks</p>
            <h4 className="text-2xl font-black text-slate-850">{alarms.length} Students</h4>
            <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Intervention or principal escalation recommended</p>
          </div>
        </div>
      </div>

      {/* Classroom Specific EWS Dropout Radar */}
      <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">🚨 Classroom Dropout Warning Radar</h3>
              <p className="text-xs text-slate-400">Immediate dropout alerts requiring direct parent supervision and teacher comments</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alarms.map(student => (
            <div 
              key={student.id} 
              className={`p-5 rounded-2xl border flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${
                student.risk_level === 'High' 
                  ? 'bg-rose-50/70 border-rose-100 shadow-rose-100/50' 
                  : 'bg-amber-50/70 border-amber-100 shadow-amber-100/50'
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
                    Roll ID: <strong className="ml-1 text-slate-700">{student.roll_number}</strong>
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    setInterventionStudent(student);
                    setShowInterventionModal(true);
                  }}
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                  Support Plan
                </button>
                <button
                  onClick={() => {
                    setEscalationStudent(student);
                    setShowEscalationModal(true);
                  }}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  Escalate
                </button>
              </div>
            </div>
          ))}
          {alarms.length === 0 && (
            <div className="col-span-2 text-center py-8 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <p className="text-xs font-bold">All student dropout metrics are stable in your class. Excellent work!</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Concept Mastery Map & Workspace alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
          <h3 className="text-base font-bold text-slate-800 mb-2">Classroom Mastery Heatmap</h3>
          <p className="text-xs text-slate-500 mb-4">Mastery of conceptual domains for students in your class section</p>
          <div className="h-64">
            {analytics.concept_gaps && analytics.concept_gaps.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.concept_gaps} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="concept" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Mastered" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Needs Improvement" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Critical Gap" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs">No gaps compiled yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 text-brand-600 mr-2" />
            Classroom Feed & Support Log
          </h3>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-2 space-y-3">
            {activities
              .filter(act => act.description.includes(`Grade 3-${section}`) || act.description.includes(activeUser.name) || act.activity_type === 'ews_alert')
              .map((act) => (
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
                      'text-slate-655'
                    }`}>{act.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== ROLE 3: SUBJECT TEACHER VIEW ====================
export function SubjectTeacherDashboard({ 
  activeUser, 
  analytics, 
  activities, 
  setActiveTab, 
  setScannerMode 
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-indigo-900 border border-indigo-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xl font-black tracking-tight mb-1 flex items-center">
          <Sparkles className="w-5.5 h-5.5 text-brand-400 mr-2 animate-pulse" />
          Academic Diagnostic Console
        </h3>
        <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
          Welcome, Subject Teacher {activeUser.name}. Easily capture conceptual gaps using our AI Handwritten Scanner or AI Voice Observatory.
        </p>
      </div>

      {/* core quick launch buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 hover:border-brand-500 rounded-3xl p-6 shadow-md transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-brand-600 text-xl font-bold">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mt-4">AI Handwritten Exam Scanner</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Take a photo of a student math sheet. Our Gemini multimodal parser will score the paper and extract concept gaps automatically.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('scanner')} 
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center"
          >
            Launch Camera Scanner
          </button>
        </div>

        <div className="bg-white border border-slate-200 hover:border-brand-500 rounded-3xl p-6 shadow-md transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600 text-xl font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mt-4">AI Voice observations logger</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Speak your classroom observation into the microphone. AI parses student names, maps gaps, and saves bridge activities.
            </p>
          </div>
          <button 
            onClick={() => { setActiveTab('scanner'); setScannerMode('voice'); }} 
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center"
          >
            Launch Voice Observatory
          </button>
        </div>
      </div>

      {/* Academic stats & Timelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
          <h3 className="text-base font-bold text-slate-800 mb-4">School-wide Learning Gaps Mastery Map</h3>
          <div className="h-64">
            {analytics.concept_gaps && analytics.concept_gaps.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.concept_gaps} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="concept" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Mastered" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Needs Improvement" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Critical Gap" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs">No analytics logs recorded.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 text-brand-600 mr-2" />
            Latest AI Scan Audits & Activities
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
                    'text-slate-655'
                  }`}>{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== ROLE 4: PARENT VIEW ====================
export function ParentDashboard({ 
  activeUser, 
  selectedStudent, 
  studentDetail, 
  parentQuizAnswers, 
  setParentQuizAnswers, 
  handleSavePractice 
}) {
  const activeGap = studentDetail?.gaps?.find(g => g.status !== 'Mastered');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-[10px] font-bold bg-white/20 text-brand-200 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider">
          Parent Supervision Portal
        </span>
        <h3 className="text-xl font-black tracking-tight mb-1 flex items-center mt-2.5">
          Welcome {activeUser.name}!
        </h3>
        <p className="text-xs text-indigo-150 max-w-xl leading-relaxed">
          Track your child <strong>{selectedStudent.name}</strong>'s attendance, practice timeline, and learning gaps directly in plain, friendly English.
        </p>
      </div>

      {/* Parent KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Meter Card */}
        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 space-y-4">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Child Attendance Tracker</span>
            <h4 className="text-3xl font-black text-slate-800 mt-1">{selectedStudent.attendance_rate}%</h4>
          </div>
          
          {/* Attendance level progress bar and advice */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  selectedStudent.attendance_rate < 75.0 ? 'bg-rose-500' :
                  selectedStudent.attendance_rate < 85.0 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${selectedStudent.attendance_rate}%` }}
              />
            </div>
            <p className="text-xs leading-relaxed text-slate-650">
              {selectedStudent.attendance_rate < 75.0 ? (
                <strong className="text-rose-600">🔴 Critical attendance drop detected. Please ensure Rahul attends school daily to keep up with classmates.</strong>
              ) : selectedStudent.attendance_rate < 85.0 ? (
                <strong className="text-amber-600">🟡 Borderline attendance. Regular school days will help Rahul learn better!</strong>
              ) : (
                <strong className="text-emerald-600">🟢 Excellent attendance! Ananya is attending regularly and staying on track.</strong>
              )}
            </p>
          </div>
        </div>

        {/* Current Mastery Recovery Card */}
        <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 space-y-4">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Current Support Topic</span>
            <h4 className="text-lg font-black text-slate-800 mt-2">
              {activeGap?.concept || "All concepts mastered! 🎉"}
            </h4>
            <p className="text-xs text-slate-550 leading-relaxed mt-1">
              {activeGap?.misconception_details || "Rahul is currently caught up with all math concepts!"}
            </p>
          </div>
          {activeGap && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-700 font-semibold flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Recommended action: Support practice sessions below.
            </div>
          )}
        </div>
      </div>

      {/* Interactive Parent Quiz Practice Card */}
      {activeGap ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-black uppercase text-brand-650 tracking-wider">Interactive Math Practice</span>
            <h4 className="text-base font-bold text-slate-800 mt-1">
              Help {selectedStudent.name} practice: {activeGap.concept}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Solve these quick exercises with your child at home. Answering correctly boosts their school record!</p>
          </div>

          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Question 1: What is 24 + 18?</label>
              <div className="flex space-x-2">
                {[32, 42, 38].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setParentQuizAnswers({ ...parentQuizAnswers, q1: opt })}
                    className={`px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer ${
                      parentQuizAnswers.q1 === opt ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Question 2: What is 45 + 17?</label>
              <div className="flex space-x-2">
                {[52, 62, 58].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setParentQuizAnswers({ ...parentQuizAnswers, q2: opt })}
                    className={`px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer ${
                      parentQuizAnswers.q2 === opt ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={async () => {
                if (parentQuizAnswers.q1 === undefined || parentQuizAnswers.q2 === undefined) {
                  alert("Please answer all questions with your child!");
                  return;
                }
                let score = 0;
                if (parentQuizAnswers.q1 === 42) score += 5;
                if (parentQuizAnswers.q2 === 62) score += 5;
                
                const res = await handleSavePractice(selectedStudent.id, "Mathematics", activeGap.concept, score);
                if (res && res.gap_resolved) {
                  alert(`🎓 Fantastic! ${selectedStudent.name} scored ${score}/10! The concept gap has been successfully recovered and flagged as MASTERED!`);
                  setParentQuizAnswers({});
                } else if (res) {
                  alert(`Practice log saved. Score: ${score}/10. Keep practicing to master this concept!`);
                  setParentQuizAnswers({});
                }
              }}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Submit Answers & Resolve Gaps
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
            🎉
          </div>
          <h4 className="text-base font-bold text-emerald-800">All concept gaps recovered!</h4>
          <p className="text-xs text-emerald-650 max-w-sm mx-auto leading-relaxed">
            Excellent work! {selectedStudent?.name} has successfully mastered all current conceptual domains. Practice logs indicate strong recovery. Keep it up!
          </p>
        </div>
      )}
    </div>
  );
}
