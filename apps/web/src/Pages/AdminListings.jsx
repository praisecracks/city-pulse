import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminApi, adminAssetUrl } from "../utils/adminApi";
import { Button, Card, Icon } from "../components/admin/ui";

const PAGE_SIZE = 20;
const LISTING_FILTERS = [
  { value: "pending_review", label: "Pending" },
  { value: "approved", label: "Approved / public" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All listings" },
];

const REVIEW_LABELS = {
  pending_review: "Pending review",
  approved: "Approved · public",
  rejected: "Rejected",
};

function reviewBadgeClass(status) {
  if (status === "approved" || !status) return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function formatDetails(details) {
  if (!details || typeof details !== "object") return "No category details supplied.";
  return Object.entries(details)
    .map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
      const display = Array.isArray(value) ? value.join(", ") : String(value);
      return `${label}: ${display}`;
    })
    .join(" · ");
}

export default function AdminListings() {
  const { token } = useAuth();
  const [listings, setListings] = useState([]);
  const [page, setPage] = useState(1);
  const [reviewStatus, setReviewStatus] = useState("pending_review");
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.listings(token, page, PAGE_SIZE, reviewStatus);
      setListings(result.data.data);
      setTotal(result.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load pending listings.");
    } finally {
      setLoading(false);
    }
  }, [page, reviewStatus, token]);

  useEffect(() => {
    // Fetch the authenticated queue when pagination changes or the page opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadListings();
  }, [loadListings]);

  const handleReview = async (listing, reviewStatus) => {
    const note = (notes[listing._id] || "").trim();
    if (reviewStatus === "rejected" && !note) {
      setError("Add a clear reason before rejecting a listing.");
      return;
    }

    setBusyId(listing._id);
    setError("");
    setMessage("");
    try {
      await adminApi.reviewListing(token, listing._id, reviewStatus, note);
      setMessage(`${listing.title} ${reviewStatus === "approved" ? "approved" : "returned to the provider"}.`);
      await loadListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the review decision.");
    } finally {
      setBusyId(null);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-[Baloo_2] text-3xl font-bold text-[#14232B]">Provider Listings</h1>
          <p className="mt-1 text-[#14232B]/60">
            Review new submissions and manage approved and rejected provider listings.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadListings}
          loading={loading}
          leftIcon={<Icon name="refresh" size={16} />}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter provider listings">
        {LISTING_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={reviewStatus === filter.value}
            onClick={() => {
              setPage(1);
              setReviewStatus(filter.value);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              reviewStatus === filter.value
                ? "bg-[#0E7F7F] text-white"
                : "border border-[#14232B]/10 bg-white text-[#14232B]/70 hover:bg-[#E4F3F1]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading && listings.length === 0 ? (
        <Card><p className="text-sm text-[#14232B]/60">Loading provider listings…</p></Card>
      ) : listings.length === 0 ? (
        <Card className="text-center">
          <Icon name="task_alt" size={36} className="mx-auto mb-2 text-[#129E9E]" />
          <h2 className="font-semibold text-[#14232B]">No listings in this view</h2>
          <p className="mt-1 text-sm text-[#14232B]/60">Choose another filter or refresh to check again.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {listings.map((listing) => (
            <Card key={listing._id} className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[#14232B]">{listing.title}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${reviewBadgeClass(listing.reviewStatus)}`}>
                      {REVIEW_LABELS[listing.reviewStatus] || "Approved · public"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#14232B]/60">
                    {listing.category} · {listing.location}
                    {listing.localGovernment ? ` · ${listing.localGovernment}` : ""}
                    {listing.state ? ` · ${listing.state}` : ""}
                    {listing.createdAt ? ` · Submitted ${new Date(listing.createdAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="text-sm text-[#14232B]/70">
                  <p className="font-semibold text-[#14232B]">{listing.agent?.name || "Provider"}</p>
                  <p>{listing.agent?.email}</p>
                  <p>{listing.agent?.phone}</p>
                </div>
              </div>

              {Array.isArray(listing.images) && listing.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {listing.images.map((image, index) => (
                    <a
                      key={`${image.path}-${index}`}
                      href={adminAssetUrl(image.path)}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-xl border border-[#14232B]/10 bg-[#F6F1E6]"
                    >
                      <img
                        src={adminAssetUrl(image.path)}
                        alt={image.caption || `${listing.title} verification photo ${index + 1}`}
                        className="h-40 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}

              <div className="grid gap-4 text-sm text-[#14232B]/75 md:grid-cols-2">
                <div className="space-y-1">
                  <p><strong>Address:</strong> {listing.address || "Not provided"}</p>
                  <p><strong>Contact:</strong> {listing.contactPhone || "Not provided"}</p>
                  <p><strong>WhatsApp:</strong> {listing.whatsapp || "Not provided"}</p>
                  <p><strong>Email:</strong> {listing.email || "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <p><strong>Description:</strong> {listing.description || "Not provided"}</p>
                  <p><strong>Category details:</strong> {formatDetails(listing.details)}</p>
                  <p>
                    <strong>Coordinates:</strong>{" "}
                    {listing.coordinates?.latitude != null && listing.coordinates?.longitude != null
                      ? `${listing.coordinates.latitude}, ${listing.coordinates.longitude}`
                      : "Not provided"}
                  </p>
                </div>
              </div>

              {listing.reviewStatus === "rejected" && listing.reviewNote && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <strong>Returned to provider:</strong> {listing.reviewNote}
                </div>
              )}

              {listing.reviewStatus === "pending_review" ? (
              <div className="border-t border-[#14232B]/10 pt-4">
                <label htmlFor={`review-note-${listing._id}`} className="mb-1 block text-sm font-semibold text-[#14232B]">
                  Review note <span className="font-normal text-[#14232B]/50">(required when rejecting)</span>
                </label>
                <textarea
                  id={`review-note-${listing._id}`}
                  maxLength={500}
                  rows={3}
                  value={notes[listing._id] || ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [listing._id]: event.target.value }))}
                  placeholder="Explain what the provider needs to correct."
                  className="w-full rounded-xl border border-[#14232B]/15 px-3 py-2 text-sm focus:border-[#129E9E] focus:outline-none focus:ring-1 focus:ring-[#129E9E]"
                />
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button
                    variant="danger"
                    disabled={busyId !== null}
                    loading={busyId === listing._id}
                    onClick={() => handleReview(listing, "rejected")}
                  >
                    Reject with notes
                  </Button>
                  <Button
                    variant="primary"
                    disabled={busyId !== null}
                    loading={busyId === listing._id}
                    onClick={() => handleReview(listing, "approved")}
                  >
                    Approve listing
                  </Button>
                </div>
              </div>
              ) : (
                <div className={`rounded-xl px-4 py-3 text-sm ${
                  listing.reviewStatus === "rejected"
                    ? "bg-red-50 text-red-800"
                    : "bg-emerald-50 text-emerald-800"
                }`}>
                  {listing.reviewStatus === "rejected"
                    ? "This listing is not public. The provider can update it and request another review."
                    : "This listing is approved and available to customers. Availability updates are enabled for its provider."}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-[#14232B]/70">
          <span>Page {page} of {pageCount} · {total} listings</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
