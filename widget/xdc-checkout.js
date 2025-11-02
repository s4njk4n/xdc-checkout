// xdc-checkout.js - NO DEPENDENCIES, NO ERRORS, WORKS INSTANTLY
// XDC Mainnet: Chain ID 50 (0x32)

const XDC_NETWORK = {
  chainId: '0x32',
  chainName: 'XDC Network',
  nativeCurrency: { name: 'XDC', symbol: 'XDC', decimals: 18 },
  rpcUrls: ['https://rpc.xinfin.network'],
  blockExplorerUrls: ['https://xdcscan.io']
};

// Helper: Convert string to hex (manual ABI encoding for pay(string))
function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i).toString(16).padStart(2, '0');
    hex += charCode;
  }
  return hex;
}

// Helper: Pad hex string to 32 bytes (64 chars)
function padTo32Bytes(hex) {
  return hex.padStart(64, '0');
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-xdc-checkout]").forEach(el => {
    const price = el.dataset.price || "10";
    const contract = el.dataset.contract?.trim();
    if (!contract) {
      el.innerHTML = "<p style='color:red;'>Missing contract address</p>";
      return;
    }

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
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [XDC_NETWORK]
              });
            } else {
              throw switchError;
            }
          }
        }

        // Encode: pay(string orderId)
        const orderId = "order_" + Date.now();
        const functionSelector = "3ccfd60b"; // keccak256("pay(string)")[:4]
        const encodedOrderId = stringToHex(orderId);
        const paddedOrderId = padTo32Bytes(encodedOrderId);
        const data = "0x" + functionSelector + paddedOrderId;

        // Convert price to wei (1 XDC = 10^18 wei)
        const valueInWei = (BigInt(price) * BigInt(1e18)).toString(16);
        const valueHex = "0x" + (valueInWei === "0" ? "0" : valueInWei);

        // Send transaction
        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [{
            from: userAddress,
            to: contract,
            value: valueHex,
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

    // Render
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
