using Microsoft.AspNetCore.Mvc;
using FrenCircle.Contracts;
using FrenCircle.Contracts.Interfaces;

namespace FrenCircle.Api.Controllers;

[Route("analytics")]
public sealed class AnalyticsController : BaseApiController
{
    private readonly ILogger<AnalyticsController> _logger;
    private readonly IUserRepository _userRepository;

    public AnalyticsController(
        ILogger<AnalyticsController> logger,
        IUserRepository userRepository)
    {
        _logger = logger;
        _userRepository = userRepository;
    }

    /// <summary>
    /// Get the total number of users in the system
    /// </summary>
    [HttpGet("users/count")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserCount(CancellationToken cancellationToken = default)
    {
        try
        {
            var userCount = await _userRepository.GetUserCountAsync(cancellationToken);

            var result = new
            {
                totalUsers = userCount,
                retrievedAt = DateTimeOffset.UtcNow
            };

            return OkEnvelope(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Configuration error while retrieving user count");
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Configuration Error",
                detail: ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user count");
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An error occurred while retrieving user count");
        }
    }
}
