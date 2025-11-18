import { Home, Package, Tag, Image, FileText, FolderOpen, Phone } from "lucide-react";
import { NavLink } from "./NavLink";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/products", icon: Package, label: "Products" },
    { to: "/categories", icon: FolderOpen, label: "Categories" },
    { to: "/offers", icon: Tag, label: "Offer Tags" },
    { to: "/banners", icon: Image, label: "Banners" },
    { to: "/flyers", icon: FileText, label: "Flyers" },
    { to: "/account", icon: Phone, label: "Account Details" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            Business Hub
          </h1>
          <p className="text-sm text-sidebar-foreground/60 mt-1">Management Dashboard</p>
        </div>
        
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
