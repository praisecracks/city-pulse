import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../utils/adminApi";
import { Card, CardTitle, CardContent, Table, Button, Icon, Badge, Input, Select, Modal, Dropdown } from "../components/admin/ui";

const STATUS_BADGES = {
  new: { variant: "primary", label: "New" },
  read: { variant: "warning", label: "Read" },
  replied: { variant: "success", label: "Replied" },
  archived: { variant: "neutral", label: "Archived" },
};

const SAMPLE_WAITLIST_USERS = [
  { _id: "1", fullName: "Babatunde Adeyemi", email: "b.adeyemi@example.com", phone: "0801 234 5678", neighborhood: "Ibara", preferences: ["POS Cash", "Gas Refills"], createdAt: "2024-01-15T10:30:00Z" },
  { _id: "2", fullName: "Kemi Olawale", email: "kemi.olawale@example.com", phone: "0802 345 6789", neighborhood: "Okemoson", preferences: ["Late Food", "Houses/Flats"], createdAt: "2024-01-14T14:22:00Z" },
  { _id: "3", fullName: "Segun Daniel", email: "segun.d@example.com", phone: "0803 456 7890", neighborhood: "Adigbe", preferences: ["POS Cash", "Late Food", "Gas Refills"], createdAt: "2024-01-13T09:15:00Z" },
  { _id: "4", fullName: "Funmi Adebayo", email: "funmi.a@example.com", phone: "0804 567 8901", neighborhood: "Kuto", preferences: ["Houses/Flats"], createdAt: "2024-01-12T16:45:00Z" },
  { _id: "5", fullName: "Tunde Bakare", email: "t.bakare@example.com", phone: "0805 678 9012", neighborhood: "Ibara", preferences: ["Gas Refills", "POS Cash"], createdAt: "2024-01-11T11:20:00Z" },
];

const SAMPLE_WAITLIST_AGENTS = [
  { _id: "a1", businessName: "Mama Tola Kitchen", email: "mama.tola@example.com", phone: "0803 555 0192", serviceType: "Food Vendors / Restaurants", createdAt: "2024-01-15T08:00:00Z" },
  { _id: "a2", businessName: "QuickGas Ibara", email: "quickgas@example.com", phone: "0806 777 1234", serviceType: "Gas Refill", createdAt: "2024-01-14T12:30:00Z" },
  { _id: "a3", businessName: "Posa Point Kuto", email: "posapoint@example.com", phone: "0807 888 5678", serviceType: "POS / Cash Withdrawal", createdAt: "2024-01-13T15:45:00Z" },
  { _id: "a4", businessName: "Prime Properties", email: "prime.props@example.com", phone: "0808 999 4321", serviceType: "House Agents / Property", createdAt: "2024-01-12T10:15:00Z" },
  { _id: "a5", businessName: "Buka Express", email: "buka.express@example.com", phone: "0809 111 2222", serviceType: "Food Vendors / Restaurants", createdAt: "2024-01-11T13:30:00Z" },
];

