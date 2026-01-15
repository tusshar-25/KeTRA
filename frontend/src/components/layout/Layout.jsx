import { React, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DisclaimerModal from "../common/DisclaimerModal";
import LoginModal from "../common/LoginModal";
import RegisterModal from "../common/RegisterModal";
import { useAuth } from "../../context/AuthContext";

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const isWelcomePage = location.pathname === "/welcome";
  
  useEffect(() => {
  const accepted = localStorage.getItem("ketra_disclaimer_accepted");
  if (!accepted) {
    setShowDisclaimer(true);
  }
}, []);

  const handleAccept = () => {
    localStorage.setItem("ketra_disclaimer_accepted", "true");
    setShowDisclaimer(false);
  };

  


  const handleAuthOpen = (mode) => {
    if (mode === "login") setShowLogin(true);
    if (mode === "register") setShowRegister(true);
  };

  return (
    <>
      {!isWelcomePage && <Navbar onAuthOpen={handleAuthOpen} />}
      <main className="min-h-screen md:pt-0 pt-14 md:pb-0 pb-16">
        {children}
      </main>
      {!isWelcomePage && <Footer />}
      
      <DisclaimerModal open={showDisclaimer} onAccept={handleAccept} />
      <LoginModal 
        open={showLogin} 
        onClose={() => setShowLogin(false)}
        switchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
      <RegisterModal 
        open={showRegister} 
        onClose={() => setShowRegister(false)}
        switchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </>
  );
};

export default Layout;
