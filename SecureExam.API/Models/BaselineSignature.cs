using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SecureExam.API.Models
{
    public class BaselineSignature
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("User")]
        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        public string ReferenceSentence { get; set; } = string.Empty;

        [Required]
        public double AverageDwellTime { get; set; } // Durée de pression d'une touche en ms [cite: 29]

        [Required]
        public double AverageFlightTime { get; set; } // Temps entre deux touches en ms [cite: 30]
    }
}