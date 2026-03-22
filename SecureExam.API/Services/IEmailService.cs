using System;
using System.Threading.Tasks;

namespace SecureExam.API.Services
{
    public interface IEmailService
    {
        Task SendExamNotificationEmailAsync(string toEmail, string courseName, DateTime startTime, string professorEmail);
        Task SendCredentialsEmailAsync(string email, string password, string role, string? cohort);
    }
}