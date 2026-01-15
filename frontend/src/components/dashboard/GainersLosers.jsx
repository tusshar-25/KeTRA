const GainersLosers = () => {
  return (
    <div
      className="
        rounded-2xl
        border border-slate-800
        bg-slate-900/40
        p-6
        text-center
      "
    >
      <h3 className="text-sm font-medium text-slate-200">
        Top Gainers & Losers
      </h3>

      <p className="mt-3 text-xs text-slate-400 leading-relaxed">
        Market movers will appear here once live market
        data is available.
      </p>

      <p className="mt-2 text-xs text-slate-500">
        This section requires price change data.
      </p>
    </div>
  );
};

export default GainersLosers;
