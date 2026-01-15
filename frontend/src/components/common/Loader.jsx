const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center py-6 text-slate-400 text-sm">
      <span className="animate-pulse">{text}</span>
    </div>
  );
};

export default Loader;
