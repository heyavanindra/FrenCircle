using System;
using System.Net;

namespace Linkyard.Contracts.Requests;

public record RecordLinkClickRequest(
    Guid Id,
    Guid LinkId,
    Guid? UserId,
    string? Fingerprint,
    double? Latitude,
    double? Longitude,
    double? Accuracy,
    string? UserAgent,
    IPAddress? IpAddress,
    DateTimeOffset At);
