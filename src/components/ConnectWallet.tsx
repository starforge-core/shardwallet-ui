import { useEffect, useRef, useState } from "react";

import { useWeb3 } from "../lib/web3";

function ConnectWallet() {
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
      className="border border-gray-500 px-3 py-2 text-sm rounded-lg"
      onClick={handleClick}
      disabled={loading}
    >
      Connect Wallet
    </button>
  );
}

export default ConnectWallet;
