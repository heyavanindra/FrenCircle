using Microsoft.EntityFrameworkCore;
using FrenCircle.Entities;
using System.Net;

namespace FrenCircle.Api.Data;

public class FrenCircleDbContext : DbContext
{
    public FrenCircleDbContext(DbContextOptions<FrenCircleDbContext> options) : base(options)
    {
    }

    // DbSets for all entities
    public DbSet<User> Users { get; set; }
    public DbSet<Profile> Profiles { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<ExternalLogin> ExternalLogins { get; set; }
    public DbSet<OtpCode> OtpCodes { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<TwoFactorMethod> TwoFactorMethods { get; set; }
    public DbSet<TwoFactorCode> TwoFactorCodes { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<RateLimitBucket> RateLimitBuckets { get; set; }
    public DbSet<AppConfig> AppConfigs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Enable PostgreSQL extensions
        modelBuilder.HasPostgresExtension("pgcrypto");
        modelBuilder.HasPostgresExtension("citext");

        ConfigureUserEntity(modelBuilder);
        ConfigureProfileEntity(modelBuilder);
        ConfigureRoleEntity(modelBuilder);
        ConfigureUserRoleEntity(modelBuilder);
        ConfigureExternalLoginEntity(modelBuilder);
        ConfigureOtpCodeEntity(modelBuilder);
        ConfigureSessionEntity(modelBuilder);
        ConfigureRefreshTokenEntity(modelBuilder);
        ConfigureTwoFactorMethodEntity(modelBuilder);
        ConfigureTwoFactorCodeEntity(modelBuilder);
        ConfigureAuditLogEntity(modelBuilder);
        ConfigureRateLimitBucketEntity(modelBuilder);
        ConfigureAppConfigEntity(modelBuilder);

        SeedRoles(modelBuilder);
        SeedAppConfigs(modelBuilder);
    }

    private void ConfigureUserEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<User>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Unique constraints
        entity.HasIndex(e => e.Email).IsUnique();

        // Global query filter for soft delete
        entity.HasQueryFilter(e => e.DeletedAt == null);

        // Relationships
        entity.HasOne(u => u.Profile)
              .WithOne(p => p.User)
              .HasForeignKey<Profile>(p => p.UserId)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany(u => u.UserRoles)
              .WithOne(ur => ur.User)
              .HasForeignKey(ur => ur.UserId)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany(u => u.ExternalLogins)
              .WithOne(el => el.User)
              .HasForeignKey(el => el.UserId)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany(u => u.Sessions)
              .WithOne(s => s.User)
              .HasForeignKey(s => s.UserId)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany(u => u.RefreshTokens)
              .WithOne(rt => rt.User)
              .HasForeignKey(rt => rt.UserId)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany(u => u.TwoFactorMethods)
              .WithOne(tfm => tfm.User)
              .HasForeignKey(tfm => tfm.UserId)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany(u => u.TwoFactorCodes)
              .WithOne(tfc => tfc.User)
              .HasForeignKey(tfc => tfc.UserId)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany(u => u.AuditLogs)
              .WithOne(al => al.User)
              .HasForeignKey(al => al.UserId)
              .OnDelete(DeleteBehavior.SetNull);
    }

    private void ConfigureProfileEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Profile>();

        // Primary key
        entity.HasKey(e => e.UserId);

        // Unique constraints
        entity.HasIndex(e => e.Username).IsUnique();
    }

    private void ConfigureRoleEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Role>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Unique constraints
        entity.HasIndex(e => e.Name).IsUnique();

        // Relationships
        entity.HasMany(r => r.UserRoles)
              .WithOne(ur => ur.Role)
              .HasForeignKey(ur => ur.RoleId)
              .OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureUserRoleEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<UserRole>();

