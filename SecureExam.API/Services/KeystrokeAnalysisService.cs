using SecureExam.API.DTOs;
using SecureExam.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SecureExam.API.Services
{
    public class KeystrokeAnalysisService
    {
        public bool IsAnomalyDetected(List<KeystrokeDataDto> events, BaselineSignature baseline, out double score)
        {
            // 1. Calculer les moyennes du test actuel (Même logique que le contrôleur)
            var keydowns = events.Where(e => e.Type == "keydown").ToList();
            var keyups = events.Where(e => e.Type == "keyup").ToList();

            double totalDwell = 0;
            int dwellCount = 0;
            foreach (var down in keydowns)
            {
                var up = keyups.FirstOrDefault(u => u.Key == down.Key && u.Timestamp > down.Timestamp);
                if (up != null)
                {
                    totalDwell += (up.Timestamp - down.Timestamp);
                    dwellCount++;
                }
            }

            double totalFlight = 0;
            int flightCount = 0;
            for (int i = 0; i < keydowns.Count - 1; i++)
            {
                var currentUp = keyups.FirstOrDefault(u => u.Key == keydowns[i].Key && u.Timestamp > keydowns[i].Timestamp);
                if (currentUp != null)
                {
                    totalFlight += (keydowns[i + 1].Timestamp - currentUp.Timestamp);
                    flightCount++;
                }
            }

            double currentDwell = dwellCount > 0 ? totalDwell / dwellCount : 0;
            double currentFlight = flightCount > 0 ? totalFlight / flightCount : 0;

            // 2. Calculer la distance euclidienne par rapport à la baseline de la DB
            // Note: Assure-toi que ton modèle BaselineSignature a bien MeanDwell et MeanFlight
            score = Math.Sqrt(Math.Pow(currentDwell - baseline.MeanDwell, 2) + Math.Pow(currentFlight - baseline.MeanFlight, 2));

            // Seuil d'anomalie (Threshold)
            double threshold = 65.0; 
            return score > threshold;
        }
    }
}