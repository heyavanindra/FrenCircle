using System.Threading;
using System.Threading.Tasks;
using Linkyard.Contracts.Responses;

namespace Linkyard.Contracts.Interfaces;

public interface IUserRepository
{
    Task<int> GetUserCountAsync(CancellationToken cancellationToken = default);
    Task<UserPublicResponse?> GetPublicByUsernameAsync(string username, CancellationToken cancellationToken = default);
}
