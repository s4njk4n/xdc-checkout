// xdc-checkout.js - NO DEPENDENCIES, NO ERRORS, WORKS INSTANTLY
// XDC Mainnet: Chain ID 50 (0x32)

const XDC_NETWORK = {
  chainId: '0x32',
  chainName: 'XDC Network',
  nativeCurrency: { name: 'XDC', symbol: 'XDC', decimals: 18 },
  rpcUrls: ['https://rpc.xinfin.network'],
  blockExplorerUrls: ['https://xdcscan.io']
};

// Helper: Convert string to hex (without '0x')
function stringToHex(str) {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

// Helper: Pad hex string left to 64 chars (32 bytes) with '0'
function padLeft(hex, length = 64) {
  return hex.padStart(length, '0');
}

// Helper: Pad hex string right to multiple of 64 chars with '0'
function padRight(hex, length) {
  return hex.padEnd(length, '0');
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

      btn.disabled = true;
      btn.textContent = 'Processing...';

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

        // Generate orderId
        const orderId = "order_" + Date.now();

        // Correct function selector for pay(string)
        const functionSelector = "2b66d72e";

        // ABI encode the string argument (dynamic type)
        const orderIdHex = stringToHex(orderId);
        const lengthHex = orderId.length.toString(16);
        const paddedLength = padLeft(lengthHex, 64);
        const offset = padLeft((32).toString(16), 64); // Offset to data (after length)
        const paddedData = padRight(orderIdHex, Math.ceil(orderId.length / 32) * 64);
        const encodedArgs = offset + paddedLength + paddedData;

        const data = "0x" + functionSelector + encodedArgs;

        // Convert price to wei
        const valueInWei = (BigInt(price) * BigInt(10n ** 18n)).toString(16);
        const valueHex = "0x" + valueInWei;

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
      } finally {
        btn.disabled = false;
        btn.textContent = `Pay ${price} XDC`;
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
