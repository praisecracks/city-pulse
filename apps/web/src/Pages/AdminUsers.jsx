import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../utils/adminApi";
import { Card, CardTitle, CardContent, Table, Button, Icon, Badge, Input, Select, Modal, Dropdown } from "../components/admin/ui";

const ROLE_BADGES = {
  customer: { variant: "primary", label: "Customer" },
  agent: { variant: "warning", label: "Agent" },
  admin: { variant: "danger", label: "Admin" },
};

const SAMPLE_USERS = [
  { _id: "u1", name: "Adebayo Johnson", email: "adebayo.j@example.com", phone: "0801 111 2222", roles: ["customer"], otpVerified: true, trustScore: 4, agentIntent: false, createdAt: "2024-01-10T08:30:00Z", lastActive: "2024-01-15T14:22:00Z" },
  { _id: "u2", name: "Chioma Okafor", email: "chioma.o@example.com", phone: "0802 222 3333", roles: ["customer"], otpVerified: true, trustScore: 5, agentIntent: true, createdAt: "2024-01-09T12:15:00Z", lastActive: "2024-01-15T10:05:00Z" },
  { _id: "u3", name: "Emeka Nwosu", email: "emeka.n@example.com", phone: "0803 333 4444", roles: ["agent"], otpVerified: true, trustScore: 3, agentIntent: false, createdAt: "2024-01-08T09:45:00Z", lastActive: "2024-01-14T16:30:00Z" },
  { _id: "u4", name: "Fatima Bello", email: "fatima.b@example.com", phone: "0804 444 5555", roles: ["customer"], otpVerified: false, trustScore: 2, agentIntent: false, createdAt: "2024-01-07T14:20:00Z", lastActive: "2024-01-13T11:10:00Z" },
  { _id: "u5", name: "Ibrahim Musa", email: "ibrahim.m@example.com", phone: "0805 555 6666", roles: ["admin"], otpVerified: true, trustScore: 5, agentIntent: false, createdAt: "2024-01-01T10:00:00Z", lastActive: "2024-01-15T08:00:00Z" },
];

export default function AdminUsers() {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ role: "", verified: "", trustScore: "" });
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.users(token, pagination.page, pagination.pageSize);
      setData(res.data.data);
      setPagination((prev) => ({ ...prev, page: res.data.page, total: res.data.total }));
      setUsingSampleData(false);
    } catch (err) {
      setError(err.message);
      setUsingSampleData(true);
      setData(SAMPLE_USERS);
      setPagination((prev) => ({ ...prev, total: SAMPLE_USERS.length }));
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

  const handleRowSelection = (id, selected) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
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
    { key: "roles", label: "Roles", render: (v, row) => (
      <div className="flex flex-wrap gap-1.5">
        {(v || []).map((role) => (
          <Badge key={role} variant={ROLE_BADGES[role]?.variant || "neutral"} size="xs">
            {ROLE_BADGES[role]?.label || role}
          </Badge>
        ))}
        {row.agentIntent && (
          <Badge variant="primary" size="xs">Agent Intent</Badge>
        )}
      </div>
    )},
    { key: "otpVerified", label: "Verified", sortable: true, render: (v) => (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${v ? "bg-[#E4F3F1] text-[#129E9E]" : "bg-[#F5E3E0] text-[#B5453B]"}`}>
        {v ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Unverified
          </>
        )}
        
      </span>
    )},
    { key: "trustScore", label: "Trust", sortable: true, render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-[#F6F1E6] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(0, Math.min(100, (v / 5) * 100))}%`,
              backgroundColor: v >= 4 ? "#129E9E" : v >= 3 ? "#F0EADB" : "#B5453B",
            }}
          />
        </div>
        <span className="text-sm font-mono text-[#14232B] w-6">{v || 3}</span>
      </div>
    )},
    { key: "createdAt", label: "Joined", sortable: true, render: (v) => new Date(v).toLocaleString() },
  ], []);

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
          aria-label="Search users"
        />
      </div>
      <Select
        options={[
          { value: "", label: "All Roles" },
          { value: "customer", label: "Customer" },
          { value: "agent", label: "Agent" },
          { value: "admin", label: "Admin" },
        ]}
        value={filters.role}
        onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
        className="min-w-[140px]"
      />
      <Select
        options={[
          { value: "", label: "Verification" },
          { value: "true", label: "Verified" },
          { value: "false", label: "Unverified" },
        ]}
        value={filters.verified}
        onChange={(e) => setFilters((prev) => ({ ...prev, verified: e.target.value }))}
        className="min-w-[140px]"
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
      (item.phone || "").toLowerCase().includes(s)
    );
  }
  if (filters.role) {
    processedItems = processedItems.filter((item) => (item.roles || []).includes(filters.role));
  }
  if (filters.verified) {
    processedItems = processedItems.filter((item) => item.otpVerified === (filters.verified === "true"));
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

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[Baloo_2] text-3xl font-bold text-[#14232B]">Mobile Registered Users</h1>
          <p className="mt-1 text-[#14232B]/60">Users who have signed up via OTP.
            {usingSampleData && <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Demo Data</span>}
          </p>
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
          pageSize={pagination.pageSize}
          serverSide={true}
          totalCount={pagination.total}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          toolbar={toolbar}
          loading={loading}
          emptyMessage="No users yet."
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
        <p className="text-[#14232B]/70 mb-6">Export {selectedRows.size} selected users as CSV?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setShowExportModal(false); setSelectedRows(new Set()); }}>Export</Button>
        </div>
      </Modal>

      {viewModal && (
        <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="User Details" size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Name</p>
                <p className="font-medium text-[#14232B] text-lg">{viewModal.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Email</p>
                <p className="font-medium text-[#14232B] font-mono">{viewModal.email}</p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Phone</p>
                <p className="font-medium text-[#14232B]">{viewModal.phone}</p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Roles</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(viewModal.roles || []).map((role) => (
                    <Badge key={role} variant={ROLE_BADGES[role]?.variant || "neutral"} size="sm">
                      {ROLE_BADGES[role]?.label || role}
                    </Badge>
                  ))}
                  {viewModal.agentIntent && <Badge variant="primary" size="sm">Agent Intent</Badge>}
                </div>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Trust Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-2 bg-[#F6F1E6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, (viewModal.trustScore / 5) * 100))}%`,
                        backgroundColor: (viewModal.trustScore || 3) >= 4 ? "#129E9E" : (viewModal.trustScore || 3) >= 3 ? "#14232B" : "#B5453B",
                      }}
                    />
                  </div>
                  <span className="text-lg font-bold text-[#14232B]">{(viewModal.trustScore || 3)}/5</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Verified</p>
                <p className="mt-1 font-medium text-[#14232B]">
                  {viewModal.otpVerified ? "Yes (OTP)" : "No"}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Joined</p>
                <p className="font-medium text-[#14232B] font-mono">{new Date(viewModal.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Last Active</p>
                <p className="font-medium text-[#14232B] font-mono">{viewModal.lastActive ? new Date(viewModal.lastActive).toLocaleString() : "Never"}</p>
              </div>
              <div className="pt-4 border-t border-[#14232B]/10">
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Actions</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="secondary" size="sm">Edit Roles</Button>
                  <Button variant="secondary" size="sm">View Activity</Button>
                  <Button variant="danger" size="sm">Suspend</Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}