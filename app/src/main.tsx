import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Wallet from "./WalletProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Wallet>
      <App />
    </Wallet>
  </React.StrictMode>
);
