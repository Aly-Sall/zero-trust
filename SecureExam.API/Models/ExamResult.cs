using System;

namespace SecureExam.API.Models
{
    public class ExamResult
    {
        public int Id { get; set; }
        public int ExamId { get; set; }
        public required string StudentEmail { get; set; }
        public int Score { get; set; }
        public DateTime SubmittedAt { get; set; }
    }
}