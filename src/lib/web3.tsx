import { getAddress } from "@ethersproject/address";
import { BigNumber } from "@ethersproject/bignumber";
import { Web3Provider as EthersWeb3Provider } from "@ethersproject/providers";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const POLLING_INTERVAL_MS = 12000;

interface Web3 {
  provider: null | EthersWeb3Provider;
  account: null | string;
  chainId: null | number;
  connectMetamask: () => void;
}
const defaultWeb3: Web3 = {
  provider: null,
  account: null,
  chainId: null,
  connectMetamask: () => {},
};
const Web3Context = createContext<Web3>(defaultWeb3);

function useMetamask() {
  const [provider, setProvider] = useState<null | EthersWeb3Provider>(null);
  const [account, setAccount] = useState<null | string>(null);
  const [chainId, setChainId] = useState<null | number>(null);

  const ethereum = (globalThis as any).ethereum;

  function updateProvider(ethereum: any) {
    const newProvider = new EthersWeb3Provider(ethereum);
    newProvider.pollingInterval = POLLING_INTERVAL_MS;
    setProvider(newProvider);
  }
  function updateAccount(account: string | null) {
    setAccount(account == null ? null : getAddress(account));
  }
  function updateChainId(chainId: string | null) {
    setChainId(chainId == null ? null : BigNumber.from(chainId).toNumber());
  }

  // Call this to start user-initiated MetaMask connection flow.
  async function connect(): Promise<boolean> {
    if (ethereum == null) return false;
    try {
      // Request user consent to connect.
      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (e) {
      console.error("web3: MetaMask error:", e);
      return false;
    }
    return true;
  }

  // On page load, try to reconnect optimistically. If the user hasn't
  // previously consented, then `account` will still be null.
  useEffect(() => {
    if (ethereum == null) return;

    const ac = new AbortController();
    async function handleConnect() {
      console.debug("web3: MetaMask RPC connected; loading state");
      const [accounts, chainId] = await Promise.all([
        ethereum.request({ method: "eth_accounts" }),
        ethereum.request({ method: "eth_chainId" }),
      ]);
      if (ac.signal.aborted) return;
      updateProvider(ethereum);
      updateAccount(accounts[0]);
      updateChainId(chainId);
    }

    ethereum.on("connect", handleConnect);
    if (ethereum.isConnected()) handleConnect();
    return () => {
      ac.abort();
      ethereum.removeListener("connect", handleConnect);
    };
  }, []);

  // Install listeners for account and chain changes.
  useEffect(() => {
    if (ethereum == null) return;

    const ac = new AbortController();
    function handleAccountsChanged(accounts: Array<string>) {
      if (ac.signal.aborted) return;
      updateAccount(accounts[0]);
    }
    function handleChainChanged(chainId: string) {
      if (ac.signal.aborted) return;
      updateChainId(chainId);
    }

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    return () => {
      ac.abort();
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return {
    provider,
    account,
    chainId,
    connect,
  };
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const metamask = useMetamask();
  const ctx = {
    provider: metamask.provider,
    account: metamask.account,
    chainId: metamask.chainId,
    connectMetamask: metamask.connect,
  };
  return <Web3Context.Provider value={ctx}>{children}</Web3Context.Provider>;
}

export const useWeb3 = () => useContext(Web3Context);
