# FrenCircle API - Authen## 3. User Login (with Email)
curl -X POST "{{dotnet}}/auth/login" \
  -H "Content-Type: applicati### Step 3: Login after verification (with email)
LOGIN_RESPONSE=$(curl -s -X POST "{{dotnet}}/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: flow-login-$(date +%s)" \
  -d '{
    "emailOrUsername": "testuser@example.com",
    "password": "TestPassword123!",
    "deviceName": "Test Device",
    "deviceType": "API Client",
    "rememberMe": false
  }')

### Step 3b: Login with username
LOGIN_RESPONSE=$(curl -s -X POST "{{dotnet}}/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: flow-login-$(date +%s)" \
  -d '{
    "emailOrUsername": "testuser",
    "password": "TestPassword123!",
    "deviceName": "Test Device",
    "deviceType": "API Client",
    "rememberMe": false
  }')
  -H "X-Correlation-Id: login-$(date +%s)" \
  -d '{
    "emailOrUsername": "john.doe@example.com",
    "password": "SecurePass123!",
    "deviceName": "My Laptop",
    "deviceType": "Desktop",
    "rememberMe": false
  }'

## 3b. User Login (with Username)
curl -X POST "{{dotnet}}/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: login-$(date +%s)" \
  -d '{
    "emailOrUsername": "johndoe",
    "password": "SecurePass123!",
    "deviceName": "My Laptop",
    "deviceType": "Desktop",
    "rememberMe": false
  }'dpoints
# Set your host variable: dotnet=http://localhost:5000 or dotnet=https://localhost:5001

## 1. User Registration
curl -X POST "{{dotnet}}/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: reg-$(date +%s)" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  }'

## 2. Email Verification
# Note: Replace the token with the actual verification token (normally sent via email)
curl -X POST "{{dotnet}}/auth/verify-email" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: verify-$(date +%s)" \
  -d '{
    "email": "john.doe@example.com",
    "token": "ABC12345"
  }'

## 3. User Login
curl -X POST "{{dotnet}}/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: login-$(date +%s)" \
  -d '{
    "emailOrUsername": "john.doe@example.com",
    "password": "SecurePass123!",
    "deviceName": "My Laptop",
    "deviceType": "Desktop",
    "rememberMe": false
  }'

# Alternative: Login with username instead of email
curl -X POST "{{dotnet}}/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: login-username-$(date +%s)" \
  -d '{
    "emailOrUsername": "johndoe",
    "password": "SecurePass123!",
    "deviceName": "My Laptop",
    "deviceType": "Desktop",
    "rememberMe": false
  }'

## 4. Refresh Access Token
# Note: Replace REFRESH_TOKEN with actual refresh token from login response
curl -X POST "{{dotnet}}/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: refresh-$(date +%s)" \
  -d '{
    "refreshToken": "REFRESH_TOKEN_HERE"
  }'

## 5. User Logout
# Note: Replace REFRESH_TOKEN with actual refresh token
curl -X POST "{{dotnet}}/auth/logout" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: logout-$(date +%s)" \
  -d '{
    "refreshToken": "REFRESH_TOKEN_HERE"
  }'

## 6. Home/Health Endpoints
# Root endpoint - Server info
curl -X GET "{{dotnet}}/" \
  -H "X-Correlation-Id: info-$(date +%s)"

# Health check
curl -X GET "{{dotnet}}/health" \
  -H "X-Correlation-Id: health-$(date +%s)"

## Example Complete Flow:

### Step 1: Register new user
REGISTRATION_RESPONSE=$(curl -s -X POST "{{dotnet}}/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: flow-reg-$(date +%s)" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "Registration Response:"
echo $REGISTRATION_RESPONSE | jq .

### Step 2: Verify email (normally you'd get token from email)
# For testing, you'd need to check the database or logs for the actual verification token
curl -X POST "{{dotnet}}/auth/verify-email" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: flow-verify-$(date +%s)" \
  -d '{
    "email": "testuser@example.com",
    "token": "TOKEN_FROM_DATABASE_OR_EMAIL"
  }'

### Step 3: Login after verification
LOGIN_RESPONSE=$(curl -s -X POST "{{dotnet}}/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: flow-login-$(date +%s)" \
  -d '{
    "emailOrUsername": "testuser@example.com",
    "password": "TestPassword123!",
    "deviceName": "Test Device",
    "deviceType": "API Client",
    "rememberMe": false
  }')

echo "Login Response:"
echo $LOGIN_RESPONSE | jq .

# Extract tokens
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.refreshToken')

### Step 4: Use refresh token
REFRESH_RESPONSE=$(curl -s -X POST "{{dotnet}}/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: flow-refresh-$(date +%s)" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "Refresh Response:"
echo $REFRESH_RESPONSE | jq .

### Step 5: Logout
LOGOUT_RESPONSE=$(curl -s -X POST "{{dotnet}}/auth/logout" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: flow-logout-$(date +%s)" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "Logout Response:"
echo $LOGOUT_RESPONSE | jq .

## Testing Error Cases:

### Try login with unverified email
curl -X POST "{{dotnet}}/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: error-unverified-$(date +%s)" \
  -d '{
    "emailOrUsername": "unverified@example.com",
    "password": "password123"
  }'

### Try login with wrong password (using email)
curl -X POST "{{dotnet}}/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: error-wrongpass-$(date +%s)" \
  -d '{
    "emailOrUsername": "testuser@example.com",
    "password": "wrongpassword"
  }'

### Try login with username and wrong password
curl -X POST "{{dotnet}}/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: error-wrongpass-username-$(date +%s)" \
  -d '{
    "emailOrUsername": "testuser",
    "password": "wrongpassword"
  }'

### Try registration with invalid username
curl -X POST "{{dotnet}}/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: error-invalidusername-$(date +%s)" \
  -d '{
    "email": "newuser@example.com",
    "password": "ValidPassword123!",
    "username": "ab"
  }'

### Try duplicate registration
curl -X POST "{{dotnet}}/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: error-duplicate-$(date +%s)" \
  -d '{
    "email": "testuser@example.com",
    "password": "AnotherPassword123!",
    "username": "testuser2"
  }'

### Try invalid refresh token
curl -X POST "{{dotnet}}/auth/refresh" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: error-invalidtoken-$(date +%s)" \
  -d '{
    "refreshToken": "invalid_token_here"
  }'

## PowerShell Variables (for Windows):
# $dotnet = "http://localhost:5000"
# $dotnet = "https://localhost:5001"

## Bash Variables (for Linux/Mac):
# export dotnet="http://localhost:5000"
# export dotnet="https://localhost:5001"

## Usage with variables:
# Replace {{dotnet}} with $dotnet in the commands above
# Example: curl -X POST "$dotnet/auth/register" ...