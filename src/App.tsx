import { useWeb3 } from "./lib/web3";
import ConnectWallet from "./components/ConnectWallet";

function App() {
  const { account, provider, connectMetamask } = useWeb3();
  return (
    <div className="flex flex-col gap-3">
      <div>Account: {account ?? <ConnectWallet />}</div>
    </div>
  );
}

export default App;
