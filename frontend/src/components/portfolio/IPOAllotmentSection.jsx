import React, { useState, useEffect, useContext } from 'react';
import { useTrade } from '../../context/TradeContext';
import { withdrawIPOApplication } from '../../services/ipoService';
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import { getIPOApplications, getIPOs, initializeAcceleratedIPOs } from "../../services/ipoService";
import Card from "../common/Card";
import Loader from "../common/Loader";

const IPOAllotmentSection = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { setWallet } = useTrade(); // Add TradeContext to update wallet
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);
  const [allIPOs, setAllIPOs] = useState([]);
  const [expandedApplications, setExpandedApplications] = useState(new Set());
  const [applicationTimelines, setApplicationTimelines] = useState({});

  // Custom confirmation function using alert system
  const showConfirmation = (title, message, onConfirm) => {
    showAlert({
      type: "info",
      title: title,
      message: message,
      onConfirm: onConfirm
    });
  };

  // Instant IPO process - no countdown
  const processInstantIPO = async (applicationId, symbol) => {
    console.log(`🎯 Starting instant IPO process for ${symbol}`);
    
    // Instant allotment decision
    const isAllotted = Math.random() > 0.5; // 50% chance of allotment
    
    // Get actual application data to use real values
    const application = applications.find(app => app.id === applicationId);
    const actualIssuePrice = application ? application.amountApplied / application.sharesApplied : 980;
    const actualSharesApplied = application ? application.sharesApplied : 15;
    const actualAmountApplied = application ? application.amountApplied : 14700;
    
    // Generate realistic listing price (10-50% profit max)
    const profitMultiplier = 1.1 + Math.random() * 0.4; // 10% to 50% profit
    const listingPrice = isAllotted ? Math.round(actualIssuePrice * profitMultiplier) : null;
    
    console.log(`📊 IPO Data for ${symbol}:`, {
      isAllotted,
      actualIssuePrice,
      actualSharesApplied,
      actualAmountApplied,
      listingPrice,
      profitMultiplier: ((profitMultiplier - 1) * 100).toFixed(1) + '%'
    });
    
    // Update backend database immediately
    try {
      console.log(`📡 Sending to backend: ${symbol}, isAllotted: ${isAllotted}`);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ipo/instant-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ketra_token')}`
        },
        body: JSON.stringify({
          applicationId,
          symbol,
          isAllotted,
          listingPrice,
          sharesApplied: actualSharesApplied,
          amountApplied: actualAmountApplied,
          issuePrice: actualIssuePrice
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Backend updated for ${symbol}:`, result);
        
        // Update frontend state based on backend response
        if (isAllotted) {
          // Calculate profit/loss using actual values
          const profitPerShare = listingPrice - actualIssuePrice;
          const totalProfit = profitPerShare * actualSharesApplied;
          const profitPercentage = ((profitPerShare / actualIssuePrice) * 100).toFixed(2);
          
          console.log(`💰 Profit Calculation for ${symbol}:`, {
            listingPrice,
            actualIssuePrice,
            profitPerShare,
            actualSharesApplied,
            totalProfit,
            profitPercentage
          });
          
          // Update to allotted status immediately
          setApplications(prev => prev.map(app => 
            app.id === applicationId 
              ? { 
                  ...app, 
                  status: 'allotted',
                  sharesAllotted: actualSharesApplied,
                  amountAllotted: actualAmountApplied,
                  listingPrice: listingPrice,
                  profitLoss: totalProfit,
                  profitLossPercentage: parseFloat(profitPercentage)
                }
              : app
          ));
          
          // Set timeline to show instant allotment and listing
          setApplicationTimelines(prev => ({
            ...prev,
            [applicationId]: {
              symbol: symbol,
              status: 'allotted',
              timeline: {
                applied: { time: new Date().toISOString(), completed: true },
                allotment: { 
                  time: new Date().toISOString(),
                  completed: true,
                  result: 'Allotted'
                },
                listing: { 
                  time: new Date().toISOString(),
                  completed: true,
                  price: listingPrice
                },
                close: { 
                  time: new Date().toISOString(),
                  completed: false
                }
              }
            }
          }));
          
          // Update to listed status immediately (no delay)
          setApplications(prev => prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: 'listed' }
              : app
          ));
          
          setApplicationTimelines(prev => ({
            ...prev,
            [applicationId]: {
              ...prev[applicationId],
              status: 'listed',
              timeline: {
                ...prev[applicationId].timeline,
                listing: {
                  ...prev[applicationId].timeline.listing,
                  completed: true,
                  price: listingPrice
                }
              }
            }
          }));
          
          console.log(`📈 ${symbol}: Immediately listed at ₹${listingPrice}, P&L: ₹${totalProfit} (${profitPercentage}%)`);
          
          console.log(`🎊 ${symbol}: Instantly allotted ${actualSharesApplied} shares`);
          
        } else {
          // Not allotted - update to not_allotted status immediately
          setApplications(prev => prev.map(app => 
            app.id === applicationId 
              ? { 
                  ...app, 
                  status: 'not_allotted',
                  sharesAllotted: 0,
                  amountAllotted: 0,
                  refundAmount: actualAmountApplied
                }
              : app
          ));
          
          // Set timeline to show instant not allotted result
          setApplicationTimelines(prev => ({
            ...prev,
            [applicationId]: {
              symbol: symbol,
              status: 'not_allotted',
              timeline: {
                applied: { time: new Date().toISOString(), completed: true },
                allotment: { 
                  time: new Date().toISOString(),
                  completed: true,
                  result: 'Not Allotted'
                },
                listing: { 
                  time: new Date().toISOString(),
                  completed: false,
                  price: null
                },
                close: { 
                  time: new Date().toISOString(),
                  completed: false
                }
              }
            }
          }));
          
          console.log(`❌ ${symbol}: Not allotted - full refund available`);
        }
        
      } else {
        console.error(`❌ Backend update failed for ${symbol}:`, response.status, response.statusText);
        // Still update frontend state even if backend fails
        if (isAllotted) {
          const profitPerShare = listingPrice - actualIssuePrice;
          const totalProfit = profitPerShare * actualSharesApplied;
          const profitPercentage = ((profitPerShare / actualIssuePrice) * 100).toFixed(2);
          
          setApplications(prev => prev.map(app => 
            app.id === applicationId 
              ? { 
                  ...app, 
                  status: 'allotted',
                  sharesAllotted: actualSharesApplied,
                  amountAllotted: actualAmountApplied,
                  listingPrice: listingPrice,
                  profitLoss: totalProfit,
                  profitLossPercentage: parseFloat(profitPercentage)
                }
              : app
          ));
        } else {
          setApplications(prev => prev.map(app => 
            app.id === applicationId 
              ? { 
                  ...app, 
                  status: 'not_allotted',
                  sharesAllotted: 0,
                  amountAllotted: 0,
                  refundAmount: actualAmountApplied
                }
              : app
          ));
        }
      }
    } catch (error) {
      console.error(`❌ Error updating backend for ${symbol}:`, error);
      // Still update frontend state even if backend fails
      if (isAllotted) {
        const profitPerShare = listingPrice - actualIssuePrice;
        const totalProfit = profitPerShare * actualSharesApplied;
        const profitPercentage = ((profitPerShare / actualIssuePrice) * 100).toFixed(2);
        
        setApplications(prev => prev.map(app => 
          app.id === applicationId 
            ? { 
                ...app, 
                status: 'allotted',
                sharesAllotted: actualSharesApplied,
                amountAllotted: actualAmountApplied,
                listingPrice: listingPrice,
                profitLoss: totalProfit,
                profitLossPercentage: parseFloat(profitPercentage)
              }
            : app
        ));
      } else {
        setApplications(prev => prev.map(app => 
          app.id === applicationId 
            ? { 
                ...app, 
                status: 'not_allotted',
                sharesAllotted: 0,
                amountAllotted: 0,
                refundAmount: actualAmountApplied
              }
            : app
        ));
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchApplications();
    fetchAllIPOs();
  }, [user]);

  // Process instant IPO for all applications that need processing
  useEffect(() => {
    applications.forEach(app => {
      // Skip withdrawn applications entirely
      if (app.isWithdrawn || app.status === 'refunded') {
        return;
      }
      
      // Process any application that is in 'applied', 'pending', or 'allotted' status
      // and doesn't have profit/loss calculated yet
      const needsProcessing = (app.status === 'applied' || app.status === 'pending' || app.status === 'allotted') && 
                           !app.profitLoss && !app.listingPrice;
      
      if (needsProcessing) {
        console.log(`🔄 Processing application: ${app.ipoSymbol}, status: ${app.status}`);
        // Process IPO instantly
        processInstantIPO(app.id, app.ipoSymbol);
        console.log(`✅ Processing ENABLED for ${app.ipoSymbol}`);
      } else {
        console.log(`⏭️ Skipping processed application: ${app.ipoSymbol}, status: ${app.status}`);
      }
    });
  }, [applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching IPO applications...');
      const response = await getIPOApplications();
      console.log('📥 Raw response:', response);
      console.log('📊 Response data:', response.data);
      
      // Applications are nested in response.data.applications
      const applicationsData = Array.isArray(response.data?.applications) ? response.data.applications : [];
      console.log('✅ Processed applications data:', applicationsData);
      console.log('📏 Applications count:', applicationsData.length);
      
      setApplications(applicationsData);
      
      // Set loading to false BEFORE initialization
      setLoading(false);
      console.log('📱 Loading set to false, applications should render now');
      
      // Initialize existing applications into accelerated system (non-blocking)
      if (applicationsData.length > 0) {
        try {
          console.log('🚀 Starting initialization of accelerated IPOs...');
          // Add timeout promise to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Initialization timeout')), 35000)
          );
          
          const initResponse = await Promise.race([
            initializeAcceleratedIPOs(applicationsData),
            timeoutPromise
          ]);
          
          console.log('📥 Initialization response:', initResponse);
          console.log('📊 Initialization response data:', initResponse.data);
          console.log(`🚀 Initialized ${initResponse.data?.initialized || 0} applications into accelerated system`);
        } catch (error) {
          console.error("Failed to initialize accelerated IPOs:", error);
          console.error("Initialization error details:", error.response?.data);
          
          // Show user-friendly error message
          if (error.message === 'Initialization timeout') {
            console.warn('⏰ IPO initialization timed out, but applications should still work');
          } else if (error.code === 'ECONNABORTED') {
            console.warn('⏰ IPO initialization took too long, continuing without it');
          } else {
            console.warn('⚠️ IPO initialization failed, continuing without it');
          }
          // Don't fail the whole component if initialization fails
        }
      } else {
        console.log('📭 No applications to initialize');
      }
    } catch (error) {
      console.error("Failed to fetch IPO applications:", error);
      showFallbackAlert("error", "Error", "Failed to load IPO applications");
      // Ensure applications is always an array even on error
      setApplications([]);
      setLoading(false);
    }
  };

  const fetchAllIPOs = async () => {
    try {
      const response = await getIPOs();
      setAllIPOs(response.data || []);
    } catch (error) {
      console.error("Failed to fetch all IPOs:", error);
    }
  };

  const getIPOCloseDate = (symbol) => {
    const ipo = allIPOs.find(ipo => ipo.symbol === symbol);
    return ipo ? formatDate(ipo.closeDate) : "N/A";
  };

  const getApplicationListingDate = (application) => {
    // Use the application's listing date (same day as allotment)
    if (application.listingDate) {
      return formatDate(application.listingDate);
    }
    // Fallback: listing happens same day as allotment
    if (application.allotmentDate) {
      return formatDate(application.allotmentDate);
    }
    // Final fallback: use IPO data (but this may not match rotation)
    const ipo = allIPOs.find(ipo => ipo.symbol === application.ipoSymbol);
    return ipo ? formatDate(ipo.listingDate) : "N/A";
  };

  const toggleApplicationExpansion = (applicationId) => {
    const newExpanded = new Set(expandedApplications);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedApplications(newExpanded);
  };

  const handleWithdraw = async (applicationId, ipoName, ipoSymbol, amount, status) => {
    console.log(`💸 Withdrawal attempt:`, {
      applicationId,
      ipoName,
      ipoSymbol,
      amount,
      status
    });
    
    let confirmMessage = "";
    
    // Remove countdown restrictions - allow withdrawal for processed statuses
    if (status === 'not_allotted') {
      confirmMessage = `Are you sure you want to withdraw ₹${amount.toLocaleString()} from ${ipoName} IPO application?`;
    } else if (status === 'allotted') {
      confirmMessage = `Are you sure you want to withdraw ₹${amount.toLocaleString()} from ${ipoName} IPO?`;
    } else if (status === 'listed') {
      confirmMessage = `Are you sure you want to withdraw ₹${amount.toLocaleString()} from ${ipoName} IPO?`;
    } else {
      // For any other status, show generic message
      showAlert({ type: "warning", title: "Cannot Withdraw", message: "This application cannot be withdrawn at this time." });
      return;
    }

    // Use custom confirmation instead of browser confirm
    showConfirmation(
      "Confirm Withdrawal",
      confirmMessage,
      () => {
        // Proceed with withdrawal
        executeWithdrawal(applicationId, ipoName, ipoSymbol, amount, status);
      }
    );
  };

  // Separate function to handle actual withdrawal
  const executeWithdrawal = async (applicationId, ipoName, ipoSymbol, amount, status) => {
      setWithdrawing(applicationId);
      console.log(`💸 Attempting to withdraw application ${applicationId} for ${ipoSymbol}`);
      const response = await withdrawIPOApplication(applicationId, ipoSymbol);
      console.log('✅ Withdrawal response:', response);
      
      showAlert({ type: "success", title: "Withdrawal Successful", message: `₹${response.data.amount?.toLocaleString() || amount.toLocaleString()} has been refunded to your wallet` });

      // Refresh applications and wallet balance
      fetchApplications();
      
      // Refresh wallet balance using TradeContext
      try {
        // Update wallet balance directly using TradeContext
        setWallet(prev => ({
          ...prev,
          balance: prev.balance + (response.data.amount || amount)
        }));
        
        console.log(`💰 Wallet updated: +₹${response.data.amount || amount}`);
        
        // Also try other methods as backup
        if (typeof window.refreshWallet === 'function') {
          window.refreshWallet();
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('walletBalanceUpdated', { 
          detail: { amount: response.data.amount, type: 'withdrawal' } 
        }));
    } catch (error) {
      console.error("Withdrawal failed:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      
      showAlert({ type: "error", title: "Withdrawal Failed", message: error.response?.data?.message || error.response?.data?.reason || "Failed to withdraw application" });
    } finally {
      setWithdrawing(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: "PENDING",
        className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
      },
      allotted: {
        label: "ALLOTTED",
        className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      },
      listed: {
        label: "LISTED",
        className: "bg-blue-500/15 text-blue-400 border-blue-500/30"
      },
      not_allotted: {
        label: "NOT ALLOTTED",
        className: "bg-red-500/15 text-red-400 border-red-500/30"
      },
      refunded: {
        label: "REFUNDED",
        className: "bg-slate-500/15 text-slate-400 border-slate-500/30"
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (!user) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            IPO Applications
          </h3>
          <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
            Track your IPO applications, allotments, and withdrawals
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25"
          >
            Login to View IPOs
          </button>
        </div>
      </Card>
    );
  }

  if (loading) {
    console.log('🔄 Loading state: true');
    return (
      <Card>
        <Loader text="Loading IPO applications..." />
      </Card>
    );
  }

  console.log('🎯 Render state:', {
    loading,
    applications: applications,
    applicationsLength: applications?.length,
    isArray: Array.isArray(applications)
  });

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">
              IPO Applications
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Total Applications: {applications.length}</span>
            </div>
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-slate-200 mb-2">
            No IPO Applications
          </h4>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            You haven't applied for any IPOs yet. Visit the IPO section to apply for upcoming offerings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.isArray(applications) && applications.map((application) => (
            <div
              key={application.id}
              className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden hover:bg-slate-800/50 transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg"
            >
              {/* Compact Header - Always Visible */}
              <div
                onClick={() => toggleApplicationExpansion(application.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-100">
                      {application.ipoName}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {application.ipoSymbol}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(application.status)}
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expandedApplications.has(application.id) ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Details - Only Visible When Clicked */}
              {expandedApplications.has(application.id) && (
                <div className="border-t border-slate-700/50 p-4 space-y-4">
                  {/* Application Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Amount Applied</p>
                      <p className="text-sm font-semibold text-slate-100">
                        {formatCurrency(application.amountApplied)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Shares Applied</p>
                      <p className="text-sm font-semibold text-slate-100">
                        {application.sharesApplied || 0}
                      </p>
                    </div>
                  </div>

                  {/* Important Dates Section without Countdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Close Date</p>
                      <p className="text-sm font-semibold text-orange-400">
                        {getIPOCloseDate(application.ipoSymbol)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <p className="text-sm font-semibold text-emerald-400">
                        {application.status === 'allotted' ? 'Allotted' : application.status === 'listed' ? 'Listed' : application.status === 'not_allotted' ? 'Not Allotted' : application.status}
                      </p>
                    </div>
                  </div>

                  {/* Additional Details for Allotted/Listed IPOs */}
                  {(application.status === 'allotted' || application.status === 'listed') && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 p-3 bg-slate-900/50 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Shares Allotted</p>
                          <p className="text-sm font-semibold text-emerald-400">
                            {application.sharesAllotted || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Issue Price</p>
                          <p className="text-sm font-semibold text-slate-100">
                            {formatCurrency(application.amountApplied / (application.sharesApplied || 1))}
                          </p>
                        </div>
                      </div>

                      {/* Listing Price and Performance */}
                      {application.listingPrice && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-900/50 rounded-lg">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Listing Price</p>
                            <p className="text-sm font-semibold text-blue-400">
                              {formatCurrency(application.listingPrice)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Previous Price</p>
                            <p className="text-sm font-semibold text-slate-100">
                              {formatCurrency(application.amountApplied / (application.sharesApplied || 1))}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Profit/Loss Display */}
                      {application.profitLoss !== undefined && (
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Profit/Loss</p>
                              <p className={`text-lg font-bold ${application.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {application.profitLoss >= 0 ? '+' : ''}{formatCurrency(application.profitLoss)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-400 mb-1">Return %</p>
                              <p className={`text-lg font-bold ${application.profitLossPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {application.profitLossPercentage >= 0 ? '+' : ''}{application.profitLossPercentage?.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end">
                    {application.status === 'not_allotted' && !application.isWithdrawn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWithdraw(application.id, application.ipoName, application.ipoSymbol, application.amountApplied, application.status);
                        }}
                        disabled={withdrawing === application.id}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {withdrawing === application.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          "Withdraw Blocked Amount"
                        )}
                      </button>
                    )}

                    {application.status === 'allotted' && !application.isWithdrawn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const withdrawAmount = (application.amountApplied || 0) + (application.profitLoss || 0);
                          handleWithdraw(application.id, application.ipoName, application.ipoSymbol, withdrawAmount, application.status);
                        }}
                        disabled={withdrawing === application.id}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {withdrawing === application.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          "Withdraw Allotted Amount"
                        )}
                      </button>
                    )}

                    {application.status === 'listed' && !application.isWithdrawn && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Total Withdrawal</p>
                          <p className="text-sm font-semibold text-blue-400">
                            {formatCurrency((application.amountApplied || 0) + (application.profitLoss || 0))}
                          </p>
                        </div>
                        {application.profitLoss !== undefined && (
                          <div className="text-right">
                            <p className="text-xs text-slate-400">P&L Amount</p>
                            <p className={`text-sm font-semibold ${application.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {application.profitLoss >= 0 ? '+' : ''}{formatCurrency(application.profitLoss)}
                            </p>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWithdraw(application.id, application.ipoName, application.ipoSymbol, (application.amountApplied || 0) + (application.profitLoss || 0), application.status);
                          }}
                          disabled={withdrawing === application.id}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {withdrawing === application.id ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            "Withdraw Total Amount"
                          )}
                        </button>
                      </div>
                    )}

                    {application.isWithdrawn && (
                      <span className="px-4 py-2 bg-slate-700/50 text-slate-400 text-sm font-medium rounded-lg border border-slate-600/30">
                        Withdrawn on {formatDate(application.withdrawalDate)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default IPOAllotmentSection;
