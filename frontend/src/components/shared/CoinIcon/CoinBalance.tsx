import { Link } from 'react-router-dom';
import { useWallet } from '../../../features/wallet/hooks/useWallet';

export function CoinBalance() {
  const { balance } = useWallet();
  return (
    <Link
      to="/wallet"
      className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 transition-colors hover:bg-white/10"
    >
      <span className="text-yellow-400">●</span>
      <span className="text-sm font-semibold text-white">
        {balance.toLocaleString()}
      </span>
    </Link>
  );
}