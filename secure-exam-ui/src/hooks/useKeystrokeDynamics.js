import { useRef, useCallback } from "react";

export default function useKeystrokeDynamics() {
  // On stocke les événements bruts sans provoquer de rechargement visuel (pour la performance)
  const keystrokesRef = useRef([]);

  const handleKeyDown = useCallback((e) => {
    // On ignore les frappes maintenues enfoncées artificiellement (quand on reste appuyé sur une touche)
    if (e.repeat) return;

    // 🚀 On enregistre l'événement "keydown" brut pour le backend C#
    keystrokesRef.current.push({
      key: e.key,
      type: "keydown",
      timestamp: Date.now(), // Date.now() est parfait pour le format 'long' du C#
    });
  }, []);

  const handleKeyUp = useCallback((e) => {
    // 🚀 On enregistre l'événement "keyup" brut
    keystrokesRef.current.push({
      key: e.key,
      type: "keyup",
      timestamp: Date.now(),
    });
  }, []);

  // Récupère toutes les frappes pour l'API
  const getKeystrokeData = useCallback(() => {
    return keystrokesRef.current;
  }, []);

  // Remise à zéro si l'étudiant recommence
  const clearKeystrokeData = useCallback(() => {
    keystrokesRef.current = [];
  }, []);

  return { handleKeyDown, handleKeyUp, getKeystrokeData, clearKeystrokeData };
}
