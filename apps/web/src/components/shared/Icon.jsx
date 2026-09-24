// Icon.jsx

export default function Icon({
  name,
  size = 18,
  className = "",
  strokeWidth = 1.7,
}) {
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
          <path
            d="M4 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "arrow_downward":
      return (
        <svg {...props}>
          <path
            d="M12 4v14M6 13l6 6 6-6"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
          <path
            d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "tune":
      return (
        <svg {...props}>
          <path
            d="M4 6h10M18 6h2M4 18h2M8 18h12M4 12h6M14 12h6"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
          <circle cx="16" cy="6" r="2" fill="currentColor" />
          <circle cx="6" cy="18" r="2" fill="currentColor" />
          <circle cx="10" cy="12" r="2" fill="currentColor" />
        </svg>
      );

    case "check_circle":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <path
            d="M8 12.5l2.5 2.5L16 9.5"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
          <path
            d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
          <path
            d="M9 12l2 2 4-4.5"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
          <path
            d="M8.5 12.2l2.2 2.2 4.3-4.6"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "close":
      return (
        <svg {...props}>
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "domain_add":
      return (
        <svg {...props}>
          <path
            d="M4 21V6l7-3 7 3v15M4 21h16M9 21v-4h4v4M9 10h1M9 14h1M14 10h1"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 9v4m-2-2h4"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "storefront":
      return (
        <svg {...props}>
          <path
            d="M4 9l1-4h14l1 4M4 9v10h16V9M4 9h16M9 19v-5h6v5"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "notifications_active":
      return (
        <svg {...props}>
          <path
            d="M6 8a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5h-15S6 12 6 8z"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
          <path
            d="M10 17.5a2 2 0 004 0"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
          <path
            d="M4 4l1.5 1.5M20 4l-1.5 1.5"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "check":
      return (
        <svg {...props}>
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "payments":
      return (
        <svg {...props}>
          <rect
            x="3"
            y="7"
            width="14"
            height="10"
            rx="2"
            stroke="currentColor"
            strokeWidth={s}
          />
          <circle
            cx="10"
            cy="12"
            r="2.2"
            stroke="currentColor"
            strokeWidth={s}
          />
          <path
            d="M21 9v8a2 2 0 01-2 2H8"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "timer":
      return (
        <svg {...props}>
          <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth={s} />
          <path
            d="M12 9v4l3 2"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 2h6M12 2v2"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "security":
      return (
        <svg {...props}>
          <path
            d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
        </svg>
      );

    case "groups":
      return (
        <svg {...props}>
          <circle cx="8" cy="9" r="2.6" stroke="currentColor" strokeWidth={s} />
          <circle
            cx="16"
            cy="9"
            r="2.6"
            stroke="currentColor"
            strokeWidth={s}
          />
          <path
            d="M3 19c0-3 2.4-5 5-5s5 2 5 5M11 19c0-3 2.4-5 5-5s5 2 5 5"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "sync":
      return (
        <svg {...props}>
          <path
            d="M16 8a6 6 0 10-1.6 5.7M16 8V3m0 5h-5"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "replay":
      return (
        <svg {...props}>
          <path
            d="M4 8a6 6 0 1110-4.7"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
          <path
            d="M4 3v5h5"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "local_gas_station":
      return (
        <svg {...props}>
          <path
            d="M6 20V6a1 1 0 011-1h6a1 1 0 011 1v14M4 20h12"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
          <path
            d="M14 9h2l2 2v5a1.5 1.5 0 01-3 0"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 10h8"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "restaurant":
      return (
        <svg {...props}>
          <path
            d="M6 3v8m0 0a2 2 0 002 2v8M6 11a2 2 0 01-2-2V3M8 3v8"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 3c-1.7 0-3 1.8-3 5s1.3 5 3 5v8"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "point_of_sale":
      return (
        <svg {...props}>
          <rect
            x="3"
            y="8"
            width="18"
            height="12"
            rx="2"
            stroke="currentColor"
            strokeWidth={s}
          />
          <path
            d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2M7 13h4"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "home_work":
      return (
        <svg {...props}>
          <path
            d="M4 21V10l7-5 7 5v11"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
          <path
            d="M4 21h16M9 21v-5h4v5"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "category":
      return (
        <svg {...props}>
          <rect
            x="3"
            y="3"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth={s}
          />
          <rect
            x="13"
            y="3"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth={s}
          />
          <rect
            x="3"
            y="13"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth={s}
          />
          <rect
            x="13"
            y="13"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth={s}
          />
        </svg>
      );

    case "trending_down":
      return (
        <svg {...props}>
          <path
            d="M4 7l6 6 4-4 6 6"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 15h5v-5"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "report_problem":
      return (
        <svg {...props}>
          <path
            d="M12 4l9 16H3L12 4z"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
          <path
            d="M12 10v4"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
          <circle cx="12" cy="17" r="0.9" fill="currentColor" />
        </svg>
      );

    case "cancel":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <path
            d="M9 9l6 6M15 9l-6 6"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "power_off":
      return (
        <svg {...props}>
          <path
            d="M12 3v8"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
          <path
            d="M7.5 6a7.5 7.5 0 109 0"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "sentiment_dissatisfied":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
          <path
            d="M8.5 16c1-1.3 2.2-2 3.5-2s2.5.7 3.5 2"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "soup_kitchen":
      return (
        <svg {...props}>
          <path
            d="M4 11h16a8 6 0 01-16 0z"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
          <path
            d="M6 11V9a6 6 0 0112 0v2"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
          <path
            d="M9 3.5c0 1-1 1-1 2M13 3.5c0 1-1 1-1 2"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "two_wheeler":
      return (
        <svg {...props}>
          <circle cx="6" cy="17" r="3" stroke="currentColor" strokeWidth={s} />
          <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth={s} />
          <path
            d="M6 17l4-8h5l3 5M10 9H8"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "propane_tank":
      return (
        <svg {...props}>
          <rect
            x="7"
            y="6"
            width="10"
            height="14"
            rx="5"
            stroke="currentColor"
            strokeWidth={s}
          />
          <path
            d="M10 6V4h4v2"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "public_off":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <path
            d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
          <path
            d="M4 4l16 16"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "radar":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={s} />
          <path
            d="M12 12L18 6"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
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
          <path
            d="M4 21V10l8-6 8 6v11"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
          <path
            d="M4 21h16M9 21v-6h6v6"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="17"
            cy="8"
            r="1.5"
            stroke="currentColor"
            strokeWidth={s}
          />
        </svg>
      );

    case "apartment":
      return (
        <svg {...props}>
          <rect
            x="5"
            y="3"
            width="14"
            height="18"
            rx="1"
            stroke="currentColor"
            strokeWidth={s}
          />
          <path
            d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
          <path
            d="M10 21v-4h4v4"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "local_pharmacy":
      return (
        <svg {...props}>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="4"
            stroke="currentColor"
            strokeWidth={s}
          />
          <path
            d="M12 8v8M8 12h8"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinecap="round"
          />
        </svg>
      );

    case "build":
      return (
        <svg {...props}>
          <path
            d="M17 3a4 4 0 00-4.9 4.9L4 16v4h4l8.1-8.1A4 4 0 0017 3z"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
        </svg>
      );

    case "map":
      return (
        <svg {...props}>
          <path
            d="M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2-6-2z"
            stroke="currentColor"
            strokeWidth={s}
            strokeLinejoin="round"
          />
          <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth={s} />
        </svg>
      );

    default:
      // Unknown icon names should not break the UI.
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      );
  }
}
