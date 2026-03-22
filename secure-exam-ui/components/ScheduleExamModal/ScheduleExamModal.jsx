import { useState, useEffect } from "react";
import api from "../../../secure-exam-ui/src/api/axiosConfig"; // Assure-toi que le chemin vers axiosConfig est bon

export default function ScheduleExamModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    formation: "",
    scheduledFor: "",
    durationMinutes: 60,
    sourceBankId: "",
    questionsToPull: 10,
  });

  const [availableBanks, setAvailableBanks] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🟢 NOUVEAU : On télécharge tes VRAIS dossiers depuis le C# au démarrage de la fenêtre
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await api.get("/Exams/banks");
        setAvailableBanks(response.data);
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des banques de questions",
          err,
        );
      }
    };
    fetchBanks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // On envoie les données au C#
      await api.post("/Exams/schedule", formData);
      setLoading(false);
      onSuccess(); // Ferme la modal et affiche un succès
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la programmation de l'examen.");
      setLoading(false);
    }
  };

  // Trouver la banque sélectionnée pour afficher le max de questions
  const selectedBank = availableBanks.find(
    (b) => b.id.toString() === formData.sourceBankId.toString(),
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-gray-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            📅 Schedule Zero-Trust Exam
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bloc 1 : Logistique */}
          <div className="bg-blue-900/10 border border-blue-500/30 rounded-lg p-5">
            <h3 className="text-blue-400 font-bold mb-4">
              📅 1. Exam Logistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0d1117] border border-gray-600 rounded p-2 text-white"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Final Cybersecurity"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Target Formation
                </label>
                <select
                  required
                  className="w-full bg-[#0d1117] border border-gray-600 rounded p-2 text-white"
                  value={formData.formation}
                  onChange={(e) =>
                    setFormData({ ...formData, formation: e.target.value })
                  }
                >
                  <option value="">Select Target Formation...</option>
                  <option value="Cyber-2026">Cyber-2026</option>
                  <option value="Data-2025">Data-2025</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full bg-[#0d1117] border border-gray-600 rounded p-2 text-white"
                  value={formData.scheduledFor}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledFor: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full bg-[#0d1117] border border-gray-600 rounded p-2 text-white"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Bloc 2 : Moteur dynamique (Les VRAIS dossiers) */}
          <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-5">
            <h3 className="text-green-400 font-bold mb-4">
              ⚙️ 2. Dynamic Generation Engine
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Source Question Bank
                </label>
                <select
                  required
                  className="w-full bg-[#0d1117] border border-gray-600 rounded p-2 text-white"
                  value={formData.sourceBankId}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceBankId: e.target.value })
                  }
                >
                  <option value="">-- Choose a Folder --</option>
                  {availableBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.course} - {bank.folderName} ({bank.totalQuestions}{" "}
                      questions)
                    </option>
                  ))}
                </select>
              </div>

              {selectedBank && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Questions per student?
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={selectedBank.totalQuestions}
                      required
                      className="w-24 bg-[#0d1117] border border-gray-600 rounded p-2 text-white"
                      value={formData.questionsToPull}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          questionsToPull: parseInt(e.target.value),
                        })
                      }
                    />
                    <span className="text-gray-400">
                      / {selectedBank.totalQuestions} Max
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "🚀 Schedule & Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
