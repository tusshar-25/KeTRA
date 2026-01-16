import iposOpen from "./iposOpen.js";
import iposUpcoming from "./iposUpcoming.js";
import iposClosed from "./iposClosed.js";

// helper: add days to date
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

// helper: subtract days from date
const subtractDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
};

// In-memory storage for persistent IPO state
let ipoState = {
  open: [],
  upcoming: [],
  closed: [],
  lastRotationDate: null,
  initialized: false
};

// Generate realistic dates for IPOs
const generateRealisticDates = (baseIPO, today, index) => {
  // Create a realistic timeline based on today's date
  const todayObj = new Date(today);
  const dayOfWeek = todayObj.getDay();
  
  // Show more IPOs opening today for better visibility
  // Create overlapping IPO periods for more variety
  let daysFromToday;
  if (index < 15) {
    daysFromToday = 0; // First 15 IPOs open today
  } else if (index < 25) {
    daysFromToday = 1; // Next 10 IPOs open tomorrow
  } else if (index < 30) {
    daysFromToday = 2; // Next 5 IPOs open day after tomorrow
  } else {
    daysFromToday = index - 25; // Rest spread out
  }
  
  // If today is weekend, start from next Monday
  if (dayOfWeek === 6) { // Saturday
    daysFromToday += 2; // Skip to Monday
  } else if (dayOfWeek === 0) { // Sunday
    daysFromToday += 1; // Skip to Monday
  }
  
  // IPOs open for 4-5 business days (longer period for more overlap)
  const openDate = addDays(today, daysFromToday);
  const closeDate = addDays(openDate, 4); // 4 days after open (was 3)
  const listingDate = addDays(closeDate, 1); // 1 day after close (SAME DAY ALLOTMENT & LISTING)
  
  return {
    ...baseIPO,
    openDate,
    closeDate,
    listingDate
  };
};

