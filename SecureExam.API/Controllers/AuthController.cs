using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SecureExam.API.Data;
using SecureExam.API.Models;
using SecureExam.API.Services; // 👈 INDISPENSABLE POUR L'EMAIL
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SecureExam.API.Controllers
{
    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class RegisterDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
        public string? Cohort { get; set; } 
    }

    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService; // 👈 LE SERVICE D'EMAIL EST LÀ

        // Le constructeur qui charge la Base de Données, la Config et l'Email
        public AuthController(AppDbContext context, IConfiguration configuration, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized("Identifiants incorrects.");

            string token = GenerateJwtToken(user);
            return Ok(new { token, user = new { user.Email, user.Role, user.Cohort } });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto request)
        {
            // Vérifie si l'utilisateur existe déjà
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest("Cet email est déjà utilisé.");

            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role,
                Cohort = request.Role == "Student" ? request.Cohort : null
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // 🚀 ENVOI DE L'EMAIL (Avec protection anti-crash)
            try 
            {
                // On passe bien les 4 paramètres, y compris request.Cohort !
                await _emailService.SendCredentialsEmailAsync(request.Email, request.Password, request.Role, request.Cohort);
            }
            catch (Exception ex)
            {
                // Si le mail échoue (ex: mauvais mot de passe Gmail), ça l'écrit dans le terminal mais ça ne bloque pas la création !
                Console.WriteLine($"⚠️ ERREUR D'ENVOI EMAIL : {ex.Message}");
            }

            return Ok(new { message = "Utilisateur créé avec succès !" });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.Email, u.Role, u.Cohort })
                .ToListAsync();
            return Ok(users);
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            if (!string.IsNullOrEmpty(user.Cohort))
            {
                claims.Add(new Claim("Cohort", user.Cohort));
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}