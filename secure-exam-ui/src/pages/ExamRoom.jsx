import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import api from "../api/axiosConfig";

export default function ExamRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [error, setError] = useState("");
  const [calibrationDone, setCalibrationDone] = useState(false);
  const [hubConnection, setHubConnection] = useState(null);

  // 🆕 NOUVEAU : État pour gérer les alertes visuelles internes
  const [localWarnings, setLocalWarnings] = useState([]);

  // Fonction pour afficher une bannière rouge temporaire
  const showWarning = (message) => {
    const id = Date.now(); // Identifiant unique
    setLocalWarnings((prev) => [{ id, text: message }, ...prev].slice(0, 3)); // Garde max 3 alertes à l'écran

    // Fait disparaître l'alerte après 5 secondes
    setTimeout(() => {
      setLocalWarnings((prev) => prev.filter((w) => w.id !== id));
    }, 5000);
  };

  // 1. INITIALISATION
  useEffect(() => {
    const userProfile = JSON.parse(localStorage.getItem("userProfile"));
    if (!userProfile) return navigate("/");

    const studentId = userProfile.email;

    api
      .get(`/Exams/generate/${examId}/student/${studentId}`)
      .then((res) => setExamData(res.data))
      .catch(() =>
        setError("Examen introuvable. Demandez au professeur de le recréer."),
      );

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5162/monitoringHub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => setHubConnection(connection))
      .catch((err) => console.error("Radar hors ligne", err));

    return () => connection && connection.stop();
  }, [examId, navigate]);

  // 2. LE BOUCLIER ANTI-TRICHE ACTIF (Sans les vieux alert())
  useEffect(() => {
    const sendCheatAlert = (actionType) => {
      const userProfile = JSON.parse(localStorage.getItem("userProfile"));
      if (hubConnection && userProfile) {
        const alertData = {
          time: new Date().toLocaleTimeString(),
          sessionId: userProfile.email,
          type: actionType,
          score: Math.random() * (0.9 - 0.7) + 0.7,
        };
        hubConnection
          .invoke("ReportCheat", alertData)
          .catch((e) => console.error(e));
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      sendCheatAlert("Tentative de Clic Droit");
      showWarning(
        "🚨 Clic droit bloqué. Le système de surveillance a enregistré cette action.",
      );
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      sendCheatAlert("Tentative de Copier-Coller");
      showWarning(
        "🚨 Presse-papier verrouillé. La copie de contenu est interdite.",
      );
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendCheatAlert("Changement d'onglet / Perte de focus");
        showWarning(
          "🚨 Interdiction de changer d'onglet ! Restez sur cette page.",
        );
      }
    };

    if (calibrationDone) {
      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("copy", handleCopyPaste);
      document.addEventListener("cut", handleCopyPaste);
      document.addEventListener("paste", handleCopyPaste);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [calibrationDone, hubConnection]);

  // ÉCRANS DE GESTION
  if (error)
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center p-10 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          🚨 Accès Refusé
        </h1>
        <p className="text-gray-400 mb-8">{error}</p>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded"
        >
          Retour
        </button>
      </div>
    );

  if (!examData)
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="animate-pulse text-xl">Chargement sécurisé...</div>
      </div>
    );

  // ÉCRAN DE CALIBRATION
  if (!calibrationDone)
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-3xl font-bold mb-6 text-blue-500">
          📷 Calibration Biométrique
        </h2>
        <div className="w-96 h-64 bg-black border-2 border-dashed border-blue-500 flex flex-col items-center justify-center mb-6 relative shadow-[0_0_30px_rgba(37,99,235,0.2)]">
          <div className="absolute top-0 w-full h-1 bg-blue-500/50 animate-[ping_3s_ease-in-out_infinite]"></div>
          <span className="text-gray-500">Flux Caméra Activé</span>
        </div>
        <button
          onClick={() => setCalibrationDone(true)}
          className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-bold transition-all"
        >
          Verrouiller l'identité et Commencer
        </button>
      </div>
    );

  // ÉCRAN DE L'EXAMEN
  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-8 select-none">
      <div className="max-w-4xl mx-auto">
        {/* HEADER STICKY */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6 sticky top-0 bg-[#0d1117]/95 backdrop-blur z-20">
          <div>
            <h1 className="text-2xl font-bold text-white">
              📝 {examData.examTitle}
            </h1>
            <p className="text-gray-400 text-sm">
              Candidat : {examData.studentId}
            </p>
          </div>
          <div className="text-red-400 font-mono flex items-center gap-3 bg-red-900/20 px-4 py-2 rounded-full border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Surveillance IA Active
          </div>
        </div>

        {/* 🆕 AFFICHAGE DES ALERTES INTERNES */}
        {localWarnings.length > 0 && (
          <div className="mb-8 space-y-3 sticky top-[100px] z-10">
            {localWarnings.map((warning) => (
              <div
                key={warning.id}
                className="bg-red-900/40 border border-red-500/50 text-red-200 px-5 py-4 rounded-lg flex items-center gap-3 animate-pulse shadow-lg backdrop-blur-sm"
              >
                <span className="text-xl">⚠️</span>
                <span className="font-semibold">{warning.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* LISTE DES QUESTIONS */}
        <div className="space-y-8">
          {examData.questions.map((q, index) => (
            <div
              key={index}
              className="bg-[#161b22] border border-gray-700 p-6 rounded-xl shadow-lg relative z-0"
            >
              <h3 className="text-lg font-bold mb-4 text-blue-100">
                <span className="text-blue-500 mr-2">Q{index + 1}.</span>{" "}
                {q.text}
              </h3>
              <div className="space-y-3">
                {q.options.map((opt, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 p-4 bg-[#0d1117] border border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-900/10 transition-all"
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      className="w-5 h-5 accent-blue-500"
                    />
                    <span className="text-gray-200">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            navigate("/student-dashboard");
          }}
          className="w-full bg-blue-600 hover:bg-blue-500 py-4 mt-10 rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]"
        >
          Soumettre définitivement
        </button>
      </div>
    </div>
  );
}
