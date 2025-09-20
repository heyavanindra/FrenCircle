using FrenCircle.Api.Data;
using FrenCircle.Api.Services;
using FrenCircle.Contracts;
using FrenCircle.Contracts.Requests;
using FrenCircle.Contracts.Responses;
using FrenCircle.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace FrenCircle.Api.Controllers;

[Route("auth")]
public sealed class AuthController : BaseApiController
{
    private readonly ILogger<AuthController> _logger;
    private readonly FrenCircleDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IJwtService _jwtService;

    public AuthController(
        ILogger<AuthController> logger, 
        FrenCircleDbContext context,
        IConfiguration configuration,
        IJwtService jwtService)
    {
        _logger = logger;
        _context = context;
        _configuration = configuration;
        _jwtService = jwtService;
    }

    /// <summary>
    /// Authenticate user with email or username and create a new session
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Login attempt for {EmailOrUsername} with CorrelationId {CorrelationId}", 
            request.EmailOrUsername, CorrelationId);

        try
        {
            // Find user by email or username (case-insensitive)
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email == request.EmailOrUsername || 
                                         u.Username == request.EmailOrUsername, cancellationToken);

            if (user == null)
            {
                _logger.LogWarning("Login failed: User not found for {EmailOrUsername}", request.EmailOrUsername);
                return UnauthorizedProblem("Invalid email/username or password");
            }

            // Verify password (in production, use proper password hashing like BCrypt)
            if (!VerifyPassword(request.Password, user.PasswordHash))
            {
                _logger.LogWarning("Login failed: Invalid password for user {UserId}", user.Id);
                return UnauthorizedProblem("Invalid email or password");
            }

            // Check if email is verified
            if (!user.EmailVerified)
            {
                _logger.LogWarning("Login failed: Email not verified for user {UserId}", user.Id);
                return UnauthorizedProblem("Please verify your email before logging in");
            }

            // Create session
            var session = new Session
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                AuthMethod = "EmailPassword",
                UserAgent = Request.Headers.UserAgent.ToString() ?? "Unknown",
                IpAddress = HttpContext.Connection.RemoteIpAddress ?? System.Net.IPAddress.Loopback,
                CreatedAt = DateTimeOffset.UtcNow,
                LastSeenAt = DateTimeOffset.UtcNow
            };

            _context.Sessions.Add(session);

            // Create refresh token
            var refreshTokenValue = GenerateRefreshToken();
            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                SessionId = session.Id,
                TokenHash = HashPassword(refreshTokenValue), // Store hash, not plain token
                FamilyId = Guid.NewGuid(),
                ExpiresAt = request.RememberMe 
                    ? DateTimeOffset.UtcNow.AddDays(60) 
                    : DateTimeOffset.UtcNow.AddDays(14),
                IssuedAt = DateTimeOffset.UtcNow
            };

            _context.RefreshTokens.Add(refreshToken);
            user.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            // Set refresh token as httpOnly cookie (secure storage)
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,                    // Not accessible via JavaScript
                Secure = !HttpContext.Request.IsHttps ? false : true, // HTTPS in production
                SameSite = SameSiteMode.Strict,     // CSRF protection
                Path = "/auth",                     // Only sent to auth endpoints
                MaxAge = request.RememberMe 
                    ? TimeSpan.FromDays(60) 
                    : TimeSpan.FromDays(14)         // Match refresh token expiry
            };
            
            Response.Cookies.Append("refreshToken", refreshTokenValue, cookieOptions);

            // Generate JWT access token
            var accessToken = _jwtService.GenerateToken(user);
            var jwtExpiryMinutes = _configuration.GetSection("JWT:ExpiryMinutes").Get<int?>();
            var expiryMinutes = jwtExpiryMinutes ?? 15;
            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes);

            var userInfo = new UserInfo(
                Id: user.Id,
                Email: user.Email,
                EmailVerified: user.EmailVerified,
                Username: user.Username,
                FirstName: user.FirstName,
                LastName: user.LastName,
                AvatarUrl: user.AvatarUrl,
                CreatedAt: user.CreatedAt,
                Roles: user.UserRoles.Select(ur => ur.Role.Name).ToList()
            );

            // Don't return refresh token in response - it's now in httpOnly cookie
            var authResponse = new AuthResponse(
                AccessToken: accessToken,
                RefreshToken: null, // Removed - now stored securely in httpOnly cookie
                ExpiresAt: expiresAt,
                User: userInfo
            );

            _logger.LogInformation("User {UserId} logged in successfully", user.Id);
            return OkEnvelope(authResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {EmailOrUsername}", request.EmailOrUsername);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Register a new user account with mandatory username
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<UserInfo>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Registration attempt for email {Email} with CorrelationId {CorrelationId}", 
            request.Email, CorrelationId);

        try
        {
            // Check if signup is disabled
            var signupDisabled = await _context.AppConfigs
                .Where(ac => ac.Key == "SignupDisabled")
                .Select(ac => ac.Value == "true")
                .FirstOrDefaultAsync(cancellationToken);

            if (signupDisabled)
            {
                return BadRequestProblem("User registration is currently disabled");
            }

            // Check if user already exists
            var existingUser = await _context.Users
                .AnyAsync(u => u.Email == request.Email, cancellationToken);

            if (existingUser)
            {
                return ConflictProblem("A user with this email already exists");
            }

            // Validate username requirements
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequestProblem("Username is required");
            }

            if (request.Username.Length < 3)
            {
                return BadRequestProblem("Username must be at least 3 characters long");
            }

            if (request.Username.Length > 30)
            {
                return BadRequestProblem("Username cannot be longer than 30 characters");
            }

            // Check if username contains only valid characters (alphanumeric, underscore, hyphen)
            if (!System.Text.RegularExpressions.Regex.IsMatch(request.Username, @"^[a-zA-Z0-9_-]+$"))
            {
                return BadRequestProblem("Username can only contain letters, numbers, underscores, and hyphens");
            }

            // Check if username is taken (case-insensitive)
            var existingUsername = await _context.Users
                .AnyAsync(u => u.Username.ToLower() == request.Username.ToLower(), cancellationToken);

            if (existingUsername)
            {
                return ConflictProblem("This username is already taken");
            }

            // Validate password requirements
            var minPasswordLength = await _context.AppConfigs
                .Where(ac => ac.Key == "PasswordMinLength")
                .Select(ac => int.Parse(ac.Value))
                .FirstOrDefaultAsync(cancellationToken);

            if (request.Password.Length < minPasswordLength)
            {
                return BadRequestProblem($"Password must be at least {minPasswordLength} characters long");
            }

            // Create user (with profile fields consolidated)
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                EmailVerified = false,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Username = request.Username,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Users.Add(user);

            // Assign default user role
            var userRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == "user", cancellationToken);

            if (userRole != null)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = userId,
                    RoleId = userRole.Id
                });
            }

            // Create email verification token
            var verificationToken = GenerateVerificationToken();
            var otpCode = new OtpCode
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                CodeHash = HashPassword(verificationToken),
                Purpose = "Signup",
                ExpiresAt = DateTimeOffset.UtcNow.AddHours(24)
            };

            _context.OtpCodes.Add(otpCode);

            await _context.SaveChangesAsync(cancellationToken);

            var userInfo = new UserInfo(
                Id: user.Id,
                Email: user.Email,
                EmailVerified: user.EmailVerified,
                Username: user.Username,
                FirstName: user.FirstName,
                LastName: user.LastName,
                AvatarUrl: user.AvatarUrl,
                CreatedAt: user.CreatedAt,
                Roles: userRole != null ? [userRole.Name] : []
            );

            _logger.LogInformation("User {UserId} registered successfully", user.Id);
            
            // TODO: Send verification email with token
            
            return Created($"/auth/users/{user.Id}", new ApiResponse<UserInfo>(userInfo));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for email {Email}", request.Email);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Refresh access token using refresh token from httpOnly cookie
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<RefreshTokenResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Token refresh attempt with CorrelationId {CorrelationId}", CorrelationId);

        try
        {
            // Read refresh token from httpOnly cookie
            if (!Request.Cookies.TryGetValue("refreshToken", out var refreshTokenValue) || 
                string.IsNullOrEmpty(refreshTokenValue))
            {
                _logger.LogWarning("Refresh token cookie not found or empty");
                return UnauthorizedProblem("Refresh token not found");
            }

            var tokenHash = HashPassword(refreshTokenValue);
            
            // Find the refresh token by hash
            var refreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                    .ThenInclude(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                .Include(rt => rt.Session)
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

            if (refreshToken == null)
            {
                _logger.LogWarning("Refresh token not found");
                return UnauthorizedProblem("Invalid refresh token");
            }

            // Check if token is expired
            if (refreshToken.ExpiresAt <= DateTimeOffset.UtcNow)
            {
                _logger.LogWarning("Expired refresh token used for user {UserId}", refreshToken.UserId);
                return UnauthorizedProblem("Refresh token has expired");
            }

            // Check if token is revoked
            if (refreshToken.RevokedAt.HasValue)
            {
                _logger.LogWarning("Revoked refresh token used for user {UserId}", refreshToken.UserId);
                return UnauthorizedProblem("Refresh token has been revoked");
            }

            // Create new refresh token (token rotation)
            var newRefreshTokenValue = GenerateRefreshToken();
            var newRefreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = refreshToken.UserId,
                SessionId = refreshToken.SessionId,
                TokenHash = HashPassword(newRefreshTokenValue),
                FamilyId = refreshToken.FamilyId,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(14),
                IssuedAt = DateTimeOffset.UtcNow
            };

            _context.RefreshTokens.Add(newRefreshToken);

            // Revoke old token
            refreshToken.RevokedAt = DateTimeOffset.UtcNow;
            refreshToken.ReplacedById = newRefreshToken.Id;

            // Update session last seen
            if (refreshToken.Session != null)
            {
                refreshToken.Session.LastSeenAt = DateTimeOffset.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);

            // Set new refresh token as httpOnly cookie (token rotation)
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !HttpContext.Request.IsHttps ? false : true,
                SameSite = SameSiteMode.Strict,
                Path = "/auth",
                MaxAge = TimeSpan.FromDays(14)
            };
            
            Response.Cookies.Append("refreshToken", newRefreshTokenValue, cookieOptions);

            // Generate new JWT access token
            var accessToken = _jwtService.GenerateToken(refreshToken.User);
            var jwtExpiryMinutes = _configuration.GetSection("JWT:ExpiryMinutes").Get<int?>();
            var expiryMinutes = jwtExpiryMinutes ?? 15;
            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes);

            // Don't return refresh token in response - it's in httpOnly cookie
            var response = new RefreshTokenResponse(
                AccessToken: accessToken,
                RefreshToken: null, // Removed - now stored securely in httpOnly cookie
                ExpiresAt: expiresAt
            );

            _logger.LogInformation("Token refreshed successfully for user {UserId}", refreshToken.UserId);
            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Logout user and revoke refresh token from httpOnly cookie
    /// </summary>
    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponse<LogoutResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Logout attempt with CorrelationId {CorrelationId}", CorrelationId);

        try
        {
            // Read refresh token from httpOnly cookie
            if (Request.Cookies.TryGetValue("refreshToken", out var refreshTokenValue) && 
                !string.IsNullOrEmpty(refreshTokenValue))
            {
                // Find and revoke refresh token
                var tokenHash = HashPassword(refreshTokenValue);
                var refreshToken = await _context.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

                if (refreshToken != null)
                {
                    refreshToken.RevokedAt = DateTimeOffset.UtcNow;
                    await _context.SaveChangesAsync(cancellationToken);
                    
                    _logger.LogInformation("User {UserId} logged out successfully", refreshToken.UserId);
                }
            }

            // Clear the refresh token cookie
            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                Path = "/auth",
                SameSite = SameSiteMode.Strict
            });

            var response = new LogoutResponse(
                Message: "Logged out successfully",
                LoggedOutAt: DateTimeOffset.UtcNow
            );

            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Verify email with verification token
    /// </summary>
    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(ApiResponse<VerificationSentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Email verification attempt for {Email} with CorrelationId {CorrelationId}", 
            request.Email, CorrelationId);

        try
        {
            // Find verification token
            var tokenHash = HashPassword(request.Token);
            var otpCode = await _context.OtpCodes
                .FirstOrDefaultAsync(oc => oc.Email == request.Email && 
                                         oc.CodeHash == tokenHash && 
                                         oc.Purpose == "Signup", 
                                   cancellationToken);

            if (otpCode == null)
            {
                return BadRequestProblem("Invalid verification token");
            }

            if (otpCode.ExpiresAt <= DateTimeOffset.UtcNow)
            {
                return BadRequestProblem("Verification token has expired");
            }

            if (otpCode.ConsumedAt.HasValue)
            {
                return BadRequestProblem("Verification token has already been used");
            }

            // Find user and verify email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

            if (user == null)
            {
                return BadRequestProblem("User not found");
            }

            user.EmailVerified = true;
            user.UpdatedAt = DateTimeOffset.UtcNow;

            // Mark token as used
            otpCode.ConsumedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var response = new VerificationSentResponse(
                Message: "Email verified successfully",
                SentAt: DateTimeOffset.UtcNow
            );

            _logger.LogInformation("Email verified successfully for user {UserId}", user.Id);
            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during email verification for {Email}", request.Email);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while processing your request");
        }
    }

    // Helper methods (in production, move to separate services)
    private static string HashPassword(string password)
    {
        // Simple hash for demo - use BCrypt or similar in production
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return HashPassword(password) == hash;
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private static string GenerateVerificationToken()
    {
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes).Replace("+", "").Replace("/", "").Replace("=", "")[..8];
    }
}