using Serilog;
using Serilog.Exceptions;
using FrenCircle.Api.Middleware; // for CorrelationIdMiddleware
using FrenCircle.Api.Data;
using FrenCircle.Api.Configuration;
using FrenCircle.Api.Services;
using FrenCircle.Api.Extensions; // added for custom CORS
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
builder.Services.AddFrenCircleDbContext(builder.Configuration, builder.Environment);

// --- JWT Configuration ---
builder.Services.AddJwtAuthentication(builder.Configuration, builder.Environment);

// --- CORS Configuration ---
builder.Services.AddCustomCors();

// Register services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddHttpClient();

// Email Service Configuration
builder.Services.Configure<FrenCircle.Infra.Configuration.SmtpSettings>(
    builder.Configuration.GetSection("Email:Smtp"));
builder.Services.AddScoped<FrenCircle.Infra.IEmailService, FrenCircle.Infra.EmailService>();

// Repository Services
builder.Services.AddScoped<FrenCircle.Contracts.Interfaces.IUserRepository, FrenCircle.Repositories.UserRepository>();

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

// Enable CORS
app.UseCustomCors();

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
