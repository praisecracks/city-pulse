// Maps the icon-name strings the design used to reference from
// "material-symbols-outlined" (e.g. "arrow_forward", "storefront") to
// inline SVGs, so nothing depends on loading that icon font.
//
// A few names below (point_of_sale, restaurant, local_gas_station,
// home_work) are best guesses for whatever `data/telemetry.js` uses for
// its four categories — I don't have that file. Anything not in this
// list renders as a small filled dot rather than breaking; add more
// `case`s here (or share telemetry.js) to get exact icons everywhere.
export default function Icon({ name, size = 18, className = "", strokeWidth = 1.7 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
    className,
  };
  const s = strokeWidth;

  switch (name) {
    case "arrow_forward":
      return (
        <svg {...props}>
          <path d="M4 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "play_circle":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <path d="M10 8.5l6 3.5-6 3.5v-7z" fill="currentColor" />
        </svg>
      );
    case "touch_app":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "tune":
      return (
        <svg {...props}>
          <path d="M4 6h10M18 6h2M4 18h2M8 18h12M4 12h6M14 12h6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <circle cx="16" cy="6" r="2" fill="currentColor" />
          <circle cx="6" cy="18" r="2" fill="currentColor" />
          <circle cx="10" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case "warning":
      return (
        <svg {...props}>
          <path d="M12 9v4m0 4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "palette":
      return (
        <svg {...props}>
          <path d="M12 3a6 6 0 000 12H6a6 6 0 010-12h6z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth={s} />
          <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth={s} />
          <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth={s} />
        </svg>
      );
    case "calendar_today":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth={s} />
          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "edit":
      return (
        <svg {...props}>
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "check_circle":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "radio_button_checked":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={s} />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      );
    case "radio_button_unchecked":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={s} />
        </svg>
      );
    case "verified_user":
      return (
        <svg {...props}>
          <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "verified":
      return (
        <svg {...props}>
          <path
            d="M12 2l2.2 2.2 3.1-.4.9 3 2.8 1.5-1 3 1 3-2.8 1.5-.9 3-3.1-.4L12 22l-2.2-2.2-3.1.4-.9-3-2.8-1.5 1-3-1-3 2.8-1.5.9-3 3.1.4L12 2z"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
          <path d="M8.5 12.2l2.2 2.2 4.3-4.6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "close":
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "domain_add":
      return (
        <svg {...props}>
          <path d="M4 21V6l7-3 7 3v15M4 21h16M9 21v-4h4v4M9 10h1M9 14h1M14 10h1" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 9v4m-2-2h4" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "storefront":
      return (
        <svg {...props}>
          <path d="M4 9l1-4h14l1 4M4 9v10h16V9M4 9h16M9 19v-5h6v5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "notifications_active":
      return (
        <svg {...props}>
          <path d="M6 8a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5h-15S6 12 6 8z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M10 17.5a2 2 0 004 0" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M4 4l1.5 1.5M20 4l-1.5 1.5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "payments":
      return (
        <svg {...props}>
          <rect x="3" y="7" width="14" height="10" rx="2" stroke="currentColor" strokeWidth={s} />
          <circle cx="10" cy="12" r="2.2" stroke="currentColor" strokeWidth={s} />
          <path d="M21 9v8a2 2 0 01-2 2H8" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "timer":
      return (
        <svg {...props}>
          <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth={s} />
          <path d="M12 9v4l3 2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 2h6M12 2v2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "security":
      return (
        <svg {...props}>
          <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
        </svg>
      );
    case "groups":
      return (
        <svg {...props}>
          <circle cx="8" cy="9" r="2.6" stroke="currentColor" strokeWidth={s} />
          <circle cx="16" cy="9" r="2.6" stroke="currentColor" strokeWidth={s} />
          <path d="M3 19c0-3 2.4-5 5-5s5 2 5 5M11 19c0-3 2.4-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "sync":
      return (
        <svg {...props}>
          <path d="M16 8a6 6 0 10-1.6 5.7M16 8V3m0 5h-5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "replay":
      return (
        <svg {...props}>
          <path d="M4 8a6 6 0 1110-4.7" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M4 3v5h5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "local_gas_station":
      return (
        <svg {...props}>
          <path d="M6 20V6a1 1 0 011-1h6a1 1 0 011 1v14M4 20h12" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M14 9h2l2 2v5a1.5 1.5 0 01-3 0" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10h8" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "restaurant":
      return (
        <svg {...props}>
          <path d="M6 3v8m0 0a2 2 0 002 2v8M6 11a2 2 0 01-2-2V3M8 3v8" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 3c-1.7 0-3 1.8-3 5s1.3 5 3 5v8" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "point_of_sale":
      return (
        <svg {...props}>
          <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth={s} />
          <path d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2M7 13h4" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "home_work":
      return (
        <svg {...props}>
          <path d="M4 21V10l7-5 7 5v11" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M4 21h16M9 21v-5h4v5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "arrow_downward":
      return (
        <svg {...props}>
          <path d="M12 4v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "category":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth={s} />
          <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth={s} />
          <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth={s} />
          <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth={s} />
        </svg>
      );
    case "trending_down":
      return (
        <svg {...props}>
          <path d="M4 7l6 6 4-4 6 6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 15h5v-5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "report_problem":
      return (
        <svg {...props}>
          <path d="M12 4l9 16H3L12 4z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M12 10v4" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <circle cx="12" cy="17" r="0.9" fill="currentColor" />
        </svg>
      );
    case "cancel":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "power_off":
      return (
        <svg {...props}>
          <path d="M12 3v8" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M7.5 6a7.5 7.5 0 109 0" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "sentiment_dissatisfied":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
          <path d="M8.5 16c1-1.3 2.2-2 3.5-2s2.5.7 3.5 2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "soup_kitchen":
      return (
        <svg {...props}>
          <path d="M4 11h16a8 6 0 01-16 0z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M6 11V9a6 6 0 0112 0v2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M9 3.5c0 1-1 1-1 2M13 3.5c0 1-1 1-1 2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "two_wheeler":
      return (
        <svg {...props}>
          <circle cx="6" cy="17" r="3" stroke="currentColor" strokeWidth={s} />
          <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth={s} />
          <path d="M6 17l4-8h5l3 5M10 9H8" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "propane_tank":
      return (
        <svg {...props}>
          <rect x="7" y="6" width="10" height="14" rx="5" stroke="currentColor" strokeWidth={s} />
          <path d="M10 6V4h4v2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "public_off":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M4 4l16 16" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "radar":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={s} />
          <path d="M12 12L18 6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" />
        </svg>
      );
    case "local_fire_department":
    case "propane":
      return (
        <svg {...props}>
          <path
            d="M12 3c1 3-2 4-2 7a4 4 0 108 0c0-1.5-1-2.5-1.5-3 .3 2-1 2.5-1 2.5.5-3-1.5-4-3.5-6.5z"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "real_estate_agent":
      return (
        <svg {...props}>
          <path d="M4 21V10l8-6 8 6v11" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M4 21h16M9 21v-6h6v6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="17" cy="8" r="1.5" stroke="currentColor" strokeWidth={s} />
        </svg>
      );
    case "apartment":
      return (
        <svg {...props}>
          <rect x="5" y="3" width="14" height="18" rx="1" stroke="currentColor" strokeWidth={s} />
          <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M10 21v-4h4v4" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "local_pharmacy":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth={s} />
          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "shopping_cart":
      return (
        <svg {...props}>
          <circle cx="9" cy="19" r="1.5" stroke="currentColor" strokeWidth={s} />
          <circle cx="19" cy="19" r="1.5" stroke="currentColor" strokeWidth={s} />
          <path d="M2 6h4l2.5 10h11l2-8H6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "print":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="14" rx="1" stroke="currentColor" strokeWidth={s} />
          <path d="M8 7h8M8 11h4M8 15h6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M12 17v3" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "build":
      return (
        <svg {...props}>
          <path d="M17 3a4 4 0 00-4.9 4.9L4 16v4h4l8.1-8.1A4 4 0 0017 3z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
        </svg>
      );
    case "map":
      return (
        <svg {...props}>
          <path d="M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2-6-2z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth={s} />
        </svg>
      );
    case "schedule":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "speed":
      return (
        <svg {...props}>
          <path d="M4 17a8 8 0 1116 0" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M12 17l4-5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.3" fill="currentColor" />
        </svg>
      );
    case "support_agent":
      return (
        <svg {...props}>
          <path d="M5 14v-2a7 7 0 0114 0v2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <rect x="3.5" y="13" width="3.5" height="6" rx="1.5" stroke="currentColor" strokeWidth={s} />
          <rect x="17" y="13" width="3.5" height="6" rx="1.5" stroke="currentColor" strokeWidth={s} />
          <path d="M19 19c0 1.7-2 2.5-5 2.5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "send":
      return (
        <svg {...props}>
          <path d="M4 12L20 4l-4 16-4.5-6L4 12z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M11.5 14L20 4" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "lock":
      return (
        <svg {...props}>
          <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth={s} />
          <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          <path d="M4 5h16v11H9l-5 4V5z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
        </svg>
      );
    case "arrow_outward":
      return (
        <svg {...props}>
          <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "alternate_email":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={s} />
          <path d="M16 12v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "location_on":
      return (
        <svg {...props}>
          <path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth={s} />
        </svg>
      );
    case "explore":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
        </svg>
      );
    case "door_open":
      return (
        <svg {...props}>
          <path d="M6 21V4h9v17M15 6l3 1v14M3 21h18" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12.5" r="0.9" fill="currentColor" />
        </svg>
      );
    case "school":
      return (
        <svg {...props}>
          <path d="M2 9l10-5 10 5-10 5L2 9z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "account_balance":
      return (
        <svg {...props}>
          <path d="M3 10l9-6 9 6H3z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "trending_up":
      return (
        <svg {...props}>
          <path d="M4 16l6-6 4 4 6-7" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 7h5v5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "help_center":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth={s} />
          <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="0.9" fill="currentColor" />
        </svg>
      );
    case "expand_more":
      return (
        <svg {...props}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "visibility":
      return (
        <svg {...props}>
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" stroke="currentColor" strokeWidth={s} />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={s} />
        </svg>
      );
    case "visibility_off":
      return (
        <svg {...props}>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-3-11-7.5a10.07 10.07 0 013.58-5.68" stroke="currentColor" strokeWidth={s} />
          <path d="M1 1l22 22" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={s} />
        </svg>
      );
    case "logout":
      return (
        <svg {...props}>
          <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "menu":
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "close":
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "home":
      return (
        <svg {...props}>
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "assignment":
      return (
        <svg {...props}>
          <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "bar_chart":
      return (
        <svg {...props}>
          <path d="M3 3v18h18" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M7 16v4M14 12v8M21 8v12" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={s} />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...props}>
          <path d="M4 4v5h5M4 4l2.5 2.5M20 20v-5h-5M20 20l-2.5-2.5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "table_chart":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={s} />
          <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "picture_as_pdf":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M16 13h-6M16 17h-6M10 9h6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "schedule":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "person_add":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8.5" cy="7" r="2.5" stroke="currentColor" strokeWidth={s} />
          <path d="M20 8h-3M20 8v3" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    case "expand_more":
      return (
        <svg {...props}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "expand_less":
      return (
        <svg {...props}>
          <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chevron_right":
      return (
        <svg {...props}>
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chevron_left":
      return (
        <svg {...props}>
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "notifications_active":
      return (
        <svg {...props}>
          <path d="M6 8a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5h-15S6 12 6 8z" stroke="currentColor" strokeWidth={s} strokeLinejoin="round" />
          <path d="M10 17.5a2 2 0 004 0" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
          <path d="M4 4l1.5 1.5M20 4l-1.5 1.5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      );
  }
}
