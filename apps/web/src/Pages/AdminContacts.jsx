import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../utils/adminApi";
import { Card, CardTitle, CardContent, Table, Button, Icon, Badge, Input, Select, Modal, Dropdown, StatCard } from "../components/admin/ui";

const STATUS_BADGES = {
  new: { variant: "primary", label: "New", color: "bg-[#E4F3F1] text-[#129E9E]" },
  read: { variant: "warning", label: "Read", color: "bg-[#F0EADB] text-[#14232B]" },
  replied: { variant: "success", label: "Replied", color: "bg-[#E4F3F1] text-[#129E9E]" },
  archived: { variant: "neutral", label: "Archived", color: "bg-[#14232B]/10 text-[#14232B]/50" },
};

const STATUS_ICONS = {
  new: "mark_email_unread",
  read: "mark_email_read",
  replied: "reply",
  archived: "archive",
};

const SAMPLE_CONTACTS = [
  { _id: "c1", name: "Adebayo Johnson", email: "adebayo.j@example.com", phone: "0801 111 2222", area: "Ibara", message: "Looking for gas refill stations near Ibara roundabout. Can you add more locations?", status: "new", createdAt: "2024-01-15T09:30:00Z" },
  { _id: "c2", name: "Chioma Okafor", email: "chioma.o@example.com", phone: "0802 222 3333", area: "Okemoson", message: "The POS finder is great but sometimes shows closed locations. Please verify more often.", status: "read", createdAt: "2024-01-14T14:15:00Z" },
  { _id: "c3", name: "Emeka Nwosu", email: "emeka.n@example.com", phone: "0803 333 4444", area: "Adigbe", message: "Want to partner as a food vendor. How do I register my restaurant?", status: "replied", createdAt: "2024-01-13T11:20:00Z" },
  { _id: "c4", name: "Fatima Bello", email: "fatima.b@example.com", phone: "0804 444 5555", area: "Kuto", message: "App crashes when searching for houses. Using Android 13.", status: "new", createdAt: "2024-01-12T16:45:00Z" },
  { _id: "c5", name: "Ibrahim Musa", email: "ibrahim.m@example.com", phone: "0805 555 6666", area: "Ibara", message: "Thank you for the service! Found cash at a POS near me in 5 mins.", status: "archived", createdAt: "2024-01-11T10:00:00Z" },
];

