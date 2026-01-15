import Card from "../common/Card";

const SIPSection = () => {
  const monthly = 5000;
  const years = 10;
  const rate = 12 / 100;

  const months = years * 12;
  const futureValue =
    monthly *
    ((Math.pow(1 + rate / 12, months) - 1) / (rate / 12));
  
  const totalInvested = monthly * months;
  const returns = futureValue - totalInvested;

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">
              SIP Projection
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Future Value Calculator</span>
            </div>
          </div>
        </div>
        
        <div className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
          @12% p.a.
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-4 border border-purple-500/20">
          <p className="text-xs text-purple-300 mb-1">Projected Value</p>
          <p className="text-3xl font-bold text-purple-300">
            ₹{Math.round(futureValue).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-1">Monthly SIP</p>
            <p className="text-lg font-semibold text-slate-200">
              ₹{monthly.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-1">Duration</p>
            <p className="text-lg font-semibold text-slate-200">
              {years} years
            </p>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Returns</p>
              <p className="text-lg font-semibold text-emerald-400">
                +₹{Math.round(returns).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Total Invested</p>
              <p className="text-sm font-medium text-slate-300">
                ₹{totalInvested.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SIPSection;
