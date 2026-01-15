import { useIPO } from "../../context/IPOContext";

const AppliedIPOs = () => {
  const { appliedIPOs, withdrawRefund } = useIPO();

  if (appliedIPOs.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No IPO applications yet.
      </p>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "applied": return "text-amber-400";
      case "allotted": return "text-emerald-400";
      case "listed": return "text-sky-400";
      case "not_allotted": return "text-red-400";
      default: return "text-slate-400";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "applied": return "APPLIED";
      case "allotted": return "ALLOTTED";
      case "listed": return "LISTED";
      case "not_allotted": return "NOT ALLOTTED";
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="space-y-3">
      {appliedIPOs.map((ipo) => (
        <div
          key={ipo.symbol}
          className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-slate-100">{ipo.name}</h4>
              <p className="text-xs text-slate-400">{ipo.symbol}</p>
            </div>
            <span className={`text-xs font-semibold ${getStatusColor(ipo.status)}`}>
              {getStatusText(ipo.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">Applied Amount:</span>
              <span className="ml-2 text-slate-100">₹{ipo.amount?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400">Shares Applied:</span>
              <span className="ml-2 text-slate-100">{ipo.lots}</span>
            </div>
            {ipo.status === "applied" && (
              <div>
                <span className="text-slate-400">Allotment Date:</span>
                <span className="ml-2 text-amber-400">
                  {ipo.allotmentDate ? formatDate(ipo.allotmentDate) : 
                   // Calculate estimated allotment date (1 day after close)
                   ipo.closeDate ? formatDate(new Date(new Date(ipo.closeDate).getTime() + 24 * 60 * 60 * 1000)) : 'TBD'}
                </span>
              </div>
            )}
            {ipo.listingDate && (
              <div>
                <span className="text-slate-400">Listing Date:</span>
                <span className="ml-2 text-sky-400">{formatDate(ipo.listingDate)}</span>
              </div>
            )}
            {ipo.sharesAllotted && (
              <div>
                <span className="text-slate-400">Shares Allotted:</span>
                <span className="ml-2 text-emerald-400">{ipo.sharesAllotted}</span>
              </div>
            )}
            {ipo.listingPrice && (
              <div>
                <span className="text-slate-400">Listing Price:</span>
                <span className="ml-2 text-slate-100">₹{ipo.listingPrice}</span>
              </div>
            )}
            {ipo.profit !== null && ipo.profit !== undefined && (
              <div>
                <span className="text-slate-400">P&L:</span>
                <span className={`ml-2 font-semibold ${ipo.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₹{ipo.profit?.toLocaleString()} ({ipo.profit >= 0 ? '+' : ''}{((ipo.profit / (ipo.amount || 1)) * 100).toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          {ipo.status === "not_allotted" && !ipo.withdrawn && (
            <button
              onClick={() => withdrawRefund(ipo.symbol)}
              className="mt-3 text-xs text-sky-400 hover:underline transition-colors"
            >
              Withdraw Refund
            </button>
          )}

          {ipo.withdrawn && (
            <div className="mt-2 text-xs text-slate-500">
              Refund withdrawn on {formatDate(ipo.withdrawalDate)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AppliedIPOs;
