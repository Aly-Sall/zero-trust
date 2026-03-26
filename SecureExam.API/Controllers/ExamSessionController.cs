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
using System.Threading.Tasks;

namespace SecureExam.API.Controllers
{
    public class LockdownAlertDto
    {
        public string AlertType { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty; // 🚀 ADDED EMAIL
    }

    public class AnalyzePayloadDto
    {
        public string StudentEmail { get; set; } = string.Empty;
        public List<KeystrokeDataDto> Events { get; set; } = new();
    }

    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class ExamSessionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<MonitoringHub> _hubContext;

        public ExamSessionController(AppDbContext context, IHubContext<MonitoringHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpPost("start")]
        public IActionResult StartSession()
        {
            return Ok(new { message = "Session started." });
        }

        [HttpPost("{examId}/analyze")]
        public async Task<IActionResult> AnalyzeKeystrokes(
            int examId, 
            [FromBody] AnalyzePayloadDto payload,
            [FromServices] KeystrokeAnalysisService analysisService)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.StudentEmail);
            if (user == null) return BadRequest(new { secure = false, message = "Student not found." });

            var baseline = await _context.BaselineSignatures.FirstOrDefaultAsync(b => b.UserId == user.Id);
            if (baseline == null) return BadRequest(new { secure = false, message = "No baseline found." });

            bool isAnomaly = analysisService.IsAnomalyDetected(payload.Events, baseline, out double score);

            if (isAnomaly)
            {
                await _hubContext.Clients.All.SendAsync("ReceiveAlert", new { 
                    sessionId = examId, 
                    studentEmail = payload.StudentEmail, // 🚀 ADDED EMAIL TO ALERT
                    type = "Identity Suspicion (Biometrics)", 
                    score = Math.Round(score, 2), 
                    time = DateTime.Now.ToString("HH:mm:ss") 
                });

                return Ok(new { secure = false, message = "Biometric mismatch.", anomalyScore = score });
            }

            return Ok(new { secure = true, message = "Session secure.", anomalyScore = score });
        }

        [HttpPost("{examId}/lockdown-alert")]
        public async Task<IActionResult> TriggerLockdownAlert(int examId, [FromBody] LockdownAlertDto dto)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveAlert", new 
            { 
                sessionId = examId, 
                studentEmail = dto.StudentEmail, // 🚀 ADDED EMAIL TO ALERT
                type = dto.AlertType, 
                score = 0.0,
                time = DateTime.Now.ToString("HH:mm:ss")
            });

            return Ok(new { message = "Alert broadcasted to SOC." });
        }
    }
}