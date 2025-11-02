// xdc-checkout.js - Embed: <script src="https://s4njk4n.github.io/xdc-checkout/widget/xdc-checkout.js"></script>
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
      if (!window.xinPay) {
        alert("Install XinPay to pay with XDC!");
        window.open("https://xinpay.xinfin.network", "_blank");
        return;
      }

      try {
        const accounts = await window.xinPay.request({ method: "eth_requestAccounts" });
        const orderId = "order_" + Date.now();

        const tx = await window.xinPay.request({
          method: "eth_sendTransaction",
          params: [{
            from: accounts[0],
            to: contract,
            value: window.xinPay.utils.toWei(price, "ether"),
            data: window.xinPay.utils.id("pay(string)").slice(0, 10) +
                  window.xinPay.utils.padLeft(window.xinPay.utils.fromUtf8(orderId), 64)
          }]
        });

        el.innerHTML = `
          <p style="color:green;">Paid! Tx: 
            <a href="https://xdcscan.io/tx/${tx}" target="_blank" style="color:#00bcd4;">
              ${tx.slice(0, 8)}...
            </a>
          </p>
        `;
      } catch (err) {
        alert("Payment failed: " + (err.message || err));
      }
    };

    el.appendChild(btn);

    // Your passive tip jar
    const tip = document.createElement("small");
    tip.innerHTML = `Powered by <a href="https://xdc.org" target="_blank">XDC</a> • 
                     Tip dev: <a href="xdc:YOUR_XDC_ADDRESS_HERE?amount=1" target="_blank">1 XDC</a>`;
    tip.style.cssText = "display:block; margin-top:8px; font-size:11px; opacity:0.7;";
    el.appendChild(tip);
  });
});
