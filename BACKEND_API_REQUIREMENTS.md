# Backend API Requirements - Zoho Books Integration

## Quick Reference for Backend Team

### 🎯 Required API Endpoints

#### 1. Client Configuration Endpoints

**Get Client Details**
```http
GET /api/v1/clients/:id
```
**Response:**
```json
{
  "_id": "client123",
  "name": "Acme Corp",
  "zoho_enabled": true,
  "zoho_organization_id": "60012345678",
  "zoho_client_id": "1000.XXXXX.XXXXX",
  "zoho_token_expiry": "2026-02-15T10:30:00Z"
  // Note: zoho_client_secret and zoho_refresh_token should NOT be returned
}
```

**Update Zoho Configuration**
```http
PATCH /api/v1/clients/:id
Content-Type: application/json
```
**Request Body:**
```json
{
  "zoho_enabled": true,
  "zoho_organization_id": "60012345678",
  "zoho_client_id": "1000.XXXXX.XXXXX",
  "zoho_client_secret": "secret_value",
  "zoho_refresh_token": "refresh_token_value"
}
```
**Response:**
```json
{
  "_id": "client123",
  "zoho_enabled": true,
  "zoho_organization_id": "60012345678",
  "zoho_client_id": "1000.XXXXX.XXXXX",
  "zoho_token_expiry": "2026-02-15T10:30:00Z"
}
```

**Test Zoho Connection**
```http
POST /api/v1/clients/:id/zoho/test-connection
```
**Response (Success):**
```json
{
  "success": true,
  "message": "Connection successful",
  "token_expiry": "2026-02-15T10:30:00Z"
}
```
**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

#### 2. Order Sync Endpoints

**Get Orders with Zoho Status**
```http
GET /api/v1/orders?page=1&limit=20
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
      "zoho_sync_status": "synced",
      "zoho_salesorder_id": "SO-12345",
      "zoho_sync_error": null
    },
    {
      "_id": "order124",
      "order_number": "ORD-102",
      "customer_name": "Jane Smith",
      "customer_phone": "+1234567891",
      "total_amount": 200.00,
      "createdAt": "2026-01-31T11:00:00Z",
      "zoho_sync_status": "failed",
      "zoho_salesorder_id": null,
      "zoho_sync_error": "Customer not found in Zoho Books"
    }
  ]
}
```

**Manual Sync Order**
```http
POST /api/v1/orders/:id/sync-zoho
```
**Response (Success):**
```json
{
  "message": "Order synced to Zoho successfully",
  "zoho_id": "SO-12345"
}
```
**Response (Error):**
```json
{
  "message": "Failed to sync order",
  "error": "Invalid tax configuration"
}
```

**Get Sync Statistics**
```http
GET /api/v1/orders/zoho/stats
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

---

#### 3. Customer Sync Endpoints

**Get Customer Sync Statistics**
```http
GET /api/v1/customers/zoho/stats
```
**Response:**
```json
{
  "synced": 45,
  "total": 120
}
```

---

### 📊 Database Schema Updates

#### Client Model
```javascript
const clientSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Zoho Books Integration Fields
  zoho_organization_id: {
    type: String,
    default: null
  },
  zoho_client_id: {
    type: String,
    default: null
  },
  zoho_client_secret: {
    type: String,
    select: false,  // IMPORTANT: Never return in API responses
    default: null
  },
  zoho_refresh_token: {
    type: String,
    select: false,  // IMPORTANT: Never return in API responses
    default: null
  },
  zoho_access_token: {
    type: String,
    select: false,  // Managed internally
    default: null
  },
  zoho_token_expiry: {
    type: Date,
    default: null
  },
  zoho_enabled: {
    type: Boolean,
    default: false
  }
});
```

#### Order Model
```javascript
const orderSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Zoho Books Sync Fields
  zoho_salesorder_id: {
    type: String,
    default: null
  },
  zoho_sync_status: {
    type: String,
    enum: ['not_synced', 'synced', 'failed'],
    default: 'not_synced'
  },
  zoho_sync_error: {
    type: String,
    default: null
  }
});
```

#### Customer Model
```javascript
const customerSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Zoho Books Mapping
  zoho_customer_id: {
    type: String,
    default: null
  }
});
```

---

### 🔐 Security Requirements

1. **Sensitive Fields Protection**:
   - `zoho_client_secret` and `zoho_refresh_token` must have `select: false`
   - Never return these fields in API responses
   - Only accept them during PATCH requests

2. **Token Management**:
   - Automatically refresh `zoho_access_token` when expired
   - Update `zoho_token_expiry` after each refresh
   - Store tokens securely (encrypted at rest recommended)

3. **Authentication**:
   - All endpoints require valid JWT authentication
   - Verify user has permission to access client data

---

### 🔄 Sync Logic Requirements

#### When to Sync Orders

1. **Automatic Sync** (if `zoho_enabled: true`):
   - When a new order is created
   - When an order status changes to "confirmed"

2. **Manual Sync**:
   - Via POST `/api/v1/orders/:id/sync-zoho`
   - Should retry failed syncs

#### Sync Process

1. **Check Prerequisites**:
   - Verify `zoho_enabled` is true
   - Verify access token is valid (refresh if expired)
   - Verify customer exists in Zoho (create if not)

2. **Create Sales Order in Zoho**:
   - Map order data to Zoho format
   - Include line items, taxes, discounts
   - Handle errors gracefully

3. **Update Order Record**:
   - Set `zoho_salesorder_id` on success
   - Set `zoho_sync_status` to "synced" or "failed"
   - Store error message in `zoho_sync_error` if failed

4. **Update Customer Record**:
   - Store `zoho_customer_id` when customer is created/found

---

### 🧪 Testing Checklist

- [ ] Test connection with valid credentials
- [ ] Test connection with invalid credentials
- [ ] Save configuration and verify fields are stored
- [ ] Verify sensitive fields are not returned in GET requests
- [ ] Test automatic order sync on creation
- [ ] Test manual order sync endpoint
- [ ] Test sync with non-existent customer (should create)
- [ ] Test sync with invalid data (should fail gracefully)
- [ ] Test token refresh when expired
- [ ] Test sync statistics endpoint
- [ ] Test customer statistics endpoint
- [ ] Test pagination in orders endpoint

---

### 📝 Error Handling

**Common Error Scenarios:**

1. **Invalid Credentials**:
   ```json
   { "message": "Invalid Zoho credentials" }
   ```

2. **Token Expired**:
   - Automatically refresh token
   - If refresh fails: `{ "message": "Token expired, please reconfigure" }`

3. **Customer Not Found**:
   - Automatically create customer in Zoho
   - If creation fails: `{ "message": "Failed to create customer in Zoho" }`

4. **Invalid Tax Configuration**:
   ```json
   { "message": "Tax configuration mismatch" }
   ```

5. **Network Error**:
   ```json
   { "message": "Failed to connect to Zoho Books API" }
   ```

---

### 🔗 Zoho Books API Reference

**Base URL**: `https://books.zoho.com/api/v3/`

