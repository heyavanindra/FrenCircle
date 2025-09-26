using FrenCircle.Api.Data;
using FrenCircle.Api.Services;
using FrenCircle.Contracts;
using FrenCircle.Contracts.Requests;
using FrenCircle.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace FrenCircle.Api.Controllers;

[Route("profile")]
[Authorize]
public sealed class ProfileController : BaseApiController
{
    private readonly ILogger<ProfileController> _logger;
    private readonly FrenCircleDbContext _context;

    public ProfileController(
        ILogger<ProfileController> logger, 
        FrenCircleDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Get current user's profile details
    /// </summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(ApiResponse<ProfileDetailsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfileDetails(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting profile details for user {UserId} with CorrelationId {CorrelationId}", 
            UserId, CorrelationId);

        try
        {
            if (!Guid.TryParse(UserId, out var userIdGuid))
            {
                return UnauthorizedProblem("Invalid user context");
            }

            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userIdGuid, cancellationToken);

            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found", UserId);
                return NotFoundProblem("User not found");
            }

            var profileResponse = new ProfileDetailsResponse(
                Id: user.Id,
                Email: user.Email,
                EmailVerified: user.EmailVerified,
                Username: user.Username,
                FirstName: user.FirstName,
                LastName: user.LastName,
                DisplayName: user.DisplayName,
                Bio: user.Bio,
                AvatarUrl: user.AvatarUrl,
                Timezone: user.Timezone,
                Locale: user.Locale,
                VerifiedBadge: user.VerifiedBadge,
                CreatedAt: user.CreatedAt,
                UpdatedAt: user.UpdatedAt,
                Roles: user.UserRoles.Select(ur => ur.Role.Name).ToList()
            );

            return OkEnvelope(profileResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting profile details for user {UserId}", UserId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while retrieving your profile");
        }
    }

    /// <summary>
    /// Update user's profile information (excluding password)
    /// </summary>
    [HttpPost("")]
    [ProducesResponseType(typeof(ApiResponse<ProfileUpdateResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating profile for user {UserId} with CorrelationId {CorrelationId}", 
            UserId, CorrelationId);

        try
        {
            if (!Guid.TryParse(UserId, out var userIdGuid))
            {
                return UnauthorizedProblem("Invalid user context");
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userIdGuid, cancellationToken);

            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found", UserId);
                return NotFoundProblem("User not found");
            }

            // Validate display name length if provided
            if (!string.IsNullOrWhiteSpace(request.DisplayName) && request.DisplayName.Length > 50)
            {
                return BadRequestProblem("Display name cannot exceed 50 characters");
            }

            // Validate bio length if provided
            if (!string.IsNullOrWhiteSpace(request.Bio) && request.Bio.Length > 500)
            {
                return BadRequestProblem("Bio cannot exceed 500 characters");
            }

            // Update only provided fields
            if (request.FirstName != null)
                user.FirstName = string.IsNullOrWhiteSpace(request.FirstName) ? null : request.FirstName.Trim();
            
            if (request.LastName != null)
                user.LastName = string.IsNullOrWhiteSpace(request.LastName) ? null : request.LastName.Trim();
            
            if (request.DisplayName != null)
                user.DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName.Trim();
            
            if (request.Bio != null)
                user.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
            
            if (request.AvatarUrl != null)
                user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
            
            if (request.Timezone != null)
                user.Timezone = string.IsNullOrWhiteSpace(request.Timezone) ? null : request.Timezone.Trim();
            
            if (request.Locale != null)
                user.Locale = string.IsNullOrWhiteSpace(request.Locale) ? null : request.Locale.Trim();

            user.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var updatedProfile = new ProfileDetailsResponse(
                Id: user.Id,
                Email: user.Email,
                EmailVerified: user.EmailVerified,
                Username: user.Username,
                FirstName: user.FirstName,
                LastName: user.LastName,
                DisplayName: user.DisplayName,
                Bio: user.Bio,
                AvatarUrl: user.AvatarUrl,
                Timezone: user.Timezone,
                Locale: user.Locale,
                VerifiedBadge: user.VerifiedBadge,
                CreatedAt: user.CreatedAt,
                UpdatedAt: user.UpdatedAt,
                Roles: user.UserRoles.Select(ur => ur.Role.Name).ToList()
            );

            var response = new ProfileUpdateResponse(
                Message: "Profile updated successfully",
                UpdatedAt: user.UpdatedAt,
                Profile: updatedProfile
            );

            _logger.LogInformation("Profile updated successfully for user {UserId}", UserId);
            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile for user {UserId}", UserId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while updating your profile");
        }
    }

    // Purpose: Allow users to change their password. The current password is required
    // by default for security, but when the current session was created via Google
    // sign-in we skip asking for the current password (useful for Google-auth users
    // who don't have a local password set).
    /// <summary>
    /// Change user's password
    /// </summary>
    [HttpPost("password")]
    [ProducesResponseType(typeof(ApiResponse<PasswordChangeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Password change attempt for user {UserId} with CorrelationId {CorrelationId}", 
            UserId, CorrelationId);

        try
        {
            if (!Guid.TryParse(UserId, out var userIdGuid))
            {
                return UnauthorizedProblem("Invalid user context");
            }

            var user = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userIdGuid, cancellationToken);

            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found", UserId);
                return NotFoundProblem("User not found");
            }

                // Determine whether to require the current password. If the current session
                // used Google as the auth method we will skip current-password verification.
                var currentSessionId = await GetCurrentSessionId(userIdGuid, cancellationToken);
                var currentSession = currentSessionId.HasValue
                    ? await _context.Sessions.AsNoTracking().FirstOrDefaultAsync(s => s.Id == currentSessionId.Value, cancellationToken)
                    : null;

                var signedInViaGoogle = currentSession != null &&
                    string.Equals(currentSession.AuthMethod, "google", StringComparison.OrdinalIgnoreCase);

                if (!signedInViaGoogle)
                {
                    // Verify current password for non-Google sessions
                    if (!VerifyPassword(request.CurrentPassword, user.PasswordHash))
                    {
                        _logger.LogWarning("Invalid current password provided by user {UserId}", UserId);
                        return BadRequestProblem("Current password is incorrect");
                    }
                }

            // Validate new password length
            var minPasswordLength = await _context.AppConfigs
                .Where(ac => ac.Key == "PasswordMinLength")
                .Select(ac => int.Parse(ac.Value))
                .FirstOrDefaultAsync(cancellationToken);

            if (request.NewPassword.Length < minPasswordLength)
            {
                return BadRequestProblem($"New password must be at least {minPasswordLength} characters long");
            }

            // Ensure new password is different from current
            if (VerifyPassword(request.NewPassword, user.PasswordHash))
            {
                return BadRequestProblem("New password must be different from current password");
            }

            // Update password
            user.PasswordHash = HashPassword(request.NewPassword);
            user.UpdatedAt = DateTimeOffset.UtcNow;

            // Revoke all existing refresh tokens to force re-login on other devices
            var refreshTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userIdGuid && rt.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var token in refreshTokens)
            {
                token.RevokedAt = DateTimeOffset.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);

            var response = new PasswordChangeResponse(
                Message: "Password changed successfully. Please log in again on other devices.",
                ChangedAt: user.UpdatedAt
            );

            _logger.LogInformation("Password changed successfully for user {UserId}", UserId);
            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user {UserId}", UserId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while changing your password");
        }
    }

    /// <summary>
    /// Get all active sessions for the current user
    /// </summary>
    [HttpGet("sessions")]
    [ProducesResponseType(typeof(ApiResponse<SessionsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSessions(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting sessions for user {UserId} with CorrelationId {CorrelationId}", 
            UserId, CorrelationId);

        try
        {
            if (!Guid.TryParse(UserId, out var userIdGuid))
            {
                return UnauthorizedProblem("Invalid user context");
            }

            // Get current session ID from various methods
            var currentSessionId = await GetCurrentSessionId(userIdGuid, cancellationToken);

            // If we found a current session id, update its LastSeenAt separately (load for update)
            if (currentSessionId.HasValue)
            {
                var currentSession = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.Id == currentSessionId.Value, cancellationToken);

                if (currentSession != null)
                {
                    currentSession.LastSeenAt = DateTimeOffset.UtcNow;
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }

            // Use AsNoTracking for read-only sessions list
            var sessions = await _context.Sessions
                .AsNoTracking()
                .Where(s => s.UserId == userIdGuid && s.RevokedAt == null)
                .OrderByDescending(s => s.LastSeenAt)
                .Select(s => new SessionInfo(
                    s.Id,
                    s.AuthMethod,
                    s.IpAddress.ToString(),
                    s.UserAgent,
                    s.CreatedAt,
                    s.LastSeenAt,
                    s.Id == currentSessionId
                ))
                .ToListAsync(cancellationToken);

            var response = new SessionsResponse(Sessions: sessions);
            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sessions for user {UserId}", UserId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while retrieving your sessions");
        }
    }

    /// <summary>
    /// Logout from a specific session (revoke session and its refresh tokens)
    /// </summary>
    [HttpPost("sessions/{sessionId:guid}/logout")]
    [ProducesResponseType(typeof(ApiResponse<SessionDeleteResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LogoutFromSession(Guid sessionId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Logout from session {SessionId} for user {UserId} with CorrelationId {CorrelationId}", 
            sessionId, UserId, CorrelationId);

        try
        {
            if (!Guid.TryParse(UserId, out var userIdGuid))
            {
                return UnauthorizedProblem("Invalid user context");
            }

            var session = await _context.Sessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userIdGuid, cancellationToken);

            if (session == null)
            {
                return NotFoundProblem("Session not found or does not belong to you");
            }

            if (session.RevokedAt.HasValue)
            {
                return BadRequestProblem("Session is already logged out");
            }

            // Revoke the session
            session.RevokedAt = DateTimeOffset.UtcNow;

            // Revoke all refresh tokens for this session
            var refreshTokens = await _context.RefreshTokens
                .Where(rt => rt.SessionId == sessionId && rt.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var token in refreshTokens)
            {
                token.RevokedAt = DateTimeOffset.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);

            var response = new SessionDeleteResponse(
                Message: "Session logged out successfully",
                DeletedAt: session.RevokedAt.Value
            );

            _logger.LogInformation("Session {SessionId} logged out successfully for user {UserId}", sessionId, UserId);
            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging out session {SessionId} for user {UserId}", sessionId, UserId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while logging out the session");
        }
    }

    /// <summary>
    /// Logout from all other sessions (except current one)
    /// </summary>
    [HttpPost("sessions/logout-all")]
    [ProducesResponseType(typeof(ApiResponse<SessionDeleteResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LogoutFromAllOtherSessions(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Logout from all other sessions for user {UserId} with CorrelationId {CorrelationId}", 
            UserId, CorrelationId);

        try
        {
            if (!Guid.TryParse(UserId, out var userIdGuid))
            {
                return UnauthorizedProblem("Invalid user context");
            }

            // Get current session ID to exclude it from logout
            var currentSessionId = await GetCurrentSessionId(userIdGuid, cancellationToken);

            // Find all other active sessions
            var otherSessions = await _context.Sessions
                .Where(s => s.UserId == userIdGuid && s.RevokedAt == null && s.Id != currentSessionId)
                .ToListAsync(cancellationToken);

            var loggedOutCount = otherSessions.Count;
            var revokedAt = DateTimeOffset.UtcNow;

            // Revoke other sessions
            foreach (var session in otherSessions)
            {
                session.RevokedAt = revokedAt;
            }

            // Revoke all refresh tokens for other sessions
            var refreshTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userIdGuid && 
                           rt.RevokedAt == null && 
                           rt.SessionId != currentSessionId)
                .ToListAsync(cancellationToken);

            foreach (var token in refreshTokens)
            {
                token.RevokedAt = revokedAt;
            }

            await _context.SaveChangesAsync(cancellationToken);

            var response = new SessionDeleteResponse(
                Message: $"Logged out from {loggedOutCount} other session(s) successfully",
                DeletedAt: revokedAt
            );

            _logger.LogInformation("Logged out from {Count} other sessions for user {UserId}", loggedOutCount, UserId);
            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging out from all other sessions for user {UserId}", UserId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while logging out from other sessions");
        }
    }

    /// <summary>
    /// Delete user account permanently (requires password confirmation)
    /// </summary>
    [HttpPost("delete")]
    [ProducesResponseType(typeof(ApiResponse<AccountDeleteResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Account deletion attempt for user {UserId} with CorrelationId {CorrelationId}", 
            UserId, CorrelationId);

        try
        {
            if (!Guid.TryParse(UserId, out var userIdGuid))
            {
                return UnauthorizedProblem("Invalid user context");
            }

            // Validate confirmation text
            if (request.ConfirmationText != "DELETE MY ACCOUNT")
            {
                return BadRequestProblem("Confirmation text must be exactly: DELETE MY ACCOUNT");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userIdGuid, cancellationToken);

            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found for deletion", UserId);
                return NotFoundProblem("User not found");
            }

            // Verify password
            if (!VerifyPassword(request.Password, user.PasswordHash))
            {
                _logger.LogWarning("Invalid password provided for account deletion by user {UserId}", UserId);
                return BadRequestProblem("Password is incorrect");
            }

            var deletedAt = DateTimeOffset.UtcNow;

            // Option 1: Soft delete (recommended for audit trail)
            user.DeletedAt = deletedAt;
            user.IsActive = false;
            user.Email = $"deleted_{userIdGuid}@deleted.local"; // Anonymize email
            user.Username = $"deleted_{userIdGuid}"; // Anonymize username
            user.FirstName = null;
            user.LastName = null;
            user.DisplayName = null;
            user.Bio = null;
            user.AvatarUrl = null;
            user.UpdatedAt = deletedAt;

            // Revoke all sessions and tokens
            var sessions = await _context.Sessions
                .Where(s => s.UserId == userIdGuid && s.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var session in sessions)
            {
                session.RevokedAt = deletedAt;
            }

            var refreshTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userIdGuid && rt.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var token in refreshTokens)
            {
                token.RevokedAt = deletedAt;
            }

            // Revoke any pending OTP codes
            var otpCodes = await _context.OtpCodes
                .Where(otp => otp.Email == user.Email && otp.ConsumedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var otp in otpCodes)
            {
                otp.ConsumedAt = deletedAt;
            }

            await _context.SaveChangesAsync(cancellationToken);

            // Clear refresh token cookie
            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/auth"
            });

            var response = new AccountDeleteResponse(
                Message: "Account deleted successfully",
                DeletedAt: deletedAt
            );

            _logger.LogInformation("Account deleted successfully for user {UserId}", UserId);
            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting account for user {UserId}", UserId);
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while deleting your account");
        }
    }

    // Helper methods (matching AuthController patterns)
    private static string HashPassword(string password)
    {
        // Use BCrypt for secure password hashing (matching AuthController)
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch
        {
            return false;
        }
    }

    private static string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hashedBytes);
    }

    private async Task<Guid?> GetCurrentSessionId(Guid userId, CancellationToken cancellationToken)
    {
        // Method 1: Try to get session ID from JWT token claims (if sessionId claim exists)
        var sessionIdClaim = User.FindFirst("sessionId")?.Value ?? User.FindFirst("sid")?.Value;
        if (!string.IsNullOrEmpty(sessionIdClaim) && Guid.TryParse(sessionIdClaim, out var sessionIdFromToken))
        {
            // Verify this session still exists and is active
            var sessionExists = await _context.Sessions
                .AnyAsync(s => s.Id == sessionIdFromToken && s.UserId == userId && s.RevokedAt == null, cancellationToken);
            
            if (sessionExists)
                return sessionIdFromToken;
        }

        // Method 2: Try to identify from refresh token cookie (if refresh tokens are hashed properly)
        if (Request.Cookies.TryGetValue("refreshToken", out var refreshTokenValue) && 
            !string.IsNullOrEmpty(refreshTokenValue))
        {
            // Hash the refresh token value to compare with stored hashes
            var hashedToken = HashToken(refreshTokenValue);
            var refreshToken = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null && rt.TokenHash == hashedToken)
                .FirstOrDefaultAsync(cancellationToken);
            
            if (refreshToken != null)
                return refreshToken.SessionId;
        }

        // Method 3: Use IP and User Agent matching as fallback
        var currentIp = Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var currentUserAgent = Request.Headers.UserAgent.ToString() ?? "unknown";
        
        var matchingSession = await _context.Sessions
            .Where(s => s.UserId == userId && s.RevokedAt == null)
            .Where(s => s.IpAddress.ToString() == currentIp && s.UserAgent == currentUserAgent)
            .OrderByDescending(s => s.LastSeenAt)
            .FirstOrDefaultAsync(cancellationToken);
            
        if (matchingSession != null)
            return matchingSession.Id;

        // Method 4: Fallback to most recent active session
        var recentSession = await _context.Sessions
            .Where(s => s.UserId == userId && s.RevokedAt == null)
            .OrderByDescending(s => s.LastSeenAt)
            .FirstOrDefaultAsync(cancellationToken);
            
        return recentSession?.Id;
    }
}