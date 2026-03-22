import React, { useState } from "react";

function ExamForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    duration: "60",
    accessCode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Exam Title
        </label>
        <input
          type="text"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Cybersecurity Final"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Date & Time
          </label>
          <input
            type="datetime-local"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Duration (min)
          </label>
          <input
            type="number"
            name="duration"
            required
            value={formData.duration}
            onChange={handleChange}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Access Code (Zero-Trust Key)
        </label>
        <input
          type="text"
          name="accessCode"
          required
          value={formData.accessCode}
          onChange={handleChange}
          placeholder="e.g. SECURE-2026"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg"
        >
          Confirm Schedule
        </button>
      </div>
    </form>
  );
}

export default ExamForm;
