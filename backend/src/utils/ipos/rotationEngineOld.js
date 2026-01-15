import iposOpen from "./iposOpen.js";
import iposUpcoming from "./iposUpcoming.js";
import iposClosed from "./iposClosed.js";

// helper: add days to date
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

// In-memory storage for persistent IPO state (simulates database)
let ipoState = {
  open: [],
  upcoming: [],
  closed: [],
  initialized: false
};

// helper: generate dynamic dates based on current date (only for new IPOs)
const generateDynamicDates = (baseIPO, today) => {
  const daysFromOpen = Math.floor(Math.random() * 7); // 0-6 days from today
  const openDate = addDays(today, daysFromOpen);
  const closeDate = addDays(openDate, 3); // 3 days after open
  const listingDate = addDays(closeDate, 5); // 5 days after close
  
  return {
    ...baseIPO,
    openDate,
    closeDate,
    listingDate
  };
};

// Initialize IPO state (runs once on server start)
const initializeIPOState = () => {
  const today = new Date().toISOString().split("T")[0];
  console.log(`🚀 Initializing IPO state for date: ${today}`);

  // Set initial dates for base IPOs
  ipoState.open = iposOpen.map(ipo => generateDynamicDates(ipo, today));
  ipoState.upcoming = iposUpcoming.map(ipo => generateDynamicDates(ipo, today));
  ipoState.closed = iposClosed;
  ipoState.initialized = true;

  console.log(`📊 Initial IPO State: ${ipoState.open.length} Open, ${ipoState.upcoming.length} Upcoming, ${ipoState.closed.length} Closed`);
  return ipoState;
};

// Real-time IPO rotation (maintains state like real market)
export const rotateIPOs = () => {
  const today = new Date().toISOString().split("T")[0];
  console.log(`🔄 Processing IPO rotation for date: ${today}`);
  
  // Initialize if not done yet
  if (!ipoState.initialized) {
    return initializeIPOState();
  }

  console.log(`📊 Before rotation: ${ipoState.open.length} Open, ${ipoState.upcoming.length} Upcoming, ${ipoState.closed.length} Closed`);

  let { open, upcoming, closed } = ipoState;

  // STRICT DATE-BASED CATEGORIZATION
  
  // 1️⃣ OPEN SECTION: Only IPOs where today is between openDate and closeDate (inclusive)
  open = open.filter((ipo) => {
    return ipo.openDate <= today && today <= ipo.closeDate;
  });

  // 2️⃣ UPCOMING SECTION: Only IPOs where today is before openDate
  upcoming = upcoming.filter((ipo) => {
    return today < ipo.openDate;
  });

  // 3️⃣ CLOSED SECTION: Only IPOs where today is after closeDate
  const newlyClosed = open.filter((ipo) => {
    return today > ipo.closeDate;
  });

  // Add newly closed to closed list with listing performance
  newlyClosed.forEach(ipo => {
    closed.unshift({
      ...ipo,
      status: "closed",
      actualListingPrice: ipo.issuePrice * (1 + (Math.random() * 0.4 - 0.1)), // -10% to +30% listing gain/loss
      listingGain: ((Math.random() * 0.4 - 0.1) * 100).toFixed(2) + "%",
      listingDate: ipo.listingDate || addDays(ipo.closeDate, 5)
    });
  });

  // Remove newly closed from open section
  open = open.filter((ipo) => {
    return today <= ipo.closeDate;
  });

  // 4️⃣ MOVE READY UPCOMING TO OPEN: IPOs whose openDate has arrived
  const readyToOpen = upcoming.filter((ipo) => {
    return ipo.openDate <= today && today <= ipo.closeDate;
  });

  readyToOpen.forEach(ipo => {
    open.push({
      ...ipo,
      status: "open"
    });
  });

  // Remove opened from upcoming
  upcoming = upcoming.filter((ipo) => {
    return today < ipo.openDate;
  });

  // 5️⃣ ROTATION: Move old closed IPOs to upcoming (keep market active)
  if (upcoming.length < 15 && closed.length > 8) {
    const recycled = closed.pop(); // Take oldest closed IPO
    
    // Generate completely new dates for recycled IPO
    const newDates = generateDynamicDates(recycled, today);
    
    upcoming.push({
      ...recycled,
      ...newDates,
      status: "upcoming",
      id: recycled.id + "-RECYCLED-" + Date.now(), // Unique ID for recycled IPO
      name: recycled.name + " (Re-listed)",
      description: recycled.description + " This IPO has been re-listed due to market demand.",
      // Reset listing performance for new cycle
      actualListingPrice: null,
      listingGain: null
    });
  }

  // 6️⃣ Ensure minimum open IPOs
  if (open.length < 1) {
    const syntheticIPO = {
      id: "SYNTHETIC-" + Date.now(),
      name: "Tech Innovation Ltd",
      symbol: "TECH" + Math.floor(Math.random() * 1000),
      sector: "Technology",
      priceBand: `₹${Math.floor(Math.random() * 500 + 500)} - ₹${Math.floor(Math.random() * 500 + 600)}`,
      issuePrice: Math.floor(Math.random() * 500 + 600),
      lotSize: Math.floor(Math.random() * 20 + 10),
      minInvestment: Math.floor(Math.random() * 10000 + 5000),
      issueSize: `₹${Math.floor(Math.random() * 5000 + 1000)} Cr`,
      riskLevel: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
      description: "Leading technology company with innovative solutions and strong growth potential.",
      status: "open",
      ...generateDynamicDates({}, today)
    };
    
    open.push(syntheticIPO);
  }

  // Update the persistent state
  ipoState = { open, upcoming, closed, initialized: true };

  console.log(`📊 After rotation: ${ipoState.open.length} Open, ${ipoState.upcoming.length} Upcoming, ${ipoState.closed.length} Closed`);
  console.log(`📅 Today's Date: ${today}`);
  console.log(`✅ Open IPOs (Today ${today}): ${open.map(i => i.name + ' (' + i.openDate + ' - ' + i.closeDate + ')').join(', ')}`);
  console.log(`🔄 Rotation: ${closed.length > 8 ? 'Recycling old IPOs to upcoming' : 'No recycling needed'}`);
  
  return ipoState;
};

// Function to get current IPO status (returns persistent state)
export const getCurrentIPOStatus = () => {
  return rotateIPOs(); // Always process rotation but maintain state
};

// Function to reset IPO state (for testing/admin use)
export const resetIPOState = () => {
  ipoState = {
    open: [],
    upcoming: [],
    closed: [],
    initialized: false
  };
  console.log("🔄 IPO state has been reset");
};
