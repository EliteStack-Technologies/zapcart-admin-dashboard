# Zoho Books OAuth 2.0 Integration - Complete Guide

## Overview

This implementation provides a complete OAuth 2.0 authentication flow for Zoho Books integration, replacing the previous manual credential entry system with a secure, user-friendly OAuth flow.

## Architecture

### Component Structure

```
ZohoBooksIntegration (Main Page)
├── OAuthConnectionDialog (OAuth Setup)
├── OrganizationSelector (Org Selection)
└── ZohoCallback (OAuth Callback Handler)
```

### Data Flow

```
1. User clicks "Connect Zoho Books"
   ↓
2. OAuthConnectionDialog opens
   - User enters Client ID, Client Secret
   - Auto-fills Redirect URI
   ↓
3. Generate Auth URL (POST /api/v1/zoho/auth-url)
   - Save credentials to sessionStorage
   - Redirect to Zoho authorization page
   ↓
4. User authorizes on Zoho
   ↓
5. Zoho redirects to /zoho/callback?code=XXX
   ↓
6. ZohoCallback component
   - Extract code from URL
   - Retrieve credentials from sessionStorage
   - Exchange code for tokens (POST /api/v1/zoho/exchange-code)
   - Clear sessionStorage
   - Redirect to organization selection
   ↓
7. OrganizationSelector opens
   - Fetch organizations (POST /api/v1/zoho/test-connection)
   - User selects organization
   - Save config (PATCH /api/v1/zoho/config)
   - Enable auto-sync
   ↓
8. Integration Complete
   - Display sync dashboard
   - Show statistics and order sync status
```

## Files Created/Modified

### New Files

1. **`src/pages/ZohoCallback.tsx`**
   - OAuth callback handler
   - Processes authorization code
   - Exchanges code for tokens
   - Handles errors and redirects

2. **`src/components/OAuthConnectionDialog.tsx`**
   - OAuth setup dialog
   - Client ID and Client Secret input
   - Form validation with Zod
   - Generates auth URL and redirects

3. **`src/components/OrganizationSelector.tsx`**
   - Organization selection dialog
   - Displays available Zoho Books organizations
   - Saves selected organization
   - Enables auto-sync

### Modified Files

1. **`src/services/zoho.ts`**
   - Replaced manual config methods with OAuth methods
   - Added: `getZohoConfig()`, `generateAuthUrl()`, `exchangeCode()`
   - Added: `testConnection()`, `updateZohoConfig()`, `disconnectZoho()`
   - Added: `syncAllOrders()` for bulk sync

2. **`src/pages/ZohoBooksIntegration.tsx`**
   - Complete rewrite with OAuth flow
   - Status-based UI (Not Connected, Connected, Token Expired)
   - Organization display
   - Sync dashboard with statistics
   - Order sync table with retry functionality

3. **`src/App.tsx`**
   - Added `ZohoCallback` import
   - Added route: `/zoho/callback`

## API Endpoints Required

### OAuth Flow Endpoints

#### 1. Get Configuration Status
```http
GET /api/v1/zoho/config
Authorization: Bearer <token>
```

**Response:**
```json
{
  "zoho_enabled": true,
  "zoho_organization_id": "60012345678",
  "zoho_organization_name": "My Company Ltd.",
  "has_credentials": true,
  "token_valid": true,
  "token_expiry": "2026-02-15T10:30:00Z"
}
```

#### 2. Generate OAuth URL
```http
POST /api/v1/zoho/auth-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "client_id": "1000.XXXXX.XXXXX",
  "redirect_uri": "https://yourdomain.com/zoho/callback"
}
```

**Response:**
```json
{
  "auth_url": "https://accounts.zoho.com/oauth/v2/auth?scope=ZohoBooks.fullaccess.all&client_id=1000.XXXXX.XXXXX&response_type=code&redirect_uri=https://yourdomain.com/zoho/callback&access_type=offline"
}
```

#### 3. Exchange Code for Tokens
```http
POST /api/v1/zoho/exchange-code
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "1000.xxxxx.xxxxx",
  "client_id": "1000.XXXXX.XXXXX",
  "client_secret": "secret_value",
  "redirect_uri": "https://yourdomain.com/zoho/callback"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tokens saved successfully"
}
```

