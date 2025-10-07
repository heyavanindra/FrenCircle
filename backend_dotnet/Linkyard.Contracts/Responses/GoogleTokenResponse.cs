using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Linkyard.Contracts.Responses
{
    public record GoogleTokenResponse(
         string AccessToken,
         string RefreshToken,
         int ExpiresIn,
         string TokenType
     );
}
