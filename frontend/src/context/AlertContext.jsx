import { createContext, useContext, useState } from "react";

/**
 * Global alert context for showing notifications
 * Provides showAlert and hideAlert functions to all components
 */
const AlertContext = createContext();

/**
 * Alert provider component that manages alert state
 * @param {Object} props - React children components
 */
export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  /**
   * Show alert with configuration
   * @param {Object} config - Alert configuration (type, title, message)
   */
  const showAlert = (config) => {
    setAlert({ ...config, open: true });
  };

  /**
   * Hide current alert
   */
  const hideAlert = () => setAlert(null);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, alert }}>
      {children}
    </AlertContext.Provider>
  );
};

/**
 * Hook to use alert context in components
 * @returns {Object} - Alert context value (showAlert, hideAlert, alert)
 */
export const useAlert = () => useContext(AlertContext);
