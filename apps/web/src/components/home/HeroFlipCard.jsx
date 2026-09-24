import { useState, useEffect, useRef, useCallback } from "react";
import img from "../../assets/Subtract.png";

const teeth = Array.from({ length: 8 });
const AUTO_FLIP_MS = 5000;

export default function HeroFlipCard() {
  const [flipped, setFlipped] = useState(false);
  const intervalRef = useRef(null);

  // (Re)starts the 5s auto-flip timer. Called on mount and after every
  // manual flip, so a manual click doesn't get immediately undone by an
  // auto-flip a moment later.
  const startAutoFlip = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFlipped((value) => !value);
    }, AUTO_FLIP_MS);
  }, []);

  useEffect(() => {
    startAutoFlip();
    return () => clearInterval(intervalRef.current);
  }, [startAutoFlip]);

  const toggle = (event) => {
    event?.stopPropagation();
    setFlipped((value) => !value);
    startAutoFlip();
  };

  return (
    <div className="relative flex items-center justify-center lg:col-span-5 lg:justify-end">
      <div className="absolute -inset-4 -z-10 rounded-full bg-[#129E9E]/10 blur-3xl" />
      <div className="relative flex aspect-[4/5] w-full max-w-[420px] items-center justify-center">
        <div className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rotate-6 rounded-2xl bg-[#E4F3F1] opacity-70 shadow-md" />
        <div className="pointer-events-none absolute inset-0 -translate-x-2 -translate-y-2 -rotate-3 rounded-2xl bg-[#129E9E]/15 shadow-md" />

        <div
          className="group relative z-10 h-full w-full cursor-pointer [perspective:1200px]"
          role="button"
          tabIndex={0}
          aria-label="Interactive card: click to flip between consumer radar and merchant status"
          onClick={toggle}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggle(event);
            }
          }}
        >
          <div
            className="relative h-full w-full rounded-2xl shadow-xl transition-transform duration-500 [transform-style:preserve-3d]"
            style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            <CardFace
              image={img}
              badge="Panseke: 14 POS Agents Active"
              buttonText="Flip"
              icon={<RefreshIcon />}
              title="TotalEnergies Omida"
              status="In Stock"
              detail="Cooking Gas 12.5kg • Refill queue: 4 mins"
              detailIcon={<FuelIcon />}
              onFlip={toggle}
            />

            <CardFace
              back
              image={img}
              badge="Omida Market: Live Merchant Status"
              buttonText="Flip Back"
              icon={<ReplayIcon />}
              title="Bola Provision & Gas Depot"
              status="In Stock"
              detail="12.5kg & 6kg Cylinders Ready • Zero wait time"
              detailIcon={<StoreIcon />}
              onFlip={toggle}
            />
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-10 -left-10 z-20 flex items-center gap-2.5 rounded-2xl border border-[#14232B]/10 bg-white p-3 shadow-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#129E9E] text-[#FAF6EE]">
            <VerifiedIcon />
          </div>
          <div className="flex flex-col pr-2">
            <span className="text-sm font-semibold text-[#14232B]">
              100% On-Ground
            </span>
            <span className="text-xs text-[#14232B]/60">Zero Guesswork</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardFace({
  back = false,
  image,
  badge,
  buttonText,
  icon,
  title,
  status,
  detail,
  detailIcon,
  onFlip,
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-white [backface-visibility:hidden] ${
        back ? "border-2 border-[#129E9E]/30 [transform:rotateY(180deg)]" : ""
      }`}
    >
      <div className="flex h-4 w-full shrink-0 justify-between bg-[#E2DAC5] px-2">
        {teeth.map((_, i) => (
          <span key={i} className="-mt-2 h-3 w-3 rounded-full bg-[#FAF6EE]" />
        ))}
      </div>
      <div className="relative w-full flex-1 overflow-hidden">
        <img className="h-full w-full object-cover" src={image} alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14232B]/85 via-transparent to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#129E9E]" />
            <span className="text-xs text-[#14232B]">{badge}</span>
          </div>
          <button
            type="button"
            onClick={onFlip}
            className="flex items-center gap-1.5 rounded-full bg-[#129E9E] px-3 py-1.5 text-xs font-semibold text-[#FAF6EE] shadow-md transition-all hover:scale-105 hover:bg-[#0E7F7F] active:scale-95"
          >
            <span>{buttonText}</span>
            {icon}
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-white/95 p-3.5 shadow-lg backdrop-blur-md">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#129E9E]/10 text-[#129E9E]">
            {detailIcon}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-semibold text-[#14232B]">
                {title}
              </span>
              <span className="text-xs font-bold text-[#129E9E]">{status}</span>
            </div>
            <span className="truncate text-xs text-[#14232B]/70">{detail}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 8a6 6 0 10-1.6 5.7M16 8V3m0 5h-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 8a6 6 0 1110-4.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 3v5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2l2.2 2.2 3.1-.4.9 3 2.8 1.5-1 3 1 3-2.8 1.5-.9 3-3.1-.4L12 22l-2.2-2.2-3.1.4-.9-3-2.8-1.5 1-3-1-3 2.8-1.5.9-3 3.1.4L12 2z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12.2l2.2 2.2 4.3-4.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FuelIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 20V6a1 1 0 011-1h6a1 1 0 011 1v14M4 20h12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14 9h2l2 2v5a1.5 1.5 0 01-3 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 9l1-4h14l1 4M4 9v10h16V9M4 9h16M9 19v-5h6v5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
