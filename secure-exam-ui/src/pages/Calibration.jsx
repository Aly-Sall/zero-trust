import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useKeystrokeDynamics from "../hooks/useKeystrokeDynamics";
import api from "../api/axiosConfig";

export default function Calibration() {
  const [text, setText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [metrics, setMetrics] = useState(null); // To display stats to the student

  const navigate = useNavigate();
  const { handleKeyDown, handleKeyUp, getKeystrokeData, clearKeystrokeData } =
    useKeystrokeDynamics();

  // English reference sentence for the jury
  const referenceSentence = "Zero-Trust security is essential.";

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const submitCalibration = async () => {
    // 1. Basic validation: Did the student type the sentence correctly?
    if (text !== referenceSentence) {
      setStatusMessage(
        "⚠️ Please type the sentence exactly as shown (respecting case and the final period).",
      );
      return;
    }

    const data = getKeystrokeData();

    try {
      setStatusMessage("⏳ Calculating your biometric signature...");

      // 2. Send keystroke data to the backend to calculate the Baseline
      const response = await api.post("/Biometrics/calibrate", data);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white relative">
      <div className="w-full max-w-2xl bg-white/5 p-8 rounded-xl border border-gray-700 shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-secureAccent">
          Biometric Enrollment
        </h1>
        <p className="text-gray-400 mb-6">
          Before accessing the exam, we need to create your typing profile.
          Please type the sentence below at your natural typing speed.
        </p>

        <div className="bg-black/40 p-4 rounded text-center text-xl font-mono mb-6 border border-gray-600 select-none">
          {referenceSentence}
        </div>

        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          disabled={isCalibrated}
          className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-4 text-white focus:outline-none focus:border-secureAccent resize-none mb-4"
          placeholder="Type the sentence here..."
          onPaste={(e) => e.preventDefault()} // Copy-paste is forbidden here too!
        ></textarea>

        {statusMessage && (
          <div
            className={`p-4 rounded mb-6 font-semibold ${isCalibrated ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}
          >
            {statusMessage}
          </div>
        )}

        {/* Displaying Data Science metrics calculated by the API */}
        {metrics && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded text-center">
              <div className="text-gray-400 text-sm">Mean Dwell Time</div>
              <div className="text-xl font-bold font-mono text-secureAccent">
                {metrics.dwell.toFixed(2)} ms
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded text-center">
              <div className="text-gray-400 text-sm">Mean Flight Time</div>
              <div className="text-xl font-bold font-mono text-secureAccent">
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
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Restart
              </button>
              <button
                onClick={submitCalibration}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 font-bold rounded shadow transition-colors"
              >
                Save My Signature
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/exam")}
              className="w-full py-3 bg-secureAccent hover:bg-emerald-400 text-gray-900 font-bold rounded-lg text-lg shadow-lg transition-transform transform hover:scale-105"
            >
              Proceed to Exam ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
