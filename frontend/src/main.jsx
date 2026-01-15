import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { TradeProvider } from "./context/TradeContext";
import { IPOProvider } from "./context/IPOContext";
import { AlertProvider } from "./context/AlertContext";



ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AlertProvider>
        <TradeProvider>
          <IPOProvider>
            <App />
          </IPOProvider>
        </TradeProvider>
      </AlertProvider>
    </AuthProvider>
  </React.StrictMode>
);