export default function AdminWaitlist() {
  const { token } = useAuth();
  const [tab, setTab] = useState("users");
  const [data, setData] = useState({ users: [], agents: [] });
  const [pagination, setPagination] = useState({ users: { page: 1, total: 0, pageSize: 20 }, agents: { page: 1, total: 0, pageSize: 20 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", dateRange: "" });
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [usingSampleData, setUsingSampleData] = useState(false);

  const currentPage = pagination[tab].page;
  const currentPageSize = pagination[tab].pageSize;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.waitlist(token, currentPage, currentPageSize);
      setData((prev) => ({ ...prev, [tab]: res.data[tab].data }));
      setPagination((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], page: res.data[tab].page, total: res.data[tab].total },
      }));
      setUsingSampleData(false);
    } catch (err) {
      setError(err.message);
      setUsingSampleData(true);
      // Set sample data for current tab
      setData((prev) => ({
        ...prev,
        [tab]: tab === "users" ? SAMPLE_WAITLIST_USERS : SAMPLE_WAITLIST_AGENTS,
      }));
      setPagination((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], total: tab === "users" ? SAMPLE_WAITLIST_USERS.length : SAMPLE_WAITLIST_AGENTS.length },
      }));
    } finally {
      setLoading(false);
    }
  }, [token, tab, currentPage, currentPageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset sample data flag when tab changes
  useEffect(() => {
    setUsingSampleData(false);
    setError("");
  }, [tab]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, [tab]: { ...prev[tab], page: newPage } }));
  };

  const handlePageSizeChange = (newSize) => {
    setPagination((prev) => ({ ...prev, [tab]: { ...prev[tab], pageSize: newSize, page: 1 } }));
  };

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  const handleRowSelection = (id, selected) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (selected) => {
    const items = data[tab] || [];
    if (selected) {
      setSelectedRows(new Set(items.map((item) => item._id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const columns = useMemo(() => {
    if (tab === "users") {
      return [
        { key: "_id", label: "", width: "48px", render: (_, row) => (
          <input
            type="checkbox"
            checked={selectedRows.has(row._id)}
            onChange={(e) => handleRowSelection(row._id, e.target.checked)}
            className="w-4 h-4 text-[#129E9E] border-[#14232B]/30 rounded focus:ring-[#129E9E]"
            aria-label={`Select ${row.fullName}`}
          />
        )},
        { key: "fullName", label: "Name", sortable: true, render: (v, row) => (
          <div>
            <p className="font-medium text-[#14232B]">{v}</p>
            <p className="text-xs text-[#14232B]/50 font-mono">{row.email}</p>
          </div>
        )},
        { key: "phone", label: "Phone", sortable: true },
        { key: "neighborhood", label: "Area", sortable: true },
        { key: "preferences", label: "Interests", render: (v) => (
          <div className="flex flex-wrap gap-1">
            {v?.map((p, i) => (
              <Badge key={i} variant="neutral" size="xs">{p}</Badge>
            ))}
          </div>
        )},
        { key: "createdAt", label: "Joined", sortable: true, render: (v) => new Date(v).toLocaleDateString() },
      ];
    } else {
      return [
        { key: "_id", label: "", width: "48px", render: (_, row) => (
          <input
            type="checkbox"
            checked={selectedRows.has(row._id)}
            onChange={(e) => handleRowSelection(row._id, e.target.checked)}
            className="w-4 h-4 text-[#129E9E] border-[#14232B]/30 rounded focus:ring-[#129E9E]"
            aria-label={`Select ${row.businessName}`}
          />
        )},
        { key: "businessName", label: "Business", sortable: true, render: (v, row) => (
          <div>
            <p className="font-medium text-[#14232B]">{v}</p>
            <p className="text-xs text-[#14232B]/50 font-mono">{row.email}</p>
          </div>
        )},
        { key: "phone", label: "Phone", sortable: true },
        { key: "serviceType", label: "Category", sortable: true, render: (v) => <Badge variant="primary" size="xs">{v}</Badge> },
        { key: "createdAt", label: "Applied", sortable: true, render: (v) => new Date(v).toLocaleDateString() },
      ];
    }
  }, [tab, selectedRows]);

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-md">
        <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#14232B]/50" />
        <input
          type="search"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[#14232B]/15 rounded-xl text-sm text-[#14232B] placeholder:text-[#14232B]/50 focus:outline-none focus:border-[#129E9E] focus:ring-1 focus:ring-[#129E9E]"
          aria-label="Search waitlist"
        />
      </div>
      <Select
        options={[
          { value: "", label: "All Status" },
          { value: "new", label: "New" },
          { value: "read", label: "Read" },
          { value: "replied", label: "Replied" },
          { value: "archived", label: "Archived" },
        ]}
        value={filters.status}
        onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
        className="min-w-[150px]"
      />
      <Dropdown
        trigger={({ isOpen, toggle }) => (
          <Button variant="secondary" size="sm" onClick={toggle} rightIcon={<Icon name={isOpen ? "expand_less" : "expand_more"} size={16} />}>
            Export
          </Button>
        )}
        items={[
          { label: "Export Current Page (CSV)", icon: <Icon name="table_chart" size={18} />, onClick: () => {} },
          { label: "Export All (CSV)", icon: <Icon name="table_chart" size={18} />, onClick: () => {} },
          { label: "Export Selected (CSV)", icon: <Icon name="table_chart" size={18} />, onClick: () => {}, disabled: selectedRows.size === 0 },
        ]}
      />
    </div>
  );

  const items = data[tab] || [];
  const total = pagination[tab].total;
  const page = pagination[tab].page;
  const pageSize = pagination[tab].pageSize;
  const totalPages = Math.ceil(total / pageSize);

  // Client-side filtering and sorting for demo
  let processedItems = items;
  if (search) {
    const s = search.toLowerCase();
    processedItems = processedItems.filter((item) =>
      (item.fullName || item.businessName || "").toLowerCase().includes(s) ||
      (item.email || "").toLowerCase().includes(s) ||
      (item.phone || "").toLowerCase().includes(s) ||
      (item.neighborhood || "").toLowerCase().includes(s)
    );
  }
  if (sortConfig.key) {
    processedItems = [...processedItems].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  const allSelected = processedItems.length > 0 && processedItems.every((item) => selectedRows.has(item._id));
  const someSelected = processedItems.some((item) => selectedRows.has(item._id));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[Baloo_2] text-3xl font-bold text-[#14232B]">Waitlist</h1>
          <p className="mt-1 text-[#14232B]/60">Manage resident and merchant signups.
            {usingSampleData && <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Demo Data</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {["users", "agents"].map((t) => (
            <Button
              key={t}
              variant={tab === t ? "primary" : "secondary"}
              onClick={() => { setTab(t); setSelectedRows(new Set()); }}
              className="whitespace-nowrap"
            >
              {t === "users" ? "Residents" : "Merchants"} ({data[t]?.length || 0})
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={processedItems}
          keyField="_id"
          sortable
          initialSortKey="createdAt"
          initialSortDirection="desc"
          pageSize={pageSize}
          serverSide={true}
          totalCount={total}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          toolbar={toolbar}
          loading={loading}
          emptyMessage={`No ${tab === "users" ? "residents" : "merchants"} found.`}
        />
      </Card>

      {selectedRows.size > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-slide-up">
          <div className="bg-[#14232B] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-4">
            <span>{selectedRows.size} selected</span>
            <Button variant="secondary" size="sm" onClick={() => setSelectedRows(new Set())}>
              Clear
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowExportModal(true)}>
              Export Selected
            </Button>
          </div>
        </div>
      )}

      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Selected" size="sm">
        <p className="text-[#14232B]/70 mb-6">Export {selectedRows.size} selected entries as CSV?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setShowExportModal(false); setSelectedRows(new Set()); }}>Export</Button>
        </div>
      </Modal>
    </div>
  );
}