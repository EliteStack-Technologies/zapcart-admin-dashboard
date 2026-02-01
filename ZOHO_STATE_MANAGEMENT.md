# Zoho Enabled State Management Update

## Overview
Updated `zoho_enabled` to follow the same pattern as `enquiry_mode` and `inventory_enabled`, storing the state in AuthContext and syncing with localStorage.

## Changes Made

### 1. AuthContext Updates (`src/contexts/AuthContext.tsx`)

#### Added to User Interface
```typescript
interface User {
  // ... existing fields
  zoho_enabled?: boolean;
}
```

#### Added to AuthContextType
```typescript
interface AuthContextType {
  // ... existing fields
  zohoEnabled: boolean;
  setZohoEnabled: (enabled: boolean) => void;
}
```

#### Added State Management
```typescript
const [zohoEnabled, setZohoEnabledState] = useState<boolean>(() => {
  const stored = localStorage.getItem("zoho_enabled");
  return stored === "true";
});
```

#### Added Setter Function
```typescript
const setZohoEnabled = (enabled: boolean) => {
  setZohoEnabledState(enabled);
  localStorage.setItem("zoho_enabled", String(enabled));
  
  // Update user object with zoho_enabled
  if (user) {
    const updatedUser = { ...user, zoho_enabled: enabled };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }
};
```

#### Added to Context Provider
```typescript
<AuthContext.Provider
  value={{
    // ... existing values
    zohoEnabled,
    setZohoEnabled,
  }}
>
```

#### Added to useEffect (Initial Load)
```typescript
const storedZohoEnabled = localStorage.getItem("zoho_enabled");

// Sync zoho_enabled from localStorage or user object
if (storedZohoEnabled !== null) {
  setZohoEnabledState(storedZohoEnabled === "true");
} else if (parsedUser.zoho_enabled !== undefined) {
  setZohoEnabledState(parsedUser.zoho_enabled);
  localStorage.setItem("zoho_enabled", String(parsedUser.zoho_enabled));
}
```

#### Added to login Function
```typescript
// Sync zoho_enabled from user object if available
if (parsedUser.zoho_enabled !== undefined) {
  setZohoEnabledState(parsedUser.zoho_enabled);
}
```

#### Added to logout Function
```typescript
const logout = () => {
  // ... existing cleanup
  setZohoEnabledState(false);
  localStorage.removeItem("zoho_enabled");
};
```

### 2. ZohoBooksIntegration Page Updates (`src/pages/ZohoBooksIntegration.tsx`)

#### Import from AuthContext
```typescript
const { user, zohoEnabled, setZohoEnabled } = useAuth();
```

#### Sync on Initial Data Fetch
```typescript
// Sync with AuthContext
if (clientData.zoho_enabled !== undefined) {
  setZohoEnabled(clientData.zoho_enabled);
}
```

#### Sync on Form Submission
```typescript
const onSubmit = async (data: ZohoConfigFormValues) => {
  // ... save to backend
  await updateZohoConfig(user.client_id, data);
  
  // Update AuthContext state
  setZohoEnabled(data.zoho_enabled);
  
  // ... rest of the logic
};
```

## How It Works

### State Flow

1. **Initial Load**:
   - AuthContext reads `zoho_enabled` from localStorage
   - If not in localStorage, reads from user object
   - Stores in both localStorage and AuthContext state

2. **Login**:
   - User object from backend includes `zoho_enabled`
   - AuthContext syncs this value to state and localStorage

3. **Configuration Update**:
   - User toggles switch or saves form
   - ZohoBooksIntegration calls `setZohoEnabled()`
   - AuthContext updates:
     - Internal state
     - localStorage
     - User object in localStorage

4. **Logout**:
   - AuthContext clears all state including `zoho_enabled`
   - Removes from localStorage

### Benefits

1. **Consistency**: Same pattern as `enquiry_mode` and `inventory_enabled`
2. **Persistence**: Survives page refreshes via localStorage
3. **Global Access**: Available throughout the app via `useAuth()`
4. **Automatic Sync**: Changes propagate to all components using the hook

## Usage in Other Components

Any component can now access `zohoEnabled`:

```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { zohoEnabled, setZohoEnabled } = useAuth();
  
  if (zohoEnabled) {
    // Show Zoho-related features
  }
  
  // Toggle Zoho integration
  const handleToggle = () => {
    setZohoEnabled(!zohoEnabled);
  };
}
```

## Backend Integration

The backend should return `zoho_enabled` in the user object during login:

```json
{
  "user": {
    "id": "123",
    "email": "admin@example.com",
    "name": "Admin",
    "client_id": "client123",
    "enquiry_mode": true,
    "inventory_enabled": true,
    "zoho_enabled": false
  },
  "token": "..."
}
```

## Testing Checklist

- [ ] `zoho_enabled` persists after page refresh
- [ ] Toggling the switch updates AuthContext
- [ ] Saving configuration syncs with AuthContext
- [ ] Logout clears `zoho_enabled` from localStorage
- [ ] Login restores `zoho_enabled` from backend
- [ ] Multiple tabs stay in sync (via localStorage events - if implemented)

## Migration Notes

If users have existing sessions:
- First load will read from backend user object
- Subsequent loads will use localStorage
- No data loss or migration needed

## Files Modified

1. `src/contexts/AuthContext.tsx` - Added zoho_enabled state management
2. `src/pages/ZohoBooksIntegration.tsx` - Integrated with AuthContext

## Consistency with Existing Patterns

This implementation exactly mirrors how `enquiry_mode` and `inventory_enabled` work:

| Feature | enquiry_mode | inventory_enabled | zoho_enabled |
|---------|--------------|-------------------|--------------|
| In User interface | ✅ | ✅ | ✅ |
| In AuthContextType | ✅ | ✅ | ✅ |
| localStorage sync | ✅ | ✅ | ✅ |
| Setter function | ✅ | ❌ | ✅ |
| Cleared on logout | ✅ | ✅ | ✅ |
| Synced on login | ✅ | ✅ | ✅ |

**Note**: `inventory_enabled` doesn't have a setter function (it's read-only from backend), but `zoho_enabled` needs one because users can toggle it in the UI, similar to `enquiry_mode`.
