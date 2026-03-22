using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;
using SecureExam.API.DTOs;
using SecureExam.API.Hubs;
using SecureExam.API.Models;
using SecureExam.API.Services;
using System.Security.Claims;

namespace SecureExam.API.Controllers
{
    // DTO to receive hardware, browser, or visual (AI) alerts
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

        // --- 🧠 BIOMETRIC ANALYSIS (DATA SCIENCE) ---
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
                session.IsLocked = false; 
                await _context.SaveChangesAsync();

                // Live alert to professor via SignalR
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

        // --- 🚨 LOCKDOWN & VISION INFRACTIONS (CYBERSECURITY) ---
        // Handles browser events (Copy/Paste) AND AI Vision alerts (Cell phone)
        [HttpPost("{sessionId}/lockdown-alert")]
        public async Task<IActionResult> TriggerLockdownAlert(
            int sessionId, 
            [FromBody] LockdownAlertDto dto,
            [FromServices] IHubContext<MonitoringHub> hubContext)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

            var session = await _context.ExamSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
            if (session == null) return NotFound();

            var alert = new IntegrityAlert
            {
                ExamSessionId = sessionId,
                AlertType = dto.AlertType,
                AnomalyScore = 0.0,
                Timestamp = DateTime.UtcNow
            };
            
            _context.IntegrityAlerts.Add(alert);
            session.IsLocked = false; 
            await _context.SaveChangesAsync();

            // Broadcast the alert to the professor dashboard
            // If the frontend sends "VISUAL: Cell Phone Detected", it will show up exactly like that
            await hubContext.Clients.All.SendAsync("ReceiveAlert", new 
            { 
                sessionId = sessionId, 
                type = dto.AlertType, 
                score = 0.0,
                time = DateTime.Now.ToString("HH:mm:ss")
            });

            return Ok();
        }
    }
}