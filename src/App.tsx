import { useWeb3 } from "./lib/web3";

function App() {
  const { account, provider, connectMetamask } = useWeb3();
  return (
    <div className="flex flex-col gap-3">
      <div>
        Account:{" "}
        {account ?? <button onClick={() => connectMetamask()}>Connect</button>}
      </div>
    </div>
  );
}

export default App;
