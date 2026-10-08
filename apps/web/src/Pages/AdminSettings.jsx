import { Card, CardTitle, CardContent, CardFooter, Button, Input, Select, Badge, Icon } from "../components/admin/ui";
import { useAuth } from "../contexts/AuthContext";

export default function AdminSettings() {
  const { user } = useAuth();

  const settingsSections = [
    {
      title: "Profile",
      subtitle: "Manage your admin account settings",
      icon: "person",
      fields: [
        { key: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
        { key: "email", label: "Email", type: "email", placeholder: "admin@citypulse.com" },
        { key: "phone", label: "Phone", type: "tel", placeholder: "+1 (555) 000-0000" },
      ],
    },
    {
      title: "Security",
      subtitle: "Password and authentication settings",
      icon: "security",
      fields: [
        { key: "currentPassword", label: "Current Password", type: "password" },
        { key: "newPassword", label: "New Password", type: "password" },
        { key: "confirmPassword", label: "Confirm Password", type: "password" },
      ],
      actions: (
        <Button variant="primary" size="sm">Update Password</Button>
      ),
    },
    {
      title: "Notifications",
      subtitle: "Configure notification preferences",
      icon: "notifications_active",
      fields: [
        { key: "emailNotifications", label: "Email Notifications", type: "toggle", description: "Receive email notifications for new contacts and waitlist signups" },
        { key: "weeklyReports", label: "Weekly Reports", type: "toggle", description: "Receive weekly analytics reports via email" },
        { key: "alertThreshold", label: "Alert Threshold", type: "select", options: [
          { value: "10", label: "10+ new items" },
          { value: "50", label: "50+ new items" },
          { value: "100", label: "100+ new items" },
        ], description: "Get notified when waitlist exceeds threshold" },
      ],
    },
    {
      title: "Appearance",
      subtitle: "Customize the admin panel appearance",
      icon: "palette",
      fields: [
        { key: "theme", label: "Theme", type: "select", options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ] },
        { key: "sidebarCollapsed", label: "Collapse Sidebar by Default", type: "toggle", description: "Start with collapsed sidebar on desktop" },
        { key: "compactMode", label: "Compact Mode", type: "toggle", description: "Reduce padding and spacing for denser UI" },
      ],
    },
    {
      title: "Danger Zone",
      subtitle: "Irreversible actions",
      icon: "warning",
      fields: [],
      actions: (
        <div className="flex gap-3">
          <Button variant="danger" size="sm">Export All Data</Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">Delete Account</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="font-[Baloo_2] text-3xl font-bold text-[#14232B]">Settings</h1>
        <p className="mt-1 text-[#14232B]/60">Manage your admin panel preferences and account settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="p-6 border-b border-[#14232B]/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#129E9E] flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "AD"}
                  </div>
                  <div>
                    <p className="font-semibold text-[#14232B]">{user?.name || "Administrator"}</p>
                    <p className="text-sm text-[#14232B]/50 font-mono">{user?.email || "admin@citypulse.com"}</p>
                  </div>
                </div>
              </div>
              <nav className="p-2" aria-label="Settings navigation">
                {settingsSections.map((section, index) => (
                  <button
                    key={section.title}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                      index === 0 ? "bg-[#E4F3F1] text-[#129E9E]" : "text-[#14232B]/70 hover:bg-[#F6F1E6] hover:text-[#14232B]"
                    }`}
                  >
                    <Icon name={section.icon} size={20} className={index === 0 ? "text-[#129E9E]" : "text-[#14232B]/50"} />
                    <span>{section.title}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          <Card>
            <CardTitle title="Admin Info" subtitle="System information" />
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#14232B]/60">Version</span>
                <span className="font-medium text-[#14232B]">2.1.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#14232B]/60">Environment</span>
                <span className="font-medium text-[#14232B]">Production</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#14232B]/60">API Status</span>
                <Badge variant="success" size="xs">Connected</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#14232B]/60">Last Sync</span>
                <span className="font-medium text-[#14232B]">2 minutes ago</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {settingsSections.map((section, index) => (
            <Card key={section.title}>
              <CardTitle
                title={section.title}
                subtitle={section.subtitle}
                className="flex items-center gap-2"
              >
                <Icon name={section.icon} size={22} className="text-[#129E9E]" />
              </CardTitle>
              <CardContent className="space-y-6">
                {section.fields.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.fields.map((field) => (
                      <div key={field.key} className={field.type === "toggle" ? "md:col-span-2" : ""}>
                        {field.type === "toggle" ? (
                          <label className="flex items-center justify-between cursor-pointer">
                            <div>
                              <p className="font-medium text-[#14232B]">{field.label}</p>
                              <p className="text-sm text-[#14232B]/50 mt-0.5">{field.description}</p>
                            </div>
                            <button
                              className="relative w-11 h-6 bg-[#F6F1E6] rounded-full transition-colors"
                              role="switch"
                              aria-checked="false"
                            >
                              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" />
                            </button>
                          </label>
                        ) : field.type === "select" ? (
                          <Select
                            label={field.label}
                            options={field.options}
                            placeholder="Select..."
                          />
                        ) : (
                          <Input
                            label={field.label}
                            type={field.type}
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {section.actions && (
                  <div className="pt-4 border-t border-[#14232B]/5">
                    {section.actions}
                  </div>
                )}
                {section.fields.length === 0 && !section.actions && (
                  <p className="text-[#14232B]/50 text-center py-8">
                    {section.title === "Danger Zone" && (
                      <div className="space-y-4">
                        <p className="font-medium text-[#14232B]">Dangerous actions that cannot be undone.</p>
                        <div className="flex justify-center gap-3">
                          <Button variant="danger" size="sm">Export All Data</Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">Delete Account</Button>
                        </div>
                      </div>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}