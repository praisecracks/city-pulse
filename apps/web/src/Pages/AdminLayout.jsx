import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import Logo from "../assets/logo2.png";
import { Button, Icon, Dropdown, UserMenu, Badge } from "../components/admin/ui";
import AdminSidebar from "../components/admin/AdminSidebar";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/admin-Pulse", label: "Dashboard", icon: "home", badge: null },
    ],
  },
  {
    label: "Management",
    items: [
      { to: "/admin-Pulse/waitlist", label: "Waitlist", icon: "assignment", badge: null },
      { to: "/admin-Pulse/contacts", label: "Contacts", icon: "chat", badge: null },
      { to: "/admin-Pulse/users", label: "Users", icon: "groups", badge: null },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin-Pulse/analytics", label: "Analytics", icon: "bar_chart", badge: null },
    ],
  },
];

export default function AdminLayout() {
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/admin-Pulse/login");
  };

  const currentPath = location.pathname;

  return (
    <div className="flex min-h-screen bg-[#F6F1E6]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-30 p-3 rounded-full bg-[#0E7F7F] text-white shadow-lg"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Icon name="menu" size={24} />
      </button>

      <main className={`flex-1 min-h-screen overflow-auto transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <div className="w-full max-w-[1240px] mx-auto">
          {/* Mobile header - fixed to viewport top */}
          <header className="fixed top-0 left-0 right-0 z-30 bg-[#0E7F7F]/95 backdrop-blur-sm border-b border-[#0E7F7F]/30 lg:hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <img
                  src={Logo}
                  alt="City Pulse"
                  className="h-7 w-auto object-contain"
                />
                <h1 className="font-[Baloo_2] text-lg font-bold text-white">City Pulse Admin</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
              >
                <Icon name="menu" size={24} className="text-white" />
              </button>
            </div>
          </header>
          {/* Mobile header spacer */}
          <div className="h-16 lg:hidden" aria-hidden="true" />

          {/* Desktop header */}
          <header className="hidden lg:sticky lg:top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#14232B]/5">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center gap-4">
                <h1 className="font-[Baloo_2] text-xl font-bold text-[#14232B]">
                  {currentPath === "/admin-Pulse" ? "Dashboard" : currentPath.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block relative">
                  <input
                    type="search"
                    placeholder="Search..."
                    className="w-64 pl-10 pr-4 py-2 bg-[#F6F1E6] border-none rounded-xl text-sm text-[#14232B] placeholder:text-[#14232B]/50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#129E9E]/30"
                    aria-label="Global search"
                  />
                  <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#14232B]/50" />
                </div>
                <Button variant="ghost" size="sm" className="relative">
                  <Icon name="notifications_active" size={20} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">3</span>
                </Button>
                <UserMenu
                  user={user}
                  onProfileClick={() => {}}
                  onSettingsClick={() => {}}
                  onLogoutClick={() => setShowLogoutConfirm(true)}
                />
              </div>
            </div>
          </header>

          <div className="w-full max-w-[1240px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
            <h3 className="font-[Baloo_2] text-xl font-bold text-[#14232B] mb-2">Sign Out?</h3>
            <p className="text-[#14232B]/60 mb-6">Are you sure you want to sign out of the admin panel?</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}