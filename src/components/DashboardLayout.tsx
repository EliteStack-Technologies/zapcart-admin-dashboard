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
      {/* Sidebar - Desktop Only */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col
        ${sidebarCollapsed ? 'w-20' : 'w-64'} h-screen bg-sidebar border-r border-sidebar-border
        transition-all duration-300 ease-in-out
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
              className="bg-white"
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
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-2 scrollbar-custom scroll-smooth">
            {navItems.map((item) => (
              <div key={item.to}>
                <NavLink
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
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

          {/* Logout */}
          <div className={`pt-4 border-t border-sidebar-border ${sidebarCollapsed ? 'px-0' : 'px-3'}`}>
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
      <main className={`flex-1 flex flex-col min-h-screen ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-3 py-2 flex items-center justify-between">
          <h1 className="text-lg font-black text-black">ZapGoCart</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground font-medium">Welcome back, {user?.name || 'Admin'}</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-2 sm:p-6 lg:p-8 pb-32 lg:pb-8">
          {children}
        </div>

        {/* Mobile Bottom Navigation - Floating Dock */}
        <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm">
          <div className="bg-background/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex items-center justify-around p-2 py-3 ring-1 ring-black/5">
            <NavLink
              to="/orders"
              className="group flex flex-col items-center gap-1.5 p-2 px-4 rounded-xl text-muted-foreground transition-all duration-300 hover:text-primary"
              activeClassName="text-primary bg-primary/10 shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]"
            >
              <ShoppingCart className="w-6 h-6 transition-transform group-active:scale-90" />
              <span className="text-[10px] font-black uppercase tracking-widest">Orders</span>
            </NavLink>

            <div className="w-[1px] h-8 bg-border/50" />

            <NavLink
              to="/customers"
              className="group flex flex-col items-center gap-1.5 p-2 px-4 rounded-xl text-muted-foreground transition-all duration-300 hover:text-primary"
              activeClassName="text-primary bg-primary/10 shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]"
            >
              <Users className="w-6 h-6 transition-transform group-active:scale-90" />
              <span className="text-[10px] font-black uppercase tracking-widest">Customers</span>
            </NavLink>

            <div className="w-[1px] h-8 bg-border/50" />

            <button
              onClick={handleLogout}
              className="group flex flex-col items-center gap-1.5 p-2 px-4 rounded-xl text-red-500/80 transition-all duration-300 hover:text-red-600 active:bg-red-50"
            >
              <LogOut className="w-6 h-6 transition-transform group-active:scale-90" />
              <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
};


export default DashboardLayout;


