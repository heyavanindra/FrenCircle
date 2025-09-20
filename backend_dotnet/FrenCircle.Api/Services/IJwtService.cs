using FrenCircle.Entities;
using System.Security.Claims;

namespace FrenCircle.Api.Services;

public interface IJwtService
{
    string GenerateToken(User user);
    ClaimsPrincipal? ValidateToken(string token);
    int GetUserIdFromToken(string token);
}