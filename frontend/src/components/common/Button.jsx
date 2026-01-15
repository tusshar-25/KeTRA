const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}) => {
  const base =
    "px-4 py-2 rounded-lg text-sm font-semibold transition focus:outline-none";

  const variants = {
    primary:
      "bg-indigo-500 text-slate-900 hover:bg-indigo-400",
    secondary:
      "bg-slate-800 text-slate-200 hover:bg-slate-700",
    danger:
      "bg-red-500 text-white hover:bg-red-400",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${base}
        ${variants[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
