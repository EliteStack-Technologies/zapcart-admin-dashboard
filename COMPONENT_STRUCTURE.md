# Zoho Books Integration - Component Structure

## Component Hierarchy

```
ZohoBooksIntegration (Main Page)
│
├── DashboardLayout (Wrapper)
│   ├── Sidebar Navigation
│   │   └── "Zoho Books" Menu Item
│   └── Main Content Area
│
├── Header Section
│   ├── Title: "Zoho Books Integration"
│   └── Subtitle: "Configure and manage..."
│
├── Integration Status Card
│   ├── Card Header
│   │   ├── ZohoLogo (Custom SVG)
│   │   ├── CardTitle: "Zoho Books Integration"
│   │   ├── CardDescription: "Sync orders and customers..."
│   │   └── Status Badge (Connected/Disconnected/Expired)
│   └── Card Content
│       ├── Token Expiry Info (Clock icon + timestamp)
│       └── Last Sync Info (RefreshCw icon + timestamp)
│
├── Configuration Form Card
│   ├── Card Header
│   │   ├── CardTitle: "Configuration"
│   │   └── CardDescription with External Link
│   └── Card Content
│       └── Form (react-hook-form + zod)
│           ├── Enable Integration Toggle
│           │   ├── FormLabel
│           │   ├── FormDescription
│           │   └── Switch Component
│           ├── Organization ID Field
│           │   ├── FormLabel
│           │   ├── Input
│           │   └── FormMessage (validation)
│           ├── Client ID Field
│           │   ├── FormLabel
│           │   ├── Input
│           │   └── FormMessage
│           ├── Client Secret Field
│           │   ├── FormLabel
│           │   ├── Input (type: password)
│           │   ├── Eye/EyeOff Toggle Button
│           │   └── FormMessage
│           ├── Refresh Token Field
│           │   ├── FormLabel
│           │   ├── Input (type: password)
│           │   ├── Eye/EyeOff Toggle Button
│           │   ├── FormDescription
│           │   └── FormMessage
│           └── Action Buttons
│               ├── Save Configuration Button (primary)
│               └── Test Connection Button (outline)
│
├── Sync Statistics Cards (Grid - 4 columns)
│   ├── Total Orders Card
│   │   ├── CardHeader (ShoppingCart icon)
│   │   └── CardContent (number display)
│   ├── Successfully Synced Card
│   │   ├── CardHeader (TrendingUp icon, green)
│   │   └── CardContent (number display)
│   ├── Failed Syncs Card
│   │   ├── CardHeader (TrendingDown icon, red)
│   │   └── CardContent (number display)
│   └── Pending Card
│       ├── CardHeader (Clock icon, yellow)
│       └── CardContent (number display)
│
├── Customer Mapping Status Card
│   ├── CardHeader
│   │   └── CardTitle (Users icon + "Customer Mapping Status")
│   └── CardContent
│       ├── Text: "Customers synced to Zoho: X / Y"
│       └── Progress Bar
│           ├── Background (secondary)
│           └── Fill (primary, calculated width)
│
└── Recent Sync Activity Card
    ├── CardHeader
    │   ├── CardTitle: "Recent Sync Activity"
    │   └── CardDescription: "View and manage..."
    └── CardContent
        ├── Table
        │   ├── TableHeader
        │   │   └── TableRow
        │   │       ├── Order # (TableHead)
        │   │       ├── Customer (TableHead)
        │   │       ├── Date (TableHead)
        │   │       ├── Total (TableHead)
        │   │       ├── Zoho Status (TableHead)
        │   │       ├── Zoho ID (TableHead)
        │   │       └── Action (TableHead)
        │   └── TableBody
        │       └── For each order:
        │           ├── Main TableRow
        │           │   ├── Order Number (TableCell)
        │           │   ├── Customer Name (TableCell)
        │           │   ├── Formatted Date (TableCell)
        │           │   ├── Total Amount (TableCell)
        │           │   ├── Status Badge (TableCell)
        │           │   │   ├── Synced (green, CheckCircle2)
        │           │   │   ├── Failed (red, XCircle)
        │           │   │   └── Pending (gray, Clock)
        │           │   ├── Zoho Sales Order ID (TableCell)
        │           │   └── Action Button (TableCell)
        │           │       └── Retry/Sync Button (RefreshCw icon)
        │           └── Error Row (if failed)
        │               └── Collapsible
        │                   ├── CollapsibleTrigger
        │                   │   └── "Show/Hide error details"
        │                   └── CollapsibleContent
        │                       └── Alert (destructive)
        │                           └── Error message text
        └── Pagination Controls
            ├── Previous Button
            ├── Page Info Text
            └── Next Button
```

## State Management

### Component State
```typescript
// Loading States
const [isLoading, setIsLoading] = useState(false);
const [isFetching, setIsFetching] = useState(true);
const [isTesting, setIsTesting] = useState(false);

// UI State
const [showClientSecret, setShowClientSecret] = useState(false);
const [showRefreshToken, setShowRefreshToken] = useState(false);

// Connection State
const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "expired">("disconnected");
const [lastSync, setLastSync] = useState<string | null>(null);
const [tokenExpiry, setTokenExpiry] = useState<string | null>(null);

// Data State
const [orders, setOrders] = useState<OrderWithZoho[]>([]);
const [syncStats, setSyncStats] = useState<ZohoSyncStats>({ total: 0, synced: 0, failed: 0, pending: 0 });
const [customerStats, setCustomerStats] = useState<CustomerSyncStats>({ synced: 0, total: 0 });

// Pagination State
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

// Interaction State
const [syncingOrders, setSyncingOrders] = useState<Set<string>>(new Set());
const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
```

