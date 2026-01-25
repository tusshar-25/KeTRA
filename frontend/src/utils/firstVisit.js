// Utility to check if it's user's first visit
export const isFirstVisit = () => {
  const hasVisited = localStorage.getItem('ketra_has_visited');
  if (!hasVisited) {
    localStorage.setItem('ketra_has_visited', 'true');
    return true;
  }
  return false;
};

// Utility to reset first visit (for testing)
export const resetFirstVisit = () => {
  localStorage.removeItem('ketra_has_visited');
};
