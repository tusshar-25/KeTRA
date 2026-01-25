import api from "./api";

// Accelerated IPO Service
export const acceleratedIPOService = {
  // Apply for IPO with accelerated timeline
  applyIPO: async (symbol, amount) => {
    const response = await api.post("/ipo/apply", { symbol, amount });
    return response.data;
  },

  // Get IPO timeline with countdown
  getIPOTimeline: async (symbol) => {
    const response = await api.get(`/ipo/timeline/${symbol}`);
    return response.data;
  },

  // Check withdrawal eligibility
  checkWithdrawEligibility: async (symbol) => {
    const response = await api.get(`/ipo/withdraw-eligibility/${symbol}`);
    return response.data;
  },

  // Get all accelerated IPOs for user
  getMyAcceleratedIPOs: async () => {
    const response = await api.get("/ipo/my-accelerated-ipos");
    return response.data;
  },

  // Withdraw funds
  withdrawFunds: async (symbol) => {
    const response = await api.post(`/ipo/withdraw/${symbol}`);
    return response.data;
  },

  // Calculate countdown for a specific timestamp
  calculateCountdown: (targetTime) => {
    const now = new Date().getTime();
    const target = new Date(targetTime).getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { completed: true, timeLeft: "Completed" };
    }

    const minutes = Math.floor(difference / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
      completed: false,
      timeLeft: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      totalSeconds: Math.floor(difference / 1000),
      minutes,
      seconds
    };
  },

  // Get current status with countdown for all stages
  getIPOStatusWithCountdown: (timeline) => {
    const now = new Date();
    const status = timeline.status;

    const stages = {
      applied: {
        ...timeline.timeline.applied,
        countdown: null,
        completed: true
      },
      allotment: {
        ...timeline.timeline.allotment,
        countdown: timeline.timeline.allotment.completed ? null : 
                  acceleratedIPOService.calculateCountdown(timeline.timeline.allotment.time),
        completed: timeline.timeline.allotment.completed
      },
      listing: {
        ...timeline.timeline.listing,
        countdown: timeline.timeline.listing.completed ? null : 
                  (timeline.timeline.allotment.completed ? 
                   acceleratedIPOService.calculateCountdown(timeline.timeline.listing.time) : null),
        completed: timeline.timeline.listing.completed
      },
      close: {
        ...timeline.timeline.close,
        countdown: timeline.timeline.close.completed ? null : 
                  (timeline.timeline.listing.completed ? 
                   acceleratedIPOService.calculateCountdown(timeline.timeline.close.time) : null),
        completed: timeline.timeline.close.completed
      }
    };

    return {
      symbol: timeline.symbol,
      status,
      stages,
      nextAction: acceleratedIPOService.getNextAction(stages)
    };
  },

  // Determine next action for user
  getNextAction: (stages) => {
    if (!stages.allotment.completed) {
      return {
        type: "allotment",
        message: "Allotment in progress",
        countdown: stages.allotment.countdown
      };
    }

    if (stages.allotment.completed && !stages.listing.completed) {
      return {
        type: "listing",
        message: "Listing announcement pending",
        countdown: stages.listing.countdown
      };
    }

    if (stages.listing.completed && !stages.close.completed) {
      return {
        type: "withdraw",
        message: "Withdraw funds available",
        countdown: stages.close.countdown
      };
    }

    return {
      type: "completed",
      message: "Process completed",
      countdown: null
    };
  }
};

export default acceleratedIPOService;