        // Composite primary key
        entity.HasKey(e => new { e.UserId, e.RoleId });
    }

    private void ConfigureExternalLoginEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<ExternalLogin>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Unique constraints
        entity.HasIndex(e => new { e.Provider, e.ProviderUserId }).IsUnique();
    }

    private void ConfigureOtpCodeEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<OtpCode>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Indexes
        entity.HasIndex(e => new { e.Email, e.Purpose, e.ExpiresAt });
    }

    private void ConfigureSessionEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Session>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Indexes
        entity.HasIndex(e => new { e.UserId, e.LastSeenAt });

        // Relationships
        entity.HasMany(s => s.RefreshTokens)
              .WithOne(rt => rt.Session)
              .HasForeignKey(rt => rt.SessionId)
              .OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureRefreshTokenEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<RefreshToken>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Indexes
        entity.HasIndex(e => new { e.UserId, e.SessionId });
        entity.HasIndex(e => e.FamilyId);

        // Self-referencing relationship
        entity.HasOne(rt => rt.ReplacedBy)
              .WithMany()
              .HasForeignKey(rt => rt.ReplacedById)
              .OnDelete(DeleteBehavior.SetNull);
    }

    private void ConfigureTwoFactorMethodEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<TwoFactorMethod>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Relationships
        entity.HasMany(tfm => tfm.TwoFactorCodes)
              .WithOne(tfc => tfc.Method)
              .HasForeignKey(tfc => tfc.MethodId)
              .OnDelete(DeleteBehavior.Cascade);
    }

    private void ConfigureTwoFactorCodeEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<TwoFactorCode>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Indexes
        entity.HasIndex(e => new { e.UserId, e.ExpiresAt });
    }

    private void ConfigureAuditLogEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<AuditLog>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Indexes
        entity.HasIndex(e => new { e.UserId, e.At });
        entity.HasIndex(e => e.Metadata).HasMethod("gin"); // GIN index for JSONB
    }

    private void ConfigureRateLimitBucketEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<RateLimitBucket>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Indexes
        entity.HasIndex(e => new { e.Key, e.WindowStart });
    }

    private void ConfigureAppConfigEntity(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<AppConfig>();

        // Primary key
        entity.HasKey(e => e.Id);

        // Unique constraints
        entity.HasIndex(e => e.Key).IsUnique();
    }

    private void SeedRoles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "admin", Description = "Administrator with full system access" },
            new Role { Id = 2, Name = "mod", Description = "Moderator with moderation privileges" },
            new Role { Id = 3, Name = "user_pro", Description = "Pro user with premium features" },
            new Role { Id = 4, Name = "user_plus", Description = "Plus user with enhanced features" },
            new Role { Id = 5, Name = "user", Description = "Standard user" }
        );
    }

    private void SeedAppConfigs(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppConfig>().HasData(
            new AppConfig { Id = Guid.NewGuid(), Key = "GoogleLoginEnabled", Value = "true", UpdatedAt = DateTimeOffset.UtcNow },
            new AppConfig { Id = Guid.NewGuid(), Key = "OtpExpiryMinutes", Value = "10", UpdatedAt = DateTimeOffset.UtcNow },
            new AppConfig { Id = Guid.NewGuid(), Key = "OtpMaxAttempts", Value = "5", UpdatedAt = DateTimeOffset.UtcNow },
            new AppConfig { Id = Guid.NewGuid(), Key = "SessionIdleTimeoutDays", Value = "14", UpdatedAt = DateTimeOffset.UtcNow },
            new AppConfig { Id = Guid.NewGuid(), Key = "SessionAbsoluteLifetimeDays", Value = "60", UpdatedAt = DateTimeOffset.UtcNow },
            new AppConfig { Id = Guid.NewGuid(), Key = "TwoFactorRequired", Value = "false", UpdatedAt = DateTimeOffset.UtcNow },
            new AppConfig { Id = Guid.NewGuid(), Key = "SignupDisabled", Value = "false", UpdatedAt = DateTimeOffset.UtcNow },
            new AppConfig { Id = Guid.NewGuid(), Key = "PasswordMinLength", Value = "8", UpdatedAt = DateTimeOffset.UtcNow }
        );
    }
}
