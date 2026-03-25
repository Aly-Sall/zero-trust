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
    public class LockdownAlertDto
    {
        public string AlertType { get; set; } = string.Empty;
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ExamSessionController : ControllerBase
    {
        private readonly AppDbContext _context;
        // 📡 1. INJECTION DE SIGNALR DANS LE CONSTRUCTEUR (Ultra robuste)
        private readonly IHubContext<MonitoringHub> _hubContext;

        public ExamSessionController(AppDbContext context, IHubContext<MonitoringHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpPost("start")]
        public async Task<IActionResult> StartSession()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized("Invalid token.");

            var session = new ExamSession { UserId = userId, StartTime = DateTime.UtcNow, IsLocked = true };
            _context.ExamSessions.Add(session);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Session started.", sessionId = session.Id });
        }

        [HttpPost("{sessionId}/analyze")]
        public async Task<IActionResult> AnalyzeKeystrokes(
            int sessionId, 
            [FromBody] List<KeystrokeDataDto> keystrokes,
            [FromServices] KeystrokeAnalysisService analysisService)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            var session = await _context.ExamSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
            if (session == null) return NotFound("Session not found.");

            var baseline = await _context.BaselineSignatures.FirstOrDefaultAsync(b => b.UserId == userId);
            if (baseline == null) return BadRequest("No baseline signature found.");

            bool isAnomaly = analysisService.IsAnomalyDetected(keystrokes, baseline, out double score);

            if (isAnomaly)
            {
                var alert = new IntegrityAlert { ExamSessionId = sessionId, AlertType = "IdentitySuspicion", AnomalyScore = score, Timestamp = DateTime.UtcNow };
                _context.IntegrityAlerts.Add(alert);
                session.IsLocked = false; 
                await _context.SaveChangesAsync();

                // 📡 Utilisation du Hub injecté
                await _hubContext.Clients.All.SendAsync("ReceiveAlert", new { sessionId = sessionId, type = "Identity Suspicion (Biometrics)", score = Math.Round(score, 2), time = DateTime.Now.ToString("HH:mm:ss") });

                return Ok(new { secure = false, message = "Integrity Alert: Biometric signature mismatch.", anomalyScore = score });
            }

            return Ok(new { secure = true, message = "Session secure.", anomalyScore = score });
        }

        // --- 🚨 LOCKDOWN & INFRACTIONS VISUELLES ---
        [HttpPost("{sessionId}/lockdown-alert")]
        [AllowAnonymous] // 👈 OBLIGATOIRE POUR LE MVP
        public async Task<IActionResult> TriggerLockdownAlert(int sessionId, [FromBody] LockdownAlertDto dto)
        {
            // 📡 2. DIFFUSION IMMÉDIATE DE L'ALERTE AU PROFESSEUR
            await _hubContext.Clients.All.SendAsync("ReceiveAlert", new 
            { 
                sessionId = sessionId, 
                type = dto.AlertType, 
                score = 0.0,
                time = DateTime.Now.ToString("HH:mm:ss")
            });

            return Ok(new { message = "Alert broadcasted to SOC." });
        }
    }
}