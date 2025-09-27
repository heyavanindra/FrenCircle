using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace FrenCircle.Contracts.Interfaces
{
    public interface IUserRepository
    {
        Task<int> GetUserCountAsync(CancellationToken cancellationToken = default);
    }
}
