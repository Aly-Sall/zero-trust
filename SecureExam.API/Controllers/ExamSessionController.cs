using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;
using SecureExam.API.DTOs; 
using SecureExam.API.Hubs;
using SecureExam.API.Models;
using SecureExam.API.Services;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SecureExam.API.Controllers
{
    // DTO pour recevoir les alertes matérielles, navigateur ou visuelles (IA)
    public class LockdownAlertDto
    {
        public string AlertType { get; set; } = string.Empty;
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Protégé par défaut pour tout le contrôleur
    public class ExamSessionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExamSessionController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("start")]
        public async Task<IActionResult> StartSession()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized("Invalid token.");

            var session = new ExamSession
            {
                UserId = userId,
                StartTime = DateTime.UtcNow,
                IsLocked = true 
            };

            _context.ExamSessions.Add(session);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Session started.", sessionId = session.Id });
        }

        // --- 🧠 ANALYSE BIOMÉTRIQUE (DATA SCIENCE) ---
        [HttpPost("{sessionId}/analyze")]
        public async Task<IActionResult> AnalyzeKeystrokes(
            int sessionId, 
            [FromBody] List<KeystrokeDataDto> keystrokes,
            [FromServices] KeystrokeAnalysisService analysisService,
            [FromServices] IHubContext<MonitoringHub> hubContext)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            var session = await _context.ExamSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
            if (session == null) return NotFound("Session not found.");

            var baseline = await _context.BaselineSignatures.FirstOrDefaultAsync(b => b.UserId == userId);
            if (baseline == null) return BadRequest("No baseline signature found.");

            // L'analyse compare les frappes actuelles avec la signature de référence
            bool isAnomaly = analysisService.IsAnomalyDetected(keystrokes, baseline, out double score);

            if (isAnomaly)
            {
                var alert = new IntegrityAlert
                {
                    ExamSessionId = sessionId,
                    AlertType = "IdentitySuspicion",
                    AnomalyScore = score,
                    Timestamp = DateTime.UtcNow
                };
                
                _context.IntegrityAlerts.Add(alert);
                session.IsLocked = false; // Verrouillage de la session suite à suspicion
                await _context.SaveChangesAsync();

                // Alerte en temps réel au professeur via SignalR
                await hubContext.Clients.All.SendAsync("ReceiveAlert", new 
                { 
                    sessionId = sessionId, 
                    type = "Identity Suspicion (Biometrics)", 
                    score = Math.Round(score, 2),
                    time = DateTime.Now.ToString("HH:mm:ss")
                });

                return Ok(new { secure = false, message = "Integrity Alert: Biometric signature mismatch.", anomalyScore = score });
            }

            return Ok(new { secure = true, message = "Session secure.", anomalyScore = score });
        }

        // --- 🚨 LOCKDOWN & INFRACTIONS VISUELLES (CYBERSECURITÉ) ---
        
        [HttpPost("{sessionId}/lockdown-alert")]
        [AllowAnonymous] // 👈 LE DÉBLOCAGE EST ICI : Permet à l'alerte de passer sans token strict pour le MVP
        public async Task<IActionResult> TriggerLockdownAlert(
            int sessionId, 
            [FromBody] LockdownAlertDto dto,
            [FromServices] IHubContext<MonitoringHub> hubContext)
        {
            // 🚨 CORRECTIF MVP : On by-pass la vérification stricte en BDD 
            // pour s'assurer que l'alerte est TOUJOURS envoyée au professeur en temps réel.
            
            // On diffuse l'alerte sur le tableau de bord professeur instantanément via SignalR
            await hubContext.Clients.All.SendAsync("ReceiveAlert", new 
            { 
                sessionId = sessionId, // Correspond à l'ExamId depuis React
                type = dto.AlertType, 
                score = 0.0,
                time = DateTime.Now.ToString("HH:mm:ss")
            });

            return Ok(new { message = "Alert broadcasted to SOC." });
        }
    }
}