**Backend Actions:**
- Exchange code with Zoho OAuth API
- Save access_token, refresh_token, token_expiry to database
- Save client_id and client_secret (encrypted)

#### 4. Test Connection & Get Organizations
```http
POST /api/v1/zoho/test-connection
Authorization: Bearer <token>
```

**Response:**
```json
{
  "organizations": [
    {
      "organization_id": "60012345678",
      "name": "My Company Ltd.",
      "currency_code": "INR",
      "currency_symbol": "₹"
    }
  ]
}
```

#### 5. Update Configuration
```http
PATCH /api/v1/zoho/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "zoho_organization_id": "60012345678",
  "zoho_enabled": true
}
```

**Response:**
```json
{
  "zoho_enabled": true,
  "zoho_organization_id": "60012345678",
  "zoho_organization_name": "My Company Ltd.",
  "has_credentials": true,
  "token_valid": true,
  "token_expiry": "2026-02-15T10:30:00Z"
}
```

### Sync Endpoints

#### 6. Get Sync Statistics
```http
GET /api/v1/orders/zoho/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 150,
  "synced": 120,
  "failed": 15,
  "pending": 15
}
```

#### 7. Get Orders with Sync Status
```http
GET /api/v1/orders?page=1&limit=20&zoho_sync_status=failed
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "orders": [
    {
      "_id": "order123",
      "order_number": "ORD-101",
      "customer_name": "John Doe",
      "customer_phone": "+1234567890",
      "total_amount": 150.00,
      "createdAt": "2026-01-31T10:00:00Z",
      "zoho_sync_status": "failed",
      "zoho_salesorder_id": null,
      "zoho_sync_error": "Customer not found in Zoho Books"
    }
  ]
}
```

#### 8. Manual Sync Order
```http
POST /api/v1/orders/:orderId/sync-zoho
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Order synced successfully",
  "zoho_id": "SO-12345"
}
```

#### 9. Sync All Pending Orders
```http
POST /api/v1/orders/sync-all-zoho
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Sync started for 15 orders"
}
```

#### 10. Get Customer Sync Stats
```http
GET /api/v1/customers/zoho/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "synced": 45,
  "total": 120
}
```

## User Flow

### Initial Connection

1. **User navigates to Settings → Zoho Books**
2. **Sees "Not Connected" status**
3. **Clicks "Connect Zoho Books" button**
4. **OAuthConnectionDialog opens:**
   - Enter Client ID (from Zoho API Console)
   - Enter Client Secret
   - Redirect URI is auto-filled
5. **Clicks "Connect with Zoho"**
6. **Redirected to Zoho authorization page**
7. **User authorizes the application**
8. **Redirected back to `/zoho/callback`**
9. **ZohoCallback processes:**
   - Shows "Completing authorization..." loading state
   - Exchanges code for tokens
   - Shows "Connection Successful" message
   - Redirects to organization selection
10. **OrganizationSelector opens:**
    - Displays available organizations
    - User selects organization
    - Clicks "Continue"
11. **Integration activated:**
    - Auto-sync enabled
    - Sync dashboard displayed
    - Statistics loaded

### Reconnection (Token Expired)

1. **User sees "Token Expired" status**
2. **Clicks "Reconnect" button**
3. **Follows same OAuth flow as initial connection**
4. **Organization is pre-selected from previous config**

### Disconnection

1. **User clicks "Disconnect" button**
2. **Confirmation dialog appears**
3. **On confirm:**
   - Auto-sync disabled
   - Status changes to "Connected but Disabled"
   - Credentials remain saved for easy reconnection

## Security Features

### Credential Storage

- **Client Secret:** Stored temporarily in sessionStorage during OAuth flow only
- **Access Token:** Stored securely in backend database
- **Refresh Token:** Stored securely in backend database (encrypted)
- **Client ID/Secret:** Saved to backend after successful authorization

### Session Management

