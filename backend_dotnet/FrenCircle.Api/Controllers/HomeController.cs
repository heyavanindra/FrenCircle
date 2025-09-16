using FrenCircle.Contracts;
using FrenCircle.Contracts.Responses;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace FrenCircle.Api.Controllers;

[Route("")]
public sealed class HomeController : BaseApiController
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Root: prints machine, OS, and uptime details.
    /// </summary>
    [HttpGet]
    [ResponseCache(NoStore = true, Duration = 0, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(ApiResponse<ServerInfo>), StatusCodes.Status200OK)]
    public IActionResult Index()
    {
        var proc = Process.GetCurrentProcess();
        var startUtc = proc.StartTime.ToUniversalTime();
        var uptime = DateTimeOffset.UtcNow - startUtc;

        var info = new ServerInfo(
            Machine: Environment.MachineName,
            OS: RuntimeInformation.OSDescription,
            OSArchitecture: RuntimeInformation.OSArchitecture.ToString(),
            ProcessArchitecture: RuntimeInformation.ProcessArchitecture.ToString(),
            Framework: RuntimeInformation.FrameworkDescription,
            Uptime: uptime,
            ProcessStartUtc: startUtc,
            RequestId: RequestId,
            CorrelationId: CorrelationId
        );

        return OkEnvelope(info);
    }

    /// <summary>
    /// Liveness/health probe. Returns 200 with a simple message.
    /// Keep lightweight (no DB calls) so it’s safe for k8s liveness.
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(typeof(ApiResponse<HealthStatus>), StatusCodes.Status200OK)]
    public IActionResult Health()
    {
        try
        {
            bool dbIsDown = false;

            if (dbIsDown)
            {
                throw new InvalidOperationException("Database is not reachable");
            }

            var payload = new HealthStatus("Healthy", DateTimeOffset.UtcNow);
            return OkEnvelope(payload);
        }
        catch (Exception ex)
        {
            // Explicit error log
            _logger.LogError(ex,
                "Health check failed at {Time} with CorrelationId {CorrelationId}",
                DateTimeOffset.UtcNow,
                CorrelationId);

            // Return ProblemDetails instead of envelope on error
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Service Unavailable",
                detail: ex.Message);
        }
    }
}
