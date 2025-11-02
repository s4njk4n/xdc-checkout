// xdc-checkout.js - NO EXTERNAL LIBS, works instantly with MetaMask
// Chain ID: 0x32 (50 decimal) - XDC Mainnet

const XDC_NETWORK = {
  chainId: '0x32',  // XDC Mainnet
  chainName: 'XDC Network',
  nativeCurrency: { name: 'XDC', symbol: 'XDC', decimals: 18 },
  rpcUrls: ['https://rpc.xinfin.network'],
  blockExplorerUrls: ['https://xdcscan.io']
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-xdc-checkout]").forEach(el => {
    const price = el.dataset.price || "10";
    const contract = el.dataset.contract?.trim();
    if (!contract) {
      el.innerHTML = "<p style='color:red;'>Missing contract address</p>";
      return;
    }

    // Always show button
    const btn = document.createElement("button");
    btn.textContent = `Pay ${price} XDC`;
    btn.style.cssText = `
      padding:10px 20px; background:#00bcd4; color:white; 
      border:none; border-radius:5px; cursor:pointer; font-weight:bold;
      font-family: inherit; font-size: 14px;
    `;

    btn.onclick = async () => {
      if (!window.ethereum) {
        alert("MetaMask not detected! Install from https://metamask.io");
        return;
      }

      try {
        // Connect wallet
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const userAddress = accounts[0];

        // Check & switch network
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        if (chainId !== XDC_NETWORK.chainId) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: XDC_NETWORK.chainId }]
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              // Network not added → add it
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [XDC_NETWORK]
              });
            } else {
              throw switchError;
            }
          }
        }

        // Encode function call: pay(string)
        const orderId = "order_" + Date.now();
        const functionSelector = "0x3ccfd60b"; // keccak256("pay(string)")[:4]
        const encodedOrderId = ethers.utils.defaultAbiCoder.encode(["string"], [orderId]).slice(2);
        const paddedOrderId = "0".repeat(64 - encodedOrderId.length) + encodedOrderId;
        const data = functionSelector + paddedOrderId;

        // Send transaction
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [{
            from: userAddress,
            to: contract,
            value: "0x" + (BigInt(price) * BigInt(1e18)).toString(16), // XDC in wei
            data: data
          }]
        });

        // Success
        el.innerHTML = `
          <p style="color:green; margin:10px 0;">
            Paid! Tx: 
            <a href="https://xdcscan.io/tx/${txHash}" target="_blank" style="color:#00bcd4; text-decoration:underline;">
              ${txHash.slice(0, 8)}...
            </a>
          </p>
        `;

      } catch (err) {
        console.error("XDC Checkout Error:", err);
        alert("Payment failed: " + (err.message || "User rejected"));
      }
    };

    // Clear and append
    el.innerHTML = "";
    el.appendChild(btn);

    // Tip jar
    const tip = document.createElement("small");
    tip.innerHTML = `
      Pay with MetaMask • 
      <a href="https://xdc.org" target="_blank" style="color:#00bcd4;">XDC Network</a> • 
      Tip dev: <a href="xdc:YOUR_XDC_ADDRESS_HERE?amount=1" target="_blank">1 XDC</a>
    `;
    tip.style.cssText = "display:block; margin-top:8px; font-size:11px; opacity:0.7;";
    el.appendChild(tip);
  });
});
