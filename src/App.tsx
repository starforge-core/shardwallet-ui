import { Contract } from "@ethersproject/contracts";
import type { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";
import { useEffect, useState } from "react";

import ethLogo from "../static/img/eth-logo.svg";
import wethLogo from "../static/img/weth-logo.svg";

import { useWeb3 } from "./lib/web3";
import AddressInput from "./components/AddressInput";
import ConnectWallet from "./components/ConnectWallet";
import Label from "./components/core/Label";

const SHARDWALLET_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function claim(uint256 tokenId, address[] currencies, uint24 fractionMicros) external returns (uint256[] amounts)",
];

const CURRENCIES = [
  {
    name: "ETH",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    logo: ethLogo,
  },
  {
    name: "WETH",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    logo: wethLogo,
  },
];

function useShardwallet() {
  const { account, provider } = useWeb3();
  const [shardwallet, setShardwallet] = useState(
    "0x221e1B033E10063Ae3Fba737Ce40ef682fbfcCcC"
  );
  const [shardIds, setShardIds] = useState<string[]>([]);
  const [selectedShard, setSelectedShard] = useState<null | string>(null);
  const [balances, setBalances] = useState<null | Record<string, BigNumber>>(
    null
  );
  const [claiming, setClaiming] = useState(false);

  function reset() {
    setShardIds([]);
    setSelectedShard(null);
    setBalances(null);
  }
  useEffect(() => {
    reset();
  }, [provider, account]);

  const contract = new Contract(
    shardwallet,
    SHARDWALLET_ABI,
    provider?.getSigner()
  );

  async function claim() {
    try {
      setClaiming(true);
      const tx = await contract.claim(
        selectedShard,
        Object.values(CURRENCIES).map((x) => x.address),
        1e6
      );
      await tx.wait();
    } finally {
      setClaiming(false);
    }
  }

  useEffect(() => {
    if (account == null || provider == null) {
      setShardIds([]);
      return;
    }
    const ac = new AbortController();
    async function go() {
      const balance = await contract.balanceOf(account);
      const shardIds = await Promise.all(
        Array(balance.toNumber())
          .fill(undefined)
          .map((_, i) => contract.tokenOfOwnerByIndex(account, i).then(String))
      );
      if (ac.signal.aborted) return;
      shardIds.sort((a, b) => Number(BigInt(a) - BigInt(b)));
      setShardIds(shardIds);
      setSelectedShard(shardIds[0] ?? null);
    }
    go();
    return () => ac.abort();
  }, [provider, account, shardwallet]);

  useEffect(() => {
    if (account == null || provider == null || selectedShard == null) {
      setBalances(null);
      return;
    }
    const ac = new AbortController();
    async function go() {
      const balanceValues = await contract.callStatic.claim(
        selectedShard,
        Object.values(CURRENCIES).map((x) => x.address),
        1e6
      );
      if (ac.signal.aborted) return;
      const balances = Object.fromEntries(
        Object.values(CURRENCIES).map((v, i) => [v.address, balanceValues[i]])
      );
      setBalances(balances);
    }
    go();
    return () => ac.abort();
  }, [provider, account, shardwallet, selectedShard]);

  return {
    contract,
    shardwallet,
    setShardwallet: (sw: string) => {
      setShardwallet(sw);
      reset();
    },
    shardIds,
    selectedShard,
    setSelectedShard,
    balances,
    claim,
    claiming,
  };
}

function App() {
  const { account, provider, connectMetamask } = useWeb3();
  const sw = useShardwallet();

  return (
    <div className="flex min-h-screen justify-center items-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col gap-3 p-5 md:p-8 w-full max-w-screen-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[300px]">
        <div>Account: {account ?? <ConnectWallet />}</div>
        <div>
          <Label>Shardwallet</Label>
          <AddressInput
            address={sw.shardwallet}
            setAddress={sw.setShardwallet}
          />
        </div>
        {sw.shardIds.length > 0 && (
          <div>
            <Label>Shard</Label>
            <select
              value={sw.selectedShard ?? undefined}
              onChange={(e) => sw.setSelectedShard(e.target.value)}
              className="block pl-2 pr-1 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
            >
              {sw.shardIds.map((s) => (
                <option key={s} value={s}>
                  Shard #{s}
                </option>
              ))}
            </select>
          </div>
        )}
        {sw.balances != null && (
          <div>
            <Label className="pb-2">Balances</Label>
            <ul className="">
              {CURRENCIES.map((c) => (
                <li key={c.name} className="mb-1 last:mb-0 text-sm font-mono">
                  <img
                    src={c.logo}
                    className="w-5 h-5 inline-block mr-2 relative -translate-y-px"
                    alt={c.name}
                  ></img>
                  {formatUnits(sw.balances![c.address], c.decimals)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {sw.balances != null && (
          <button
            className="mt-3 rounded-lg p-2 filter-invert bg-primary-600 text-white dark:bg-primary-800"
            onClick={sw.claim}
            disabled={sw.claiming}
          >
            Claim
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
