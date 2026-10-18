import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminApi, adminAssetUrl } from "../utils/adminApi";
import { Button, Card, Icon } from "../components/admin/ui";

const PAGE_SIZE = 20;

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
      const result = await adminApi.pendingListings(token, page, PAGE_SIZE);
      setListings(result.data.data);
      setTotal(result.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load pending listings.");
    } finally {
      setLoading(false);
    }
  }, [page, token]);

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
          <h1 className="font-[Baloo_2] text-3xl font-bold text-[#14232B]">Provider Listing Review</h1>
          <p className="mt-1 text-[#14232B]/60">
            Check provider details and photos before approving a listing for public discovery.
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

      {loading && listings.length === 0 ? (
        <Card><p className="text-sm text-[#14232B]/60">Loading review queue…</p></Card>
      ) : listings.length === 0 ? (
        <Card className="text-center">
          <Icon name="task_alt" size={36} className="mx-auto mb-2 text-[#129E9E]" />
          <h2 className="font-semibold text-[#14232B]">No listings awaiting review</h2>
          <p className="mt-1 text-sm text-[#14232B]/60">New provider submissions will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {listings.map((listing) => (
            <Card key={listing._id} className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[#14232B]">{listing.title}</h2>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Pending review
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#14232B]/60">
                    {listing.category} · {listing.location} · Submitted {new Date(listing.createdAt).toLocaleString()}
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
            </Card>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-[#14232B]/70">
          <span>Page {page} of {pageCount} · {total} pending listings</span>
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