**Key Endpoints Used**:
- `POST /salesorders` - Create sales order
- `GET /contacts` - Search for customer
- `POST /contacts` - Create customer
- `POST /oauth/v2/token` - Refresh access token

**Documentation**: https://www.zoho.com/books/api/v3/

---

### 💡 Implementation Tips

1. **Token Refresh**:
   ```javascript
   async function refreshZohoToken(client) {
     const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', {
       refresh_token: client.zoho_refresh_token,
       client_id: client.zoho_client_id,
       client_secret: client.zoho_client_secret,
       grant_type: 'refresh_token'
     });
     
     client.zoho_access_token = response.data.access_token;
     client.zoho_token_expiry = new Date(Date.now() + response.data.expires_in * 1000);
     await client.save();
   }
   ```

2. **Customer Sync**:
   ```javascript
   async function syncCustomerToZoho(customer, client) {
     // Search for existing customer
     const existing = await searchZohoCustomer(customer.phone);
     
     if (existing) {
       customer.zoho_customer_id = existing.contact_id;
     } else {
       // Create new customer
       const created = await createZohoCustomer(customer);
       customer.zoho_customer_id = created.contact_id;
     }
     
     await customer.save();
   }
   ```

3. **Order Sync**:
   ```javascript
   async function syncOrderToZoho(order, client) {
     try {
       // Ensure customer is synced
       await syncCustomerToZoho(order.customer, client);
       
       // Create sales order
       const salesOrder = await createZohoSalesOrder(order, client);
       
       order.zoho_salesorder_id = salesOrder.salesorder_id;
       order.zoho_sync_status = 'synced';
       order.zoho_sync_error = null;
     } catch (error) {
       order.zoho_sync_status = 'failed';
       order.zoho_sync_error = error.message;
     }
     
     await order.save();
   }
   ```

---

### 📊 Statistics Calculation

**Order Stats**:
```javascript
async function getZohoSyncStats(clientId) {
  const stats = await Order.aggregate([
    { $match: { client_id: clientId } },
    {
      $group: {
        _id: '$zoho_sync_status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    total: stats.reduce((sum, s) => sum + s.count, 0),
    synced: stats.find(s => s._id === 'synced')?.count || 0,
    failed: stats.find(s => s._id === 'failed')?.count || 0,
    pending: stats.find(s => s._id === 'not_synced')?.count || 0
  };
}
```

**Customer Stats**:
```javascript
async function getCustomerSyncStats(clientId) {
  const total = await Customer.countDocuments({ client_id: clientId });
  const synced = await Customer.countDocuments({ 
    client_id: clientId,
    zoho_customer_id: { $ne: null }
  });
  
  return { synced, total };
}
```

---

### ✅ Acceptance Criteria

- [ ] All API endpoints return correct data structure
- [ ] Sensitive fields are never exposed in responses
- [ ] Token refresh works automatically
- [ ] Orders sync successfully to Zoho Books
- [ ] Customers are created/mapped correctly
- [ ] Error messages are descriptive and helpful
- [ ] Statistics are calculated accurately
- [ ] Pagination works correctly
- [ ] Manual retry functionality works
- [ ] Integration can be enabled/disabled

---

**Priority**: High  
**Estimated Effort**: 2-3 days  
**Dependencies**: Zoho Books API access, OAuth credentials  
**Contact**: Frontend team for any clarifications
