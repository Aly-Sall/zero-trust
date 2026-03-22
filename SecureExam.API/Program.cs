using Microsoft.EntityFrameworkCore;
using SecureExam.API.Data;
using SecureExam.API.Services;
using SecureExam.API.Hubs; // 👈 AJOUT DU DOSSIER HUB

var builder = WebApplication.CreateBuilder(args);

// 1. Base de données
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Service d'Emails
builder.Services.AddScoped<IEmailService, EmailService>();

// 3. SIGNALR (LE MOTEUR TEMPS RÉEL DU RADAR)
builder.Services.AddSignalR();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 4. CORS (CRITIQUE : AllowCredentials est obligatoire pour les WebSockets SignalR)
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReact", policy => {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // 👈 LIGNE MAGIQUE
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");
app.UseAuthorization();
app.MapControllers();

// 5. CONNEXION DE LA ROUTE DU RADAR
app.MapHub<MonitoringHub>("/monitoringHub");

app.Run();