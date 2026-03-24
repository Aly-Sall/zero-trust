using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SecureExam.API.Data;
using SecureExam.API.Models;
using SecureExam.API.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http; 
using System.IO; 
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

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
        private readonly IEmailService _emailService;

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

            try 
            {
                await _emailService.SendCredentialsEmailAsync(request.Email, request.Password, request.Role, request.Cohort);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ ERREUR D'ENVOI EMAIL : {ex.Message}");
            }

            return Ok(new { message = "Utilisateur créé avec succès !" });
        }

        // 🚀 MÉTHODE D'IMPORTATION CSV EN MASSE (Gère , et ;)
        [HttpPost("import")]
        public async Task<IActionResult> ImportUsers(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Fichier CSV vide.");

            var usersAdded = 0;
            var errors = new List<string>();

            using var stream = new StreamReader(file.OpenReadStream());
            var isFirstLine = true;

            while (!stream.EndOfStream)
            {
                var line = await stream.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line)) continue;

                // 🛠️ LA CORRECTION EST ICI : On coupe sur la virgule ET le point-virgule
                var values = line.Split(new[] { ',', ';' });

                // Ignore l'en-tête du fichier CSV
                if (isFirstLine) {
                    isFirstLine = false;
                    if (values[0].ToLower().Contains("email")) continue;
                }

                if (values.Length >= 1)
                {
                    var email = values[0].Trim();
                    var role = values.Length > 1 && !string.IsNullOrWhiteSpace(values[1]) ? values[1].Trim() : "Student";
                    var cohort = values.Length > 2 ? values[2].Trim() : null;

                    if (!await _context.Users.AnyAsync(u => u.Email == email))
                    {
                        var tempPassword = "Temp" + Guid.NewGuid().ToString().Substring(0, 6) + "!";
                        
                        var user = new User
                        {
                            Email = email,
                            Role = role,
                            Cohort = role == "Student" ? cohort : null,
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword)
                        };

                        _context.Users.Add(user);
                        
                        try 
                        {
                            await _emailService.SendCredentialsEmailAsync(email, tempPassword, role, cohort);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Erreur d'email pour {email} : {ex.Message}");
                            errors.Add(email);
                        }
                        usersAdded++;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"{usersAdded} utilisateurs provisionnés avec succès !", emailErrors = errors });
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