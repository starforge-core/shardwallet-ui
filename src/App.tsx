import { BigNumber } from "@ethersproject/bignumber";
import { WeiPerEther, Zero } from "@ethersproject/constants";
import { Contract } from "@ethersproject/contracts";
import { formatUnits } from "@ethersproject/units";
import { useEffect, useState } from "react";

import ethLogo from "../static/img/eth-logo.svg";
import wethLogo from "../static/img/weth-logo.svg";

import classNames from "./lib/classNames";
import { useWeb3 } from "./lib/web3";
import AddressInput from "./components/AddressInput";
import ConnectWallet from "./components/ConnectWallet";
import Label from "./components/core/Label";

const SHARDWALLET_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function claim(uint256 tokenId, address[] currencies, uint24 fractionMicros) external returns (uint256[] amounts)",
];

const PRICE_ORACLE_ADDRESS = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"; // eth-usd.data.eth
const PRICE_ORACLE_ABI = [
  "function decimals() external view returns (uint8)",
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
];

const CURRENCIES = [
  {
    name: "ETH",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    logo: ethLogo,
    pricedLikeEth: true,
  },
  {
    name: "WETH",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18,
    logo: wethLogo,
    pricedLikeEth: true,
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

  async function claim(fractionMicros: number) {
    try {
      setClaiming(true);
      const tx = await contract.claim(
        selectedShard,
        Object.values(CURRENCIES).map((x) => x.address),
        fractionMicros
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

function useEthPrice() {
  const { provider } = useWeb3();
  const [data, setData] = useState<null | {
    price: BigNumber;
    decimals: number;
    timestamp: Date;
  }>(null);

  const contract =
    provider && new Contract(PRICE_ORACLE_ADDRESS, PRICE_ORACLE_ABI, provider);

  useEffect(() => {
    if (contract == null) {
      setData(null);
      return;
    }
    const ac = new AbortController();
    async function go() {
      const [decimals, { answer: price, updatedAt }] = await Promise.all([
        contract!.decimals(),
        contract!.latestRoundData(),
      ]);
      if (ac.signal.aborted) return;
      const timestamp = new Date(updatedAt * 1000);
      setData({ price, decimals, timestamp });
    }
    go();
    return () => ac.abort();
  }, [provider, contract?.address]);

  return data;
}

function App() {
  const { account, provider, connectMetamask } = useWeb3();
  const [claimPercentage, setClaimPercentage] = useState(100);
  const sw = useShardwallet();
  const ethPrice = useEthPrice();

  function ethToDisplayUsd(wei: BigNumber) {
    if (ethPrice == null) return null;
    const cents = wei
      .mul(ethPrice.price)
      .mul(100)
      .div(BigNumber.from(10).pow(ethPrice.decimals + 18));
    return "$" + (cents.toNumber() / 100).toFixed(2);
  }

  const ethPriceTooltip =
    ethPrice == null
      ? undefined
      : `Conversions using ETH price of ${ethToDisplayUsd(
          WeiPerEther
        )} as of ${ethPrice.timestamp.toLocaleString()}.`;

  return (
    <div className="flex flex-col mt-8 sm:mt-0 sm:min-h-screen justify-center items-center bg-gray-50 dark:bg-gray-900 p-3">
      <div className="flex flex-col gap-3 p-5 md:p-8 w-full max-w-screen-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[300px]">
        <div>
          <Label>Account</Label>{" "}
          {account != null && <span className="text-sm">{account}</span>}
          {
            <ConnectWallet
              className={classNames("ml-3", account != null && "invisible")}
            />
          }
        </div>
        <div className={classNames(account == null && "invisible")}>
          <Label>Shardwallet</Label>
          <AddressInput
            address={sw.shardwallet}
            setAddress={sw.setShardwallet}
          />
        </div>
        <div className={classNames(account == null && "invisible")}>
          <Label>Shard</Label>
          <select
            disabled={sw.shardIds.length === 0}
            value={sw.selectedShard ?? undefined}
            onChange={(e) => sw.setSelectedShard(e.target.value)}
            className="text-sm sm:text-base block pl-1 pr-1 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 min-w-16"
          >
            {sw.shardIds.length === 0 && <option>Loading…</option>}
            {sw.shardIds.map((s) => (
              <option key={s} value={s}>
                Shard #{s}
              </option>
            ))}
          </select>
        </div>
        <div className={classNames(account == null && "invisible")}>
          <Label className="pb-2" title={ethPriceTooltip}>
            Balances
          </Label>
          <ul className="">
            {CURRENCIES.map((c) => (
              <li key={c.name} className="mb-1 last:mb-0 text-sm">
                <img
                  src={c.logo}
                  className="w-5 h-5 inline-block mr-2 relative -translate-y-px"
                  alt={c.name}
                  title={c.name}
                ></img>
                {sw.balances == null && <span>Loading…</span>}
                {sw.balances != null && (
                  <>
                    <span className="font-mono">
                      {formatUnits(sw.balances![c.address], c.decimals)}
                    </span>
                    {ethPrice != null && c.pricedLikeEth && (
                      <span className="ml-2" title={ethPriceTooltip}>
                        ({ethToDisplayUsd(sw.balances![c.address])})
                      </span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className={classNames(account == null && "invisible")}>
          <Label>Claim fraction</Label>
          <div>
            Claim{" "}
            <label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-[3em]"
                value={claimPercentage}
                onChange={(e) => {
                  const v = e.target.valueAsNumber;
                  if (typeof v === "number" && v >= 0 && v <= 100)
                    setClaimPercentage(v);
                }}
              />
              %
            </label>{" "}
            of available balance
            {sw.balances != null && ethPrice != null && (
              <>
                {" "}
                (will claim{" "}
                <span title={ethPriceTooltip}>
                  {ethToDisplayUsd(
                    Object.entries(sw.balances)
                      .reduce(
                        (acc, [k, v]) =>
                          CURRENCIES.find((x) => x.address === k)!.pricedLikeEth
                            ? acc.add(v)
                            : acc,
                        Zero
                      )
                      .mul(claimPercentage)
                      .div(100)
                  )}
                </span>
                )
              </>
            )}
          </div>
        </div>
        <button
          className={classNames(
            "mt-3 rounded-lg p-2 filter-invert bg-primary-600 text-white dark:bg-primary-800 disabled:bg-gray-400 disabled:dark:bg-gray-600",
            account == null && "invisible"
          )}
          onClick={() => sw.claim(claimPercentage * 1e4)}
          disabled={sw.balances == null || sw.claiming}
        >
          Claim
        </button>
      </div>
      <div className="flex flex-col gap-3 p-5 md:p-8 md:py-5 w-full max-w-screen-sm rounded-lg">
        <div>
          <Label>External links</Label>
          <ul>
            <li>
              <a
                href="https://app.uniswap.org/#/swap?inputCurrency=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&outputCurrency=ETH"
                target="_blank"
                className="underline hover:text-primary-600 dark:hover:text-primary-300"
              >
                Uniswap: unwrap WETH to ETH
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
