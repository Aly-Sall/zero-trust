using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;
using SecureExam.API.DTOs;
using SecureExam.API.Models;
using System.Security.Claims;

namespace SecureExam.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Il faut être connecté pour calibrer sa signature
    public class BiometricsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BiometricsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("calibrate")]
        public async Task<IActionResult> Calibrate([FromBody] List<KeystrokeDataDto> keystrokes)
        {
            // 1. On identifie l'utilisateur via son Token JWT
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            if (keystrokes == null || keystrokes.Count == 0)
                return BadRequest("Aucune donnée de frappe reçue.");

           // 2. DATA SCIENCE : Calcul des vraies moyennes (avec nettoyage des valeurs aberrantes)
            double avgDwell = keystrokes.Average(k => k.DwellTime);

            // On filtre : on ne garde que les temps de vol inférieurs à 1 seconde (1000 ms)
            var validFlightTimes = keystrokes
                .Where(k => k.FlightTime >= 0 && k.FlightTime < 1000)
                .Select(k => k.FlightTime)
                .ToList();

            // Si le tableau est vide (ex: il n'a tapé qu'une lettre), on met 0 pour éviter une erreur de division
            double avgFlight = validFlightTimes.Any() ? validFlightTimes.Average() : 0;

            // 3. On cherche s'il a déjà une signature en base
            var baseline = await _context.BaselineSignatures.FirstOrDefaultAsync(b => b.UserId == userId);
            
            if (baseline == null)
            {
                // S'il n'en a pas, on la crée
                baseline = new BaselineSignature
                {
                    UserId = userId,
                    ReferenceSentence = "La sécurité Zero-Trust est essentielle.",
                    AverageDwellTime = avgDwell,
                    AverageFlightTime = avgFlight
                };
                _context.BaselineSignatures.Add(baseline);
            }
            else
            {
                // S'il refait la calibration, on met à jour ses données
                baseline.AverageDwellTime = avgDwell;
                baseline.AverageFlightTime = avgFlight;
                _context.BaselineSignatures.Update(baseline);
            }

            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                message = "Signature biométrique enregistrée avec succès !", 
                dwell = avgDwell, 
                flight = avgFlight 
            });
        }
    }
}