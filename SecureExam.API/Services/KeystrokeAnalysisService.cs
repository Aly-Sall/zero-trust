using SecureExam.API.DTOs;
using SecureExam.API.Models;

namespace SecureExam.API.Services
{
    public class KeystrokeAnalysisService
    {
       private const double ANOMALY_THRESHOLD = 4.0; 

    // On donne à l'utilisateur le droit de varier naturellement de 45ms sur le maintien de la touche
    private const double STD_DEV_DWELL = 45.0; 
    
    // Et de 65ms sur le temps de vol (les transitions d'un doigt à l'autre sont toujours plus instables)
    private const double STD_DEV_FLIGHT = 65.0;

        public bool IsAnomalyDetected(List<KeystrokeDataDto> currentKeystrokes, BaselineSignature baseline, out double anomalyScore)
        {
            if (currentKeystrokes == null || currentKeystrokes.Count == 0)
            {
                anomalyScore = 0;
                return false;
            }

            // 1. Calcul des moyennes actuelles (x_i) avec nettoyage des pauses de réflexion
            double currentAvgDwell = currentKeystrokes.Average(k => k.DwellTime);

            var validFlights = currentKeystrokes
                .Where(k => k.FlightTime >= 0 && k.FlightTime < 1000)
                .ToList();

            // Si l'étudiant a fait beaucoup de pauses et qu'on a filtré toutes les touches,
            // on utilise sa moyenne de base temporairement pour ne pas fausser le score.
            double currentAvgFlight = validFlights.Any() 
                ? validFlights.Average(k => k.FlightTime) 
                : baseline.AverageFlightTime;

            // 2. Application de la formule de distance (Z-score euclidien) de tes slides
            double dwellZScore = (currentAvgDwell - baseline.AverageDwellTime) / STD_DEV_DWELL;
            double flightZScore = (currentAvgFlight - baseline.AverageFlightTime) / STD_DEV_FLIGHT;

            anomalyScore = Math.Sqrt(Math.Pow(dwellZScore, 2) + Math.Pow(flightZScore, 2));

            // 3. Vérification par rapport au seuil
            return anomalyScore > ANOMALY_THRESHOLD;
        }
    }
}