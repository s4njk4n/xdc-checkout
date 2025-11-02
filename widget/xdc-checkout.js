// xdc-checkout.js - Embed: <script src="https://s4njk4n.github.io/xdc-checkout/widget/xdc-checkout.js"></script>
// Now MetaMask-only for broader compatibility

// XDC Mainnet Config (for adding network)
const XDC_NETWORK = {
  chainId: '0x2f', // 47 in hex
  chainName: 'XDC Network',
  nativeCurrency: { name: 'XDC', symbol: 'XDC', decimals: 18 },
  rpcUrls: ['https://rpc.xinfin.network'],
  blockExplorerUrls: ['https://xdcscan.io']
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-xdc-checkout]").forEach(el => {
    const price = el.dataset.price || "10";
    const contract = el.dataset.contract;
    if (!contract) {
      el.innerHTML = "<p style='color:red;'>Missing contract address</p>";
      return;
    }

    const btn = document.createElement("button");
    btn.textContent = `Pay ${price} XDC`;
    btn.style.cssText = "padding:10px 20px; background:#00bcd4; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;";

    btn.onclick = async () => {
      if (!window.ethereum) {
        alert("Install MetaMask to pay with XDC!");
        window.open("https://metamask.io", "_blank");
        return;
      }

      try {
        // Request accounts (connects wallet)
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

        // Check/switch to XDC Network
        const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
        if (currentChainId !== XDC_NETWORK.chainId) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [XDC_NETWORK]
            });
          } catch (addError) {
            // If add fails, prompt manual add
            alert("Please add XDC Network to MetaMask:\n1. Click the network dropdown.\n2. 'Add Network' > Manual.\n3. Network Name: XDC Network\nRPC URL: https://rpc.xinfin.network\nChain ID: 50\nSymbol: XDC\nExplorer: https://xdcscan.io");
            return;
          }
        }

        const orderId = "order_" + Date.now();

        // Send transaction (MetaMask handles signing)
        const tx = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [{
            from: accounts[0],
            to: contract,
            value: window.ethereum.utils.toWei(price.toString(), "ether"), // Use ethers.js utils if loaded, or polyfill
            data: window.ethereum.utils.id("pay(string)").slice(0, 10) +
                  window.ethereum.utils.toUtf8Bytes(orderId).padLeft(32, "0") // Simplified; use ethers for prod
          }]
        });

        // Success: Show tx link
        el.innerHTML = `
          <p style="color:green;">Paid! Tx: 
            <a href="https://xdcscan.io/tx/${tx}" target="_blank" style="color:#00bcd4;">
              ${tx.slice(0, 8)}...
            </a>
          </p>
        `;
      } catch (err) {
        console.error(err);
        alert("Payment failed: " + (err.message || err));
      }
    };

    el.appendChild(btn);

    // Passive tip jar + MetaMask note
    const tip = document.createElement("small");
    tip.innerHTML = `Pay with MetaMask • Powered by <a href="https://xdc.org" target="_blank">XDC</a> • 
                     Tip dev: <a href="xdc:YOUR_XDC_ADDRESS_HERE?amount=1" target="_blank">1 XDC</a>`;
    tip.style.cssText = "display:block; margin-top:8px; font-size:11px; opacity:0.7;";
    el.appendChild(tip);
  });
});
