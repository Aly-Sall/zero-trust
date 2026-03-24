using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;
using SecureExam.API.Models;
using SecureExam.API.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SecureExam.API.Controllers
{
    // --- DTOs ---
    public class QuestionBankPayload
    {
        public int Id { get; set; }
        public string FolderName { get; set; }
        public string Course { get; set; }
        public List<QuestionPayload> Questions { get; set; }
    }

    public class QuestionPayload
    {
        public string Text { get; set; }
        public List<string> Options { get; set; }
        public int CorrectAnswerIndex { get; set; }
    }

    public class ScheduleExamPayload
    {
        public int Id { get; set; } 
        public string Title { get; set; }
        public string Formation { get; set; } 
        public DateTime ScheduledFor { get; set; }
        public int DurationMinutes { get; set; }
        public int SourceBankId { get; set; }
        public int QuestionsToPull { get; set; }
    }

    public class StudentQuestionDto
    {
        public int QuestionId { get; set; }
        public string Text { get; set; }
        public List<string> Options { get; set; }
    }

    public class AiBankRequest
    {
        public string Course { get; set; }
        public string Topic { get; set; }
        public int QuestionCount { get; set; }
    }

    // 🛡️ NOUVEAU DTO POUR LA SOUMISSION
    public class ExamSubmissionDto
    {
        public int ExamId { get; set; }
        public string StudentEmail { get; set; }
        public Dictionary<int, int> Answers { get; set; } 
    }

    // --- CONTRÔLEUR ---
    [ApiController]
    [Route("api/[controller]")]
    public class ExamsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        private static List<QuestionBankPayload> _questionBanks = new List<QuestionBankPayload>();
        private static List<ScheduleExamPayload> _scheduledExams = new List<ScheduleExamPayload>();

        public ExamsController(AppDbContext context, IEmailService emailService) 
        { 
            _context = context; 
            _emailService = emailService;
        }

        [HttpPost("banks")]
        public IActionResult SaveQuestionBank([FromBody] QuestionBankPayload payload)
        {
            if (payload == null || !payload.Questions.Any()) return BadRequest(new { message = "Bank must contain questions." });
            payload.Id = _questionBanks.Count > 0 ? _questionBanks.Max(b => b.Id) + 1 : 1;
            _questionBanks.Add(payload);
            return Ok(new { message = "Question Bank saved!", id = payload.Id });
        }

        [HttpGet("banks")]
        public IActionResult GetAllBanks()
        {
            var summaries = _questionBanks.Select(b => new {
                id = b.Id, course = b.Course, folderName = b.FolderName,
                totalQuestions = b.Questions.Count, lastUpdated = DateTime.Now.ToString("yyyy-MM-dd")
            });
            return Ok(summaries);
        }

        [HttpPost("banks/generate-ai")]
        public async Task<IActionResult> GenerateAiBank([FromBody] AiBankRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Topic)) return BadRequest(new { message = "Topic is required." });

            await Task.Delay(2500); 

            var aiQuestions = new List<QuestionPayload>();
            string topic = request.Topic.ToLower();

            if (topic.Contains("cyber") || topic.Contains("securit") || topic.Contains("reseau") || topic.Contains("tcp"))
            {
                aiQuestions.Add(new QuestionPayload { Text = "Quel protocole assure une communication sécurisée sur le web en chiffrant les données ?", Options = new List<string> { "HTTP", "FTP", "HTTPS", "Telnet" }, CorrectAnswerIndex = 2 });
                aiQuestions.Add(new QuestionPayload { Text = "Dans le modèle OSI, à quelle couche se situe le protocole TCP ?", Options = new List<string> { "Couche 2 (Liaison)", "Couche 3 (Réseau)", "Couche 4 (Transport)", "Couche 7 (Application)" }, CorrectAnswerIndex = 2 });
                aiQuestions.Add(new QuestionPayload { Text = "Quelle est la fonction principale d'un pare-feu (Firewall) ?", Options = new List<string> { "Accélérer la connexion", "Filtrer le trafic entrant et sortant", "Stocker des fichiers", "Chiffrer les emails" }, CorrectAnswerIndex = 1 });
            }
            else if (topic.Contains("data") || topic.Contains("ia") || topic.Contains("machine") || topic.Contains("python"))
            {
                aiQuestions.Add(new QuestionPayload { Text = "Quelle bibliothèque Python est spécialisée dans l'apprentissage automatique (Machine Learning) ?", Options = new List<string> { "Django", "Scikit-Learn", "Flask", "Requests" }, CorrectAnswerIndex = 1 });
                aiQuestions.Add(new QuestionPayload { Text = "Qu'est-ce que le 'Deep Learning' ?", Options = new List<string> { "Une base de données très profonde", "Une branche de l'IA basée sur les réseaux de neurones", "Un algorithme de tri", "Une technique de compression" }, CorrectAnswerIndex = 1 });
            }
            else
            {
                for (int i = 0; i < request.QuestionCount; i++)
                {
                    aiQuestions.Add(new QuestionPayload { Text = $"Analysez l'impact de {request.Topic} dans un environnement Zero-Trust. Quel est le risque principal ?", Options = new List<string> { "Indisponibilité des données", "Usurpation d'identité", "Augmentation de la latence", "Fuite de mémoire" }, CorrectAnswerIndex = 1 });
                }
            }

            var finalQuestions = aiQuestions.Take(request.QuestionCount).ToList();
            var newBank = new QuestionBankPayload { Id = _questionBanks.Count > 0 ? _questionBanks.Max(b => b.Id) + 1 : 1, Course = request.Course, FolderName = $"AI-Gen: {request.Topic}", Questions = finalQuestions };
            _questionBanks.Add(newBank);
            return Ok(new { message = "Questions générées !", id = newBank.Id });
        }

        [HttpPost("schedule")]
        public async Task<IActionResult> ScheduleExam([FromBody] ScheduleExamPayload payload)
        {
            if (payload == null) return BadRequest(new { message = "Invalid schedule data." });
            payload.Id = _scheduledExams.Count > 0 ? _scheduledExams.Max(e => e.Id) + 1 : 1;
            _scheduledExams.Add(payload);

            try
            {
                var studentsInCohort = await _context.Users.Where(u => u.Role == "Student" && u.Cohort == payload.Formation).ToListAsync();
                string professorEmail = User.FindFirstValue(ClaimTypes.Email) ?? "admin@esaip.org";
                foreach (var student in studentsInCohort)
                {
                    await _emailService.SendExamNotificationEmailAsync(student.Email, payload.Title, payload.ScheduledFor, professorEmail);
                }
                return Ok(new { message = "Exam scheduled successfully!", emailsSent = studentsInCohort.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Exam scheduled, but failed to send some emails.", error = ex.Message });
            }
        }

        // 🛡️ NOUVEAU : EXAMENS DISPONIBLES (Vérifie si déjà soumis)
        [HttpGet("available/{cohort}/{studentEmail}")]
        public IActionResult GetAvailableExams(string cohort, string studentEmail)
        {
            var submittedExamIds = _context.ExamResults.Where(er => er.StudentEmail == studentEmail).Select(er => er.ExamId).ToList();
            var exams = _scheduledExams.Where(e => e.Formation == cohort).Select(e => new {
                id = e.Id, title = e.Title, scheduledFor = e.ScheduledFor, durationMinutes = e.DurationMinutes,
                isCompleted = submittedExamIds.Contains(e.Id)
            });
            return Ok(exams);
        }

        // 🛡️ NOUVEAU : GÉNÉRER EXAMEN (Bloque si déjà soumis)
        [HttpGet("generate/{examId}/student/{studentEmail}")]
        public IActionResult GenerateStudentExam(int examId, string studentEmail)
        {
            if (_context.ExamResults.Any(er => er.ExamId == examId && er.StudentEmail == studentEmail))
                return BadRequest(new { message = "Tentative de fraude : Vous avez déjà soumis cet examen." });

            var scheduledExam = _scheduledExams.FirstOrDefault(e => e.Id == examId);
            if (scheduledExam == null) return NotFound(new { message = "Examen introuvable." });

            var bank = _questionBanks.FirstOrDefault(b => b.Id == scheduledExam.SourceBankId);
            if (bank == null) return NotFound(new { message = "Banque de questions introuvable." });

            var randomizedQuestions = bank.Questions.OrderBy(q => Guid.NewGuid()).Take(scheduledExam.QuestionsToPull).ToList();
            var safeExamVersion = randomizedQuestions.Select((q, index) => new StudentQuestionDto {
                QuestionId = index + 1, Text = q.Text, Options = q.Options
            }).ToList();

            return Ok(new { ExamTitle = scheduledExam.Title, Duration = scheduledExam.DurationMinutes, Questions = safeExamVersion });
        }

        // 🛡️ NOUVEAU : SOUMISSION ET CALCUL DU SCORE
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitExam([FromBody] ExamSubmissionDto submission)
        {
            if (await _context.ExamResults.AnyAsync(er => er.ExamId == submission.ExamId && er.StudentEmail == submission.StudentEmail))
                return BadRequest(new { message = "Examen déjà soumis." });

            var scheduledExam = _scheduledExams.FirstOrDefault(e => e.Id == submission.ExamId);
            var bank = _questionBanks.FirstOrDefault(b => b.Id == scheduledExam.SourceBankId);
            
            int score = 0;
            if (submission.Answers != null && bank != null)
            {
                foreach(var answer in submission.Answers)
                {
                    var question = bank.Questions[answer.Key - 1]; 
                    if (question.CorrectAnswerIndex == answer.Value) score++;
                }
            }

            var result = new ExamResult {
                ExamId = submission.ExamId, StudentEmail = submission.StudentEmail, Score = score, SubmittedAt = DateTime.Now
            };

            _context.ExamResults.Add(result);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Examen enregistré avec succès !", score = score });
        }
    }
}