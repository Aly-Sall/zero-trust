using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;

namespace SecureExam.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        // --- 1. ENVOI DES IDENTIFIANTS (Le texte brut que tu voulais !) ---
        public async Task SendCredentialsEmailAsync(string email, string password, string role, string? cohort)
        {
            var message = new MimeMessage();
            var senderEmail = _config["EmailSettings:SenderEmail"] ?? "admin@esaip.org";
            
            message.From.Add(new MailboxAddress("SecureExam", senderEmail));
            message.To.Add(new MailboxAddress("", email));
            message.Subject = "Welcome to SecureExam";

            // Ajoute la ligne de la cohorte uniquement si elle existe
            string cohortLine = string.IsNullOrEmpty(cohort) ? "" : $"\nAssigned Cohort: {cohort}";

            message.Body = new TextPart("plain")
            {
                Text = $"Welcome to SecureExam\nYour {role} account has been provisioned.\nLogin: {email}\nPassword: {password}{cohortLine}"
            };

            await SendEmailAsync(message);
        }

        // --- 2. NOTIFICATION D'EXAMEN (Aussi passée en texte brut pour être cohérent) ---
        public async Task SendExamNotificationEmailAsync(string toEmail, string courseName, DateTime startTime, string professorEmail)
        {
            var message = new MimeMessage();
            var senderEmail = _config["EmailSettings:SenderEmail"] ?? "admin@esaip.org";
            
            message.From.Add(new MailboxAddress("SecureExam", senderEmail)); 
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = $"New Exam Scheduled: {courseName}";

            message.Body = new TextPart("plain")
            {
                Text = $"A new secure exam has been scheduled.\nCourse: {courseName}\nDate: {startTime:dd/MM/yyyy HH:mm}\nSupervisor: {professorEmail}"
            };

            await SendEmailAsync(message);
        }

        // --- MOTEUR D'ENVOI SMTP ---
        private async Task SendEmailAsync(MimeMessage message)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            var port = int.Parse(_config["EmailSettings:Port"] ?? "587");
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var senderPassword = _config["EmailSettings:SenderPassword"];

            // Si les identifiants ne sont pas dans appsettings.json, on annule l'envoi pour éviter un crash
            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                Console.WriteLine("⚠️ ERREUR : Identifiants Email manquants dans appsettings.json !");
                return; 
            }

            using var client = new SmtpClient();
            try
            {
                await client.ConnectAsync(smtpServer, port, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(senderEmail, senderPassword);
                await client.SendAsync(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ ERREUR SMTP : {ex.Message}");
            }
            finally
            {
                await client.DisconnectAsync(true);
            }
        }
    }
}