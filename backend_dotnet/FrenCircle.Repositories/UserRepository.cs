using System.Data;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using FrenCircle.Contracts.Interfaces;

namespace FrenCircle.Repositories
{
    public class UserRepository : IUserRepository
    {
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

            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            
            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogError("Connection string not found");
                throw new InvalidOperationException("Database connection string not configured");
            }

            using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);

            const string query = @"
                SELECT COUNT(*) 
                FROM public.""Users""
                WHERE ""DeletedAt"" IS NULL";

            using var command = new NpgsqlCommand(query, connection);
            var result = await command.ExecuteScalarAsync(cancellationToken);

            var userCount = Convert.ToInt32(result);
            _logger.LogInformation("Retrieved user count from database: {UserCount}", userCount);
            
            return userCount;
        }
    }
}
