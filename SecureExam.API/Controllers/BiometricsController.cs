using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;
using SecureExam.API.DTOs;
using SecureExam.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SecureExam.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BiometricsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BiometricsController(AppDbContext context)
        {
            _context = context;
        }

        private (double Dwell, double Flight) ExtractFeatures(List<KeystrokeDataDto> events)
        {
            if (events == null || !events.Any()) return (0, 0);

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

            return (dwellCount > 0 ? totalDwell / dwellCount : 0, 
                    flightCount > 0 ? totalFlight / flightCount : 0);
        }

        [HttpPost("calibrate")]
        public async Task<IActionResult> Calibrate([FromBody] BiometricPayload payload)
        {
            var features = ExtractFeatures(payload.Events);

            // Recherche de l'utilisateur
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.StudentEmail);
            if (user == null) return BadRequest(new { message = "User not found." });

            // Sauvegarde en Base de Données
            var baseline = await _context.BaselineSignatures.FirstOrDefaultAsync(b => b.UserId == user.Id);
            if (baseline == null)
            {
                baseline = new BaselineSignature { UserId = user.Id };
                _context.BaselineSignatures.Add(baseline);
            }

            baseline.MeanDwell = features.Dwell;
            baseline.MeanFlight = features.Flight;
            baseline.CreatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Biometric signature securely saved to database.", dwell = features.Dwell, flight = features.Flight });
        }

        [HttpPost("verify")]
        public async Task<IActionResult> Verify([FromBody] BiometricPayload payload)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.StudentEmail);
            if (user == null) return BadRequest(new { message = "User not found." });

            var baseline = await _context.BaselineSignatures.FirstOrDefaultAsync(b => b.UserId == user.Id);
            if (baseline == null) return BadRequest(new { message = "No baseline found for this user." });

            var current = ExtractFeatures(payload.Events);

            // Calcul de la distance euclidienne
            double distance = Math.Sqrt(Math.Pow(current.Dwell - baseline.MeanDwell, 2) + Math.Pow(current.Flight - baseline.MeanFlight, 2));

            // Si la distance est sous le seuil de 65ms, l'identité est validée
            if (distance <= 65.0) 
                return Ok(new { success = true, distance });
            
            return BadRequest(new { success = false, message = "Identity Mismatch: Biometric profile does not match.", distance });
        }
    }
}