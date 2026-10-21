import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../utils/adminApi";
import { Card, Table, Button, Icon, Badge, Input, Select, Modal } from "../components/admin/ui";

const ROLE_BADGES = {
  customer: { variant: "primary", label: "Customer" },
  agent: { variant: "warning", label: "Agent" },
  admin: { variant: "danger", label: "Admin" },
};

const SAMPLE_USERS = [
  { _id: "u1", name: "Adebayo Johnson", email: "adebayo.j@example.com", phone: "0801 111 2222", roles: ["customer"], otpVerified: true, trustScore: 4, agentIntent: false, createdAt: "2024-01-10T08:30:00Z" },
];

export default function AdminUsers() {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ role: "", verified: "" });
  const [viewModal, setViewModal] = useState(null);
  const [verifyNote, setVerifyNote] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
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

  const openDetail = useCallback(async (id) => {
    try {
      const res = await adminApi.user(token, id);
      setViewModal(res.data);
      setVerifyNote("");
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const handleVerify = useCallback(async (isVerified) => {
    if (!viewModal || !viewModal.user) return;
    setVerifyBusy(true);
    try {
      const res = await adminApi.verifyUser(token, viewModal.user._id, isVerified, verifyNote);
      setViewModal((prev) => (prev ? { ...prev, user: { ...prev.user, ...res.data } } : prev));
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyBusy(false);
    }
  }, [token, viewModal, verifyNote, fetchData]);

  const handleBlock = useCallback(async (isBlocked) => {
    if (!viewModal || !viewModal.user) return;
    if (!window.confirm(isBlocked ? "Block this user?" : "Unblock this user?")) return;
    setVerifyBusy(true);
    try {
      const res = await adminApi.blockUser(token, viewModal.user._id, isBlocked, verifyNote);
      setViewModal((prev) => (prev ? { ...prev, user: { ...prev.user, ...res.data } } : prev));
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyBusy(false);
    }
  }, [token, viewModal, verifyNote, fetchData]);

  const handleDelete = useCallback(async () => {
    if (!viewModal || !viewModal.user) return;
    if (!window.confirm("Permanently delete this user and their listings?")) return;
    setVerifyBusy(true);
    try {
      await adminApi.deleteUser(token, viewModal.user._id);
      setViewModal(null);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyBusy(false);
    }
  }, [token, viewModal, fetchData]);

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

  const columns = [
    { key: "name", label: "Name", render: (v, row) => (
      <div>
        <p className="font-medium text-[#14232B]">{v}</p>
        <p className="text-xs text-[#14232B]/50 font-mono">{row.email}</p>
      </div>
    ) },
    { key: "phone", label: "Phone" },
    { key: "roles", label: "Roles", render: (v, row) => (
      <div className="flex flex-wrap gap-1.5">
        {(v || []).map((role) => (
          <Badge key={role} variant={ROLE_BADGES[role] ? ROLE_BADGES[role].variant : "neutral"} size="xs">
            {ROLE_BADGES[role] ? ROLE_BADGES[role].label : role}
          </Badge>
        ))}
        {row.agentIntent && <Badge variant="primary" size="xs">Agent Intent</Badge>}
      </div>
    ) },
    { key: "otpVerified", label: "Verified", render: (v) => (v ? "Verified" : "Unverified") },
    { key: "trustScore", label: "Trust", render: (v) => (v || 3) + "/5" },
    { key: "createdAt", label: "Joined", render: (v) => new Date(v).toLocaleString() },
    { key: "actions", label: "Actions", render: (_, row) => (
      <Button variant="secondary" size="sm" onClick={() => openDetail(row._id)}>Manage</Button>
    ) },
  ];

  const toolbar = (
    <div className="flex flex-col sm:flex-row gap-4">
      <Input
        type="search"
        placeholder="Search by name, email, phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Select
        options={[
          { value: "", label: "All Roles" },
          { value: "customer", label: "Customer" },
          { value: "agent", label: "Agent" },
          { value: "admin", label: "Admin" },
        ]}
        value={filters.role}
        onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
      />
      <Select
        options={[
          { value: "", label: "Verification" },
          { value: "true", label: "Verified" },
          { value: "false", label: "Unverified" },
        ]}
        value={filters.verified}
        onChange={(e) => setFilters((prev) => ({ ...prev, verified: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="font-[Baloo_2] text-3xl font-bold text-[#14232B]">Mobile Registered Users</h1>
        <p className="mt-1 text-[#14232B]/60">
          Users who have signed up.
          {usingSampleData && <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Demo Data</span>}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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
          toolbar={toolbar}
          loading={loading}
          emptyMessage="No users yet."
        />
      </Card>

      {viewModal && (
        <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Manage User" size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Name</p>
                <p className="font-medium text-[#14232B] text-lg">{viewModal.user ? viewModal.user.name : ""}</p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Email</p>
                <p className="font-medium text-[#14232B] font-mono">{viewModal.user ? viewModal.user.email : ""}</p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Phone</p>
                <p className="font-medium text-[#14232B]">{viewModal.user ? viewModal.user.phone : ""}</p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Verified</p>
                <p className="mt-1 font-medium text-[#14232B]">
                  {viewModal.user && viewModal.user.isVerified ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Blocked</p>
                <p className="mt-1 font-medium text-[#14232B]">
                  {viewModal.user && viewModal.user.isBlocked ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Trust Score</p>
                <p className="mt-1 font-medium text-[#14232B]">{viewModal.user ? (viewModal.user.trustScore || 3) : 3}/5</p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-[#14232B]/50 uppercase tracking-wider">Listings (onboarding data)</p>
              {(!viewModal.listings || viewModal.listings.length === 0) && (
                <p className="text-sm text-[#14232B]/50">No listings submitted.</p>
              )}
              {(viewModal.listings || []).map((l) => (
                <div key={l._id} className="border border-[#14232B]/10 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[#14232B]">{l.title}</p>
                    <Badge variant={l.reviewStatus === "approved" ? "success" : l.reviewStatus === "rejected" ? "danger" : "warning"} size="xs">
                      {l.reviewStatus || "legacy"}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#14232B]/60">{l.category} · {l.status}</p>
                  {l.contactPhone && <p className="text-xs">Phone: {l.contactPhone}</p>}
                  {l.email && <p className="text-xs">Email: {l.email}</p>}
                  {l.whatsapp && <p className="text-xs">WhatsApp: {l.whatsapp}</p>}
                  {l.address && <p className="text-xs">Address: {l.address}</p>}
                </div>
              ))}
              <div className="pt-4 border-t border-[#14232B]/10">
                <p className="text-xs text-[#14232B]/50 uppercase tracking-wider mb-2">Note</p>
                <textarea
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  placeholder="Reason for action (optional)"
                  className="w-full border border-[#14232B]/15 rounded-xl p-2 text-sm text-[#14232B] focus:outline-none focus:border-[#129E9E]"
                  rows={3}
                />
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button variant="primary" size="sm" disabled={verifyBusy} onClick={() => handleVerify(true)}>Verify</Button>
                  <Button variant="secondary" size="sm" disabled={verifyBusy} onClick={() => handleVerify(false)}>Unverify</Button>
                  <Button variant="secondary" size="sm" disabled={verifyBusy} onClick={() => handleBlock(true)}>Block</Button>
                  <Button variant="secondary" size="sm" disabled={verifyBusy} onClick={() => handleBlock(false)}>Unblock</Button>
                  <Button variant="danger" size="sm" disabled={verifyBusy} onClick={handleDelete}>Delete</Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
