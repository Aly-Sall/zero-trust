import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr"; // 🚀 IMPORT NOUVEAU
import api from "../api/axiosConfig";
import useKeystrokeDynamics from "../hooks/useKeystrokeDynamics";

export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();

  // 🚀 NOUVEAU : On récupère l'email de l'étudiant dès le début pour l'envoyer avec la vidéo et les alertes
  const userProfile = JSON.parse(localStorage.getItem("userProfile")) || {};
  const studentEmail = userProfile.email || "Unknown Student";

  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointText, setCheckpointText] = useState("");
  const [hasPassedCheckpoint, setHasPassedCheckpoint] = useState(false);
  const [checkpointStatus, setCheckpointStatus] = useState("");

  const { handleKeyDown, handleKeyUp, getKeystrokeData } =
    useKeystrokeDynamics();
  const checkpointSentence = "I confirm my identity.";

  // 🎥 REFS POUR LA WEBCAM
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hubConnection, setHubConnection] = useState(null);

  const reportInfraction = useCallback(
    async (alertType) => {
      try {
        // 🚀 NOUVEAU : On ajoute l'email de l'étudiant à l'alerte
        await api.post(`/ExamSession/${examId}/lockdown-alert`, {
          alertType,
          studentEmail,
        });
      } catch (err) {
        console.error("Failed to send alert to server", err);
      }
    },
    [examId, studentEmail],
  );

  // 🛡️ ZERO-TRUST : Active Browser Surveillance (Inchangé)
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      reportInfraction("Right-Click Attempt");
    };
    const handleCopyPaste = (e) => {
      e.preventDefault();
      reportInfraction("Copy/Paste Attempt");
    };
    const handleVisibilityChange = () => {
      if (document.hidden) reportInfraction("Tab Switch / Left Exam Screen");
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

  // 🚀 NOUVEAU : CONNEXION SIGNALR & WEBCAM POUR L'ÉTUDIANT
  useEffect(() => {
    // 1. Démarrer la webcam
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Webcam Error:", err));

    // 2. Connecter au Hub
    const conn = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5162/monitoringHub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .build();

    conn
      .start()
      .then(() => setHubConnection(conn))
      .catch(console.error);

    return () => {
      conn.stop();
      // Couper la caméra en sortant
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 🚀 NOUVEAU : BOUCLE D'ENVOI VIDÉO (1 Image / seconde)
  useEffect(() => {
    if (!hubConnection) return;
    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        // On dessine l'image en basse résolution (320x240) pour le réseau
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        // On convertit en texte (Base64) format JPEG qualité 50%
        const frameData = canvasRef.current.toDataURL("image/jpeg", 0.5);

        // 🚀 NOUVEAU : On inclut l'email de l'étudiant dans l'envoi vidéo
        hubConnection
          .invoke("SendVideoFrame", examId, studentEmail, frameData)
          .catch(console.error);
      }
    }, 1000); // Envoie une frame toutes les 1000ms

    return () => clearInterval(interval);
  }, [hubConnection, examId, studentEmail]);

  // 📥 CHARGEMENT DES QUESTIONS (Inchangé)
  useEffect(() => {
    const fetchExamQuestions = async () => {
      try {
        const userProfile = JSON.parse(localStorage.getItem("userProfile"));
        const res = await api.get(
          `/Exams/generate/${examId}/student/${userProfile.email}`,
        );
        const rawQuestions = res.data.Questions || res.data.questions;
        setExamData({
          title: res.data.ExamTitle || "Official Exam",
          questions: rawQuestions,
        });
        setTimeLeft((res.data.Duration || 60) * 60);
        await api.post("/ExamSession/start").catch(() => {});
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        navigate("/student-dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchExamQuestions();
  }, [examId, navigate]);

  // ⏱️ GESTION DU TIMER (Inchangé)
  useEffect(() => {
    if (timeLeft > 0 && !showCheckpoint) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && examData) handleFinalSubmit();
  }, [timeLeft, examData, showCheckpoint]);

  const handleNextClick = () => {
    if (currentQuestionIndex === 0 && !hasPassedCheckpoint) {
      setShowCheckpoint(true);
      return;
    }
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const verifyIdentity = async () => {
    if (checkpointText !== checkpointSentence) {
      setCheckpointStatus("⚠️ Please type the sentence exactly.");
      return;
    }
    setCheckpointStatus("⏳ Analyzing rhythm...");
    const events = getKeystrokeData();
    const userProfile = JSON.parse(localStorage.getItem("userProfile"));

    try {
      const res = await api.post(`/ExamSession/${examId}/analyze`, {
        studentEmail: userProfile.email,
        events,
      });
      if (!res.data.secure)
        alert(
          "🚨 BIOMETRIC ANOMALY DETECTED! The professor has been notified.",
        );
      setShowCheckpoint(false);
      setHasPassedCheckpoint(true);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setCheckpointStatus("❌ Network error.");
    }
  };

  const handleFinalSubmit = async () => {
    if (timeLeft > 0 && !window.confirm("Are you sure you want to submit?"))
      return;
    setLoading(true);
    try {
      const userProfile = JSON.parse(localStorage.getItem("userProfile"));
      await api.post("/Exams/submit", {
        examId: parseInt(examId),
        studentEmail: userProfile.email,
        answers,
      });

      // 🛑 NOUVEAU : ARRÊT DE LA CAMÉRA SUR LE DASHBOARD DU PROFESSEUR AVEC L'EMAIL
      if (hubConnection) {
        hubConnection
          .invoke("StopVideoFrame", examId, studentEmail)
          .catch(console.error);
      }

      alert("✅ Exam locked and submitted!");
      navigate("/student-dashboard");
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Error submitting.");
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

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6 font-sans select-none relative">
      {/* 🎥 MINI-RETOUR WEBCAM ÉTUDIANT */}
      <div className="fixed bottom-6 right-6 z-[60] bg-black p-2 rounded-xl border border-gray-700 shadow-2xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-gray-400 tracking-widest">
            LIVE PROCTORING
          </span>
        </div>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-40 h-28 object-cover rounded-lg border border-gray-800"
        />
        {/* Canvas caché servant à capturer l'image */}
        <canvas ref={canvasRef} width="320" height="240" className="hidden" />
      </div>

      {showCheckpoint && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#161b22] p-8 rounded-2xl border border-red-500/50 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              🛑 Random Security Checkpoint
            </h2>
            <div className="bg-black p-4 rounded text-center font-mono mb-4">
              {checkpointSentence}
            </div>
            <textarea
              value={checkpointText}
              onChange={(e) => setCheckpointText(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onPaste={(e) => e.preventDefault()}
              className="w-full h-20 bg-[#0d1117] border border-gray-600 rounded p-3 text-white mb-4"
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
              Verify Identity
            </button>
          </div>
        </div>
      )}

      <div className="fixed top-0 left-0 right-0 bg-[#161b22] border-b border-gray-800 p-4 flex justify-between z-50">
        <h1 className="text-xl font-bold">🛡️ {examData?.title}</h1>
        <div className="text-xl font-mono text-green-400 font-bold">
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-24 pb-20">
        <div className="bg-[#161b22] border border-gray-700 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-8">
            {currentQuestion?.text}
          </h2>
          <div className="space-y-4">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = answers[currentQuestion.questionId] === index;
              return (
                <button
                  key={index}
                  onClick={() =>
                    setAnswers({
                      ...answers,
                      [currentQuestion.questionId]: index,
                    })
                  }
                  className={`w-full text-left p-5 rounded-xl border-2 ${isSelected ? "border-blue-500 bg-blue-900/30" : "border-gray-700"}`}
                >
                  <span className="text-lg">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-[#161b22] border-t border-gray-800 p-4 z-50">
          <div className="max-w-4xl mx-auto flex justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="bg-gray-800 text-white px-6 py-2.5 rounded-lg disabled:opacity-40"
            >
              ← Previous
            </button>
            {currentQuestionIndex < (examData?.questions.length || 0) - 1 ? (
              <button
                onClick={handleNextClick}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                className="bg-green-600 text-white px-8 py-2.5 rounded-lg font-bold"
              >
                💾 Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
