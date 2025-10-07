﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Linkyard.Contracts.Responses
{
    public record GoogleUserInfo(
       string Id,
       string Email,
       bool VerifiedEmail,
       string Name,
       string GivenName,
       string FamilyName,
       string Picture,
       string Locale
   );
}
