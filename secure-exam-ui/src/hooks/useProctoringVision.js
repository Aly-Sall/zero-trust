import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";

export default function useProctoringVision(webcamRef, onAnomalyDetected) {
  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const intervalRef = useRef(null);

  // 1. Load the COCO-SSD model on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await cocossd.load();
        setModel(loadedModel);
        setIsModelLoading(false);
        console.log("✅ AI Vision: COCO-SSD Model loaded successfully.");
      } catch (err) {
        console.error("❌ AI Vision: Failed to load model:", err);
      }
    };
    loadModel();
  }, []);

  // 2. Detection loop
  useEffect(() => {
    if (!model || !webcamRef.current || !webcamRef.current.video) return;

    const detectAnomalies = async () => {
      const video = webcamRef.current.video;

      if (video.readyState === 4) {
        const predictions = await model.detect(video);

        // --- DEBUG LOG : See what the AI sees in your F12 console ---
        console.log("🔍 AI Vision Scan:", predictions);

        let phoneDetected = false;
        let personCount = 0;

        predictions.forEach((prediction) => {
          // Sensitivity set to 0.4 (40%) for easier testing
          if (prediction.class === "cell phone" && prediction.score > 0.4) {
            phoneDetected = true;
          }
          if (prediction.class === "person" && prediction.score > 0.4) {
            personCount++;
          }
        });

        // 3. Trigger alerts to parent component
        if (phoneDetected) {
          onAnomalyDetected("Cell Phone Detected");
        }
        if (personCount === 0) {
          onAnomalyDetected("Student Absent");
        } else if (personCount > 1) {
          onAnomalyDetected("Multiple People Detected");
        }
      }
    };

    // Run detection every 3 seconds
    intervalRef.current = setInterval(detectAnomalies, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [model, webcamRef, onAnomalyDetected]);

  return { isModelLoading };
}
