using FrenCircle.Api.Data;
using FrenCircle.Contracts.Requests;
using FrenCircle.Contracts.Responses;
using FrenCircle.Contracts;
using FrenCircle.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FrenCircle.Api.Controllers;

[Route("group")]
[ApiController]
public sealed class GroupsController : BaseApiController
{
    private readonly FrenCircleDbContext _context;
    private readonly ILogger<GroupsController> _logger;

    public GroupsController(ILogger<GroupsController> logger, FrenCircleDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    [HttpGet("")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<LinkGroupResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGroups(CancellationToken cancellationToken = default)
    {
        try
        {
            if (!Guid.TryParse(UserId, out var userId))
                return UnauthorizedProblem("Invalid user context");

            var groups = await _context.LinkGroups
                .AsNoTracking()
                .Where(g => g.UserId == userId)
                .OrderBy(g => g.Sequence)
                .Select(g => new LinkGroupResponse(
                    g.Id,
                    g.Name,
                    g.Description,
                    g.Sequence,
                    g.IsActive,
                    new List<LinkSummary>()
                ))
                .ToListAsync(cancellationToken);

            return OkEnvelope(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting groups");
            return Problem(StatusCodes.Status500InternalServerError, "Internal Server Error", "An error occurred while retrieving groups");
        }
    }

    [HttpPost("")]
    [ProducesResponseType(typeof(ApiResponse<LinkGroupResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating link group with CorrelationId {CorrelationId}", CorrelationId);
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequestProblem("Name is required");

            var now = DateTimeOffset.UtcNow;
            var group = new LinkGroup
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                Sequence = request.Sequence ?? 0,
                IsActive = request.IsActive ?? true,
                UserId = Guid.TryParse(UserId, out var uid) ? uid : (Guid?)null,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.LinkGroups.Add(group);
            await _context.SaveChangesAsync(cancellationToken);

            var resp = new LinkGroupResponse(group.Id, group.Name, group.Description, group.Sequence, group.IsActive, new List<LinkSummary>());
            return OkEnvelope(resp);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating group");
            return Problem(StatusCodes.Status500InternalServerError, "Internal Server Error", "An error occurred while creating the group");
        }
    }

    [HttpPost("{id:guid}/edit")]
    [ProducesResponseType(typeof(ApiResponse<LinkGroupResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> EditGroup(Guid id, [FromBody] UpdateGroupRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Editing group {GroupId} with CorrelationId {CorrelationId}", id, CorrelationId);
        try
        {
            if (!Guid.TryParse(UserId, out var userId))
                return UnauthorizedProblem("Invalid user context");

            var group = await _context.LinkGroups.FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
            if (group == null) return NotFoundProblem("Group not found");

            var isOwner = group.UserId == userId;
            var isAdmin = User.IsInRole("admin");
            if (!isOwner && !isAdmin) return ForbiddenProblem("You do not have permission to edit this group");

            if (request.Name != null) group.Name = string.IsNullOrWhiteSpace(request.Name) ? group.Name : request.Name.Trim();
            if (request.Description != null) group.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
            if (request.Sequence.HasValue) group.Sequence = request.Sequence.Value;
            if (request.IsActive.HasValue) group.IsActive = request.IsActive.Value;

            group.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            var resp = new LinkGroupResponse(group.Id, group.Name, group.Description, group.Sequence, group.IsActive, new List<LinkSummary>());
            return OkEnvelope(resp);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error editing group {GroupId}", id);
            return Problem(StatusCodes.Status500InternalServerError, "Internal Server Error", "An error occurred while editing the group");
        }
    }

    [HttpPost("{id:guid}/delete")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteGroup(Guid id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting group {GroupId} with CorrelationId {CorrelationId}", id, CorrelationId);
        try
        {
            if (!Guid.TryParse(UserId, out var userId))
                return UnauthorizedProblem("Invalid user context");

            var group = await _context.LinkGroups.FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
            if (group == null) return NotFoundProblem("Group not found");

            var isOwner = group.UserId == userId;
            var isAdmin = User.IsInRole("admin");
            if (!isOwner && !isAdmin) return ForbiddenProblem("You do not have permission to delete this group");

            // Option: decide whether to delete associated links or set their GroupId to null. We'll set GroupId to null.
            var links = await _context.Links.Where(l => l.GroupId == id).ToListAsync(cancellationToken);
            foreach (var l in links) l.GroupId = null;

            _context.LinkGroups.Remove(group);
            await _context.SaveChangesAsync(cancellationToken);

            return OkEnvelope(new { Message = "Group deleted" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting group {GroupId}", id);
            return Problem(StatusCodes.Status500InternalServerError, "Internal Server Error", "An error occurred while deleting the group");
        }
    }
}
