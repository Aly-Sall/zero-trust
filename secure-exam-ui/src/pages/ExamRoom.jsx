import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import useKeystrokeDynamics from "../hooks/useKeystrokeDynamics"; // 🚀 NOUVEAU

export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  // 🛡️ ÉTATS POUR LE CHECKPOINT BIOMÉTRIQUE
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointText, setCheckpointText] = useState("");
  const [hasPassedCheckpoint, setHasPassedCheckpoint] = useState(false);
  const [checkpointStatus, setCheckpointStatus] = useState("");

  const { handleKeyDown, handleKeyUp, getKeystrokeData, clearKeystrokeData } =
    useKeystrokeDynamics();

  const checkpointSentence = "I confirm my identity.";

  // 🚨 FONCTION POUR DÉNONCER L'ÉTUDIANT AU PROFESSEUR
  const reportInfraction = useCallback(
    async (alertType) => {
      try {
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
      setTimeout(() => {
        alert(
          "⚠️ Copy/Paste is strictly forbidden. The professor has been notified.",
        );
      }, 100);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportInfraction("Tab Switch / Left Exam Screen");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("visibilitychange", handleVisibilityChange);

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

        // 🚀 Démarre discrètement la session côté serveur
        await api.post("/ExamSession/start").catch(() => {});
      } catch (err) {
        console.error(err);
        alert("Access denied. Exam unavailable or already submitted.");
        navigate("/student-dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchExamQuestions();
  }, [examId, navigate]);

  // ⏱️ GESTION DU TIMER
  useEffect(() => {
    if (timeLeft > 0 && !showCheckpoint) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && examData) {
      handleFinalSubmit();
    }
  }, [timeLeft, examData, showCheckpoint]);

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  // 🚀 LOGIQUE DU BOUTON "NEXT" AVEC LE PIÈGE BIOMÉTRIQUE
  const handleNextClick = () => {
    // Pour la démo, on déclenche le Checkpoint quand on passe à la 2ème question (index 1)
    if (currentQuestionIndex === 0 && !hasPassedCheckpoint) {
      setShowCheckpoint(true);
      return;
    }
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  // 🧠 ANALYSE BIOMÉTRIQUE EN PLEIN EXAMEN
  const verifyIdentity = async () => {
    if (checkpointText !== checkpointSentence) {
      setCheckpointStatus("⚠️ Please type the sentence exactly.");
      return;
    }

    setCheckpointStatus("⏳ Analyzing rhythm...");
    const events = getKeystrokeData();

    try {
      const res = await api.post(`/ExamSession/${examId}/analyze`, events);

      // Si le backend dit que ce n'est pas sécurisé (Anomalie détectée)
      if (!res.data.secure) {
        alert(
          "🚨 BIOMETRIC ANOMALY DETECTED! Your typing rhythm does not match the registered student. The professor has been notified instantly.",
        );
      }

      // Quoi qu'il arrive, on ferme le pop-up pour qu'il continue (le prof s'en chargera avec son radar)
      setShowCheckpoint(false);
      setHasPassedCheckpoint(true);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } catch (err) {
      console.error(err);
      setCheckpointStatus("❌ Network error.");
    }
  };

  const handleFinalSubmit = async () => {
    if (
      timeLeft > 0 &&
      !window.confirm("Are you sure you want to submit your final answers?")
    )
      return;

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
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Error submitting the exam.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white">
        Loading...
      </div>
    );

  const currentQuestion = examData?.questions[currentQuestionIndex];
  const totalQuestions = examData?.questions.length || 0;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6 font-sans select-none relative">
      {/* 🛑 POP-UP DU CHECKPOINT BIOMÉTRIQUE */}
      {showCheckpoint && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#161b22] p-8 rounded-2xl border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] max-w-lg w-full">
            <h2 className="text-2xl font-bold text-red-500 mb-4 flex items-center gap-2">
              🛑 Random Security Checkpoint
            </h2>
            <p className="text-gray-300 mb-6 text-sm">
              Continuous authentication required. Please type the sentence below
              to verify your identity.
            </p>

            <div className="bg-black p-4 rounded text-center font-mono text-gray-200 mb-4 border border-gray-700">
              {checkpointSentence}
            </div>

            <textarea
              value={checkpointText}
              onChange={(e) => setCheckpointText(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onPaste={(e) => e.preventDefault()}
              className="w-full h-20 bg-[#0d1117] border border-gray-600 rounded p-3 text-white focus:border-red-500 outline-none mb-4"
              placeholder="Type here..."
            />

            {checkpointStatus && (
              <p className="text-yellow-500 text-sm mb-4 font-bold">
                {checkpointStatus}
              </p>
            )}

            <button
              onClick={verifyIdentity}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg"
            >
              Verify Identity & Continue
            </button>
          </div>
        </div>
      )}

      {/* HEADER EXAMEN */}
      <div className="fixed top-0 left-0 right-0 bg-[#161b22] border-b border-gray-800 p-4 flex justify-between items-center z-50">
        <h1 className="text-xl font-bold">🛡️ {examData?.title}</h1>
        <div className="text-xl font-mono text-green-400 font-bold">
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
      </div>

      {/* ZONE DES QUESTIONS */}
      <div className="max-w-4xl mx-auto pt-24 pb-20">
        <div className="bg-[#161b22] border border-gray-700 rounded-2xl p-8 shadow-2xl relative">
          <div className="text-gray-400 text-sm mb-4">
            Question {currentQuestionIndex + 1} / {totalQuestions}
          </div>
          <h2 className="text-2xl font-semibold mb-8 text-gray-50">
            {currentQuestion?.text}
          </h2>

          <div className="space-y-4">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = answers[currentQuestion.questionId] === index;
              return (
                <button
                  key={index}
                  onClick={() =>
                    handleAnswerSelect(currentQuestion.questionId, index)
                  }
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    isSelected
                      ? "bg-blue-900/30 border-blue-500"
                      : "bg-[#0d1117] border-gray-700 hover:border-gray-500"
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-blue-400 bg-blue-500" : "border-gray-500"}`}
                  >
                    {isSelected && (
                      <div className="h-2.5 w-2.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-lg text-gray-300">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FOOTER BOUTONS */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#161b22] border-t border-gray-800 p-4 z-50">
          <div className="max-w-4xl mx-auto flex justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="bg-gray-800 text-white px-6 py-2.5 rounded-lg disabled:opacity-40"
            >
              ← Previous
            </button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNextClick} // 🚀 ON UTILISE NOTRE NOUVELLE FONCTION PIÈGE ICI
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                className="bg-green-600 text-white px-8 py-2.5 rounded-lg font-bold"
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
