using Microsoft.EntityFrameworkCore;
using SecureExam.API.Models;

namespace SecureExam.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<BaselineSignature> BaselineSignatures { get; set; }
        public DbSet<ExamSession> ExamSessions { get; set; }
        public DbSet<IntegrityAlert> IntegrityAlerts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // On s'assure que les emails sont uniques
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }
    }
}