export default function AdminContacts() {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", dateRange: "" });
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [updating, setUpdating] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.contacts(token, pagination.page, pagination.pageSize);
      setData(res.data.data);
      setPagination((prev) => ({ ...prev, page: res.data.page, total: res.data.total }));
      setUsingSampleData(false);
    } catch (err) {
      setError(err.message);
      setUsingSampleData(true);
      setData(SAMPLE_CONTACTS);
      setPagination((prev) => ({ ...prev, total: SAMPLE_CONTACTS.length }));
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize) => {
    setPagination((prev) => ({ ...prev, pageSize: newSize, page: 1 }));
  };

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";
      const res = await fetch(`${API_BASE}/admin-Pulse/contact/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update");
      setData(data.map((c) => (c._id === id ? { ...c, status: newStatus } : c)));
    } catch (err) {
      alert("Failed to update: " + err.message);
    } finally {
      setUpdating(null);
    }
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
    if (selected) {
      setSelectedRows(new Set(data.map((item) => item._id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const columns = useMemo(() => [
    { key: "_id", label: "", width: "48px", render: (_, row) => (
      <input
        type="checkbox"
        checked={selectedRows.has(row._id)}
        onChange={(e) => handleRowSelection(row._id, e.target.checked)}
        className="w-4 h-4 text-[#129E9E] border-[#14232B]/30 rounded focus:ring-[#129E9E]"
        aria-label={`Select ${row.name}`}
      />
    )},
    { key: "name", label: "Name", sortable: true, render: (v, row) => (
      <div>
        <p className="font-medium text-[#14232B]">{v}</p>
        <p className="text-xs text-[#14232B]/50 font-mono">{row.email}</p>
      </div>
    )},
    { key: "phone", label: "Phone", sortable: true },
    { key: "area", label: "Area", sortable: true },
    { key: "message", label: "Message", render: (v) => (
      <p className="max-w-xs truncate text-[#14232B]/70" title={v}>{v}</p>
    )},
    { key: "status", label: "Status", sortable: true, render: (v, row) => (
      <select
        value={v}
        onChange={(e) => handleStatusChange(row._id, e.target.value)}
        disabled={updating === row._id}
        className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_BADGES[v] ? STATUS_BADGES[v].color : "bg-gray-100 text-gray-600"}`}
        aria-label="Change status"
      >
        <option value="new">New</option>
        <option value="read">Read</option>
        <option value="replied">Replied</option>
        <option value="archived">Archived</option>
      </select>
    )},
    { key: "createdAt", label: "Received", sortable: true, render: (v) => new Date(v).toLocaleString() },
  ], [updating]);

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-md">
        <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#14232B]/50" />
        <input
          type="search"
          placeholder="Search by name, email, message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[#14232B]/15 rounded-xl text-sm text-[#14232B] placeholder:text-[#14232B]/50 focus:outline-none focus:border-[#129E9E] focus:ring-1 focus:ring-[#129E9E]"
          aria-label="Search contacts"
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

  // Client-side filtering and sorting
  let processedItems = data;
  if (search) {
    const s = search.toLowerCase();
    processedItems = processedItems.filter((item) =>
      (item.name || "").toLowerCase().includes(s) ||
      (item.email || "").toLowerCase().includes(s) ||
      (item.message || "").toLowerCase().includes(s) ||
      (item.area || "").toLowerCase().includes(s)
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
          <h1 className="font-[Baloo_2] text-3xl font-bold text-[#14232B]">Contact Messages</h1>
          <p className="mt-1 text-[#14232B]/60">Messages sent via the contact form.
            {usingSampleData && <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Demo Data</span>}
          </p>
        </div>
      </div>

      {/* Message Status Breakdown */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(STATUS_BADGES).map(([key, badge]) => {
          const count = data.filter((d) => d.status === key).length;
          const [iconBg, iconColor] = badge.color.split(" ");
          return (
            <StatCard
              key={key}
              label={badge.label}
              value={count}
              icon={STATUS_ICONS[key]}
              iconColor={iconColor}
              iconBg={iconBg}
              trend="neutral"
            />
          );
        })}
      </div>

      <Card>
        <Table
          columns={columns}
          data={processedItems}
          keyField="_id"
          sortable
          initialSortKey="createdAt"
          initialSortDirection="desc"
          pageSize={pagination.pageSize}
          serverSide={true}
          totalCount={pagination.total}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          toolbar={toolbar}
          loading={loading}
          emptyMessage="No messages yet."
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
        <p className="text-[#14232B]/70 mb-6">Export {selectedRows.size} selected messages as CSV?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setShowExportModal(false); setSelectedRows(new Set()); }}>Export</Button>
        </div>
      </Modal>

      {viewModal && (
        <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="View Message" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Name</p>
                <p className="font-medium text-[#14232B]">{viewModal.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Email</p>
                <p className="font-medium text-[#14232B] font-mono text-sm">{viewModal.email}</p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Phone</p>
                <p className="font-medium text-[#14232B]">{viewModal.phone}</p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Area</p>
                <p className="font-medium text-[#14232B]">{viewModal.area || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Status</p>
                <Badge variant="primary" className={STATUS_BADGES[viewModal.status]?.color}>
                  {STATUS_BADGES[viewModal.status]?.label || viewModal.status}
                </Badge>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Received</p>
                <p className="font-medium text-[#14232B] font-mono text-sm">{new Date(viewModal.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Message</p>
              <p className="mt-2 p-4 bg-[#F6F1E6] rounded-lg text-[#14232B]/70 whitespace-pre-wrap">{viewModal.message}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}