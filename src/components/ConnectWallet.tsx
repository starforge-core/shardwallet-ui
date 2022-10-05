import { useEffect, useRef, useState } from "react";

import classNames from "../lib/classNames";
import { useWeb3 } from "../lib/web3";

function ConnectWallet({ className }: { className?: string | false|null|undefined }) {
  const [loading, setLoading] = useState(false);
  const { connectMetamask } = useWeb3();

  async function handleClick() {
    try {
      setLoading(true);
      await connectMetamask();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={classNames(
        "border border-gray-500 px-3 py-1 text-sm rounded-lg",
        className
      )}
      onClick={handleClick}
      disabled={loading}
    >
      Connect Wallet
    </button>
  );
}

export default ConnectWallet;