- **sessionStorage** used for temporary OAuth flow data
- Cleared immediately after successful token exchange
- Prevents credential exposure in browser history

### Token Refresh

- Backend automatically refreshes access_token when expired
- Frontend checks token_valid status
- Prompts reconnection only if refresh fails

## UI States

### Connection Status Badge

| Status | Badge Color | Icon | Description |
|--------|------------|------|-------------|
| Not Connected | Red | XCircle | No credentials saved |
| Connected & Active | Green | CheckCircle2 | Valid token, sync enabled |
| Connected but Disabled | Yellow | Clock | Valid token, sync disabled |
| Token Expired | Orange | AlertCircle | Token expired, needs reconnect |

### Action Buttons

| Status | Primary Action | Secondary Action |
|--------|---------------|------------------|
| Not Connected | Connect Zoho Books | - |
| Connected & Active | Disconnect | Test Connection |
| Connected but Disabled | Enable Sync (toggle) | Disconnect |
| Token Expired | Reconnect | - |

## Error Handling

### OAuth Errors

```typescript
// Authorization denied
if (error === "access_denied") {
  message = "Authorization was denied. Please try again.";
}

// Invalid credentials
if (error === "invalid_client") {
  message = "Invalid Client ID or Secret. Please check your credentials.";
}

// Session expired
if (!sessionStorage.getItem("zoho_client_id")) {
  message = "Session expired. Please start the connection process again.";
}
```

### Sync Errors

- **Failed orders:** Display in table with expandable error details
- **Retry functionality:** Individual retry buttons for each failed order
- **Bulk sync:** "Sync All Pending" button for multiple orders

## Testing Checklist

### OAuth Flow
- [ ] Connect with valid credentials
- [ ] Connect with invalid credentials
- [ ] User denies authorization
- [ ] Session expires during OAuth flow
- [ ] Redirect URI mismatch
- [ ] Network error during token exchange

### Organization Selection
- [ ] Single organization auto-selects
- [ ] Multiple organizations display correctly
- [ ] Selected organization saves
- [ ] Auto-sync enables after selection

### Sync Dashboard
- [ ] Statistics display correctly
- [ ] Orders table loads
- [ ] Pagination works
- [ ] Manual retry syncs order
- [ ] Bulk sync processes all pending
- [ ] Error details expand/collapse

### State Management
- [ ] zohoEnabled syncs with AuthContext
- [ ] Status persists after page refresh
- [ ] Disconnect clears state
- [ ] Reconnect updates state

## Troubleshooting

### "Session expired" error
**Cause:** sessionStorage cleared or OAuth flow took too long  
**Solution:** Start connection process again

### "No organizations found"
**Cause:** Zoho account has no Books organizations  
**Solution:** Create organization in Zoho Books first

### "Token expired" status
**Cause:** Refresh token expired or invalid  
**Solution:** Click "Reconnect" to re-authorize

### Orders not syncing
**Cause:** Auto-sync disabled or token invalid  
**Solution:** Enable auto-sync toggle and verify connection

## Development Notes

### Environment Variables

Add to `.env`:
```
VITE_APP_URL=https://yourdomain.com
```

Used for auto-filling redirect URI.

### Zoho API Console Setup

1. Go to https://api-console.zoho.com/
2. Create "Server-based Application"
3. Add redirect URI: `https://yourdomain.com/zoho/callback`
4. Note Client ID and Client Secret
5. Set scope: `ZohoBooks.fullaccess.all`

### Backend Implementation Notes

- Store tokens encrypted in database
- Implement automatic token refresh
- Handle Zoho API rate limits
- Log all sync operations for debugging

## Future Enhancements

1. **Multi-organization support:** Allow syncing with multiple organizations
2. **Selective sync:** Choose which order types to sync
3. **Sync scheduling:** Configure sync frequency
4. **Webhook support:** Real-time sync via Zoho webhooks
5. **Advanced mapping:** Custom field mapping between systems
6. **Sync history:** Detailed audit log of all sync operations

---

**Status:** ✅ OAuth 2.0 flow complete and ready for backend integration  
**Version:** 2.0.0  
**Last Updated:** February 1, 2026
