import { useState } from "react";
import img from "../../assets/Subtract.png";

const teeth = Array.from({ length: 8 });

export default function HeroFlipCard() {
  const [flipped, setFlipped] = useState(false);

  const toggle = (event) => {
    event?.stopPropagation();
    setFlipped((value) => !value);
  };

  return (
    <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
      <div className="absolute -inset-4 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="relative w-full max-w-[420px] aspect-[4/5] flex items-center justify-center">
        <div className="absolute inset-0 bg-surface-container-highest rounded-2xl rotate-6 translate-x-3 translate-y-3 opacity-60 shadow-md pointer-events-none" />
        <div className="absolute inset-0 bg-secondary-container rounded-2xl -rotate-3 -translate-x-2 -translate-y-2 opacity-80 shadow-md pointer-events-none" />

        <div
          className="relative z-10 w-full h-full flip-card-perspective cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="Interactive 3D Card: Click to flip between consumer radar and merchant status"
          onClick={toggle}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggle(event);
            }
          }}
        >
          <div
            className={`flip-card-inner shadow-xl rounded-2xl ${flipped ? "flipped" : ""}`}
          >
            <CardFace
              image={img}
              badge="Panseke: 14 POS Agents Active"
              buttonText="Flip"
              buttonIcon="sync"
              title="TotalEnergies Omida"
              status="In Stock"
              detail="Cooking Gas 12.5kg • Refill queue: 4 mins"
              detailIcon="local_gas_station"
              onFlip={toggle}
            />

            <CardFace
              back
              image={img}
              badge="Omida Market: Live Merchant Status"
              buttonText="Flip Back"
              buttonIcon="replay"
              title="Bola Provision & Gas Depot"
              status="In Stock"
              detail="12.5kg & 6kg Cylinders Ready • Zero wait time"
              detailIcon="storefront"
              onFlip={toggle}
            />
          </div>
        </div>

        <div className="absolute -bottom-6 -left-6 z-20 p-3 bg-surface-container-lowest rounded-2xl shadow-xl flex items-center gap-2.5 card-hover-teal border border-outline-variant/30 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">
              verified
            </span>
          </div>
          <div className="flex flex-col pr-2">
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              100% On-Ground
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Zero Guesswork
            </span>
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
  buttonIcon,
  title,
  status,
  detail,
  detailIcon,
  onFlip,
}) {
  return (
    <div
      className={`flip-card-face bg-surface-container-lowest flex flex-col card-hover-teal ${back ? "flip-card-back border-2 border-primary/30" : ""}`}
    >
      <div className="h-4 w-full bg-surface-container-high flex justify-between px-2 shrink-0">
        {teeth.map((_, i) => (
          <span key={i} className="w-3 h-3 bg-surface rounded-full -mt-2" />
        ))}
      </div>
      <div className="relative flex-1 w-full overflow-hidden">
        <img className="w-full h-full object-cover" src={image} alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/85 via-transparent to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          <div className="px-3 py-1.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-md shadow-md flex items-center gap-2 pulse-ring-anim">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label-sm text-label-sm text-on-surface">
              {badge}
            </span>
          </div>
          <button
            type="button"
            onClick={onFlip}
            className="px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm shadow-md flex items-center gap-1.5 hover:bg-primary-container transition-all hover:scale-105 active:scale-95"
          >
            <span>{buttonText}</span>
            <span className="material-symbols-outlined text-[16px]">
              {buttonIcon}
            </span>
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md shadow-lg flex items-center gap-3 card-hover-teal">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">
              {detailIcon}
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                {title}
              </span>
              <span className="font-label-sm text-label-sm text-primary font-bold">
                {status}
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
              {detail}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
