import { useTrade } from "../context/TradeContext";

const useWallet = () => {
  const { wallet } = useTrade();

  return {
    wallet: {
      ...wallet,
      pnl: wallet.balance - wallet.invested,
    },
    loading: false,
  };
};

export default useWallet;
