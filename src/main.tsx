import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";
import { Web3Provider } from "./lib/web3";

function Root() {
  return (
    <Web3Provider>
      <App />
    </Web3Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
