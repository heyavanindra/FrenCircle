using FrenCircle.Api.Data;
using FrenCircle.Contracts.Requests;
using FrenCircle.Contracts.Responses;
using FrenCircle.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FrenCircle.Contracts;

namespace FrenCircle.Api.Controllers;

[Route("link")]
[ApiController]
[Authorize]
public class LinksController : BaseApiController
{
    private readonly FrenCircleDbContext _context;
    private readonly ILogger<LinksController> _logger;

    public LinksController(ILogger<LinksController> logger, FrenCircleDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Get links grouped by their group. Ungrouped links are returned in the Ungrouped field.
    /// </summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(ApiResponse<LinksGroupedResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLinks(CancellationToken cancellationToken = default)
    {
        try
        {
            if (!Guid.TryParse(UserId, out var userId))
                return UnauthorizedProblem("Invalid user context");

            // Load groups owned by this user and their links
            var groups = await _context.LinkGroups
                .AsNoTracking()
                .Where(g => g.UserId == userId)
                .OrderBy(g => g.Sequence)
                .ToListAsync(cancellationToken);

            var links = await _context.Links
                .AsNoTracking()
                .Where(l => l.UserId == userId)
                .OrderBy(l => l.Sequence)
                .ToListAsync(cancellationToken);

            // Map grouped
            var groupResponses = groups.Select(g => new LinkGroupResponse(
                Id: g.Id,
                Name: g.Name,
                Description: g.Description,
                Sequence: g.Sequence,
                IsActive: g.IsActive,
                Links: links.Where(l => l.GroupId == g.Id).Select(l => new LinkSummary(
                    Id: l.Id,
                    Name: l.Name,
                    Url: l.Url,
                    Description: l.Description,
                    IsActive: l.IsActive,
                    Sequence: l.Sequence,
                    GroupId: l.GroupId,
                    CreatedAt: l.CreatedAt,
                    UpdatedAt: l.UpdatedAt
                )).ToList()
            )).ToList();

            // Ungrouped links
            var ungrouped = new LinkGroupResponse(
                Id: Guid.Empty,
                Name: "Ungrouped",
                Description: null,
                Sequence: 0,
                IsActive: true,
                Links: links.Where(l => l.GroupId == null).Select(l => new LinkSummary(
                    Id: l.Id,
                    Name: l.Name,
                    Url: l.Url,
                    Description: l.Description,
                    IsActive: l.IsActive,
                    Sequence: l.Sequence,
                    GroupId: l.GroupId,
                    CreatedAt: l.CreatedAt,
                    UpdatedAt: l.UpdatedAt
                )).ToList()
            );

            var response = new LinksGroupedResponse(Groups: groupResponses, Ungrouped: ungrouped);

            return OkEnvelope(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting links for user {UserId}", UserId);
            return Problem(StatusCodes.Status500InternalServerError, "Internal Server Error", "An error occurred while retrieving links");
        }
    }

    /// <summary>
    /// Create a new link
    /// </summary>
    [HttpPost("")]
    [ProducesResponseType(typeof(ApiResponse<LinkSummary>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateLink([FromBody] CreateLinkRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating link for user {UserId} with CorrelationId {CorrelationId}", UserId, CorrelationId);

        try
        {
            if (!Guid.TryParse(UserId, out var userId))
                return UnauthorizedProblem("Invalid user context");

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Url))
                return BadRequestProblem("Name and Url are required");

            // Optional: validate URL format
            if (!Uri.IsWellFormedUriString(request.Url, UriKind.Absolute))
                return BadRequestProblem("Url is not a valid absolute URL");

            // If GroupId provided, ensure group exists and is owned by the user
            if (request.GroupId.HasValue)
            {
                var group = await _context.LinkGroups.FirstOrDefaultAsync(g => g.Id == request.GroupId.Value, cancellationToken);
                if (group == null || group.UserId != userId)
                    return BadRequestProblem("Specified group does not exist or does not belong to you");
            }

            var now = DateTimeOffset.UtcNow;
            var link = new Link
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                Url = request.Url.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                UserId = userId,
                GroupId = request.GroupId,
                Sequence = request.Sequence ?? 0,
                IsActive = request.IsActive ?? true,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.Links.Add(link);
            await _context.SaveChangesAsync(cancellationToken);

            var summary = new LinkSummary(
                Id: link.Id,
                Name: link.Name,
                Url: link.Url,
                Description: link.Description,
                IsActive: link.IsActive,
                Sequence: link.Sequence,
                GroupId: link.GroupId,
                CreatedAt: link.CreatedAt,
                UpdatedAt: link.UpdatedAt
            );

            return OkEnvelope(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating link for user {UserId}", UserId);
            return Problem(StatusCodes.Status500InternalServerError, "Internal Server Error", "An error occurred while creating the link");
        }
    }

    /// <summary>
    /// Edit a link by id (only owner or admin). POST-based edit to follow GET/POST-only policy.
    /// </summary>
    [HttpPost("{id:guid}/edit")]
    [ProducesResponseType(typeof(ApiResponse<LinkSummary>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EditLink(Guid id, [FromBody] CreateLinkRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Editing link {LinkId} by user {UserId}", id, UserId);

        try
        {
            if (!Guid.TryParse(UserId, out var userId))
                return UnauthorizedProblem("Invalid user context");

            var link = await _context.Links.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
            if (link == null) return NotFoundProblem("Link not found");

            var isOwner = link.UserId == userId;
            var isAdmin = User.IsInRole("admin");
            if (!isOwner && !isAdmin) return ForbiddenProblem("You do not have permission to edit this link");

            if (!string.IsNullOrWhiteSpace(request.Name)) link.Name = request.Name.Trim();
            if (!string.IsNullOrWhiteSpace(request.Url))
            {
                if (!Uri.IsWellFormedUriString(request.Url, UriKind.Absolute))
                    return BadRequestProblem("Url is not a valid absolute URL");
                link.Url = request.Url.Trim();
            }

            if (request.Description != null) link.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

            // If GroupId provided, ensure group exists and belongs to user (unless admin)
            if (request.GroupId.HasValue)
            {
                var group = await _context.LinkGroups.FirstOrDefaultAsync(g => g.Id == request.GroupId.Value, cancellationToken);
                if (group == null || (group.UserId != userId && !isAdmin))
                    return BadRequestProblem("Specified group does not exist or does not belong to you");

                link.GroupId = request.GroupId;
            }

            if (request.Sequence.HasValue) link.Sequence = request.Sequence.Value;

            if (request.IsActive.HasValue) link.IsActive = request.IsActive.Value;
            link.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var summary = new LinkSummary(
                Id: link.Id,
                Name: link.Name,
                Url: link.Url,
                Description: link.Description,
                IsActive: link.IsActive,
                Sequence: link.Sequence,
                GroupId: link.GroupId,
                CreatedAt: link.CreatedAt,
                UpdatedAt: link.UpdatedAt
            );

            return OkEnvelope(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error editing link {LinkId} by user {UserId}", id, UserId);
            return Problem(StatusCodes.Status500InternalServerError, "Internal Server Error", "An error occurred while editing the link");
        }
    }

    /// <summary>
    /// Delete a link by id (only owner or admin) - POST-based delete to follow GET/POST-only policy
    /// </summary>
    [HttpPost("{id:guid}/delete")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLink(Guid id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting link {LinkId} by user {UserId}", id, UserId);

        try
        {
            if (!Guid.TryParse(UserId, out var userId))
                return UnauthorizedProblem("Invalid user context");

            var link = await _context.Links.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
            if (link == null)
                return NotFoundProblem("Link not found");

            // Allow deletion if owner or admin
            var isOwner = link.UserId == userId;
            var isAdmin = User.IsInRole("admin");

            if (!isOwner && !isAdmin)
                return ForbiddenProblem("You do not have permission to delete this link");

            _context.Links.Remove(link);
            await _context.SaveChangesAsync(cancellationToken);

            return OkEnvelope(new { Message = "Link deleted" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting link {LinkId} by user {UserId}", id, UserId);
            return Problem(StatusCodes.Status500InternalServerError, "Internal Server Error", "An error occurred while deleting the link");
        }
    }
}
