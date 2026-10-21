import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { trackEvent } from "../../utils/analytics";

const DEFAULT_UNLOCK_DELAY_MS = 12 * 60 * 60 * 1000;
const STORAGE_KEY = "cp_android_unlock_at_v2";

function resolveUnlockAt() {
  const envValue = import.meta.env.VITE_ANDROID_APP_UNLOCK_AT;
  if (envValue) return new Date(envValue).getTime();

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return Number(stored);

  const next = Date.now() + DEFAULT_UNLOCK_DELAY_MS;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

const androidDownloadUrl = import.meta.env.VITE_ANDROID_APP_DOWNLOAD_URL;
const unlockAt = resolveUnlockAt();

function getRemainingTime() {
  return Math.max(0, unlockAt - Date.now());
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export default function AndroidDownloadAction({ compact = false }) {
  const [remaining, setRemaining] = useState(getRemainingTime);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(getRemainingTime());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const buttonClass = compact
    ? "whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#129E9E] transition-colors hover:bg-[#FAF6EE] disabled:cursor-not-allowed disabled:bg-[#FAF6EE]/20 disabled:text-white"
    : "w-full rounded-full bg-white px-7 py-3.5 text-center text-sm font-semibold text-[#129E9E] shadow-sm transition-all hover:bg-[#FAF6EE] disabled:cursor-not-allowed disabled:bg-[#0E7F7F]/30 disabled:text-[#FAF6EE] sm:w-auto";

  if (remaining === 0 && androidDownloadUrl) {
    return (
      <a
        href={androidDownloadUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackEvent("android_download_click")}
        className={buttonClass}
      >
        Download Android App
      </a>
    );
  }

  return (
    <div className={compact ? "" : "flex flex-col items-center gap-2"}>
      <button
        type="button"
        disabled
        aria-label={`Android app download opens in ${formatCountdown(remaining)}`}
        className={`${buttonClass} ${compact ? "flex items-center gap-2" : "inline-flex items-center justify-center gap-2"}`}
      >
        <span>{androidDownloadUrl ? "Download" : "Coming soon"}</span>
        {androidDownloadUrl && (
          <span
            aria-hidden="true"
            className="rounded-full bg-[#129E9E]/10 px-2 py-0.5 font-mono text-xs tabular-nums text-[#0E7F7F]"
          >
            {formatCountdown(remaining)}
          </span>
        )}
      </button>
      {!compact && (
        <p className="text-center text-xs leading-relaxed text-[#FAF6EE]/85">
          Join the waitlist for priority verification and faster onboarding.
          {" "}
          <Link to="/waitlist" className="font-semibold underline underline-offset-2">
            Join now
          </Link>
        </p>
      )}
    </div>
  );
}
