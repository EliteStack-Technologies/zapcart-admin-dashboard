import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Package, Tag, Image, FileText, FolderOpen, Phone, Upload, Menu, X, LogOut, Columns3, ShoppingCart, UserCircle } from "lucide-react";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/orders", icon: ShoppingCart, label: "Orders" },
    { to: "/products", icon: Package, label: "Products" },
    { to: "/categories", icon: FolderOpen, label: "Categories" },
    { to: "/rows", icon: Columns3, label: "Sections" },
    { to: "/offers", icon: Tag, label: "Offer Tags" },
    { to: "/banners", icon: Image, label: "Banners" },
    { to: "/flyers", icon: FileText, label: "Flyers" },
    // { to: "/upload-images", icon: Upload, label: "Upload Images" },
    { to: "/account", icon: Phone, label: "Account Details" },
    { to: "/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on all screen sizes */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-64 h-screen bg-sidebar border-r border-sidebar-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-sidebar-foreground">
                Zapcart
              </h1>
              <p className="text-sm text-sidebar-foreground/60 mt-1">Management Dashboard</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <nav className=" space-y-1 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Info and Logout */}
          <div className="px-3 pt-4 border-t border-sidebar-border space-y-3">
      
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 overflow-y-auto h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Zapcart</h1>
        </div>
        
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
