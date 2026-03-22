import { useEffect, useState } from "react";

export default function ExamCalendar() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    // Fetch exams from your new backend port 5162
    fetch("http://localhost:5162/api/exams")
      .then((res) => res.json())
      .then((data) => setExams(data))
      .catch((err) => console.error("Error loading exams:", err));
  }, []);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
        📅 Upcoming Exams
      </h2>

      {exams.length === 0 ? (
        <p className="text-gray-500 italic">No exams scheduled yet.</p>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-4 bg-gray-700/50 rounded-lg border-l-4 border-blue-500 hover:bg-gray-700 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white">{exam.title}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(exam.date).toLocaleDateString()} at{" "}
                    {new Date(exam.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded border border-blue-700">
                  {exam.duration} mins
                </span>
              </div>
              <div className="mt-2 text-xs font-mono text-gray-500">
                Access Code:{" "}
                <span className="text-green-400">{exam.accessCode}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
