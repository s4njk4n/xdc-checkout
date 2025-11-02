// xdc-checkout.js - Embed: <script src="https://s4njk4n.github.io/xdc-checkout/widget/xdc-checkout.js"></script>
// MetaMask-only: Accepts XDC payments on any site. Chain ID fixed to 0x32 (50 decimal).

// Load ethers.js for utils (CDN)
if (typeof ethers === 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://cdn.ethers.io/lib/ethers-5.7.umd.min.js';
  document.head.appendChild(script);
}

// XDC Mainnet Config (CORRECTED: Chain ID 0x32 = 50 decimal)
const XDC_NETWORK = {
  chainId: '0x32',  // ← FIXED: Was 0x2f (wrong)
  chainName: 'XDC Network',
  nativeCurrency: { name: 'XDC', symbol: 'XDC', decimals: 18 },
  rpcUrls: ['https://rpc.xinfin.network'],
  blockExplorerUrls: ['https://xdcscan.io']
};

document.addEventListener("DOMContentLoaded", () => {
  // Wait for ethers if loading
  function initWidget() {
    if (typeof ethers === 'undefined') return setTimeout(initWidget, 100);
    
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

          // Check current chain
          const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
          if (currentChainId !== XDC_NETWORK.chainId) {
            try {
              // Add/switch to XDC
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [XDC_NETWORK]
              });
            } catch (addError) {
              if (addError.code === 4001) {
                alert("Network add rejected. Please add XDC manually in MetaMask.");
              } else {
                alert("Failed to add XDC Network. Manual setup:\n1. Network dropdown > Add Network > Manual\n2. Name: XDC Network\n3. RPC: https://rpc.xinfin.network\n4. Chain ID: 50\n5. Symbol: XDC\n6. Explorer: https://xdcscan.io");
              }
              return;
            }
          }

          const orderId = "order_" + Date.now();
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();

          // Encode data properly with ethers
          const iface = new ethers.utils.Interface(['function pay(string memory orderId)']);
          const data = iface.encodeFunctionData("pay", [orderId]);

          // Send transaction
          const tx = await signer.sendTransaction({
            to: contract,
            value: ethers.utils.parseEther(price.toString()),
            data: data
          });

          // Wait for confirmation & show link
          await tx.wait();
          el.innerHTML = `
            <p style="color:green;">Paid! Tx: 
              <a href="https://xdcscan.io/tx/${tx.hash}" target="_blank" style="color:#00bcd4;">
                ${tx.hash.slice(0, 8)}...
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
  }
  
  initWidget();
});
