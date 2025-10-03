using FrenCircle.Api.Data;
using FrenCircle.Contracts.Responses;
using FrenCircle.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace FrenCircle.Api.Controllers;

[Route("user")]
[ApiController]
public class UserController : BaseApiController
{
    private readonly FrenCircleDbContext _context;
    private readonly ILogger<UserController> _logger;

    public UserController(ILogger<UserController> logger, FrenCircleDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Get minimal public profile information for a username.
    /// </summary>
    [HttpGet("{username}/public")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<UserPublicResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPublicByUsername(string username, CancellationToken cancellationToken = default)
    {
        try
        {
            var usernameNorm = (username ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(usernameNorm)) return NotFoundProblem("User not found");

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username.ToLower() == usernameNorm, cancellationToken);

            if (user == null) return NotFoundProblem("User not found");

            var response = new UserPublicResponse(
                Id: user.Id,
                Username: user.Username,
                FirstName: user.FirstName,
                LastName: user.LastName,
                AvatarUrl: user.AvatarUrl
            );

            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting public user for username {Username}", username);
            return Problem(StatusCodes.Status500InternalServerError, "Internal Server Error", "An error occurred while retrieving user");
        }
    }
}
