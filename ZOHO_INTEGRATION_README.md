# Zoho Books Integration - ZapCart Admin Dashboard

## Overview

The Zoho Books Integration module allows super admins to configure and manage the Zoho Books connection for each client in the ZapCart system. This integration enables automatic synchronization of orders and customers to Zoho Books for seamless accounting and invoicing.

## Features

### 1. **Integration Status Card**
- Real-time connection status indicator:
  - 🟢 **Connected**: Integration is active and token is valid
  - 🔴 **Disconnected**: Integration is disabled or not configured
  - 🟡 **Token Expired**: Credentials need to be refreshed
- Displays last sync timestamp and token expiry date
- Zoho Books branding with logo

### 2. **Configuration Form**
Secure form to manage Zoho Books API credentials:

| Field | Type | Description |
|-------|------|-------------|
| `zoho_enabled` | Toggle Switch | Enable/disable automatic sync |
| `zoho_organization_id` | Text Input | Zoho Organization ID (e.g., 60012345678) |
| `zoho_client_id` | Text Input | OAuth Client ID from Zoho Developer Console |
| `zoho_client_secret` | Password Input | OAuth Client Secret (masked, not returned by API) |
| `zoho_refresh_token` | Password Input | OAuth Refresh Token (masked, not returned by API) |

**Actions:**
- **Save Configuration**: Updates client settings via `PATCH /api/clients/:id`
- **Test Connection**: Validates credentials via `POST /api/clients/:id/zoho/test-connection`

### 3. **Sync Audit Dashboard**
Real-time monitoring of order synchronization:

#### Stats Cards
- **Total Orders**: Count of all orders
- **Successfully Synced**: Orders with `zoho_sync_status === "synced"`
- **Failed Syncs**: Orders with `zoho_sync_status === "failed"`
- **Pending**: Orders with `zoho_sync_status === "not_synced"`

#### Recent Sync Activity Table
Displays orders with the following columns:

| Column | Description |
|--------|-------------|
| Order # | Order number (e.g., ORD-101) |
| Customer | Customer name |
| Date | Order creation date |
| Total | Order total amount |
| Zoho Status | Badge showing sync status (✅ Synced, ❌ Failed, ⏳ Pending) |
| Zoho ID | Zoho Sales Order ID (if synced) |
| Action | Retry/Sync button for failed or pending orders |

**Error Handling:**
- Failed orders show an expandable error row with detailed error messages
- Manual retry functionality via `POST /api/orders/:id/sync-zoho`

### 4. **Customer Mapping Status**
Visual progress indicator showing:
- Number of customers synced to Zoho (`zoho_customer_id !== null`)
- Total customers in the system
- Progress bar visualization

## API Endpoints

### Client Configuration
```typescript
// Get client details with Zoho config
GET /api/v1/clients/:id
Response: {
  _id: string,
  zoho_enabled: boolean,
  zoho_organization_id: string,
  zoho_client_id: string,
  zoho_token_expiry: string,
  // Note: zoho_client_secret and zoho_refresh_token are not returned
}

// Update Zoho configuration
PATCH /api/v1/clients/:id
Body: {
  zoho_enabled: boolean,
  zoho_organization_id: string,
  zoho_client_id: string,
  zoho_client_secret: string,
  zoho_refresh_token: string
}

// Test Zoho connection
POST /api/v1/clients/:id/zoho/test-connection
Response: { success: boolean, message: string }
```

### Order Synchronization
```typescript
// Get orders with Zoho sync status
GET /api/v1/orders?page=1&limit=20
Response: {
  orders: [{
    _id: string,
    order_number: string,
    customer_name: string,
    total_amount: number,
    zoho_sync_status: "not_synced" | "synced" | "failed",
    zoho_salesorder_id?: string,
    zoho_sync_error?: string
  }],
  total: number,
  page: number,
  totalPages: number
}

// Manual sync an order
POST /api/v1/orders/:id/sync-zoho
Response: {
  message: string,
  zoho_id: string
}

// Get sync statistics
GET /api/v1/orders/zoho/stats
Response: {
  total: number,
  synced: number,
  failed: number,
  pending: number
}
```

### Customer Statistics
```typescript
// Get customer sync statistics
GET /api/v1/customers/zoho/stats
Response: {
  synced: number,
  total: number
}
```

## Data Models

