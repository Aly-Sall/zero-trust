using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;
using SecureExam.API.Services;
using SecureExam.API.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Base de données
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Services
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<KeystrokeAnalysisService>(); // 👈 Indispensable pour l'analyse biométrique

// 3. SIGNALR (LE MOTEUR TEMPS RÉEL DU RADAR)
builder.Services.AddSignalR();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 4. CORS (Pour laisser passer React)
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReact", policy => {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); 
    });
});

// 5. 🛡️ LA SÉCURITÉ JWT (C'est ça qui manquait !)
// On récupère ta clé dans appsettings.json, sinon on utilise une clé de secours par défaut
var jwtKey = builder.Configuration["Jwt:Key"] ?? "TaCleSecreteSuperLonguePourLeProjetZeroTrust2026!";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false, // Désactivé en dev pour éviter les conflits de ports locaux
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");

// 6. 🛡️ ACTIVER L'AUTHENTIFICATION AVANT L'AUTORISATION (Ordre strict)
app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();

// 7. CONNEXION DE LA ROUTE DU RADAR
app.MapHub<MonitoringHub>("/monitoringHub");

app.Run();