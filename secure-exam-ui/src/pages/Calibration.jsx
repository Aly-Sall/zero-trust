import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useKeystrokeDynamics from "../hooks/useKeystrokeDynamics";
import api from "../api/axiosConfig";

export default function Calibration() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [metrics, setMetrics] = useState(null);

  const { handleKeyDown, handleKeyUp, getKeystrokeData, clearKeystrokeData } =
    useKeystrokeDynamics();

  // La phrase exacte que l'étudiant doit taper
  const referenceSentence = "Zero-Trust security is essential.";

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const submitCalibration = async () => {
    // Vérification stricte
    if (text !== referenceSentence) {
      setStatusMessage(
        "⚠️ Please type the sentence exactly as shown (respecting case and the final period).",
      );
      return;
    }

    const events = getKeystrokeData();
    const userProfile = JSON.parse(localStorage.getItem("userProfile"));

    try {
      setStatusMessage("⏳ Calculating your biometric signature...");

      // Envoi du profil et des événements au backend
      const response = await api.post("/Biometrics/calibrate", {
        studentEmail: userProfile.email,
        events: events,
      });

      setIsCalibrated(true);
      setMetrics({
        dwell: response.data.dwell,
        flight: response.data.flight,
      });
      setStatusMessage("✅ " + response.data.message);
    } catch (err) {
      console.error("Calibration Error:", err);
      setStatusMessage(
        "❌ Error during recording. Are you connected to the server?",
      );
    }
  };

  const resetTyping = () => {
    setText("");
    clearKeystrokeData();
    setStatusMessage("");
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-8 text-white font-sans">
      <div className="w-full max-w-2xl bg-[#161b22] p-8 rounded-2xl border border-gray-700 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-green-500"></div>

        <h1 className="text-3xl font-bold mb-2 text-blue-500 flex items-center gap-3">
          ⌨️ Biometric Enrollment
        </h1>
        <p className="text-gray-400 mb-6">
          Before accessing the exam, we need to create your typing profile.
          Please type the sentence below at your natural typing speed.
        </p>

        <div className="bg-black/40 p-5 rounded-lg text-center text-xl font-mono mb-6 border border-gray-700 select-none text-gray-200">
          {referenceSentence}
        </div>

        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          disabled={isCalibrated}
          className="w-full h-24 bg-[#0d1117] border border-gray-600 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 resize-none mb-4 transition-colors disabled:opacity-50"
          placeholder="Type the sentence here..."
          onPaste={(e) => e.preventDefault()} // Interdit le copier/coller
        ></textarea>

        {statusMessage && (
          <div
            className={`p-4 rounded-lg mb-6 font-bold text-center border ${
              isCalibrated
                ? "bg-green-900/30 text-green-400 border-green-500/50"
                : "bg-yellow-900/30 text-yellow-400 border-yellow-500/50"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0d1117] border border-gray-700 p-4 rounded-lg text-center">
              <div className="text-gray-400 text-sm mb-1">Mean Dwell Time</div>
              <div className="text-2xl font-bold font-mono text-blue-400">
                {metrics.dwell.toFixed(2)} ms
              </div>
            </div>
            <div className="bg-[#0d1117] border border-gray-700 p-4 rounded-lg text-center">
              <div className="text-gray-400 text-sm mb-1">Mean Flight Time</div>
              <div className="text-2xl font-bold font-mono text-purple-400">
                {metrics.flight.toFixed(2)} ms
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-4">
          {!isCalibrated ? (
            <>
              <button
                onClick={resetTyping}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors font-semibold"
              >
                Restart
              </button>
              <button
                onClick={submitCalibration}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
              >
                Save My Signature
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(`/exam/${examId}`)} // 🚀 Envoie vers la VRAIE salle d'examen
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all flex justify-center items-center gap-2"
            >
              Proceed to Exam Room ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
