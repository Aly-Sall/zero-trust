using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SecureExam.API.Models
{
    public class ExamSession
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        public DateTime StartTime { get; set; } = DateTime.UtcNow;

        public DateTime? EndTime { get; set; }

        [Required]
        public bool IsLocked { get; set; } = true; // Passe à false si l'étudiant quitte le plein écran [cite: 19]

        // Propriété de navigation
        public ICollection<IntegrityAlert> IntegrityAlerts { get; set; } = new List<IntegrityAlert>();
    }
}