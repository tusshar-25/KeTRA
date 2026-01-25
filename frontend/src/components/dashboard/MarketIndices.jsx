import { useMarket } from "../../context/MarketContext";

const formatTime = (date) =>
  date
    ? new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

const MarketIndices = () => {
  const { indices, lastUpdated } = useMarket();

  if (!indices || indices.length === 0) {
    return (
      <div className="text-sm text-slate-400">
        Loading market data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">
              Market Indices
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Real-time market data</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      {/* INDICES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {indices.map((idx) => (
          <div
            key={idx.symbol}
            className="group relative bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            <p className="text-sm text-slate-400 mb-2 truncate">{idx.name}</p>
            <p className="text-2xl font-bold text-slate-100 truncate">
              {idx.value?.toLocaleString("en-IN")}
            </p>
            <div
              className={`text-sm font-medium mt-2 ${
                idx.positive
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {idx.change > 0 ? "+" : ""}{idx.change} ({idx.percent})
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Real-time data</span>
          </div>
          <span>
            {lastUpdated ? `Updated: ${formatTime(lastUpdated)}` : 'Loading...'}
          </span>
        </div>
        
      </div>
    </div>
  );
};

export default MarketIndices;
