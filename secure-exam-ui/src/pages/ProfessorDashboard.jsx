import { useState, useEffect } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr"; // 📡 AJOUT : Import SignalR
import api from "../api/axiosConfig";
import ScheduleExamModal from "../../components/ScheduleExamModal/ScheduleExamModal";

export default function ProfessorDashboard() {
  const [banks, setBanks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // 📡 AJOUT : État pour le radar de sécurité
  const [liveAlerts, setLiveAlerts] = useState([]);

  // State for manual creation
  const [manualBank, setManualBank] = useState({
    course: "",
    folderName: "",
    questions: [{ text: "", options: ["", "", "", ""], correctAnswerIndex: 0 }],
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchBanks();
  }, []);

  // 📡 AJOUT : Écoute des alertes via WebSocket (SignalR)
  useEffect(() => {
    // ⚠️ Remplace '7194' par le port de ton backend C# si nécessaire
    const hubConnection = new HubConnectionBuilder()
      .withUrl("https://localhost:7194/monitoringHub")
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    hubConnection
      .start()
      .then(() => console.log("📡 Connected to Security Hub!"))
      .catch((err) => console.error("SignalR Connection Error: ", err));

    hubConnection.on("ReceiveAlert", (alertData) => {
      console.log("🚨 ALERTE REÇUE :", alertData);
      setLiveAlerts((prevAlerts) => [alertData, ...prevAlerts]);
    });

    return () => {
      hubConnection.stop();
    };
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await api.get("/Exams/banks");
      setBanks(res.data);
    } catch (err) {
      console.error("Error fetching banks", err);
    }
  };

  const addQuestion = () => {
    setManualBank({
      ...manualBank,
      questions: [
        ...manualBank.questions,
        { text: "", options: ["", "", "", ""], correctAnswerIndex: 0 },
      ],
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...manualBank.questions];
    newQuestions[index][field] = value;
    setManualBank({ ...manualBank, questions: newQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...manualBank.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setManualBank({ ...manualBank, questions: newQuestions });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/Exams/banks", manualBank);
      alert("✅ Question bank created successfully!");
      setShowManualForm(false);
      fetchBanks();
      setManualBank({
        course: "",
        folderName: "",
        questions: [
          { text: "", options: ["", "", "", ""], correctAnswerIndex: 0 },
        ],
      });
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Error during creation.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-blue-500">
            👨‍🏫 Professor Workspace
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-all"
            >
              {showManualForm ? "Cancel" : "➕ Create a Bank"}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-all"
            >
              📅 Schedule an Exam
            </button>
          </div>
        </div>

        {/* 🚨 AJOUT : SOC - LIVE SECURITY FEED */}
        <div className="bg-[#161b22] border-2 border-red-900/50 rounded-xl p-8 shadow-[0_0_30px_rgba(220,38,38,0.1)]">
          <h2 className="text-xl font-bold mb-6 text-red-500 flex items-center gap-3 border-b border-gray-800 pb-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Live Exam Monitoring (SOC)
          </h2>

          {liveAlerts.length === 0 ? (
            <div className="p-6 text-center text-gray-500 italic bg-black/20 rounded-lg border border-dashed border-gray-700">
              ✅ No security breaches detected. All active exam sessions are
              secure.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-sm">
                    <th className="pb-3 pl-4">Time</th>
                    <th className="pb-3">Session ID</th>
                    <th className="pb-3">Infraction Type</th>
                    <th className="pb-3 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {liveAlerts.map((alert, index) => (
                    <tr
                      key={index}
                      className="bg-red-900/10 hover:bg-red-900/20 transition-colors animate-pulse"
                    >
                      <td className="py-4 pl-4 font-mono text-gray-300">
                        {alert.time}
                      </td>
                      <td className="py-4 font-mono text-blue-400">
                        #{alert.sessionId}
                      </td>
                      <td className="py-4 font-bold text-red-400 flex items-center gap-2">
                        ⚠️ {alert.type}
                      </td>
                      <td className="py-4 text-right pr-4">
                        <button className="bg-red-600/20 text-red-500 border border-red-600/50 px-4 py-1.5 rounded-lg text-sm hover:bg-red-600 hover:text-white transition-all font-bold">
                          Lock Exam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FORMULAIRE MANUEL (Ton code d'origine) */}
        {showManualForm && (
          <div className="bg-[#161b22] border border-gray-700 p-8 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-blue-400">
              New Question Bank
            </h2>
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Course (e.g., Cryptography)"
                  required
                  className="bg-[#0d1117] border border-gray-600 p-3 rounded text-white"
                  value={manualBank.course}
                  onChange={(e) =>
                    setManualBank({ ...manualBank, course: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Folder Name (e.g., Final Exam 2026)"
                  required
                  className="bg-[#0d1117] border border-gray-600 p-3 rounded text-white"
                  value={manualBank.folderName}
                  onChange={(e) =>
                    setManualBank({ ...manualBank, folderName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-8">
                {manualBank.questions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="p-6 bg-[#0d1117] border border-gray-700 rounded-lg space-y-4"
                  >
                    <div className="flex justify-between">
                      <h3 className="text-lg font-bold">
                        Question {qIndex + 1}
                      </h3>
                    </div>
                    <input
                      type="text"
                      placeholder="Question text"
                      required
                      className="w-full bg-[#161b22] border border-gray-600 p-2 rounded text-white"
                      value={q.text}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "text", e.target.value)
                      }
                    />
                    <div className="grid grid-cols-2 gap-4">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctAnswerIndex === oIndex}
                            onChange={() =>
                              handleQuestionChange(
                                qIndex,
                                "correctAnswerIndex",
                                oIndex,
                              )
                            }
                          />
                          <input
                            type="text"
                            placeholder={`Option ${oIndex + 1}`}
                            required
                            className="w-full bg-[#161b22] border border-gray-600 p-2 rounded text-sm text-white"
                            value={opt}
                            onChange={(e) =>
                              handleOptionChange(qIndex, oIndex, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-blue-400 hover:text-blue-300 font-bold"
                >
                  + Add another question
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 px-10 py-3 rounded-xl font-bold"
                >
                  Save Bank
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LIST OF BANKS */}
        <div className="bg-[#161b22] border border-gray-700 p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-bold mb-4">
            📂 Available Question Banks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banks.length === 0 ? (
              <p className="text-gray-500 italic">No banks available.</p>
            ) : (
              banks.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#0d1117] p-4 rounded-lg border border-gray-700 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold">{b.course}</div>
                    <div className="text-sm text-gray-400">{b.folderName}</div>
                  </div>
                  <div className="text-blue-400 font-mono">
                    {b.totalQuestions} Qs
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {isModalOpen && (
          <ScheduleExamModal
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              setIsModalOpen(false);
              fetchBanks();
              alert("✅ Exam scheduled!");
            }}
          />
        )}
      </div>
    </div>
  );
}
