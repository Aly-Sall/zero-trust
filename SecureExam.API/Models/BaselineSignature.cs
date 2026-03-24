using System;

namespace SecureExam.API.Models
{
    public class BaselineSignature
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        
        // 📊 Caractéristiques biométriques (Data Science)
        public double MeanDwell { get; set; }
        public double MeanFlight { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}