import { useRef, useCallback } from "react";

export default function useKeystrokeDynamics() {
  // useRef permet de stocker des données en tâche de fond SANS provoquer de rechargement visuel
  const keystrokesRef = useRef([]);
  const activeKeysRef = useRef({});
  const lastKeyUpTimeRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    const pressTime = performance.now(); // Précision à la milliseconde près
    const key = e.key;

    // On ignore les frappes maintenues artificiellement (auto-repeat du clavier)
    if (e.repeat) return;

    let flightTime = 0;
    // Si ce n'est pas la toute première touche, on calcule le temps de vol
    if (lastKeyUpTimeRef.current !== null) {
      flightTime = pressTime - lastKeyUpTimeRef.current;
    }

    // On enregistre le moment exact où la touche s'enfonce
    activeKeysRef.current[key] = {
      downTime: pressTime,
      flightTime: flightTime,
    };
  }, []);

  const handleKeyUp = useCallback((e) => {
    const releaseTime = performance.now();
    const key = e.key;

    if (activeKeysRef.current[key]) {
      const { downTime, flightTime } = activeKeysRef.current[key];

      // Calcul du Dwell Time (Relâchement - Pression)
      const dwellTime = releaseTime - downTime;

      // On ajoute cette signature à notre tableau de données
      keystrokesRef.current.push({
        key,
        dwellTime,
        flightTime,
        timestamp: releaseTime,
      });

      // On met à jour le temps de relâchement pour calculer le prochain Flight Time
      lastKeyUpTimeRef.current = releaseTime;

      // Nettoyage de la touche active
      delete activeKeysRef.current[key];
    }
  }, []);

  // Fonction pour récupérer les données quand on veut les envoyer à l'API
  const getKeystrokeData = useCallback(() => {
    return keystrokesRef.current;
  }, []);

  const clearKeystrokeData = useCallback(() => {
    keystrokesRef.current = [];
    activeKeysRef.current = {};
    lastKeyUpTimeRef.current = null;
  }, []);

  return { handleKeyDown, handleKeyUp, getKeystrokeData, clearKeystrokeData };
}
