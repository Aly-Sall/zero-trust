import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();
  const userProfile = JSON.parse(localStorage.getItem("userProfile")) || {};

  useEffect(() => {
    if (userProfile.cohort && userProfile.email) {
      api
        .get(`/Exams/available/${userProfile.cohort}/${userProfile.email}`)
        .then((res) => setExams(res.data))
        .catch((err) => console.error("Error fetching exams:", err));
    }
  }, [userProfile.cohort, userProfile.email]);

  const pendingExams = exams.filter((e) => !e.isCompleted);
  const completedExams = exams.filter((e) => e.isCompleted);

  return (
    <div className="min-h-screen bg-[#0d1117] p-8 text-white font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-blue-500">🎓</span> Student Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Cohort:{" "}
            <span className="text-green-400 font-bold">
              {userProfile.cohort || "Unassigned"}
            </span>
          </p>
        </div>

        {/* PENDING EXAMS */}
        <div className="bg-[#161b22] border border-blue-900/50 rounded-xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-blue-400 border-b border-gray-800 pb-2">
            📋 My Upcoming Exams
          </h2>
          {pendingExams.length === 0 ? (
            <div className="p-6 text-center text-gray-500 italic bg-black/20 rounded-lg border border-dashed border-gray-700">
              No pending exams for your class at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-[#0d1117] border border-blue-600/30 rounded-lg p-6 shadow-lg hover:border-blue-500 transition-all"
                >
                  <h3 className="text-xl font-bold text-white mb-2">
                    {exam.title}
                  </h3>
                  <div className="text-sm text-gray-400 space-y-2 mb-6">
                    <p>
                      📅 Date: {new Date(exam.scheduledFor).toLocaleString()}
                    </p>
                    <p>⏱️ Duration: {exam.durationMinutes} minutes</p>
                  </div>
                  {/* 🚀 CORRECTION : On envoie d'abord vers la Calibration Biométrique ! */}
                  <button
                    onClick={() => navigate(`/calibration/${exam.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
                  >
                    ⌨️ Biometric Enrollment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COMPLETED EXAMS */}
        <div className="bg-[#161b22] border border-gray-700 rounded-xl p-8 shadow-xl">
          <h2 className="text-xl font-bold mb-6 text-green-400 border-b border-gray-800 pb-2">
            ✅ Completed Exams (Locked)
          </h2>
          {completedExams.length === 0 ? (
            <div className="p-6 text-center text-gray-500 italic bg-black/20 rounded-lg border border-dashed border-gray-700">
              You have not submitted any exams yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-gray-900/50 border border-green-900/50 rounded-lg p-6"
                >
                  <h3 className="text-xl font-bold text-gray-300 mb-2">
                    {exam.title}
                  </h3>
                  <div className="text-sm text-gray-400 space-y-2 mb-4">
                    <p>
                      📅 Date: {new Date(exam.scheduledFor).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-900/20 text-green-400 px-4 py-2 rounded-lg text-center font-bold border border-green-800/50">
                    🔒 Submission Locked
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
