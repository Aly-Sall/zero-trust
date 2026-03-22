using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SecureExam.API.Models
{
    public class IntegrityAlert
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("ExamSession")]
        public int ExamSessionId { get; set; }
        public ExamSession? ExamSession { get; set; }

        [Required]
        public string AlertType { get; set; } = string.Empty; // ex: "FocusLost", "FullScreenExit", "ImposterDetected" [cite: 35]

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public double? AnomalyScore { get; set; } // Résultat de l'algorithme de distance [cite: 28]
    }
}