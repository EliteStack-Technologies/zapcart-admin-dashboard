# Zoho Books OAuth - Quick Reference

## 🚀 Quick Start

### For Users
1. Go to **Settings → Zoho Books**
2. Click **"Connect Zoho Books"**
3. Enter Client ID and Client Secret from [Zoho API Console](https://api-console.zoho.com/)
4. Authorize on Zoho
5. Select your organization
6. Done! Auto-sync is enabled

### For Developers
```bash
# Files to review
src/pages/ZohoBooksIntegration.tsx    # Main page
src/pages/ZohoCallback.tsx            # OAuth callback
src/components/OAuthConnectionDialog.tsx  # Connection dialog
src/components/OrganizationSelector.tsx   # Org selector
src/services/zoho.ts                  # API service
```

## 📋 API Endpoints Checklist

```
[ ] GET    /api/v1/zoho/config
[ ] POST   /api/v1/zoho/auth-url
[ ] POST   /api/v1/zoho/exchange-code
[ ] POST   /api/v1/zoho/test-connection
[ ] PATCH  /api/v1/zoho/config
[ ] GET    /api/v1/orders/zoho/stats
[ ] GET    /api/v1/orders (with zoho_sync_status filter)
[ ] POST   /api/v1/orders/:id/sync-zoho
[ ] POST   /api/v1/orders/sync-all-zoho
[ ] GET    /api/v1/customers/zoho/stats
```

## 🔑 Environment Setup

### Zoho API Console
1. Create "Server-based Application"
2. Set Redirect URI: `https://yourdomain.com/zoho/callback`
3. Scope: `ZohoBooks.fullaccess.all`
4. Note Client ID and Client Secret

### Frontend
```env
VITE_APP_URL=https://yourdomain.com
```

## 🎨 UI States

| Status | Badge | Actions |
|--------|-------|---------|
| Not Connected | 🔴 Red | Connect Zoho Books |
| Connected & Active | 🟢 Green | Test Connection, Disconnect |
| Connected but Disabled | 🟡 Yellow | Enable Sync Toggle, Disconnect |
| Token Expired | 🟠 Orange | Reconnect |

## 🔄 OAuth Flow (Simplified)

```
User → Connect Button → OAuth Dialog → Zoho Auth → Callback
→ Token Exchange → Org Selection → Config Save → Dashboard
```

## 📊 Data Models

### ZohoConfig
```typescript
{
  zoho_enabled: boolean;
  zoho_organization_id?: string;
  zoho_organization_name?: string;
  has_credentials: boolean;
  token_valid: boolean;
  token_expiry?: string;
}
```

### ZohoOrganization
```typescript
{
  organization_id: string;
  name: string;
  currency_code: string;
  currency_symbol?: string;
}
```

## 🛠️ Common Tasks

### Test Connection
```typescript
const result = await testConnection();
// Returns: { organizations: [...] }
```

### Update Config
```typescript
await updateZohoConfig({
  zoho_organization_id: "60012345678",
  zoho_enabled: true
});
```

### Sync Order
```typescript
await syncOrderToZoho(orderId);
```

### Get Sync Stats
```typescript
const stats = await getZohoSyncStats();
// Returns: { total, synced, failed, pending }
```

## 🐛 Debugging

### Check sessionStorage
```javascript
console.log(sessionStorage.getItem('zoho_client_id'));
console.log(sessionStorage.getItem('zoho_client_secret'));
console.log(sessionStorage.getItem('zoho_redirect_uri'));
```

### Check AuthContext
```javascript
const { zohoEnabled } = useAuth();
console.log('Zoho Enabled:', zohoEnabled);
```

### Check localStorage
```javascript
console.log(localStorage.getItem('zoho_enabled'));
```

## ⚠️ Common Issues

### "Session expired"
**Fix:** Start connection process again

### "No organizations found"
**Fix:** Create organization in Zoho Books first

### "Token expired"
**Fix:** Click "Reconnect" button

### Orders not syncing
**Fix:** Enable auto-sync toggle and verify connection

## 📱 Routes

```
/settings/zoho-books     → Main integration page
/zoho/callback           → OAuth callback handler
```

## 🔐 Security Notes

- Client Secret masked in UI
- Credentials in sessionStorage only during OAuth
- sessionStorage cleared after token exchange
- Backend stores tokens encrypted
- Automatic token refresh

## 📞 Support

- **Documentation:** See `ZOHO_OAUTH_GUIDE.md`
- **API Specs:** See `BACKEND_API_REQUIREMENTS.md`
- **Architecture:** See `COMPONENT_STRUCTURE.md`
- **Flow Diagram:** See generated image

## ✅ Pre-Launch Checklist

### Frontend
- [x] OAuth flow implemented
- [x] Organization selection
- [x] Sync dashboard
- [x] Error handling
- [x] State management
- [x] Documentation

### Backend (TODO)
- [ ] OAuth endpoints
- [ ] Token management
- [ ] Zoho API integration
- [ ] Sync logic
- [ ] Database schema
- [ ] Error handling

---

**Quick Links:**
- [Zoho API Docs](https://www.zoho.com/books/api/v3/)
- [Zoho API Console](https://api-console.zoho.com/)
- [OAuth 2.0 Spec](https://oauth.net/2/)
