const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`
        rounded-xl
        border border-slate-800
        bg-gradient-to-br from-slate-900/60 to-slate-950/80
        p-5
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
