import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  // 🚨 FONCTION POUR DÉNONCER L'ÉTUDIANT AU PROFESSEUR
  const reportInfraction = useCallback(
    async (alertType) => {
      try {
        // Envoi de la requête au backend
        await api.post(`/ExamSession/${examId}/lockdown-alert`, {
          alertType: alertType,
        });
        console.log(`🚨 Integrity Alert Sent: ${alertType}`);
      } catch (err) {
        console.error("Failed to send alert to server", err);
      }
    },
    [examId],
  );

  // 🛡️ ZERO-TRUST : Active Browser Surveillance
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      reportInfraction("Right-Click Attempt");
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      reportInfraction("Copy/Paste Attempt");

      // 🚀 ASTUCE : On retarde l'alerte de 100ms pour laisser la requête partir !
      setTimeout(() => {
        alert(
          "⚠️ Copy/Paste is strictly forbidden. The professor has been notified.",
        );
      }, 100);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportInfraction("Tab Switch / Left Exam Screen");

        // 🚀 ASTUCE : On retarde l'alerte pour ne pas bloquer le thread réseau
        setTimeout(() => {
          alert(
            "🚨 You left the exam screen! An integrity alert has been sent to the professor.",
          );
        }, 100);
      }
    };

    // Activation des écoutes
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Nettoyage
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reportInfraction]);

  // 📥 CHARGEMENT DES QUESTIONS
  useEffect(() => {
    const fetchExamQuestions = async () => {
      try {
        const userProfile = JSON.parse(localStorage.getItem("userProfile"));
        const res = await api.get(
          `/Exams/generate/${examId}/student/${userProfile.email}`,
        );

        const rawQuestions = res.data.Questions || res.data.questions;
        if (!rawQuestions || rawQuestions.length === 0) {
          throw new Error("No questions received from the server.");
        }

        setExamData({
          title: res.data.ExamTitle || res.data.examTitle || "Official Exam",
          questions: rawQuestions,
        });

        const duration = res.data.Duration || res.data.duration || 60;
        setTimeLeft(duration * 60);
      } catch (err) {
        console.error(err);
        alert(
          err.response?.data?.message ||
            "Access denied. Exam unavailable or already submitted.",
        );
        navigate("/student-dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchExamQuestions();
  }, [examId, navigate]);

  // ⏱️ GESTION DU TIMER
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && examData) {
      handleFinalSubmit();
    }
  }, [timeLeft, examData]);

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleFinalSubmit = async () => {
    if (
      timeLeft > 0 &&
      !window.confirm("Are you sure you want to submit your final answers?")
    ) {
      return;
    }

    setLoading(true);
    try {
      const userProfile = JSON.parse(localStorage.getItem("userProfile"));
      await api.post("/Exams/submit", {
        examId: parseInt(examId),
        studentEmail: userProfile.email,
        answers: answers,
      });

      alert("✅ Exam locked and submitted successfully!");
      navigate("/student-dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting the exam.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold animate-pulse">
            Encrypting and securing the session...
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = examData?.questions[currentQuestionIndex];
  const totalQuestions = examData?.questions.length || 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6 font-sans select-none">
      <div className="fixed top-0 left-0 right-0 bg-[#161b22] border-b border-gray-800 p-4 flex justify-between items-center z-50 shadow-xl">
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          🛡️ {examData?.title}
        </h1>
        <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-gray-700">
          <span className="text-sm text-gray-400">Time remaining:</span>
          <span
            className={`text-xl font-mono font-bold ${timeLeft < 300 ? "text-red-500 animate-pulse" : "text-green-400"}`}
          >
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-24 pb-20">
        <div className="bg-[#161b22] border border-gray-700 rounded-2xl p-8 shadow-2xl relative">
          <div className="absolute top-4 right-4 bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-xs font-mono">
            Question {currentQuestionIndex + 1} / {totalQuestions}
          </div>

          <h2 className="text-2xl font-semibold mb-8 text-gray-50 leading-snug">
            {currentQuestion?.text}
          </h2>

          <div className="space-y-4">
            {currentQuestion?.options.map((option, index) => {
              const questionId = currentQuestion.questionId;
              const isSelected = answers[questionId] === index;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(questionId, index)}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-150 flex items-center gap-4 hover:border-blue-500 group
                    ${isSelected ? "bg-blue-900/30 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-[#0d1117] border-gray-700 hover:bg-[#1c2128]"}`}
                >
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors
                    ${isSelected ? "border-blue-400 bg-blue-500" : "border-gray-500 group-hover:border-blue-400"}`}
                  >
                    {isSelected && (
                      <div className="h-2.5 w-2.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span
                    className={`text-lg ${isSelected ? "text-white font-medium" : "text-gray-300"}`}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-[#161b22] border-t border-gray-800 p-4 z-50 shadow-dark-up">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-bold disabled:opacity-40 transition-all flex items-center gap-2"
            >
              ← Previous
            </button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                }
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                💾 Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
