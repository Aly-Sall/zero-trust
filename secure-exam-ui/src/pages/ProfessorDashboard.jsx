import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import api from "../api/axiosConfig";

export default function ProfessorDashboard() {
  // --- ÉTATS DU MONITORING (SIGNALR) ---
  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  // --- ÉTATS DES EXAMENS ---
  const [banks, setBanks] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    title: "Examen Cybersécurité - Final",
    formation: "Cyber-2026", // La fameuse cohorte !
    scheduledFor: "",
    durationMinutes: 60,
    sourceBankId: "",
    questionsToPull: 3,
  });

  // 1. Charger les banques de questions au démarrage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await api.get("/Exams/banks");
      setBanks(res.data);
      if (res.data.length > 0) {
        setScheduleForm((prev) => ({ ...prev, sourceBankId: res.data[0].id }));
      }
    } catch (err) {
      console.error("Erreur chargement des banques", err);
    }
  };

  // 2. Connexion au serveur de Monitoring (WebSocket)
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5162/monitoringHub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    newConnection
      .start()
      .then(() => {
        setConnectionStatus("🟢 Connected to AI Monitoring (Live)");
        newConnection.on("ReceiveAlert", (alertData) => {
          setAlerts((prevAlerts) => [alertData, ...prevAlerts]);
        });
      })
      .catch(() => setConnectionStatus("🔴 Server offline"));

    return () => newConnection && newConnection.stop();
  }, []);

  // 3. Bouton "Triche" pour la démo : Créer une banque rapidement
  const handleQuickCreateBank = async () => {
    const mockBank = {
      folderName: "Network Security & AI",
      course: "Cybersecurity",
      questions: [
        {
          text: "What is the core principle of a Zero-Trust architecture?",
          options: [
            "Always trust the local network",
            "Never trust, always verify",
            "Rely exclusively on VPNs",
          ],
          correctAnswerIndex: 1,
        },
        {
          text: "What is the primary purpose of a biometric system during a secure exam?",
          options: [
            "To enhance the user interface graphics",
            "To provide continuous identity authentication",
            "To automatically calculate the final grade",
          ],
          correctAnswerIndex: 1,
        },
        {
          text: "What does the AI monitoring system actively detect during a session?",
          options: [
            "Identity spoofing and behavioral anomalies",
            "Changes in local weather conditions",
            "The device's battery level",
          ],
          correctAnswerIndex: 0,
        },
      ],
    };
    try {
      await api.post("/Exams/banks", mockBank);
      alert("✅ Banque d'examen créée !");
      fetchBanks();
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Erreur lors de la création.");
    }
  };

  // 4. Planifier l'examen (et envoyer les emails !)
  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.sourceBankId || !scheduleForm.scheduledFor) {
      return alert("Veuillez sélectionner une banque et une date.");
    }
    try {
      const res = await api.post("/Exams/schedule", scheduleForm);
      alert(
        `✅ Examen planifié ! ${res.data.emailsSent} emails de notification ont été envoyés aux étudiants.`,
      );
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Erreur lors de la planification.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-8 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-blue-500">👨‍🏫</span> Professor Control Center
          </h1>
          <span
            className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
              connectionStatus.includes("🟢")
                ? "bg-green-900/40 text-green-400 border border-green-500/50"
                : "bg-red-900/40 text-red-400 border border-red-500/50"
            }`}
          >
            {connectionStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* COLONNE GAUCHE : GESTION DES EXAMENS */}
          <div className="space-y-8">
            {/* Repo Questions */}
            <div className="bg-[#161b22] border border-gray-700 p-6 rounded-xl shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-blue-400">
                  📚 Exam Repository
                </h2>
                <button
                  onClick={handleQuickCreateBank}
                  className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition-colors border border-gray-600"
                >
                  + Add Demo Bank
                </button>
              </div>

              {banks.length === 0 ? (
                <p className="text-gray-500 italic">
                  Aucune banque de questions. Utilisez le bouton pour en générer
                  une.
                </p>
              ) : (
                <ul className="space-y-3">
                  {banks.map((b) => (
                    <li
                      key={b.id}
                      className="bg-[#0d1117] p-3 rounded border border-gray-700 flex justify-between"
                    >
                      <span className="font-bold">{b.folderName}</span>
                      <span className="text-gray-400 text-sm">
                        {b.totalQuestions} Qs
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Planification d'Examen */}
            <div className="bg-[#161b22] border border-gray-700 p-6 rounded-xl shadow-xl">
              <h2 className="text-xl font-bold mb-6 text-purple-400">
                📅 Schedule New Exam
              </h2>
              <form onSubmit={handleSchedule} className="space-y-4">
                <input
                  type="text"
                  className="w-full bg-[#0d1117] border border-gray-600 p-3 rounded"
                  value={scheduleForm.title}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, title: e.target.value })
                  }
                  placeholder="Titre de l'examen"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">
                      Cohorte (Cible)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#0d1117] border border-gray-600 p-3 rounded text-green-400 font-bold"
                      value={scheduleForm.formation}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          formation: e.target.value,
                        })
                      }
                      placeholder="Ex: Cyber-2026"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">
                      Date & Heure
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full bg-[#0d1117] border border-gray-600 p-3 rounded [color-scheme:dark]"
                      value={scheduleForm.scheduledFor}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          scheduledFor: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="w-full bg-[#0d1117] border border-gray-600 p-3 rounded"
                    value={scheduleForm.sourceBankId}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        sourceBankId: e.target.value,
                      })
                    }
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.folderName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="w-full bg-[#0d1117] border border-gray-600 p-3 rounded"
                    value={scheduleForm.questionsToPull}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        questionsToPull: e.target.value,
                      })
                    }
                    placeholder="Nombre de Qs à tirer"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-lg shadow-lg transition-colors mt-4"
                >
                  🚀 Launch Exam & Notify Students
                </button>
              </form>
            </div>
          </div>

          {/* COLONNE DROITE : LIVE MONITORING (Ton code SignalR) */}
          <div className="bg-[#161b22] border border-gray-700 rounded-xl overflow-hidden shadow-2xl h-[800px] flex flex-col">
            <div className="p-6 border-b border-gray-700 bg-gray-900/50">
              <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                🚨 Live Security Feeds
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Détection IA des anomalies en temps réel
              </p>
            </div>

            <div className="p-4 bg-black/40 border-b border-gray-700 font-semibold text-gray-400 grid grid-cols-4 gap-4 text-sm">
              <div>Time</div>
              <div>Student ID</div>
              <div>Alert Type</div>
              <div>Threat Score</div>
            </div>

            <div className="divide-y divide-gray-800 overflow-y-auto flex-1 p-2">
              {alerts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 italic">
                  Aucune anomalie détectée. La session est sécurisée.
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="p-10 grid grid-cols-4 gap-4 items-center bg-red-900/10 hover:bg-red-900/30 transition-colors rounded mb-2 border border-red-900/30"
                  >
                    <div className="text-gray-400 text-sm">{alert.time}</div>
                    <div className="font-mono text-white text-sm">
                      #{alert.sessionId}
                    </div>
                    <div className="text-red-400 font-bold text-sm mr-7">
                      ⚠️ {alert.type}
                    </div>
                    <div>
                      <span className="font-mono text-red-200 bg-red-900 px-2 py-1 rounded text-xs border border-red-700">
                        {alert.score.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
