import { motion } from "framer-motion";

/* ---------------- STATIC NEWS (PHASE 1) ---------------- */

const NEWS = [
  {
    id: 1,
    title: "Markets trade flat amid weak global cues",
    source: "Market Desk",
    time: "1h ago",
    category: "Markets",
    sentiment: "neutral"
  },
  {
    id: 2,
    title: "IT stocks gain as rupee slips against dollar",
    source: "Sector Watch",
    time: "3h ago",
    category: "Technology",
    sentiment: "positive"
  },
  {
    id: 3,
    title: "Banking shares under pressure after RBI commentary",
    source: "Economy",
    time: "5h ago",
    category: "Banking",
    sentiment: "negative"
  },
  {
    id: 4,
    title: "Midcap stocks see selective buying interest",
    source: "Market Pulse",
    time: "6h ago",
    category: "Equity",
    sentiment: "positive"
  },
];

/* ---------------- COMPONENT ---------------- */

const NewsSection = () => {
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'negative':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Markets':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Technology':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Banking':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Equity':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <section className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Market News
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Live Updates</span>
            </div>
          </div>
        </div>

        <div className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          {NEWS.length} articles
        </div>
      </div>

      {/* NEWS LIST */}
      <div className="space-y-4">
        {NEWS.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ x: 4, scale: 1.02 }}
            className="
              rounded-xl
              border border-slate-700/50
              bg-gradient-to-br from-slate-900/60 to-slate-950/80
              p-4
              cursor-pointer
              transition-all duration-300
              hover:border-cyan-500/40
              hover:shadow-lg hover:shadow-cyan-500/10
              backdrop-blur-sm
            "
          >
            {/* NEWS HEADER */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-100 leading-snug mb-2">
                  {item.title}
                </h3>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getCategoryColor(item.category)}`}>
                  {item.category}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getSentimentColor(item.sentiment)}`}>
                  {item.sentiment}
                </span>
              </div>
            </div>

            {/* NEWS FOOTER */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{item.source}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{item.time}</span>
                </div>
              </div>

              <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      
    </section>
  );
};

export default NewsSection;
