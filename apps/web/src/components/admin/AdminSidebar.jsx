import { NavLink, useLocation } from "react-router-dom";
import Logo from "../../assets/logo2.png";
import { useAuth } from "../../contexts/AuthContext";
import { Icon } from "../admin/ui";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      {
        to: "/admin-pulse",
        label: "Dashboard",
        icon: "home",
        badge: null,
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        to: "/admin-pulse/waitlist",
        label: "Waitlist",
        icon: "assignment",
        badge: null,
      },
      {
        to: "/admin-pulse/contacts",
        label: "Contacts",
        icon: "chat",
        badge: null,
      },
      {
        to: "/admin-pulse/users",
        label: "Users",
        icon: "groups",
        badge: null,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        to: "/admin-pulse/analytics",
        label: "Analytics",
        icon: "bar_chart",
        badge: null,
      },
    ],
  },
];

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  onLogoutClick,
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        bg-[#096B6B]
        border-r border-white/10
        flex flex-col
        transform transition-all duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${sidebarCollapsed ? "w-20" : "w-64"}
      `}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div
        className={`
          p-4
          border-b border-white/10
          flex items-center
          ${sidebarCollapsed ? "justify-center" : "justify-between"}
        `}
      >
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={Logo}
              alt="City Pulse"
              className="h-8 w-auto object-contain flex-shrink-0"
            />

            <h1 className="font-[Baloo_2] text-lg font-bold text-white truncate">
              City Pulse Admin
            </h1>
          </div>
        )}

        {sidebarCollapsed && (
          <img
            src={Logo}
            alt="City Pulse"
            className="h-8 w-auto object-contain"
          />
        )}

        <button
          className={`
            p-2 rounded-lg
            text-white/70
            hover:bg-white/10
            hover:text-white
            transition-colors
            ${sidebarCollapsed ? "ml-auto" : "lg:hidden"}
          `}
          onClick={() => setSidebarOpen(false)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Close sidebar"}
        >
          <Icon
            name={sidebarCollapsed ? "chevron_right" : "close"}
            size={20}
            className="text-white"
          />
        </button>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-3 py-4 overflow-y-auto"
        aria-label="Admin navigation"
      >
        {NAV_SECTIONS.map((section) => (
          <div
            key={section.label}
            className={sidebarCollapsed ? "mb-3" : "mb-5"}
          >
            {!sidebarCollapsed && (
              <h2 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                {section.label}
              </h2>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  currentPath === item.to ||
                  (item.to !== "/admin-pulse" &&
                    currentPath.startsWith(item.to + "/"));

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() =>
                      window.innerWidth < 1024 && setSidebarOpen(false)
                    }
                    className={`
                      relative
                      flex items-center
                      gap-3
                      px-3 py-2.5
                      rounded-xl
                      text-sm font-medium
                      transition-all duration-200
                      ${
                        sidebarCollapsed
                          ? "justify-center"
                          : ""
                      }

                      ${
                        isActive
                          ? `
                            bg-white/[0.14]
                            text-white
                            shadow-sm
                          `
                          : `
                            text-white/75
                            hover:bg-white/[0.07]
                            hover:text-white
                          `
                      }

                      ${item.badge ? "pr-8" : ""}
                    `}
                    aria-current={isActive ? "page" : undefined}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {/* Active indicator */}
                    {isActive && !sidebarCollapsed && (
                      <span
                        className="
                          absolute
                          left-0
                          top-1/2
                          -translate-y-1/2
                          h-6
                          w-1
                          bg-white
                          rounded-r-full
                        "
                        aria-hidden="true"
                      />
                    )}

                    <Icon
                      name={item.icon}
                      size={20}
                      className="text-white flex-shrink-0"
                      aria-hidden="true"
                    />

                    {!sidebarCollapsed && (
                      <span className="truncate">
                        {item.label}
                      </span>
                    )}

                    {item.badge && !sidebarCollapsed && (
                      <span
                        className="
                          absolute
                          right-3
                          px-1.5 py-0.5
                          text-[10px]
                          font-semibold
                          bg-red-500
                          text-white
                          rounded-full
                        "
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onLogoutClick}
          className={`
            w-full
            flex items-center
            gap-2
            px-3 py-2.5
            rounded-xl
            text-sm font-medium
            text-white/70
            hover:bg-white/[0.07]
            hover:text-white
            transition-colors
            ${sidebarCollapsed ? "justify-center" : ""}
          `}
          title={sidebarCollapsed ? "Sign out" : undefined}
        >
          <Icon
            name="logout"
            size={20}
            className="text-red-300 flex-shrink-0"
            aria-hidden="true"
          />

          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse / Expand */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="
            w-full
            p-2
            rounded-lg
            text-white/50
            hover:bg-white/[0.07]
            hover:text-white
            transition-colors
          "
          aria-label={
            sidebarCollapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          <Icon
            name={sidebarCollapsed ? "chevron_right" : "chevron_left"}
            size={20}
            className="mx-auto"
          />
        </button>
      </div>
    </aside>
  );
}
