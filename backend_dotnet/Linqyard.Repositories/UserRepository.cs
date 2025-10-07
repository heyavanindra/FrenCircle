﻿using System;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using Linqyard.Contracts.Interfaces;
using Linqyard.Contracts.Responses;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using NpgsqlTypes;

namespace Linkyard.Repositories;

public class UserRepository : IUserRepository
{
    private const string DefaultConnectionName = "DefaultConnection";

    private readonly ILogger<UserRepository> _logger;
    private readonly IConfiguration _configuration;

    public UserRepository(ILogger<UserRepository> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<int> GetUserCountAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting user count from database");

        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync(cancellationToken);

        const string query = @"
                SELECT COUNT(*)
                FROM public.""Users""
                WHERE ""DeletedAt"" IS NULL";

        await using var command = new NpgsqlCommand(query, connection);
        var result = await command.ExecuteScalarAsync(cancellationToken);

        var userCount = Convert.ToInt32(result);
        _logger.LogInformation("Retrieved user count from database: {UserCount}", userCount);

        return userCount;
    }

    public async Task<UserPublicResponse?> GetPublicByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        var normalized = (username ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(normalized))
        {
            return null;
        }

        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync(cancellationToken);

        const string query = @"
            SELECT ""Id"", ""Username"", ""FirstName"", ""LastName"", ""AvatarUrl"", ""CoverUrl""
            FROM public.""Users""
            WHERE LOWER(""Username"") = LOWER(@username)
              AND ""DeletedAt"" IS NULL
            LIMIT 1;";

        await using var command = new NpgsqlCommand(query, connection);
        command.Parameters.AddWithValue("username", NpgsqlDbType.Text, normalized);

        await using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow, cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new UserPublicResponse(
            reader.GetGuid(0),
            reader.GetString(1),
            reader.IsDBNull(2) ? null : reader.GetString(2),
            reader.IsDBNull(3) ? null : reader.GetString(3),
            reader.IsDBNull(4) ? null : reader.GetString(4),
            reader.IsDBNull(5) ? null : reader.GetString(5)
        );
    }

    private string GetConnectionString()
    {
        var connectionString = _configuration.GetConnectionString(DefaultConnectionName);
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        const string message = "Database connection string not configured";
        _logger.LogError(message);
        throw new InvalidOperationException(message);
    }
}

