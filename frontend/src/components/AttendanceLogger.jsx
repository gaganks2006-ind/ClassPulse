import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Calendar, 
  Check, 
  X, 
  CheckSquare, 
  MinusCircle, 
  Save, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

export default function AttendanceLogger({ activeUser, students, API_BASE, onAttendanceSubmitted }) {
  // Determine section based on the teacher's name
  const section = activeUser.name?.includes("Priya") ? "B" : "A";
  const myStudents = students.filter(s => s.section === section);

  // Initialize date to today's local date (YYYY-MM-DD)
  const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getTodayString());
  const [records, setRecords] = useState({}); // student_id -> 'Present' or 'Absent'
  const [historyMap, setHistoryMap] = useState({}); // student_id -> attendance_trend
  const [absenceReasons, setAbsenceReasons] = useState({}); // student_id -> absence_reason
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  
  const prevStudentsRef = useRef(students);
  const [autoAlertsInfo, setAutoAlertsInfo] = useState([]);

  useEffect(() => {
    // Compare students list to detect risk status transitions (EWS triggers)
    const transitions = [];
    students.forEach(s => {
      const prev = prevStudentsRef.current.find(ps => ps.id === s.id);
      if (prev && prev.risk_level !== s.risk_level && (s.risk_level === 'High' || s.risk_level === 'Medium')) {
        transitions.push({
          name: s.name,
          risk: s.risk_level,
          rate: s.attendance_rate
        });
      }
    });

    if (transitions.length > 0) {
      setAutoAlertsInfo(transitions);
      // Auto-clear after 12 seconds
      const timer = setTimeout(() => setAutoAlertsInfo([]), 12000);
      return () => clearTimeout(timer);
    }
    
    prevStudentsRef.current = students;
  }, [students]);

  // Load 5-day attendance history trend from EWS analytics endpoint
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/attendance-ews?grade=Grade 3&section=${section}`);
      if (res.ok) {
        const data = await res.json();
        const map = {};
        data.forEach(s => {
          map[s.student_id] = s.attendance_trend || [];
        });
        setHistoryMap(map);
      }
    } catch (err) {
      console.error("Failed to load attendance history", err);
    }
  };

  // Load attendance records for the selected date
  const loadAttendance = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/attendance?grade=Grade 3&section=${section}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch attendance data");
      const data = await res.json();
      
      const recordsMap = {};
      data.forEach(r => {
        recordsMap[r.student_id] = r.status;
      });
      
      // For any student in class not in response, default to 'Present'
      myStudents.forEach(s => {
        if (!recordsMap[s.id]) {
          recordsMap[s.id] = 'Present';
        }
      });
      
      setRecords(recordsMap);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error loading attendance records. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    fetchHistory();
  }, [date, students.length]);

  const toggleStatus = (studentId) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const markAll = (status) => {
    const updated = {};
    myStudents.forEach(s => {
      updated[s.id] = status;
    });
    setRecords(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    // Build payload
    const recordsPayload = Object.entries(records).map(([id, status]) => ({
      student_id: parseInt(id),
      status: status
    }));

    try {
      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date,
          records: recordsPayload,
          user_id: activeUser.id
        })
      });

      if (!res.ok) throw new Error("Failed to save attendance");
      const data = await res.json();

      if (data.success) {
        const totalCount = myStudents.length;
        const presentCount = Object.values(records).filter(status => status === 'Present').length;
        const absentCount = totalCount - presentCount;

        // Post qualitative comments for any student marked absent with a reason selected
        const reasonComments = Object.entries(absenceReasons)
          .filter(([id, reason]) => {
            const status = records[id] || records[parseInt(id)];
            return status === 'Absent' && reason;
          })
          .map(([id, reason]) => {
            const sName = myStudents.find(s => s.id === parseInt(id))?.name || "Student";
            return fetch(`${API_BASE}/comments?user_id=${activeUser.id}&student_id=${id}&comment_text=${encodeURIComponent(`Absence Reason: ${reason} (Logged during daily attendance review for ${sName})`)}`, {
              method: 'POST'
            });
          });

        if (reasonComments.length > 0) {
          await Promise.all(reasonComments);
        }
        
        // Refresh the 5-day visual checklist
        await fetchHistory();

        setMessage({
          type: 'success',
          text: `Attendance saved successfully for ${date}! ${presentCount} Present, ${absentCount} Absent.`
        });
        
        // Trigger parent dashboard updates
        if (onAttendanceSubmitted) {
          onAttendanceSubmitted();
        }
      } else {
        throw new Error(data.detail || "Unknown error occurred");
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to submit attendance.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg border border-white rounded-3xl p-6 shadow-xl shadow-indigo-100/40 space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-100 text-brand-700 rounded-2xl">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">📝 Daily Attendance Logger</h3>
            <p className="text-xs text-slate-400">Class: Grade 3-{section} • Fill daily sheets to refresh dynamic EWS risks</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 hover:border-brand-300 focus:border-brand-500 rounded-xl text-xs font-bold text-slate-700 outline-none transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Auto Alerts feedback toast */}
      {autoAlertsInfo.length > 0 && (
        <div className="space-y-2">
          {autoAlertsInfo.map((alert, idx) => (
            <div key={idx} className="p-4 bg-indigo-50 border border-indigo-150 text-indigo-900 rounded-2xl flex items-start space-x-3 animate-fade-in shadow-lg shadow-indigo-100/30">
              <span className="text-base mt-0.5">⚠️</span>
              <div className="text-xs">
                <p className="font-extrabold text-indigo-950">Auto WhatsApp Alert Dispatched</p>
                <p className="mt-0.5 text-indigo-700 font-medium">Sent to parent of <strong>{alert.name}</strong> due to crossing into <strong>{alert.risk} Risk</strong> (Attendance: {alert.rate}%).</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message feedback */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-start space-x-3 border animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          )}
          <span className="text-xs font-bold leading-relaxed">{message.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-brand-655 animate-spin" />
          <p className="text-xs font-medium">Retrieving class attendance logs...</p>
        </div>
      ) : myStudents.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs">No students registered in Grade 3-{section}.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bulk Action Controls */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => markAll('Present')}
              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-250 hover:border-slate-350 text-slate-700 rounded-xl text-[10px] font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark All Present</span>
            </button>
            <button
              type="button"
              onClick={() => markAll('Absent')}
              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-250 hover:border-slate-350 text-slate-700 rounded-xl text-[10px] font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Mark All Absent</span>
            </button>
          </div>

          {/* Grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
            {myStudents.map(student => {
              const status = records[student.id] || 'Present';
              const isPresent = status === 'Present';
              
              return (
                <div 
                  key={student.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                    isPresent 
                      ? 'bg-slate-50/50 border-slate-150 hover:border-emerald-250' 
                      : 'bg-rose-50/40 border-rose-150 hover:border-rose-250'
                  }`}
                >
                  <div className="flex flex-col flex-grow">
                    <span className="text-xs font-bold text-slate-800">{student.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">Roll ID: {student.roll_number}</span>
                    
                    {/* Absence Reason Dropdown */}
                    {!isPresent && (
                      <select
                        value={absenceReasons[student.id] || ""}
                        onChange={(e) => setAbsenceReasons({ ...absenceReasons, [student.id]: e.target.value })}
                        className="mt-2 text-[9px] px-2 py-1 bg-white border border-rose-250 text-rose-800 rounded-lg outline-none font-extrabold focus:ring-1 focus:ring-rose-500 max-w-[170px]"
                      >
                        <option value="">❓ Select Absence Reason...</option>
                        <option value="Sick Leave 🤒">🤒 Sick Leave (Health)</option>
                        <option value="Family Outing 🏡">🏡 Family Outing (Leave)</option>
                        <option value="Unexcused Absence 🚫">🚫 Unexcused (No notice)</option>
                        <option value="Heavy Rain/Weather 🌧️">🌧️ Weather (Heavy Rain)</option>
                        <option value="No Transportation 🚌">🚌 Transit (No ride)</option>
                      </select>
                    )}
                  </div>

                  {/* 5-Day Visual Calendar Strip */}
                  <div className="flex flex-col items-center mr-4">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1">Recent 5 Days</span>
                    <div className="flex space-x-1">
                      {historyMap[student.id] && historyMap[student.id].length > 0 ? (
                        historyMap[student.id].slice(-5).map((h, i) => {
                          const isHPresent = h.status === 'Present';
                          return (
                            <span 
                              key={i}
                              title={`${h.date}: ${h.status}`}
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-extrabold border ${
                                isHPresent
                                  ? 'bg-emerald-100 border-emerald-250 text-emerald-800'
                                  : 'bg-rose-100 border-rose-250 text-rose-800'
                              }`}
                            >
                              {isHPresent ? 'P' : 'A'}
                            </span>
                          );
                        })
                      ) : (
                        [...Array(5)].map((_, i) => (
                          <span 
                            key={i} 
                            className="w-3.5 h-3.5 rounded-full border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[6px] text-slate-400"
                            title="No record synced"
                          >
                            -
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleStatus(student.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center space-x-1 transition-all cursor-pointer ${
                        isPresent
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100'
                          : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-100'
                      }`}
                    >
                      {isPresent ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Present</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          <span>Absent</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="py-3 px-6 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-450 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-brand-100/50 hover:shadow-brand-100/70 transition-all flex items-center space-x-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Checklist...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Submit Daily Attendance</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
