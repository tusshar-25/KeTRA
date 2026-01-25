import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Trade from "./pages/Trade";
import Portfolio from "./pages/Portfolio";
import IPO from "./pages/IPO";
import Transactions from "./pages/Transactions";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/Welcome";
import Markets from "./pages/Markets";
import StockDetails from "./pages/StockDetails";
import Profile from "./pages/Profile";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider } from "./context/AuthContext";
import { TradeProvider } from "./context/TradeContext";
import { IPOProvider } from "./context/IPOContext";
import { MarketProvider } from "./context/MarketContext";
import ScreenAlert from "./components/common/ScreenAlert";
import { isFirstVisit } from "./utils/firstVisit";


const App = () => {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if it's first visit
    if (isFirstVisit()) {
      setShowWelcome(true);
    }
  }, []);

  if (showWelcome) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <AlertProvider>
            <TradeProvider>
              <IPOProvider>
                <MarketProvider>
                  <ScreenAlert />
                  <Routes>
                    <Route path="/welcome" element={<Welcome />} />
                    <Route path="*" element={<Navigate to="/welcome" replace />} />
                  </Routes>
                </MarketProvider>
              </IPOProvider>
            </TradeProvider>
          </AlertProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AlertProvider>
          <TradeProvider>
            <IPOProvider>
              <MarketProvider>
                <ScreenAlert />
                <Layout>
                  <Routes>
                    <Route path="/welcome" element={<Navigate to="/" replace />} />
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/trade" element={<Trade />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/ipo" element={<IPO />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/markets" element={<Markets />} />
                    <Route path="/stock-details/:symbol" element={<StockDetails />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </MarketProvider>
            </IPOProvider>
          </TradeProvider>
        </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
