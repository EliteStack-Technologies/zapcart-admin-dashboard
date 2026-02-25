import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Package, Tag, Image, FileText, FolderOpen, Phone, Upload, Menu, X, LogOut, Columns3, ShoppingCart, UserCircle, Users, MessageSquare, TrendingUp, TrendingDown, AlertTriangle, ChevronDown, PackageOpen, Warehouse, Settings } from "lucide-react";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { removeFCMTokenOnLogout } from "@/hooks/useFCM";
// import { NotifyButton } from "./NotifyButton";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Read initial value from localStorage
    const stored = localStorage.getItem('sidebarCollapsed');
    return stored === 'true';
  });
  const [inventoryExpanded, setInventoryExpanded] = useState(() => {
    // Auto-expand if on an inventory page
    const stored = localStorage.getItem('inventoryExpanded');
    return stored === 'true';
  });
  const { logout, user, enquiryMode, inventoryEnabled, zohoEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-expand inventory menu when on inventory pages
  useEffect(() => {
    if (location.pathname.startsWith('/inventory')) {
      setInventoryExpanded(true);
      localStorage.setItem('inventoryExpanded', 'true');
    }
  }, [location.pathname]);
  
  const handleLogout = async () => {
    // Remove FCM token from backend before clearing auth state
    await removeFCMTokenOnLogout();
    logout();
    navigate("/login");
  };

  const toggleInventory = () => {
    const newState = !inventoryExpanded;
    setInventoryExpanded(newState);
    localStorage.setItem('inventoryExpanded', newState.toString());
  };
  
  const allNavItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/orders", icon: ShoppingCart, label: "Orders" },
    { to: "/customers", icon: Users, label: "Customers" },
    { to: "/enquiries", icon: MessageSquare, label: "Enquiries", requireEnquiryMode: true },
    { to: "/products", icon: Package, label: "Products" },
    { to: "/categories", icon: FolderOpen, label: "Categories" },
    { to: "/rows", icon: Columns3, label: "Sections" },
    { to: "/offers", icon: Tag, label: "Offer Tags" },
    { to: "/banners", icon: Image, label: "Banners" },
    { to: "/flyers", icon: FileText, label: "Flyers" },
    // { to: "/upload-images", icon: Upload, label: "Upload Images" },
    { to: "/settings/zoho-books", icon: Settings, label: "Zoho Books", requireZohoEnabled: true },
    { to: "/account", icon: Phone, label: "Account Details" },
    { to: "/profile", icon: UserCircle, label: "Profile" },
  ];

  const inventorySubItems = [
    { to: "/inventory/current-stock", icon: Warehouse, label: "Current Stock" },
    { to: "/inventory/stock-in", icon: TrendingUp, label: "Stock In" },
    { to: "/inventory/stock-out", icon: TrendingDown, label: "Stock Out" },
    { to: "/inventory/low-stock", icon: AlertTriangle, label: "Low Stock" },
  ];
  
  // Filter nav items based on enquiry mode and zoho enabled
  const navItems = allNavItems.filter(item => {
    if (item.requireEnquiryMode) {
      return enquiryMode === true;
    }
    if (item.requireZohoEnabled) {
      return zohoEnabled === true;
    }
    return true;
  });


  
  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Collapsible on desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        ${sidebarCollapsed ? 'w-20' : 'w-64'} h-screen bg-sidebar border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className={`flex flex-col h-full ${sidebarCollapsed ? 'p-2' : 'p-6'}`}>
          <div className={`flex items-center justify-between mb-8 ${sidebarCollapsed ? 'flex-col gap-2' : ''}`}>
            <div className={sidebarCollapsed ? 'flex flex-col items-center' : ''}>
              <h1 className={sidebarCollapsed ? "text-xl font-bold text-sidebar-foreground" : "text-2xl font-bold text-sidebar-foreground"}>
             {sidebarCollapsed ? "" :"ZapGoCart"}   
              </h1>
              {!sidebarCollapsed && (
                <p className="text-sm text-sidebar-foreground/60 mt-1">Management Dashboard</p>
              )}
            </div>
            {/* Collapse/Expand Button for desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex bg-white"
              onClick={() => {
                setSidebarCollapsed((prev) => {
                  localStorage.setItem('sidebarCollapsed', (!prev).toString());
                  return !prev;
                });
              }}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </Button>
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-2 scrollbar-custom scroll-smooth">
            {navItems.map((item) => (
              <div key={item.to}>
                <NavLink
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                  onClick={() => {
                    // Only close sidebar on mobile (when sidebarOpen is true)
                    // Do NOT change collapsed state on desktop
                    if (sidebarOpen) setSidebarOpen(false);
                    // No action for sidebarCollapsed here
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </NavLink>
                
                {/* Insert Inventory Management after Products */}
                {item.to === '/products' && inventoryEnabled && (
                  <div className="space-y-1 mt-1">
                    <button
                      onClick={toggleInventory}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${
                        location.pathname.startsWith('/inventory') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                      } ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                    >
                      <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                        <PackageOpen className="w-5 h-5" />
                        {!sidebarCollapsed && <span className="font-medium">Inventory</span>}
                      </div>
                      {!sidebarCollapsed && (
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform duration-200 ${inventoryExpanded ? 'rotate-180' : ''}`} 
                        />
                      )}
                    </button>
                    
                    {/* Inventory Sub-items */}
                    {inventoryExpanded && !sidebarCollapsed && (
                      <div className="ml-4 space-y-1 border-l-2 border-sidebar-border pl-3">
                        {inventorySubItems.map((subItem) => (
                          <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors text-sm"
                            activeClassName="bg-sidebar-accent/70 text-sidebar-accent-foreground"
                            onClick={() => {
                              if (sidebarOpen) setSidebarOpen(false);
                            }}
                          >
                            <subItem.icon className="w-4 h-4" />
                            <span className="font-medium">{subItem.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User Info and Logout */}
          <div className={`pt-4 border-t border-sidebar-border space-y-3 ${sidebarCollapsed ? 'px-0' : 'px-3'}`}>
            <Button
              variant="outline"
              className={`w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${sidebarCollapsed ? 'px-0 flex justify-center' : ''}`}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto h-screen ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">ZapGoCart</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* <NotifyButton variant="ghost" size="sm" /> */}
            <NotificationBell />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block sticky top-0 z-30 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.name || 'Admin'}</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
