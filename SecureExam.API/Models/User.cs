namespace SecureExam.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Student"; // Admin, Professor, Student
        
        // C'est CETTE ligne qui manquait et qui causait l'erreur rouge !
        public string? Cohort { get; set; } 
    }
}