### Client Model (Zoho Fields)
```typescript
{
  zoho_organization_id: String,
  zoho_client_id: String,
  zoho_client_secret: String,      // select: false (not returned by API)
  zoho_refresh_token: String,      // select: false (not returned by API)
  zoho_access_token: String,       // Managed by backend
  zoho_token_expiry: Date,
  zoho_enabled: Boolean
}
```

### Order Model (Zoho Fields)
```typescript
{
  zoho_salesorder_id: String,
  zoho_sync_status: "not_synced" | "synced" | "failed",
  zoho_sync_error: String
}
```

### Customer Model (Zoho Fields)
```typescript
{
  zoho_customer_id: String
}
```

## User Flow

1. **Initial Setup**
   - Admin navigates to **Settings → Zoho Books** (`/settings/zoho-books`)
   - If not configured, sees empty state with connection form
   - Admin obtains credentials from [Zoho Developer Console](https://api-console.zoho.com/)

2. **Configuration**
   - Fill in Organization ID, Client ID, Client Secret, and Refresh Token
   - Click **Test Connection** to validate credentials
   - Backend attempts to refresh access token
   - On success, shows "Connected" status

3. **Enable Integration**
   - Toggle **Enable Integration** switch
   - Click **Save Configuration**
   - Sync Audit Dashboard becomes visible

4. **Monitor Syncs**
   - View real-time sync statistics
   - Check customer mapping progress
   - Review recent sync activity in the table

5. **Handle Failures**
   - Click on failed orders to expand error details
   - Click **Retry** to manually trigger sync
   - Backend re-attempts sync and updates status

## Security Considerations

- **Sensitive Fields**: `zoho_client_secret` and `zoho_refresh_token` are:
  - Masked with password inputs in the UI
  - Not returned by the API (`select: false` in backend)
  - Only sent during configuration updates

- **Token Management**:
  - Access tokens are automatically refreshed by the backend
  - Token expiry is tracked and displayed to the user
  - Expired tokens trigger a warning status

## Design Guidelines

### Visual Style
- Professional business aesthetic
- Zoho brand color (`#1A73E8`) for primary actions
- Clear status indicators with color-coded badges
- Responsive grid layout for all screen sizes

### UX Best Practices
- Loading states during API calls
- Clear error messages with actionable feedback
- Helper text and tooltips for technical fields
- Link to Zoho documentation for credential setup
- Keyboard navigation support

### Accessibility
- Proper ARIA labels for all form inputs
- Color-blind friendly status indicators (icons + colors)
- Semantic HTML structure
- Focus management for modals and dialogs

## File Structure

```
src/
├── pages/
│   └── ZohoBooksIntegration.tsx    # Main integration page
├── services/
│   ├── zoho.ts                      # Zoho API service
│   ├── orders.ts                    # Updated with Zoho fields
│   └── customer.ts                  # Updated with Zoho fields
├── contexts/
│   └── AuthContext.tsx              # Updated with client_id
└── components/
    └── DashboardLayout.tsx          # Updated with navigation link
```

## Navigation

The Zoho Books Integration page is accessible via:
- **Route**: `/settings/zoho-books`
- **Sidebar**: Settings → Zoho Books (with ⚙️ icon)
- **Protected**: Requires authentication

## Future Enhancements

- [ ] Bulk sync functionality for multiple orders
- [ ] Sync scheduling and automation settings
- [ ] Webhook integration for real-time updates
- [ ] Detailed sync logs with filtering
- [ ] Product mapping configuration
- [ ] Tax and GST settings customization
- [ ] Invoice generation and download
- [ ] Two-way sync (Zoho → ZapCart)

## Troubleshooting

### Common Issues

**Issue**: "Token Expired" status
- **Solution**: Re-enter credentials and click "Test Connection"

**Issue**: Sync fails with "Invalid Organization ID"
- **Solution**: Verify Organization ID from Zoho Books settings

**Issue**: "Unauthorized" error during test
- **Solution**: Regenerate refresh token in Zoho Developer Console

**Issue**: Orders stuck in "Pending" status
- **Solution**: Check if integration is enabled and credentials are valid

## Support

For backend API issues or questions, refer to:
- Zoho Books API Documentation: https://www.zoho.com/books/api/v3/
- ZapCart Backend Repository: [Link to backend repo]

## License

This module is part of the ZapCart Admin Dashboard and follows the same license terms.
