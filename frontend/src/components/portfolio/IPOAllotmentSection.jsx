import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import { getIPOApplications, withdrawIPOApplication, getIPOs } from "../../services/ipoService";
import Card from "../common/Card";
import Loader from "../common/Loader";

const IPOAllotmentSection = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);
  const [allIPOs, setAllIPOs] = useState([]);
  const [expandedApplications, setExpandedApplications] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    fetchApplications();
    fetchAllIPOs();
  }, [user]);

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

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await getIPOApplications();
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error("Failed to fetch IPO applications:", error);
      showAlert({
        type: "error",
        title: "Error",
        message: "Failed to load IPO applications"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId, ipoName, amount, status) => {
    let confirmMessage = "";
    
    if (status === 'pending') {
      showAlert({
        type: "warning",
        title: "Cannot Withdraw",
        message: "Cannot withdraw application before allotment announcement. Wait for allotment results."
      });
      return;
    }
    
    if (status === 'allotted') {
      showAlert({
        type: "warning", 
        title: "Cannot Withdraw",
        message: "Cannot withdraw allotted applications before listing day."
      });
      return;
    }
    
    if (status === 'not_allotted') {
      confirmMessage = `Are you sure you want to withdraw ₹${amount.toLocaleString()} from ${ipoName} IPO application?`;
    } else if (status === 'listed') {
      confirmMessage = `Are you sure you want to withdraw ₹${amount.toLocaleString()} from ${ipoName} IPO?`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setWithdrawing(applicationId);
      const response = await withdrawIPOApplication(applicationId);
      
      showAlert({
        type: "success",
        title: "Withdrawal Successful",
        message: `₹${amount.toLocaleString()} has been refunded to your wallet`
      });

      // Refresh applications
      fetchApplications();
    } catch (error) {
      console.error("Withdrawal failed:", error);
      showAlert({
        type: "error",
        title: "Withdrawal Failed",
        message: error.response?.data?.message || "Failed to withdraw application"
      });
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
    return (
      <Card>
        <Loader text="Loading IPO applications..." />
      </Card>
    );
  }

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
          {applications.map((application) => (
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

                  {/* Important Dates Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Close Date</p>
                      <p className="text-sm font-semibold text-orange-400">
                        {getIPOCloseDate(application.ipoSymbol)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Allotment Date</p>
                      <p className="text-sm font-semibold text-emerald-400">
                        {formatDate(application.allotmentDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Listing Date</p>
                      <p className="text-sm font-semibold text-blue-400">
                        {getApplicationListingDate(application)}
                      </p>
                    </div>
                  </div>

                  {/* Additional Details for Allotted/Listed IPOs */}
                  {(application.status === 'allotted' || application.status === 'listed') && (
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 p-3 bg-slate-900/50 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Shares Allotted</p>
                        <p className="text-sm font-semibold text-emerald-400">
                          {application.sharesAllotted || 0}
                        </p>
                      </div>
                      {application.listingPrice && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Listing Price</p>
                          <p className="text-sm font-semibold text-blue-400">
                            {formatCurrency(application.listingPrice)}
                          </p>
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
                          handleWithdraw(application.id, application.ipoName, application.amountApplied, application.status);
                        }}
                        disabled={withdrawing === application.id}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {withdrawing === application.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          "Withdraw Blocked Amount"
                        )}
                      </button>
                    )}

                    {application.status === 'listed' && !application.isWithdrawn && (
                      <div className="flex items-center gap-3">
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
                            handleWithdraw(application.id, application.ipoName, application.amountApplied, application.status);
                          }}
                          disabled={withdrawing === application.id}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {withdrawing === application.id ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            "Withdraw with P&L"
                          )}
                        </button>
                      </div>
                    )}

                    {application.status === 'allotted' && (
                      <span className="px-4 py-2 bg-slate-700/50 text-slate-400 text-sm font-medium rounded-lg border border-slate-600/30">
                        Cannot Withdraw (Before Listing)
                      </span>
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
