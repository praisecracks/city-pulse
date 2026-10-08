import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../utils/adminApi";
import { Card, CardTitle, CardContent, StatCard, Button, Icon, Badge, AreaChart, DonutChart, Dropdown } from "../components/admin/ui";
import { DashboardSkeleton } from "../components/admin/ui/Skeleton";

const STATUS_BADGES = {
  new: { variant: "primary", label: "New" },
  read: { variant: "warning", label: "Read" },
  replied: { variant: "success", label: "Replied" },
  archived: { variant: "neutral", label: "Archived" },
};

const QUICK_ACTIONS = [
  { label: "View Waitlist", href: "/admin-pulse/waitlist", icon: "assignment", color: "bg-[#E4F3F1] text-[#129E9E]" },
  { label: "Check Contacts", href: "/admin-pulse/contacts", icon: "chat", color: "bg-[#F5E3E0] text-[#B5453B]" },
  { label: "Manage Users", href: "/admin-pulse/users", icon: "groups", color: "bg-[#F0EADB] text-[#14232B]" },
  { label: "Analytics", href: "/admin-pulse/analytics", icon: "bar_chart", color: "bg-[#E4F3F1] text-[#0E7F7F]" },
];

const SAMPLE_TIMELINE = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split("T")[0],
    pageviews: Math.floor(Math.random() * 500) + 50,
    events: Math.floor(Math.random() * 50) + 5,
  };
});

const SAMPLE_CONTACT_STATUS = [
  { label: "New", value: 23, color: "#129E9E" },
  { label: "Read", value: 12, color: "#14232B" },
  { label: "Replied", value: 8, color: "#0E7F7F" },
  { label: "Archived", value: 5, color: "#9B9285" },
];

