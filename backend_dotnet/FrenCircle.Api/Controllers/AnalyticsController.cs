using Microsoft.AspNetCore.Mvc;
using FrenCircle.Contracts;
using FrenCircle.Contracts.Interfaces;
using FrenCircle.Api.Data;
using FrenCircle.Entities;
using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Primitives;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FrenCircle.Api.Controllers;

public record ClickPayload(string? fp, LocationDto? location);
public record LocationDto(CoordsDto? coords);
public record CoordsDto(double latitude, double longitude, double accuracy);

[Route("analytics")]
public sealed class AnalyticsController : BaseApiController
{
    private readonly ILogger<AnalyticsController> _logger;
    private readonly IUserRepository _userRepository;
    private readonly FrenCircleDbContext _db;

    public AnalyticsController(
        ILogger<AnalyticsController> logger,
        IUserRepository userRepository,
        FrenCircleDbContext db)
    {
        _logger = logger;
        _userRepository = userRepository;
        _db = db;
    }

    // DTOs are declared as public records at the namespace level above.

    /// <summary>
    /// Record a click for a link. This endpoint is intentionally permissive and does not require authentication.
    /// If the request is authenticated, the UserId will be set on the AuditLog so users can later query their own analytics.
    /// </summary>
    [HttpPost("/link/{linkId:guid}/click")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RecordLinkClick([FromRoute] Guid linkId, [FromBody] ClickPayload? body, CancellationToken cancellationToken = default)
    {
        try
        {
            // Build metadata
            // Persist a dedicated Analytics record for querying
            var analytics = new FrenCircle.Entities.Analytics
            {
                Id = Guid.NewGuid(),
                LinkId = linkId,
                Fingerprint = body?.fp,
                At = DateTimeOffset.UtcNow
            };
            // Attach user if present
            if (IsAuthenticated && Guid.TryParse(UserId, out var uid))
            {
                analytics.UserId = uid;
            }

            // User agent
            if (Request.Headers.TryGetValue("User-Agent", out var ua) && !StringValues.IsNullOrEmpty(ua))
            {
                analytics.UserAgent = ua.ToString();
            }

            if (body?.location?.coords is not null)
            {
                analytics.Latitude = body!.location!.coords!.latitude;
                analytics.Longitude = body.location.coords.longitude;
                analytics.Accuracy = body.location.coords.accuracy;
            }

            try
            {
                var remoteIp = HttpContext.Connection.RemoteIpAddress;
                if (remoteIp is not null)
                {
                    analytics.IpAddress = remoteIp;
                }
            }
            catch { }

            await _db.Analytics.AddAsync(analytics, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            return OkEnvelope(new { message = "Recorded" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording link click");
            return Problem(StatusCodes.Status500InternalServerError, "Internal Server Error", "Could not record click");
        }
    }

    /// <summary>
    /// Returns analytics counts grouped by the authenticated user's links.
    /// Only the owner may call this endpoint.
    /// </summary>
    [HttpGet("my/links")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyLinkCounts(CancellationToken cancellationToken = default)
    {
        if (!IsAuthenticated || !Guid.TryParse(UserId, out var uid)) return UnauthorizedProblem();

        var query = from a in _db.Analytics
                    join l in _db.Links on a.LinkId equals l.Id
                    where l.UserId == uid
                    group a by a.LinkId into g
                    select new { linkId = g.Key, clicks = g.LongCount() };

        var results = await query.ToListAsync(cancellationToken);
        return OkEnvelope(results);
    }

    /// <summary>
    /// Returns recent analytics events for a specific link owned by the authenticated user.
    /// </summary>
    [HttpGet("my/link/{linkId:guid}/events")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyLinkEvents([FromRoute] Guid linkId, CancellationToken cancellationToken = default)
    {
        if (!IsAuthenticated || !Guid.TryParse(UserId, out var uid)) return UnauthorizedProblem();

        // Verify ownership
        var link = await _db.Links.FindAsync(new object[] { linkId }, cancellationToken);
        if (link is null || link.UserId != uid) return ForbiddenProblem("You do not own this link");

        var events = await _db.Analytics
            .Where(a => a.LinkId == linkId)
            .OrderByDescending(a => a.At)
            .Take(100)
            .Select(a => new { a.Id, a.At, a.Fingerprint, a.Latitude, a.Longitude, a.Accuracy, a.UserAgent })
            .ToListAsync(cancellationToken);

        return OkEnvelope(events);
    }

    /// <summary>
    /// Returns summary metrics (total clicks and average clicks per day) for the authenticated user's links in a date range.
    /// </summary>
    [HttpGet("my/summary")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMySummary([FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to, CancellationToken cancellationToken = default)
    {
        if (!IsAuthenticated || !Guid.TryParse(UserId, out var uid)) return UnauthorizedProblem();

    // Default to last 30 days if not provided
    var toVal = to ?? DateTimeOffset.UtcNow;
    var fromVal = from ?? toVal.AddDays(-29);

    // Normalize to date boundaries (inclusive) using the calendar date components.
    // Treat the selected calendar dates as UTC-day boundaries so selecting the same day includes that day.
    var startDateUtc = new DateTime(fromVal.Year, fromVal.Month, fromVal.Day, 0, 0, 0, DateTimeKind.Utc);
    var endDateUtc = new DateTime(toVal.Year, toVal.Month, toVal.Day, 23, 59, 59, DateTimeKind.Utc).AddMilliseconds(999);

    var start = new DateTimeOffset(startDateUtc, TimeSpan.Zero);
    var end = new DateTimeOffset(endDateUtc, TimeSpan.Zero);

    // Count analytics for links owned by this user in the date window
    var query = from a in _db.Analytics
            join l in _db.Links on a.LinkId equals l.Id
            where l.UserId == uid && a.At >= start && a.At <= end
            select a;

        var totalClicks = await query.LongCountAsync(cancellationToken);

        var days = (toVal.Date - fromVal.Date).TotalDays + 1;
        var averagePerDay = days > 0 ? (double)totalClicks / days : 0.0;

        var result = new
        {
            totalClicks,
            averagePerDay,
            days = (int)days,
            from = start,
            to = toVal
        };

        return OkEnvelope(result);
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

    /// <summary>
    /// Returns counts of clicks grouped by device type (Desktop, Mobile, Tablet, Other)
    /// for the authenticated user's links.
    /// </summary>
    [HttpGet("my/devices")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDevices(CancellationToken cancellationToken = default)
    {
        if (!IsAuthenticated || !Guid.TryParse(UserId, out var uid)) return UnauthorizedProblem();

        // Query analytics for links owned by this user
        var query = from a in _db.Analytics
                    join l in _db.Links on a.LinkId equals l.Id
                    where l.UserId == uid
                    select a.UserAgent;

        var userAgents = await query.ToListAsync(cancellationToken);

        // Simple heuristics to classify user agents into device categories.
        int mobile = 0, tablet = 0, desktop = 0, other = 0;

        foreach (var ua in userAgents)
        {
            if (string.IsNullOrWhiteSpace(ua))
            {
                other++;
                continue;
            }

            var lower = ua.ToLowerInvariant();

            // Tablet detection
            if (lower.Contains("ipad") || (lower.Contains("android") && lower.Contains("tablet")) || lower.Contains("tablet"))
            {
                tablet++;
                continue;
            }

            // Mobile detection
            if (lower.Contains("mobi") || lower.Contains("iphone") || lower.Contains("android") && !lower.Contains("tablet") || lower.Contains("phone"))
            {
                mobile++;
                continue;
            }

            // Desktop detection
            if (lower.Contains("windows") || lower.Contains("macintosh") || lower.Contains("linux") || lower.Contains("x11") || lower.Contains("cros"))
            {
                desktop++;
                continue;
            }

            other++;
        }

        var result = new
        {
            desktop,
            mobile,
            tablet,
            other,
            total = desktop + mobile + tablet + other,
            retrievedAt = DateTimeOffset.UtcNow
        };

        return OkEnvelope(result);
    }
}
