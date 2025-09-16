using FrenCircle.Contracts;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Microsoft.Net.Http.Headers;
using System.Security.Claims;

namespace FrenCircle.Api.Controllers;

[ApiController]
[Produces("application/json")]
[ApiExplorerSettings(IgnoreApi = true)] // hide in Swagger
public abstract class BaseApiController : ControllerBase
{
    // Standard header names you can reuse
    public const string HeaderRequestId = "X-Request-Id";
    public const string HeaderCorrelationId = "X-Correlation-Id";

    // -------- Context helpers --------
    protected string? RequestId =>
        HttpContext.Items[nameof(RequestId)] as string
        ?? TryGetHeader(HeaderRequestId);

    protected string? CorrelationId =>
        HttpContext.Items[nameof(CorrelationId)] as string
        ?? TryGetHeader(HeaderCorrelationId);

    protected string? BearerToken =>
        Request.Headers.TryGetValue(HeaderNames.Authorization, out var auth) && auth.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? auth.ToString()["Bearer ".Length..]
            : null;

    protected string? UserId =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("oid")?.Value; // Entra ID object id fallback

    protected string? TenantId =>
        User.FindFirst("tid")?.Value
        ?? User.FindFirst("tenant_id")?.Value;

    protected bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    // -------- ProblemDetails helpers (RFC 7807) --------
    protected IActionResult NotFoundProblem(string title = "Resource not found", string? detail = null)
        => Problem(statusCode: StatusCodes.Status404NotFound, title: title, detail: detail);

    protected IActionResult BadRequestProblem(string title = "Bad request", string? detail = null)
        => Problem(statusCode: StatusCodes.Status400BadRequest, title: title, detail: detail);

    protected IActionResult ConflictProblem(string title = "Conflict", string? detail = null)
        => Problem(statusCode: StatusCodes.Status409Conflict, title: title, detail: detail);

    protected IActionResult ForbiddenProblem(string title = "Forbidden", string? detail = null)
        => Problem(statusCode: StatusCodes.Status403Forbidden, title: title, detail: detail);

    protected IActionResult UnauthorizedProblem(string title = "Unauthorized", string? detail = null)
        => Problem(statusCode: StatusCodes.Status401Unauthorized, title: title, detail: detail);

    // Overload exposing instance/type if you want richer ProblemDetails
    protected IActionResult Problem(
        int statusCode,
        string title,
        string? detail = null,
        string? type = "about:blank",
        string? instance = null,
        IDictionary<string, object?>? extensions = null)
    {
        var pd = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Type = type,
            Instance = instance ?? HttpContext.Request.Path
        };

        if (extensions is not null)
        {
            foreach (var kvp in extensions)
                pd.Extensions[kvp.Key] = kvp.Value;
        }

        // Always echo correlation/request ids if present
        if (!string.IsNullOrWhiteSpace(RequestId)) pd.Extensions[nameof(RequestId)] = RequestId;
        if (!string.IsNullOrWhiteSpace(CorrelationId)) pd.Extensions[nameof(CorrelationId)] = CorrelationId;

        return new ObjectResult(pd) { StatusCode = statusCode, ContentTypes = { "application/problem+json" } };
    }

    // -------- Optional success envelope helpers --------
    // Use these if you prefer explicit wrapping from controllers.
    // If you later add a global ResultFilter to auto-wrap 2xx, keep these for special cases.

    protected IActionResult OkEnvelope<T>(T data, object? meta = null)
        => Ok(new ApiResponse<T>(data, meta));

    protected IActionResult CreatedEnvelope<T>(string routeName, object routeValues, T data, object? meta = null)
        => CreatedAtRoute(routeName, routeValues, new ApiResponse<T>(data, meta));

    protected IActionResult PagedOk<T>(IReadOnlyCollection<T> items, int page, int pageSize, long total)
        => Ok(new ApiResponse<IReadOnlyCollection<T>>(items, new PagedMeta(page, pageSize, total)));

    // -------- Utilities --------
    private string? TryGetHeader(string name)
        => Request.Headers.TryGetValue(name, out StringValues v) && !StringValues.IsNullOrEmpty(v) ? v.ToString() : null;
}