const Footer = () => {
  return (
    <footer className="bg-[#01091a] border-t border-slate-800 mt-12 py-6 text-center text-xs text-slate-500 md:pb-6 pb-20">
      <p>
        © {new Date().getFullYear()} KeTRA — Virtual Trading Platform
      </p>
      <p className="mt-1">
        For educational purposes only. No real money involved.
      </p>
    </footer>
  );
};

export default Footer;
