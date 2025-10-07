using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Linkyard.Contracts.Requests;
using Linkyard.Contracts.Responses;

namespace Linkyard.Contracts.Interfaces;

public interface IAnalyticsRepository
{
    Task RecordLinkClickAsync(RecordLinkClickRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LinkClickCountResponse>> GetLinkClickCountsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AnalyticsEventResponse>?> GetLinkEventsForUserAsync(Guid userId, Guid linkId, int take, CancellationToken cancellationToken = default);
    Task<long> GetClickCountAsync(Guid userId, DateTimeOffset fromInclusive, DateTimeOffset toInclusive, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<string?>> GetUserAgentsForUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
