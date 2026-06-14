import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Products = lazy(() => import("@/pages/Products"));
const Categories = lazy(() => import("@/pages/Categories"));
const CategoryProducts = lazy(() => import("@/pages/CategoryProducts"));
const Rows = lazy(() => import("@/pages/Rows"));
const Orders = lazy(() => import("@/pages/Orders"));
const Customers = lazy(() => import("@/pages/Customers"));
const Enquiries = lazy(() => import("@/pages/Enquiries"));
const Offers = lazy(() => import("@/pages/Offers"));
const Banners = lazy(() => import("@/pages/Banners"));
const Flyers = lazy(() => import("@/pages/Flyers"));
const DeliveryAgents = lazy(() => import("@/pages/DeliveryAgents"));
const TableQrCodes = lazy(() => import("@/pages/TableQrCodes"));
const UploadImages = lazy(() => import("@/pages/UploadImages"));
const Account = lazy(() => import("@/pages/Account"));
const Profile = lazy(() => import("@/pages/Profile"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const CustomerLogin = lazy(() => import("@/pages/CustomerLogin"));
const CustomerProfile = lazy(() => import("@/pages/CustomerProfile"));
const CustomerOrders = lazy(() => import("@/pages/CustomerOrders"));
const StockIn = lazy(() => import("@/pages/StockIn"));
const StockOut = lazy(() => import("@/pages/StockOut"));
const LowStock = lazy(() => import("@/pages/LowStock"));
const CurrentStock = lazy(() => import("@/pages/CurrentStock"));
const ZohoBooksIntegration = lazy(() => import("@/pages/ZohoBooksIntegration"));
const ZohoCallback = lazy(() => import("@/pages/ZohoCallback"));
const BulkEditProducts = lazy(() => import("@/pages/BulkEditProducts"));



function AppRoutes() {
  const navigate = useNavigate();

  return (
    <NotificationProvider onNavigate={navigate}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
        >
        <Routes>
          {/* Admin Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/categories/:categoryId/products" element={<ProtectedRoute><CategoryProducts /></ProtectedRoute>} />
          <Route path="/rows" element={<ProtectedRoute><Rows /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/enquiries" element={<ProtectedRoute><Enquiries /></ProtectedRoute>} />
          <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
          <Route path="/banners" element={<ProtectedRoute><Banners /></ProtectedRoute>} />
          <Route path="/flyers" element={<ProtectedRoute><Flyers /></ProtectedRoute>} />
          <Route path="/delivery-agents" element={<ProtectedRoute><DeliveryAgents /></ProtectedRoute>} />
          <Route path="/table-qr-codes" element={<ProtectedRoute><TableQrCodes /></ProtectedRoute>} />
          <Route path="/upload-images" element={<ProtectedRoute><UploadImages /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/inventory/stock-in" element={<ProtectedRoute><StockIn /></ProtectedRoute>} />
          <Route path="/inventory/stock-out" element={<ProtectedRoute><StockOut /></ProtectedRoute>} />
          <Route path="/inventory/low-stock" element={<ProtectedRoute><LowStock /></ProtectedRoute>} />
          <Route path="/inventory/current-stock" element={<ProtectedRoute><CurrentStock /></ProtectedRoute>} />
          <Route path="/settings/zoho-books" element={<ProtectedRoute><ZohoBooksIntegration /></ProtectedRoute>} />
          <Route path="/zoho/callback" element={<ProtectedRoute><ZohoCallback /></ProtectedRoute>} />
          <Route path="/products/bulk-edit" element={<ProtectedRoute><BulkEditProducts /></ProtectedRoute>} />
          
          {/* Customer Routes */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/orders" element={<CustomerOrders />} />
          
     

          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </TooltipProvider>
    </NotificationProvider>
  );
}

const App = () => (
  <AuthProvider>
    <CurrencyProvider>
      <ProfileProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ProfileProvider>
    </CurrencyProvider>
  </AuthProvider>
);

export default App;