// Initialize IPO state with realistic dates
const initializeIPOState = () => {
  // Use local timezone (IST) instead of UTC
  const now = new Date();
  const today = new Date(now.getTime() + (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  console.log(`🚀 Initializing IPO state for date: ${today} (Local Time)`);
  
  // Only initialize if not already done today
  if (ipoState.lastRotationDate === today) {
    console.log(`📅 IPO state already initialized for ${today}, using existing state`);
    return ipoState;
  }

  // Use the actual dates from IPO data instead of generating new ones
  const allIPOs = [
    ...iposOpen.map((ipo) => ({ ...ipo })), // Keep original dates
    ...iposUpcoming.map((ipo) => ({ ...ipo })) // Keep original dates
  ];
  
  // Filter by actual dates from the data
  ipoState.open = allIPOs.filter(ipo => ipo.openDate <= today && today <= ipo.closeDate);
  ipoState.upcoming = allIPOs.filter(ipo => today < ipo.openDate);
  ipoState.closed = iposClosed;
  ipoState.lastRotationDate = today;
  ipoState.initialized = true;

  console.log(`📊 Initial IPO State: ${ipoState.open.length} Open, ${ipoState.upcoming.length} Upcoming, ${ipoState.closed.length} Closed`);
  return ipoState;
};

// Process real-time daily rotation
const processDailyRotation = () => {
  // Use local timezone (IST) instead of UTC
  const now = new Date();
  const today = new Date(now.getTime() + (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  
  // Skip rotation if already processed today
  if (ipoState.lastRotationDate === today) {
    return ipoState;
  }
  
  console.log(`🔄 Processing daily rotation for ${today} (Local Time)`);
  console.log(`📊 Before rotation: ${ipoState.open.length} Open, ${ipoState.upcoming.length} Upcoming, ${ipoState.closed.length} Closed`);

  // Use actual IPO data with real dates
  const allIPOs = [
    ...iposOpen.map((ipo) => ({ ...ipo })), // Keep original dates
    ...iposUpcoming.map((ipo) => ({ ...ipo })) // Keep original dates
  ];
  
  // Filter by actual dates from the data
  ipoState.open = allIPOs.filter(ipo => ipo.openDate <= today && today <= ipo.closeDate);
  ipoState.upcoming = allIPOs.filter(ipo => today < ipo.openDate);

  // CLOSED: IPOs where today is after closeDate
  const newlyClosed = allIPOs.filter((ipo) => {
    const isClosed = today > ipo.closeDate;
    console.log(`📅 ${ipo.name}: Close=${ipo.closeDate}, Today=${today}, IsClosed=${isClosed}`);
    return isClosed;
  });

  // ALLOTMENT: Check for IPOs that should be allotted today (day after closing)
  const dayAfterClose = addDays(today, -1); // Yesterday was the close date
  const toBeAllotted = newlyClosed.filter(ipo => ipo.closeDate === dayAfterClose && !ipo.allotted);
  
  // Process allotments and listings for IPOs that closed yesterday
  toBeAllotted.forEach(ipo => {
    // Generate realistic listing performance (-10% to +30%)
    const listingPerformance = 1 + (Math.random() * 0.4 - 0.1);
    const actualListingPrice = Math.round(ipo.issuePrice * listingPerformance);
    const listingGain = ((listingPerformance - 1) * 100).toFixed(2);
    
    // Mark as allotted and listed
    ipo.allotted = true;
    ipo.allotmentDate = today;
    ipo.listed = true;
    ipo.listingDate = today;
    ipo.actualListingPrice = actualListingPrice;
    ipo.listingGain = listingGain + "%";
    
    // Move to closed list with final status
    const existingClosed = ipoState.closed.find(c => c.id === ipo.id);
    if (!existingClosed) {
      ipoState.closed.unshift({
        ...ipo,
        status: "listed",
        actualListingPrice,
        listingGain: listingGain + "%",
        listingDate: today,
        allotted: true,
        allotmentDate: today,
        listed: true
      });
      
      console.log(`🎉 ${ipo.name} ALLOTTED & LISTED today - Listing: ₹${actualListingPrice} (${listingGain}%)`);
    }
  });

  // Add other newly closed IPOs (that aren't being allotted today) to closed list
  newlyClosed.forEach(ipo => {
    const existingClosed = ipoState.closed.find(c => c.id === ipo.id);
    const isBeingAllottedToday = toBeAllotted.find(a => a.id === ipo.id);
    
    if (!existingClosed && !isBeingAllottedToday) {
      // For IPOs that closed but not being allotted today, set future listing date
      const futureListingDate = addDays(ipo.closeDate, 1);
      
      ipoState.closed.unshift({
        ...ipo,
        status: "closed",
        allotted: false,
        listingDate: futureListingDate,
        actualListingPrice: null,
        listingGain: null
      });
      
      console.log(`📉 ${ipo.name} moved to CLOSED - Will be allotted & listed on ${futureListingDate}`);
    }
  });

  // 2️⃣ ENSURE MINIMUM IPO COUNTS
  
  // Ensure minimum open IPOs (create new if needed)
  if (ipoState.open.length < 2) {
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
      allotted: false,
      listed: false,
      allotmentDate: null,
      ...generateRealisticDates({}, today, Date.now())
    };
    ipoState.open.push(syntheticIPO);
    console.log(`➕ Created synthetic IPO: ${syntheticIPO.name} (lists on ${syntheticIPO.listingDate})`);
  }

  // Ensure minimum upcoming IPOs
  if (ipoState.upcoming.length < 3) {
    const upcomingIPO = {
      id: "UPCOMING-" + Date.now(),
      name: "Future Solutions Ltd",
      symbol: "FUTR" + Math.floor(Math.random() * 1000),
      sector: "Healthcare",
      priceBand: `₹${Math.floor(Math.random() * 400 + 400)} - ₹${Math.floor(Math.random() * 400 + 500)}`,
      issuePrice: Math.floor(Math.random() * 400 + 500),
      lotSize: Math.floor(Math.random() * 15 + 15),
      minInvestment: Math.floor(Math.random() * 8000 + 4000),
      issueSize: `₹${Math.floor(Math.random() * 3000 + 800)} Cr`,
      riskLevel: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
      description: "Innovative healthcare company focusing on future medical solutions.",
      status: "upcoming",
      allotted: false,
      listed: false,
      allotmentDate: null,
      ...generateRealisticDates({}, today, Date.now() + 1000)
    };
    ipoState.upcoming.push(upcomingIPO);
    console.log(`➕ Created upcoming IPO: ${upcomingIPO.name} (lists on ${upcomingIPO.listingDate})`);
  }

  // 3️⃣ ROTATION: Recycle old closed IPOs to upcoming
  if (ipoState.upcoming.length < 5 && ipoState.closed.length > 8) {
    const recycled = ipoState.closed.pop(); // Take oldest closed IPO
    
    // Generate new future dates for recycled IPO (30-45 days from now)
    const futureDays = 30 + Math.floor(Math.random() * 15);
    const newOpenDate = addDays(today, futureDays);
    const newCloseDate = addDays(newOpenDate, 4); // 4 days open period
    const newListingDate = addDays(newCloseDate, 1); // Same day allotment & listing
    
    ipoState.upcoming.push({
      ...recycled,
      openDate: newOpenDate,
      closeDate: newCloseDate,
      listingDate: newListingDate,
      status: "upcoming",
      id: recycled.id + "-RECYCLED-" + Date.now(),
      name: recycled.name + " (Re-listed)",
      description: recycled.description + " This IPO has been re-listed due to market demand.",
      actualListingPrice: null,
      listingGain: null,
      allotted: false,
      listed: false,
      allotmentDate: null
    });
    
    console.log(`♻️ Recycled ${recycled.name} to UPCOMING - Reopens on ${newOpenDate}, lists on ${newListingDate}`);
  }

  // Update state with proper status
  ipoState = { 
    open: ipoState.open.map(ipo => ({ ...ipo, status: 'open' })),
    upcoming: ipoState.upcoming.map(ipo => ({ ...ipo, status: 'upcoming' })),
    closed: ipoState.closed.map(ipo => ({ 
      ...ipo, 
      status: ipo.listed ? 'listed' : 'closed'
    })),
    lastRotationDate: today,
    initialized: true
  };

  console.log(`📊 After rotation: ${ipoState.open.length} Open, ${ipoState.upcoming.length} Upcoming, ${ipoState.closed.length} Closed`);
  console.log(`📅 Today's Date: ${today}`);
  console.log(`✅ Open IPOs (${ipoState.open.length}): ${ipoState.open.map(i => `${i.name} (${i.openDate} - ${i.closeDate})`).join(', ')}`);
  console.log(`🔄 Upcoming IPOs (${ipoState.upcoming.length}): ${ipoState.upcoming.map(i => `${i.name} (opens ${i.openDate})`).join(', ')}`);
  
  return ipoState;
};

// Get current IPO status (with proper state management)
export const getCurrentIPOStatus = () => {
  // Initialize if not done yet
  if (!ipoState.initialized) {
    return initializeIPOState();
  }
  
  // Process daily rotation
  return processDailyRotation();
};

// Force refresh IPO data (for manual refresh)
export const refreshIPOData = () => {
  console.log("🔄 Forcing IPO data refresh");
  ipoState.lastRotationDate = null; // Reset to force rotation
  return getCurrentIPOStatus();
};

// Reset IPO state (for testing)
export const resetIPOState = () => {
  ipoState = {
    open: [],
    upcoming: [],
    closed: [],
    lastRotationDate: null,
    initialized: false
  };
  console.log("🔄 IPO state has been reset");
};
