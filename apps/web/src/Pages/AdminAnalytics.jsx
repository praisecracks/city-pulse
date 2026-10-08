import { Card, CardTitle, CardContent, StatCard, Button, Icon, Badge, AreaChart, DonutChart, Dropdown } from "../components/admin/ui";
import { AnalyticsSkeleton } from "../components/admin/ui/Skeleton";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../utils/adminApi";
import { useEffect, useState, useMemo } from "react";

const SAMPLE_TIMELINE = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split("T")[0],
    pageviews: Math.floor(Math.random() * 500) + 50,
    events: Math.floor(Math.random() * 50) + 5,
  };
});

const SAMPLE_EVENT_TYPES = [
  { label: "Page Views", value: 12500 },
  { label: "Form Starts", value: 1240 },
  { label: "Form Submits", value: 890 },
];

const SAMPLE_WAITLIST = { users: 127, agents: 43 };
const SAMPLE_SUMMARY = {
  views: { total: 12500, today: 342, week: 2100, month: 8500 },
  events: { formStarts: 1240, formSubmits: 890 },
  waitlist: SAMPLE_WAITLIST,
  contacts: 48,
  users: 312,
};

export default function AdminAnalytics() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState(30);
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const [summaryRes, timelineRes] = await Promise.all([
          adminApi.summary(token),
          adminApi.timeline(token, timeRange),
        ]);
        setSummary(summaryRes.data);
        setTimeline(timelineRes.data);
        setUsingSampleData(!timelineRes.data.length && !summaryRes.data.views?.total);
      } catch (err) {
        setError(err.message);
        setUsingSampleData(true);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [token, timeRange]);

  const statsCards = useMemo(() => {
    const data = summary || (usingSampleData ? SAMPLE_SUMMARY : null);
    if (!data) return [];
    return [
      {
        label: "Total Page Views",
        value: data.views?.total?.toLocaleString() ?? 0,
        change: data.views?.month ? Math.round((data.views.today / Math.max(data.views.month / 30, 1)) * 100) - 100 : 0,
        changeLabel: "vs daily avg",
        icon: "bar_chart",
        iconColor: "text-[#129E9E]",
        iconBg: "bg-[#E4F3F1]",
        trend: data.views?.today > (data.views?.month / 30 || 0) ? "up" : "down",
      },
      {
        label: "Today's Views",
        value: data.views?.today?.toLocaleString() ?? 0,
        change: data.views?.week ? Math.round((data.views.today / Math.max(data.views.week / 7, 1)) * 100) - 100 : 0,
        changeLabel: "vs weekly avg",
        icon: "calendar_today",
        iconColor: "text-[#0E7F7F]",
        iconBg: "bg-[#E4F3F1]",
        trend: data.views?.today > (data.views?.week / 7 || 0) ? "up" : "neutral",
      },
      {
        label: "Form Starts",
        value: data.events?.formStarts?.toLocaleString() ?? 0,
        change: 12,
        changeLabel: "this month",
        icon: "edit",
        iconColor: "text-[#B5453B]",
        iconBg: "bg-[#F5E3E0]",
        trend: "up",
      },
      {
        label: "Form Submits",
        value: data.events?.formSubmits?.toLocaleString() ?? 0,
        change: data.events?.formStarts ? Math.round((data.events.formSubmits / data.events.formStarts) * 100) : 0,
        changeLabel: "conversion rate",
        icon: "check_circle",
        iconColor: "text-[#14232B]",
        iconBg: "bg-[#F0EADB]",
        trend: data.events?.formSubmits > data.events?.formStarts / 2 ? "up" : "neutral",
      },
    ];
  }, [summary, usingSampleData]);

  const chartColors = ["#129E9E", "#B5453B"];

  const timelineData = useMemo(() => {
    if (!timeline.length) return usingSampleData ? SAMPLE_TIMELINE.slice(-timeRange) : [];
    return timeline.slice(-Math.min(timeRange, 90)).map((d) => ({
      date: d.date,
      pageviews: d.pageviews,
      events: d.events,
    }));
  }, [timeline, timeRange, usingSampleData]);

  const eventTypes = useMemo(() => {
    const data = summary || (usingSampleData ? SAMPLE_SUMMARY : null);
    if (!data) return [];
    return [
      { label: "Page Views", value: data.views?.total ?? 0 },
      { label: "Form Starts", value: data.events?.formStarts ?? 0 },
      { label: "Form Submits", value: data.events?.formSubmits ?? 0 },
    ];
  }, [summary, usingSampleData]);

  const waitlistData = useMemo(() => {
    const data = summary || (usingSampleData ? SAMPLE_SUMMARY : null);
    if (!data) return { users: 0, agents: 0 };
    return { users: data.waitlist?.users ?? 0, agents: data.waitlist?.agents ?? 0 };
  }, [summary, usingSampleData]);

  const contactsCount = useMemo(() => {
    const data = summary || (usingSampleData ? SAMPLE_SUMMARY : null);
    return data?.contacts ?? 0;
  }, [summary, usingSampleData]);

  const usersCount = useMemo(() => {
    const data = summary || (usingSampleData ? SAMPLE_SUMMARY : null);
    return data?.users ?? 0;
  }, [summary, usingSampleData]);

  const conversionRate = useMemo(() => {
    const data = summary || (usingSampleData ? SAMPLE_SUMMARY : null);
    if (!data?.events?.formStarts) return 0;
    return Math.round((data.events.formSubmits / data.events.formStarts) * 100);
  }, [summary, usingSampleData]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1240px] p-4 lg:p-8">
        <div className="rounded-2xl bg-red-50 p-6 text-red-700 flex items-center gap-4">
          <Icon name="error" size={24} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold">Failed to load analytics</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[Baloo_2] text-3xl font-bold text-[#14232B]">Analytics</h1>
          <p className="mt-1 text-[#14232B]/60">Detailed analytics and reporting.
            {usingSampleData && <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Demo Data</span>}
          </p>
        </div>
        <Dropdown
          trigger={({ isOpen, toggle }) => (
            <Button variant="secondary" size="sm" onClick={toggle} rightIcon={<Icon name={isOpen ? "expand_less" : "expand_more"} size={16} />}>
              {timeRange} Days
            </Button>
          )}
          items={[
            { label: "7 Days", onClick: () => setTimeRange(7) },
            { label: "30 Days", onClick: () => setTimeRange(30) },
            { label: "90 Days", onClick: () => setTimeRange(90) },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardTitle
              title="Activity Timeline"
              subtitle={`Page views and events over the last ${timeRange} days`}
            />
            <CardContent>
              <div className="w-full h-[350px]">
                <AreaChart
                  data={timelineData}
                  xKey="date"
                  yKeys={["pageviews", "events"]}
                  colors={chartColors}
                  height={350}
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

          <Card>
            <CardTitle title="Event Breakdown" subtitle="Distribution of event types" />
            <CardContent>
              <div className="h-[300px]">
                <DonutChart
                  data={eventTypes}
                  labelKey="label"
                  valueKey="value"
                  colors={["#129E9E", "#B5453B", "#0E7F7F"]}
                  height={300}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle title="Waitlist Summary" subtitle="Current waitlist statistics" />
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#14232B]/70">Total Residents</span>
                <span className="font-bold text-[#14232B]">{waitlistData.users.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#14232B]/70">Total Merchants</span>
                <span className="font-bold text-[#14232B]">{waitlistData.agents.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#14232B]/70">Total Contacts</span>
                <span className="font-bold text-[#14232B]">{contactsCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#14232B]/70">Registered Users</span>
                <span className="font-bold text-[#14232B]">{usersCount.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-[#14232B]/5 flex items-center justify-between">
                <span className="text-[#14232B]/70">Conversion Rate</span>
                <span className="font-bold text-[#129E9E]">{conversionRate}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardTitle title="Quick Actions" subtitle="Export and reporting" />
            <CardContent className="space-y-3">
              <Button variant="outline" fullWidth leftIcon={<Icon name="table_chart" size={18} />}>
                Export Analytics CSV
              </Button>
              <Button variant="outline" fullWidth leftIcon={<Icon name="picture_as_pdf" size={18} />}>
                Generate PDF Report
              </Button>
              <Button variant="outline" fullWidth leftIcon={<Icon name="schedule" size={18} />}>
                Schedule Weekly Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}