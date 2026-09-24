export const telemetryData = {
  pos: {
    icon: "point_of_sale",
    badge: "Panseke Corridor • Live Telemetry",
    title: "Segun & Sons POS Hub (Near Panseke Flyover)",
    subtitle: "Vetted agent #CP-ABK-042 • Operating continuously since 07:30 AM",
    trustLabel: "Verified Float: Yes",
    note: "Simulated live feed from Abeokuta Panseke Agent Network • 14 terminals reporting",
    metrics: [
      ["Cash On Hand", "₦350,000", "check_circle", "Dispensing ₦500 & ₦1000 notes"],
      ["Queue / Wait Time", "~3 Mins", "group", "2 persons currently in line"],
      ["Network Health", "99.4%", "network_wifi", "GTBank & Zenith instant approval"],
      ["Verification Check", "Zero Charges Hike", "task_alt", "Normal standard fee policy"],
    ],
  },
  gas: {
    icon: "propane_tank",
    badge: "Omida District • Live Refill Station",
    title: "TotalEnergies Gas Station (Omida Roundabout)",
    subtitle: "Retail certified refiller #CP-GAS-019 • Heavy cylinders offloaded 1h ago",
    trustLabel: "Digital Scale Certified",
    note: "Simulated live feed from Omida & Ibara cooking gas stations • 6 tanks operational",
    metrics: [
      ["Price per KG", "₦1,150 / kg", "check_circle", "12.5kg refill at ₦14,375 flat"],
      ["Refill Queue Time", "4 Mins", "schedule", "2 dual-nozzle electric pumps active"],
      ["Bulk Tank Level", "82% Stocked", "check_circle", "Estimated stock: 3,200 Litres remaining"],
      ["Safety / Weight", "Tare Weight Zeroed", "verified", "Calibrated electronic platform scale"],
    ],
  },
  food: {
    icon: "restaurant",
    badge: "Omida Market Gate • Hot Food Radar",
    title: "Mama Basira Buka (Omida Junction)",
    subtitle: "Famous Abeokuta Amala & Goat Meat • Hand-pounded batch freshly ready",
    trustLabel: "Clean Kitchen Certified",
    note: "Live status updated by local food runner • 12 top eateries currently tracking",
    metrics: [
      ["Pot Freshness", "Dropped 8m ago", "local_fire_department", "Smoking hot Gbegiri & Ewedu"],
      ["Goat Meat Remaining", "18 Portions", "inventory_2", "Ogun special spiced cuts"],
      ["Dining Hall Space", "12 Seats Open", "chair", "AC section free, fast takeaway line"],
      ["Average Cost/Plate", "₦1,800 - ₦3,500", "payments", "Accepts POS & instant transfer"],
    ],
  },
  house: {
    icon: "real_estate_agent",
    badge: "Ibara GRA & Adigbe • Verified Flats",
    title: "Verified 2-Bedroom Flat (Ibara Housing Estate)",
    subtitle: "Direct landlord liaison verified by City Pulse Abeokuta community steward",
    trustLabel: "Zero Agent Fraud Vetted",
    note: "All listings physically inspected • Keys verified in steward possession",
    metrics: [
      ["Annual Rent", "₦650,000 / yr", "verified", "No double-agent commission extortion"],
      ["Running Water / Power", "Borehole + Pre-paid", "water_drop", "Dedicated transformer line"],
      ["Inspection Status", "Key In Hand", "key", "Inspect today within 45 mins notice"],
      ["Direct Agent Chat", "Direct WhatsApp", "chat", "Tap to message verified manager"],
    ],
  },
};

export const categories = [
  {
    key: "pos",
    icon: "point_of_sale",
    title: "POS / Cash",
    description: "Find an agent with cash on hand nearby. Skip the broken ATMs and empty kiosks.",
    feed: "Live Dispense Check",
  },
  {
    key: "gas",
    icon: "propane_tank",
    title: "Gas Refill",
    description: "See who has fuel in stock before you queue or transport your heavy cylinder.",
    feed: "Weight & Price Feed",
  },
  {
    key: "food",
    icon: "restaurant",
    title: "Food Vendors",
    description: "Know who's open, hot, and serving right now before stepping out into traffic.",
    feed: "Fresh Batch Radar",
  },
  {
    key: "house",
    icon: "real_estate_agent",
    title: "House Agents",
    description: "Reach verified local agents with legitimate listings and transparent inspection terms.",
    feed: "Direct Verified WhatsApp",
  },
];
