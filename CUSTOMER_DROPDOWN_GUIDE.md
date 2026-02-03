# Customer Dropdown Implementation Guide

## Overview
This guide explains how to add a customer dropdown with "Add Customer" functionality to the order creation dialog.

## What's Been Done

### 1. Created AddCustomerSheet Component
**File**: `src/components/AddCustomerSheet.tsx`

A reusable slide-in sheet component that:
- Slides in from the right side
- Contains a form for adding new customers (name, phone, email)
- Validates required fields
- Creates the customer via API
- Calls a callback function when customer is created

### 2. Added Required Imports to Orders.tsx
- Added `UserPlus` icon from lucide-react
- Added Sheet components
- Added customer service functions (`getCustomers`, `createCustomer`, `Customer` type)

### 3. Added State Variables to Orders.tsx
```typescript
const [customers, setCustomers] = useState<Customer[]>([]);
const [loadingCustomers, setLoadingCustomers] = useState(false);
const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
const [addCustomerSheetOpen, setAddCustomerSheetOpen] = useState(false);
const [newCustomerName, setNewCustomerName] = useState("");
const [newCustomerPhone, setNewCustomerPhone] = useState("");
const [newCustomerEmail, setNewCustomerEmail] = useState("");
const [creatingCustomer, setCreatingCustomer] = useState(false);
```

### 4. Added Helper Functions
- `fetchCustomers()` - Fetches list of customers from API
- `handleCreateCustomer()` - Creates new customer (currently standalone, will be moved to component)

## What Needs to Be Done

### Step 1: Add useEffect to Fetch Customers
Add this after the existing useEffect hooks (around line 240):

```typescript
useEffect(() => {
  // Fetch customers when create order dialog opens
  if (createOrderDialogOpen) {
    fetchCustomers();
    handleSearchOrderItems(); // This already exists
  }
}, [createOrderDialogOpen]);
```

### Step 2: Replace Customer Input Fields
Find the "Customer Information" section in the Create Order Dialog (around line 1705-1728).

**Replace this:**
```typescript
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="customer_name">Customer Name *</Label>
    <Input
      id="customer_name"
      value={newOrderCustomerName}
      onChange={(e) => setNewOrderCustomerName(e.target.value)}
      placeholder="Enter customer name"
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="customer_phone">Customer Phone *</Label>
    <Input
      id="customer_phone"
      value={newOrderCustomerPhone}
      onChange={(e) => setNewOrderCustomerPhone(e.target.value)}
      placeholder="Enter phone number"
    />
  </div>
</div>
```

**With this:**
```typescript
<div className="space-y-2">
  <Label>Select Customer *</Label>
  <Select
    value={selectedCustomerId}
    onValueChange={(value) => {
      if (value === "add_new") {
        setAddCustomerSheetOpen(true);
      } else {
        setSelectedCustomerId(value);
        const customer = customers.find(c => c._id === value);
        if (customer) {
          setNewOrderCustomerName(customer.name);
          setNewOrderCustomerPhone(customer.phone);
        }
      }
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select a customer"} />
    </SelectTrigger>
    <SelectContent>
      {loadingCustomers ? (
        <div className="p-2 text-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mx-auto mr-2 inline" />
          Loading customers...
        </div>
      ) : (
        <>
          {customers.map((customer) => (
            <SelectItem key={customer._id} value={customer._id}>
              {customer.name} - {customer.phone}
            </SelectItem>
          ))}
          <Separator className="my-1" />
          <SelectItem value="add_new" className="text-primary font-medium">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add New Customer
            </SelectItem>
          </SelectItem>
        </>
      )}
    </SelectContent>
  </Select>
</div>
```

### Step 3: Add the AddCustomerSheet Component
Add this at the end of the component, before the closing `</DashboardLayout>` tag (around line 1935):

```typescript
{/* Add Customer Sheet */}
<AddCustomerSheet
  open={addCustomerSheetOpen}
  onOpenChange={setAddCustomerSheetOpen}
  onCustomerCreated={(customer) => {
    setCustomers(prev => [customer, ...prev]);
    setSelectedCustomerId(customer._id);
    setNewOrderCustomerName(customer.name);
    setNewOrderCustomerPhone(customer.phone);
  }}
/>
```

### Step 4: Add Import for AddCustomerSheet
Add this to the imports at the top of Orders.tsx:

```typescript
import AddCustomerSheet from "@/components/AddCustomerSheet";
```

### Step 5: Add Separator Import
Make sure Separator is imported from components/ui:

```typescript
import { Separator } from "@/components/ui/separator";
```

## How It Works

1. **Initial Load**: When user clicks "Create Order", the dialog opens and `fetchCustomers()` is called
2. **Customer Selection**: User sees a dropdown with existing customers showing "Name - Phone"
3. **Add New Customer**: At the bottom of the dropdown is "Add New Customer" option
4. **Slide-in Sheet**: Clicking "Add New Customer" opens a sheet from the right side
5. **Create Customer**: User fills in name, phone, and optional email, then clicks "Create Customer"
6. **Auto-Select**: New customer is added to the list and automatically selected
7. **Order Creation**: User can now proceed to create the order with the selected customer

## Testing

1. Click "Create Order" button
2. Click on the customer dropdown
3. Verify existing customers are listed
4. Click "Add New Customer" at the bottom
5. Verify sheet slides in from right
6. Fill in customer details and click "Create Customer"
7. Verify customer is created and automatically selected
8. Verify you can now create an order with this customer

## Benefits

- ✅ Better UX - No need to manually type customer details
- ✅ Prevents duplicates - Can see existing customers
- ✅ Quick access - Add new customers without leaving the dialog
- ✅ Auto-fill - Customer details are automatically filled when selected
- ✅ Modern UI - Slide-in sheet provides a clean, modern experience