### Form State (react-hook-form)
```typescript
const form = useForm<ZohoConfigFormValues>({
  resolver: zodResolver(zohoConfigSchema),
  defaultValues: {
    zoho_enabled: false,
    zoho_organization_id: "",
    zoho_client_id: "",
    zoho_client_secret: "",
    zoho_refresh_token: "",
  },
});
```

## Data Flow

### 1. Initial Load
```
Component Mount
    ↓
useEffect (fetch client details)
    ↓
getClientDetails(user.client_id)
    ↓
Update form with fetched data
    ↓
Determine connection status
    ↓
If enabled: fetchSyncData()
    ↓
Display UI
```

### 2. Save Configuration
```
User fills form
    ↓
Click "Save Configuration"
    ↓
onSubmit(formData)
    ↓
updateZohoConfig(client_id, formData)
    ↓
Show success toast
    ↓
If enabled: fetchSyncData()
    ↓
Update UI
```

### 3. Test Connection
```
User clicks "Test Connection"
    ↓
handleTestConnection()
    ↓
testZohoConnection(client_id)
    ↓
Backend validates credentials
    ↓
Show success/error toast
    ↓
Update connection status
```

### 4. Manual Sync
```
User clicks "Retry" on failed order
    ↓
handleSyncOrder(orderId)
    ↓
syncOrderToZoho(orderId)
    ↓
Backend syncs to Zoho
    ↓
Show success/error toast
    ↓
fetchSyncData() to refresh
    ↓
Update table
```

## API Integration Points

### Service Layer (`src/services/zoho.ts`)
```typescript
// Client Configuration
getClientDetails(clientId) → GET /api/v1/clients/:id
updateZohoConfig(clientId, config) → PATCH /api/v1/clients/:id
testZohoConnection(clientId) → POST /api/v1/clients/:id/zoho/test-connection

// Order Sync
getOrdersWithZohoStatus(page, limit) → GET /api/v1/orders
syncOrderToZoho(orderId) → POST /api/v1/orders/:id/sync-zoho
getZohoSyncStats() → GET /api/v1/orders/zoho/stats

// Customer Stats
getCustomerSyncStats() → GET /api/v1/customers/zoho/stats
```

## Styling & Theming

### Color Scheme
- **Primary**: Zoho Blue (`#1A73E8`)
- **Success**: Green (`bg-green-100`, `text-green-800`)
- **Error**: Red (`bg-red-100`, `text-red-800`)
- **Warning**: Yellow (`bg-yellow-100`, `text-yellow-800`)
- **Neutral**: Gray (`bg-secondary`, `text-muted-foreground`)

### Icons (lucide-react)
- Save, TestTube2, Loader2 (actions)
- CheckCircle2, XCircle, AlertCircle (status)
- RefreshCw, Eye, EyeOff (interactions)
- ExternalLink, Users, ShoppingCart (context)
- TrendingUp, TrendingDown, Clock (stats)

### Responsive Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px` (md:)
- Desktop: `> 1024px` (lg:)

### Grid Layouts
- Stats Cards: `grid-cols-1 md:grid-cols-4`
- Form Fields: `grid-cols-1 md:grid-cols-2`

## Error Handling

### Form Validation (Zod)
```typescript
const zohoConfigSchema = z.object({
  zoho_enabled: z.boolean(),
  zoho_organization_id: z.string().min(1, "Organization ID is required"),
  zoho_client_id: z.string().min(1, "Client ID is required"),
  zoho_client_secret: z.string().min(1, "Client Secret is required"),
  zoho_refresh_token: z.string().min(1, "Refresh Token is required"),
});
```

### API Error Handling
```typescript
try {
  // API call
} catch (error: any) {
  toast({
    title: "Error",
    description: error?.response?.data?.message || "Operation failed",
    variant: "destructive",
  });
}
```

### Loading States
- Form submission: `isLoading` → Disable buttons, show spinner
- Connection test: `isTesting` → Show "Testing..." text
- Individual sync: `syncingOrders.has(orderId)` → Show spinner in button
- Initial fetch: `isFetching` → Show full-page loader

## Accessibility Features

### ARIA Labels
- Form inputs have proper labels
- Buttons have descriptive text or aria-label
- Status badges use semantic colors + icons

### Keyboard Navigation
- Tab order follows logical flow
- Enter submits forms
- Escape closes modals/collapsibles
- Space toggles switches

### Screen Reader Support
- Semantic HTML (header, main, nav, section)
- Descriptive link text
- Error messages announced
- Loading states communicated

## Performance Optimizations

### Lazy Loading
- Only fetch sync data when integration is enabled
- Pagination for large order lists

### Debouncing
- Form validation on change (built into react-hook-form)

### Memoization Opportunities
- Status badge component
- Date formatting function
- Table rows (if performance issues arise)

### State Updates
- Batch state updates where possible
- Use functional setState for derived state

## Testing Considerations

### Unit Tests
- Form validation logic
- Status determination logic
- Date formatting utilities
- Error handling

### Integration Tests
- Form submission flow
- API error handling
- Loading states
- Pagination

### E2E Tests
- Complete configuration flow
- Connection testing
- Manual sync operation
- Error expansion/collapse

## Browser Compatibility

Tested and supported:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

### Core
- React 18+
- TypeScript 4.9+
- React Router DOM 6+

### UI Components
- shadcn/ui components
- lucide-react (icons)
- tailwindcss (styling)

### Form Management
- react-hook-form
- @hookform/resolvers
- zod

### HTTP Client
- axios (via axiosInstance)

### Utilities
- date-fns (optional, for date formatting)
