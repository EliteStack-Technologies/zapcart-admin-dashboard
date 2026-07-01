import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Package, Tag, Image, FileText, FolderOpen, Phone, Upload, Menu, X, LogOut, Columns3, ShoppingCart, UserCircle, Users, MessageSquare, TrendingUp, TrendingDown, AlertTriangle, ChevronDown, PackageOpen, Warehouse, Settings, Building2, ArrowLeftRight, Truck, QrCode, Bell } from "lucide-react";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { removeFCMTokenOnLogout } from "@/hooks/useFCM";
import { registerFCMOnLogin } from "@/hooks/useFCM";
import axiosInstance from "@/services/axiosInstance";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width >= 768 && width < 1450) {
        return true;
      }
    }
    // Read initial value from localStorage
    const stored = localStorage.getItem('sidebarCollapsed');
    return stored === 'true';
  });
  const [isMediumScreen, setIsMediumScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      return width >= 768 && width < 1450;
    }
    return false;
  });
  const [inventoryExpanded, setInventoryExpanded] = useState(() => {
    // Auto-expand if on an inventory page
    const stored = localStorage.getItem('inventoryExpanded');
    return stored === 'true';
  });

  const { logout, user, enquiryMode, inventoryEnabled, zohoEnabled, deliveryManagementEnabled, isRestaurant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Branch admin client switcher state
  const [isBranchAdmin] = useState(() => localStorage.getItem("is_branch_admin") === "true");
  const [assignedClients] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("assigned_clients") || "[]"); } catch { return []; }
  });
  const [branchAdminInfo] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem("branch_admin_info") || "null"); } catch { return null; }
  });
  const [showClientSwitcher, setShowClientSwitcher] = useState(false);
  const [switchingClient, setSwitchingClient] = useState(false);

  // Auto-expand inventory menu when on inventory pages
  useEffect(() => {
    if (location.pathname.startsWith('/inventory')) {
      setInventoryExpanded(true);
      localStorage.setItem('inventoryExpanded', 'true');
    }
  }, [location.pathname]);

  // Handle responsive sidebar collapsing and screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMed = width >= 768 && width < 1450;
      setIsMediumScreen(isMed);
      if (isMed) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const handleLogout = async () => {
    await removeFCMTokenOnLogout();
    logout();
    navigate("/login");
  };

  const handleSwitchClient = async (client: any) => {
    if (switchingClient) return;
    setSwitchingClient(true);
    try {
      const branchToken = localStorage.getItem("branch_admin_token");
      if (!branchToken) throw new Error("Branch admin session expired");

      const response = await axiosInstance.post(
        `/api/v1/branch-admins/switch-client/${client._id}`,
        {},
        { headers: { Authorization: `Bearer ${branchToken}` } }
      );

      if (!response?.data?.accessToken) throw new Error("Failed to switch client");

      localStorage.setItem("accessToken", response.data.accessToken);

      if (response.data.client) {
        const userData = {
          id: response.data.client.id,
          email: response.data.client.email,
          name: response.data.client.client_name || response.data.client.business_name,
          business_name: response.data.client.business_name,
          business_type: response.data.client.business_type,
          enquiry_mode: response.data.client.enquiry_mode || false,
          inventory_enabled: response.data.client.inventory_enabled || false,
          zoho_enabled: response.data.client.zoho_enabled || false,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("enquiry_mode", String(response.data.client.enquiry_mode || false));
        localStorage.setItem("inventory_enabled", String(response.data.client.inventory_enabled || false));
        localStorage.setItem("delivery_management_enabled", String(response.data.client.delivery_management_enabled || false));
        localStorage.setItem("zoho_enabled", String(response.data.client.zoho_enabled || false));
        if (response.data.client.sub_domain_name) {
          localStorage.setItem("sub_domain_name", response.data.client.sub_domain_name);
        }

        if (response.data.client.currency_id) {
          localStorage.setItem("currency", JSON.stringify(response.data.client.currency_id));
          window.dispatchEvent(new Event("currencyUpdated"));
        }
      }

      // Reload to reinitialize all contexts with new client data
      window.location.href = "/";
    } catch (err: any) {
      console.error("Switch client error:", err);
      alert(err.response?.data?.message || err.message || "Failed to switch client");
    } finally {
      setSwitchingClient(false);
      setShowClientSwitcher(false);
    }
  };

  const toggleInventory = () => {
    const newState = !inventoryExpanded;
    setInventoryExpanded(newState);
    localStorage.setItem('inventoryExpanded', newState.toString());
  };



  const allNavItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/orders", icon: ShoppingCart, label: "Orders" },
    // { to: "/customers", icon: Users, label: "Customers" },
    { to: "/enquiries", icon: MessageSquare, label: "Enquiries", requireEnquiryMode: true },
    { to: "/products", icon: Package, label: "Products" },
    { to: "/categories", icon: FolderOpen, label: "Categories" },
    { to: "/rows", icon: Columns3, label: "Sections" },
    { to: "/offers", icon: Tag, label: "Offer Tags" },
    { to: "/banners", icon: Image, label: "Banners" },
    { to: "/flyers", icon: FileText, label: "Flyers" },
    // { to: "/upload-images", icon: Upload, label: "Upload Images" },
    { to: "/settings/notifications", icon: Bell, label: "WhatsApp Notifications" },
    { to: "/settings/zoho-books", icon: Settings, label: "Zoho Books", requireZohoEnabled: true },
    { to: "/delivery-agents", icon: Truck, label: "Delivery Management", requireDeliveryManagement: true },
    { to: "/table-qr-codes", icon: QrCode, label: "Table QR Codes", requireRestaurant: true },
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
    if ('requireEnquiryMode' in item && item.requireEnquiryMode) {
      return enquiryMode === true;
    }
    if ('requireZohoEnabled' in item && item.requireZohoEnabled) {
      return zohoEnabled === true;
    }
    if ('requireDeliveryManagement' in item && item.requireDeliveryManagement) {
      return deliveryManagementEnabled === true;
    }
    if ('requireRestaurant' in item && item.requireRestaurant) {
      return isRestaurant === true;
    }
    return true;
  });



  return (
    <div className="flex h-screen bg-background">
      <aside className={`
        fixed inset-y-0 left-0 z-50 hidden md:flex flex-col print:!hidden
        ${sidebarCollapsed ? 'w-20' : (isMediumScreen ? 'w-56' : 'w-64')} h-screen bg-sidebar border-r border-sidebar-border
        transition-all duration-300 ease-in-out
      `}>
        <div className={`flex flex-col h-full ${sidebarCollapsed ? 'p-2' : (isMediumScreen ? 'p-4' : 'p-6')}`}>
          <div className={`flex items-center justify-between ${sidebarCollapsed ? 'mb-8 flex-col gap-2' : (isMediumScreen ? 'mb-6' : 'mb-8')}`}>
            <div className={sidebarCollapsed ? 'flex flex-col items-center' : ''}>
              <h1 className={sidebarCollapsed ? "text-xl font-bold text-sidebar-foreground" : (isMediumScreen ? "text-xl font-bold text-sidebar-foreground" : "text-2xl font-bold text-sidebar-foreground")}>
                {sidebarCollapsed ? "" : "ZapGoCart"}
              </h1>
              {!sidebarCollapsed && (
                <p className={`${isMediumScreen ? 'text-xs' : 'text-sm'} text-sidebar-foreground/60 mt-1`}>Management Dashboard</p>
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
                  className={`flex items-center ${sidebarCollapsed ? 'justify-center gap-3 px-3 py-2.5' : (isMediumScreen ? 'gap-2 px-2.5 py-2' : 'gap-3 px-3 py-2.5')} rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors`}
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                >
                  <item.icon className={isMediumScreen ? "w-4 h-4" : "w-5 h-5"} />
                  {!sidebarCollapsed && <span className={`font-medium ${isMediumScreen ? 'text-xs' : 'text-sm'}`}>{item.label}</span>}
                </NavLink>

                {/* Insert Inventory Management after Products */}
                {item.to === '/products' && inventoryEnabled && (
                  <div className="space-y-1 mt-1">
                    <button
                      onClick={toggleInventory}
                      className={`w-full flex items-center rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${location.pathname.startsWith('/inventory') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                        } ${sidebarCollapsed ? 'justify-center gap-3 px-3 py-2.5' : (isMediumScreen ? 'justify-between gap-2 px-2.5 py-2' : 'justify-between gap-3 px-3 py-2.5')}`}
                    >
                      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center gap-3' : (isMediumScreen ? 'gap-2' : 'gap-3')}`}>
                        <PackageOpen className={isMediumScreen ? "w-4 h-4" : "w-5 h-5"} />
                        {!sidebarCollapsed && <span className={`font-medium ${isMediumScreen ? 'text-xs' : 'text-sm'}`}>Inventory</span>}
                      </div>
                      {!sidebarCollapsed && (
                        <ChevronDown
                          className={`${isMediumScreen ? 'w-3.5 h-3.5' : 'w-4 h-4'} transition-transform duration-200 ${inventoryExpanded ? 'rotate-180' : ''}`}
                        />
                      )}
                    </button>

                    {/* Inventory Sub-items */}
                    {inventoryExpanded && !sidebarCollapsed && (
                      <div className={`${isMediumScreen ? 'ml-2 pl-2' : 'ml-4 pl-3'} space-y-1 border-l-2 border-sidebar-border`}>
                        {inventorySubItems.map((subItem) => (
                          <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            className={`flex items-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors ${isMediumScreen ? 'gap-2 px-2 py-1.5 text-xs' : 'gap-3 px-3 py-2 text-sm'}`}
                            activeClassName="bg-sidebar-accent/70 text-sidebar-accent-foreground"
                          >
                            <subItem.icon className={isMediumScreen ? "w-3.5 h-3.5" : "w-4 h-4"} />
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
          <div className={`pt-4 border-t border-sidebar-border ${sidebarCollapsed ? 'px-0' : (isMediumScreen ? 'px-1' : 'px-3')}`}>
            <Button
              variant="outline"
              className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${sidebarCollapsed ? 'px-0 flex justify-center gap-2' : (isMediumScreen ? 'px-2 py-1.5 gap-1.5 text-xs' : 'px-3 py-2 gap-2 text-sm')}`}
              onClick={handleLogout}
            >
              <LogOut className={isMediumScreen ? "w-3.5 h-3.5" : "w-4 h-4"} />
              {!sidebarCollapsed && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 w-full flex flex-col min-h-screen ${sidebarCollapsed ? 'md:ml-20' : (isMediumScreen ? 'md:ml-56' : 'md:ml-64')} transition-all duration-300 print:!ml-0`}>
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-4 py-2 flex items-center justify-between print:!hidden">
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-primary leading-tight">ZapGoCart</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              {user?.business_name || 'Administrator'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </div>

        {/* Desktop Header */}
        <div className={`hidden md:block sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b ${isMediumScreen ? 'px-4 py-3' : 'px-6 py-4'} print:!hidden`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`${isMediumScreen ? 'text-lg' : 'text-xl'} font-bold text-foreground`}>Admin Dashboard</h1>
              <div className="flex items-center gap-2">
                <p className={`${isMediumScreen ? 'text-xs' : 'text-sm'} text-muted-foreground font-medium`}>Welcome back, {user?.name || 'Admin'}</p>
                <span className="text-xs text-muted-foreground/40">|</span>
                <p className="text-xs font-bold text-primary uppercase tracking-wide">{user?.business_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Branch Admin Client Switcher */}
              {isBranchAdmin && assignedClients.length > 1 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-sm"
                    onClick={() => setShowClientSwitcher(!showClientSwitcher)}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Switch Client
                    <ChevronDown className={`w-3 h-3 transition-transform ${showClientSwitcher ? 'rotate-180' : ''}`} />
                  </Button>

                  {showClientSwitcher && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-background border rounded-lg shadow-xl z-50 py-2 max-h-80 overflow-y-auto">
                      <div className="px-3 py-2 border-b">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {branchAdminInfo?.name || 'Branch Admin'} — Assigned Clients
                        </p>
                      </div>
                      {assignedClients.map((client: any) => (
                        <button
                          key={client._id}
                          onClick={() => handleSwitchClient(client)}
                          disabled={switchingClient || client._id === user?.id}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors ${client._id === user?.id ? 'bg-primary/5 border-l-2 border-primary' : ''
                            } ${switchingClient ? 'opacity-50' : ''}`}
                        >
                          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{client.business_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{client.client_name}</p>
                          </div>
                          {client._id === user?.id && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Current</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <NotificationBell />
            </div>
          </div>
        </div>

        <div className={`flex-1 ${isMediumScreen ? 'p-4 md:p-6 pb-32 md:pb-6' : 'p-2 sm:p-6 md:p-8 pb-32 md:pb-8'} print:!p-0`}>
          {children}
        </div>

        {/* Mobile Bottom Navigation - Floating Dock */}
        <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm print:!hidden">
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


