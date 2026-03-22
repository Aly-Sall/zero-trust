import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();
  const userProfile = JSON.parse(localStorage.getItem("userProfile")) || {};

  useEffect(() => {
    // On récupère les examens basés sur la cohorte stockée au login
    if (userProfile.cohort) {
      api
        .get(`/Exams/available/${userProfile.cohort}`)
        .then((res) => setExams(res.data))
        .catch((err) => console.error("Erreur récupération examens:", err));
    }
  }, [userProfile.cohort]);

  return (
    <div className="min-h-screen bg-[#0d1117] p-8 text-white font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-gray-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-blue-500">🎓</span> Espace Étudiant
            </h1>
            <p className="text-gray-400 mt-2">
              Cohorte :{" "}
              <span className="text-green-400 font-bold">
                {userProfile.cohort || "Non définie"}
              </span>
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            className="text-sm bg-gray-800 hover:bg-red-900 px-4 py-2 rounded transition-colors"
          >
            Déconnexion
          </button>
        </div>

        <div className="bg-[#161b22] border border-gray-700 rounded-xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-blue-400 border-b border-gray-800 pb-2">
            Mes Examens Programmés
          </h2>

          {exams.length === 0 ? (
            <div className="p-10 text-center text-gray-500 italic bg-black/20 rounded-lg border border-dashed border-gray-700">
              Aucun examen n'est programmé pour votre classe actuellement.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-[#0d1117] border border-gray-600 rounded-lg p-6 hover:border-blue-500 transition-all shadow-lg"
                >
                  <h3 className="text-xl font-bold text-white mb-2">
                    {exam.title}
                  </h3>
                  <div className="text-sm text-gray-400 space-y-2 mb-6">
                    <p>
                      📅 Date : {new Date(exam.scheduledFor).toLocaleString()}
                    </p>
                    <p>⏱️ Durée : {exam.durationMinutes} minutes</p>
                  </div>
                  <button
                    onClick={() => navigate(`/exam/${exam.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    Rejoindre la salle d'examen
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
