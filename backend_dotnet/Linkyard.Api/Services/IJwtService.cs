using Linkyard.Entities;
using System.Security.Claims;

namespace Linkyard.Api.Services;

public interface IJwtService
{
    string GenerateToken(User user, Guid? sessionId = null);
    ClaimsPrincipal? ValidateToken(string token);
    int GetUserIdFromToken(string token);
}