const SAMPLE_WAITLIST = [
  { label: "Residents", value: 127 },
  { label: "Merchants", value: 43 },
];

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);
  const [contactStatus, setContactStatus] = useState([]);
  const [recentWaitlist, setRecentWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [summaryRes, timelineRes, contactsRes, waitlistRes, contactStatusRes] = await Promise.all([
          adminApi.summary(token),
          adminApi.timeline(token, 30),
          adminApi.contacts(token, 1, 5),
          adminApi.waitlist(token, 1, 5),
          adminApi.contacts(token, 1, 1000), // Get all contacts for status breakdown
        ]);
        setSummary(summaryRes.data);
        setTimeline(timelineRes.data);
        setRecentContacts(contactsRes.data.data);
        setContactStatus(contactStatusRes.data.data);
        setRecentWaitlist([...waitlistRes.data.users.data, ...waitlistRes.data.agents.data].slice(0, 5));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [token]);

  const statsCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: "Residents",
        value: summary.waitlist?.users ?? 0,
        change: summary.views?.week ? Math.round((summary.views.today / Math.max(summary.views.week / 7, 1)) * 100) - 100 : 0,
        changeLabel: "vs daily avg",
        icon: "person_pin_circle",
        iconColor: "text-[#129E9E]",
        iconBg: "bg-[#E4F3F1]",
        trend: summary.views?.today > (summary.views?.week / 7 || 0) ? "up" : "down",
      },
      {
        label: "Merchants",
        value: summary.waitlist?.agents ?? 0,
        change: summary.events?.formSubmits ? Math.round((summary.events.formSubmits / Math.max(summary.events.formStarts, 1)) * 100) - 100 : 0,
        changeLabel: "conversion",
        icon: "storefront",
        iconColor: "text-[#0E7F7F]",
        iconBg: "bg-[#E4F3F1]",
        trend: summary.events?.formSubmits > summary.events?.formStarts / 2 ? "up" : "neutral",
      },
      {
        label: "Messages",
        value: summary.contacts ?? 0,
        change: summary.contacts > 0 ? 12 : 0,
        changeLabel: "this week",
        icon: "chat",
        iconColor: "text-[#B5453B]",
        iconBg: "bg-[#F5E3E0]",
        trend: "up",
      },
      {
        label: "App Users",
        value: summary.users ?? 0,
        change: summary.users > 0 ? 8 : 0,
        changeLabel: "this month",
        icon: "groups",
        iconColor: "text-[#14232B]",
        iconBg: "bg-[#F0EADB]",
        trend: "up",
      },
    ];
  }, [summary]);

  const chartColors = ["#129E9E", "#B5453B"];

  const timelineData = useMemo(() => {
    if (!timeline.length) return SAMPLE_TIMELINE;
    return timeline.slice(-30).map((d) => ({
      date: d.date,
      pageviews: d.pageviews,
      events: d.events,
    }));
  }, [timeline]);

  const waitlistDistribution = useMemo(() => {
    if (!summary) return SAMPLE_WAITLIST;
    const users = summary.waitlist?.users ?? 0;
    const agents = summary.waitlist?.agents ?? 0;
    if (users === 0 && agents === 0) return SAMPLE_WAITLIST;
    return [
      { label: "Residents", value: users },
      { label: "Merchants", value: agents },
    ];
  }, [summary]);

  const contactStatusDistribution = useMemo(() => {
    if (!contactStatus.length) return SAMPLE_CONTACT_STATUS;
    const counts = contactStatus.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([status, value]) => ({
      label: STATUS_BADGES[status]?.label || status,
      value,
      color: STATUS_BADGES[status]?.variant === "primary" ? "#129E9E" :
             STATUS_BADGES[status]?.variant === "success" ? "#0E7F7F" :
             STATUS_BADGES[status]?.variant === "warning" ? "#14232B" : "#9B9285",
    }));
  }, [contactStatus]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1240px] p-4 lg:p-8">
        <div className="rounded-2xl bg-red-50 p-6 text-red-700 flex items-center gap-4">
          <Icon name="error" size={24} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold">Failed to load dashboard</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[Baloo_2] text-3xl font-bold text-[#14232B]">Dashboard</h1>
          <p className="mt-1 text-[#14232B]/60">Welcome back, {user?.name?.split(" ")[0] || "Admin"}. Here's what's happening.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Icon name="refresh" size={16} />}>
            Refresh
          </Button>
          <Dropdown
            trigger={({ isOpen, toggle }) => (
              <Button variant="primary" size="sm" onClick={toggle} rightIcon={<Icon name={isOpen ? "expand_less" : "expand_more"} size={16} />}>
                Export
              </Button>
            )}
            items={[
              { label: "Export CSV", icon: <Icon name="table_chart" size={18} />, onClick: () => {} },
              { label: "Export PDF", icon: <Icon name="picture_as_pdf" size={18} />, onClick: () => {} },
              { divider: true },
              { label: "Schedule Report", icon: <Icon name="schedule" size={18} />, onClick: () => {} },
            ]}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Chart */}
          <Card>
            <CardTitle
              title="Activity Overview"
              subtitle="Page views and events over the last 30 days"
              action={
                <Dropdown
                  trigger={({ isOpen, toggle }) => (
                    <Button variant="ghost" size="sm" onClick={toggle} rightIcon={<Icon name={isOpen ? "expand_less" : "expand_more"} size={16} />}>
                      30 Days
                    </Button>
                  )}
                  items={[
                    { label: "7 Days", onClick: () => {} },
                    { label: "30 Days", onClick: () => {} },
                    { label: "90 Days", onClick: () => {} },
                  ]}
                />
              }
            />
            <CardContent>
              <div className="h-[300px]">
                <AreaChart
                  data={timelineData}
                  xKey="date"
                  yKeys={["pageviews", "events"]}
                  colors={chartColors}
                  height={300}
                />
              </div>
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#14232B]/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#129E9E]" />
                  <span className="text-sm text-[#14232B]/70">Page Views</span>
                  <span className="text-sm font-semibold text-[#14232B] ml-2">
                    {timelineData.reduce((sum, d) => sum + d.pageviews, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#B5453B]" />
                  <span className="text-sm text-[#14232B]/70">Events</span>
                  <span className="text-sm font-semibold text-[#14232B] ml-2">
                    {timelineData.reduce((sum, d) => sum + d.events, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardTitle title="Waitlist Distribution" subtitle="Residents vs Merchants" />
              <CardContent>
                <div className="h-[250px]">
                  <DonutChart
                    data={waitlistDistribution}
                    labelKey="label"
                    valueKey="value"
                    colors={["#129E9E", "#0E7F7F"]}
                    height={250}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardTitle title="Contact Status" subtitle="Message status breakdown" />
              <CardContent>
                <div className="h-[250px]">
                  <DonutChart
                    data={contactStatusDistribution}
                    labelKey="label"
                    valueKey="value"
                    colors={contactStatusDistribution.map((d) => d.color)}
                    height={250}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardTitle title="Quick Actions" subtitle="Common administrative tasks" />
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[#14232B]/5 hover:border-[#129E9E]/30 hover:bg-[#FAF6EE] transition-all"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}>
                      <Icon name={action.icon} size={24} />
                    </div>
                    <span className="text-sm font-medium text-[#14232B] text-center">{action.label}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Contacts */}
          <Card>
            <CardTitle
              title="Recent Contacts"
              subtitle="Latest messages from users"
              action={
                <a href="/admin-pulse/contacts" className="text-sm text-[#129E9E] font-medium hover:underline">
                  View all
                </a>
              }
            />
            <CardContent className="p-0">
              <div className="divide-y divide-[#14232B]/5">
                {recentContacts.length === 0 ? (
                  <div className="p-6 text-center text-[#14232B]/50">
                    <Icon name="chat" size={32} className="mx-auto text-[#14232B]/20 mb-2" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  recentContacts.map((contact) => (
                    <div key={contact._id} className="p-4 hover:bg-[#FAF6EE]/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[#14232B] truncate">{contact.name}</p>
                            <Badge variant={STATUS_BADGES[contact.status]?.variant || "neutral"} size="xs">
                              {STATUS_BADGES[contact.status]?.label || contact.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-[#14232B]/60 truncate">{contact.message}</p>
                          <p className="mt-1 text-xs text-[#14232B]/40 font-mono">
                            {new Date(contact.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Waitlist Signups */}
          <Card>
            <CardTitle
              title="Recent Signups"
              subtitle="New waitlist registrations"
              action={
                <a href="/admin-pulse/waitlist" className="text-sm text-[#129E9E] font-medium hover:underline">
                  View all
                </a>
              }
            />
            <CardContent className="p-0">
              <div className="divide-y divide-[#14232B]/5">
                {recentWaitlist.length === 0 ? (
                  <div className="p-6 text-center text-[#14232B]/50">
                    <Icon name="person_add" size={32} className="mx-auto text-[#14232B]/20 mb-2" />
                    <p>No signups yet</p>
                  </div>
                ) : (
                  recentWaitlist.map((signup) => (
                    <div key={signup._id} className="p-4 hover:bg-[#FAF6EE]/50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            signup.businessName ? "bg-[#F0EADB] text-[#14232B]" : "bg-[#E4F3F1] text-[#129E9E]"
                          }`}>
                            <Icon name={signup.businessName ? "storefront" : "person_pin_circle"} size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-[#14232B] truncate max-w-[200px]">
                              {signup.businessName || signup.fullName}
                            </p>
                            <p className="text-xs text-[#14232B]/50 font-mono">{signup.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#14232B]/50">
                            {new Date(signup.createdAt).toLocaleDateString()}
                          </p>
                          <Badge variant="primary" size="xs">
                            {signup.businessName ? "Merchant" : "Resident"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}