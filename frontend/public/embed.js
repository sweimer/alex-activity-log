(function () {
    window.HUDXReactEmbed = {
        mount: function (selector, options = {}) {
            const container = document.querySelector(selector);
            if (!container) return;

            const iframe = document.createElement("iframe");
            iframe.src = "https://main.dnerb9bayadja.amplifyapp.com/";
            iframe.style.width = "100%";
            iframe.style.border = "0";
            iframe.style.height = options.height || "600px";

            // 508 compliance: required accessible name
            iframe.title = options.title || "HUDX Embedded Application";

            container.appendChild(iframe);

            // Auto-resize via postMessage
            window.addEventListener("message", (event) => {
                if (event.data.hudxAppHeight) {
                    iframe.style.height = event.data.hudxAppHeight + "px";
                }
            });
        }
    };
})();
