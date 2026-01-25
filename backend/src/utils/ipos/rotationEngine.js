import iposOpen from "./iposOpen.js";
import iposUpcoming from "./iposUpcoming.js";
import iposClosed from "./iposClosed.js";

// In-memory storage for persistent IPO state
let ipoState = {
  open: [],
  upcoming: [],
  closed: [],
  lastRotationDate: null,
  initialized: false,
  rotationCycle: 0 // Track rotation cycles
};

// Get all available IPOs from the data files
const getAllIPOs = () => {
  return [
    ...iposOpen.map(ipo => ({ ...ipo, originalSource: 'open' })),
    ...iposUpcoming.map(ipo => ({ ...ipo, originalSource: 'upcoming' })),
    ...iposClosed.map(ipo => ({ ...ipo, originalSource: 'closed' }))
  ];
};

// Initialize or rotate IPO state based on daily cycle
const initializeIPOState = () => {
  const today = new Date().toLocaleDateString('en-CA');
  console.log(`🚀 Initializing IPO state for date: ${today} (Local Time)`);
  
  // Only initialize if not already done today
  if (ipoState.lastRotationDate === today) {
    console.log(`📅 IPO state already initialized for ${today}, using existing state`);
    return ipoState;
  }

  // Get all available IPOs
  const allIPOs = getAllIPOs();
  console.log(`📊 Total IPOs available: ${allIPOs.length}`);

  // Simple rotation logic without dates
  const rotatedState = processDailyRotation(allIPOs, today);
  
  ipoState = {
    ...rotatedState,
    lastRotationDate: today,
    initialized: true
  };

  console.log(`✅ Final counts: Open=${ipoState.open.length}, Upcoming=${ipoState.upcoming.length}, Closed=${ipoState.closed.length}`);
  return ipoState;
};

// Process daily rotation without date logic
const processDailyRotation = (allIPOs, today) => {
  console.log(`🔄 Processing daily rotation for ${today}`);
  
  // Initialize state
  let newState = {
    open: [],
    upcoming: [],
    closed: []
  };

  // Get current rotation cycle (0, 1, 2 for different distributions)
  const cycle = ipoState.rotationCycle % 3;
  
  console.log(`🔄 Using rotation cycle: ${cycle}`);

  // Different distribution patterns for each cycle
  switch (cycle) {
    case 0:
      // Cycle 0: More open IPOs
      distributeIPOs(allIPOs, newState, { open: 8, upcoming: 6, closed: 12 });
      break;
    case 1:
      // Cycle 1: Balanced distribution
      distributeIPOs(allIPOs, newState, { open: 6, upcoming: 8, closed: 12 });
      break;
    case 2:
      // Cycle 2: More upcoming IPOs
      distributeIPOs(allIPOs, newState, { open: 5, upcoming: 10, closed: 11 });
      break;
  }

  // Process applied IPOs - move them to closed after application
  processAppliedIPOs(newState);

  // Ensure minimum counts
  ensureMinimumCounts(newState, allIPOs);

  // Update rotation cycle for next day
  ipoState.rotationCycle++;

  console.log(`📊 After rotation: ${newState.open.length} Open, ${newState.upcoming.length} Upcoming, ${newState.closed.length} Closed`);
  
  return newState;
};

// Distribute IPOs across categories
const distributeIPOs = (allIPOs, state, targets) => {
  const shuffled = [...allIPOs].sort(() => Math.random() - 0.5);
  
  // Assign to open
  state.open = shuffled.splice(0, targets.open).map(ipo => ({
    ...ipo,
    status: 'open',
    openDate: today,
    closeDate: today, // Same day for simplicity
    listingDate: today,
    currentPrice: ipo.issuePrice || (Math.floor(Math.random() * 500) + 500),
    priceChange: (Math.random() * 10 - 5).toFixed(2),
    priceChangePercent: (Math.random() * 6 - 3).toFixed(2)
  }));

  // Assign to upcoming
  state.upcoming = shuffled.splice(0, targets.upcoming).map(ipo => ({
    ...ipo,
    status: 'upcoming',
    openDate: today,
    closeDate: today,
    listingDate: today
  }));

  // Assign to closed (rest)
  state.closed = shuffled.map(ipo => ({
    ...ipo,
    status: ipo.originalSource === 'closed' ? 'listed' : 'closed',
    openDate: today,
    closeDate: today,
    listingDate: today,
    actualListingPrice: ipo.issuePrice ? Math.round(ipo.issuePrice * (1 + (Math.random() * 0.4 - 0.1))) : null,
    listingGain: ipo.issuePrice ? ((Math.random() * 0.4 - 0.1) * 100).toFixed(2) + "%" : null,
    allotted: ipo.originalSource === 'closed',
    listed: ipo.originalSource === 'closed'
  }));
};

// Process applied IPOs - move them from open to closed
const processAppliedIPOs = (state) => {
  // This would integrate with your application tracking system
  // For now, we'll simulate some IPOs moving from open to closed
  const appliedCount = Math.floor(Math.random() * 2); // 0-1 IPOs applied per day
  
  for (let i = 0; i < appliedCount && state.open.length > 3; i++) {
    const appliedIPO = state.open.shift();
    
    // Move to closed as allotted
    state.closed.unshift({
      ...appliedIPO,
      status: 'listed',
      allotted: true,
      listed: true,
      actualListingPrice: Math.round(appliedIPO.issuePrice * (1 + (Math.random() * 0.3))),
      listingGain: ((Math.random() * 0.3) * 100).toFixed(2) + "%"
    });
    
    console.log(`📈 ${appliedIPO.name} moved from OPEN to CLOSED (applied and listed)`);
  }
};

// Ensure minimum counts in each category
const ensureMinimumCounts = (state, allIPOs) => {
  // Ensure minimum open IPOs
  while (state.open.length < 3 && state.upcoming.length > 0) {
    const movedIPO = state.upcoming.shift();
    state.open.push({
      ...movedIPO,
      status: 'open',
      currentPrice: movedIPO.issuePrice || (Math.floor(Math.random() * 500) + 500),
      priceChange: (Math.random() * 10 - 5).toFixed(2),
      priceChangePercent: (Math.random() * 6 - 3).toFixed(2)
    });
    console.log(`➕ Moved ${movedIPO.name} from UPCOMING to OPEN`);
  }

  // Ensure minimum upcoming IPOs
  while (state.upcoming.length < 3 && state.closed.length > 10) {
    const recycledIPO = state.closed.pop();
    state.upcoming.push({
      ...recycledIPO,
      status: 'upcoming',
      id: recycledIPO.id + "-RECYCLED-" + Date.now(),
      name: recycled.name + " (New)",
      actualListingPrice: null,
      listingGain: null,
      allotted: false,
      listed: false
    });
    console.log(`♻️ Recycled ${recycled.name} from CLOSED to UPCOMING`);
  }
};

// Get current IPO status
export const getCurrentIPOStatus = () => {
  return initializeIPOState();
};

// Force refresh IPO data
export const refreshIPOData = () => {
  console.log("🔄 Forcing IPO data refresh");
  ipoState.lastRotationDate = null; // Reset to force rotation
  return getCurrentIPOStatus();
};

// Reset IPO state
export const resetIPOState = () => {
  ipoState = {
    open: [],
    upcoming: [],
    closed: [],
    lastRotationDate: null,
    initialized: false,
    rotationCycle: 0
  };
  console.log("🔄 IPO state has been reset");
};
