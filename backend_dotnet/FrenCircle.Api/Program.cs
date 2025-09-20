using Serilog;
using Serilog.Exceptions;
using FrenCircle.Api.Middleware; // for CorrelationIdMiddleware
using FrenCircle.Api.Data;
using FrenCircle.Api.Configuration;
using FrenCircle.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- 1. Bootstrap Serilog very early ---
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration) // read from appsettings.json
    .Enrich.FromLogContext()
    .Enrich.WithExceptionDetails()
    .Enrich.WithProperty("Application", "FrenCircle.Api")
    .CreateLogger();

builder.Host.UseSerilog((ctx, services, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .ReadFrom.Services(services)
       .Enrich.FromLogContext()
       .Enrich.WithExceptionDetails()
       .Enrich.WithProperty("Environment", ctx.HostingEnvironment.EnvironmentName);
});

// --- 2. Register services ---
builder.Services.AddControllers();
builder.Services.AddOpenApi(); // built-in OpenAPI/Swagger

// --- Entity Framework Core with PostgreSQL ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<FrenCircleDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.MigrationsAssembly("FrenCircle.Api"); // Assembly where migrations will be stored
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
    });
    
    // Configure warnings
    options.ConfigureWarnings(warnings =>
    {
        warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.PossibleIncorrectRequiredNavigationWithQueryFilterInteractionWarning);
        warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning);
    });
    
    // Enable detailed errors in development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
    
    // Add query logging (only for Information level and above to reduce noise)
    options.LogTo(Console.WriteLine, LogLevel.Warning);
});

// --- JWT Configuration ---
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JWT"));
var jwtSettings = builder.Configuration.GetSection("JWT").Get<JwtSettings>();

if (jwtSettings == null || string.IsNullOrEmpty(jwtSettings.SecretKey))
{
    throw new InvalidOperationException("JWT configuration is missing or invalid");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); // Allow HTTP in development
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero, // No tolerance for token expiry
        NameClaimType = ClaimTypes.Name,
        RoleClaimType = ClaimTypes.Role
    };
    
    // JWT events for logging
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Log.Warning("JWT Authentication failed: {Error}", context.Exception.Message);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var userId = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Log.Information("JWT token validated for user {UserId}", userId);
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Register services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddHttpClient();

// Add custom app services (example)
// builder.Services.AddSingleton<ILoggingService, LoggingService>();

var app = builder.Build();

// --- 3. Configure middleware pipeline ---
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Serilog request logging (logs HTTP requests with correlation info)
app.UseSerilogRequestLogging(opts =>
{
    opts.EnrichDiagnosticContext = (diag, http) =>
    {
        diag.Set("RequestHost", http.Request.Host.Value);
        diag.Set("RequestScheme", http.Request.Scheme);
        diag.Set("ClientIP", http.Connection.RemoteIpAddress?.ToString());
        diag.Set("UserId", http.User?.FindFirst("oid")?.Value ?? http.User?.Identity?.Name);
        diag.Set("CorrelationId", http.Request.Headers["X-Correlation-Id"].ToString());
    };
});
// Correlation ID middleware (ensures every request has one)
app.UseMiddleware<CorrelationIdMiddleware>();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// --- 4. Start app with safe logging ---
try
{
    Log.Information("Starting FrenCircle.Api...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "FrenCircle.Api terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
