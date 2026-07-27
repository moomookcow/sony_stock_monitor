const productApi = require("./productApi");
const stockChecker = require("./stockChecker");
const notifier = require("./telegramNotifier");
const stateStore = require("./stateStore");
const config = require("./config");

async function runCheck() {
  const previousState = stateStore.loadState();
  const isInitialRun = Object.keys(previousState).length === 0;
  const forceNotifyOnManual = process.env.FORCE_NOTIFY_ON_MANUAL === "true";
  const newState = {};

  for (const productNo of config.products.targetIds) {
    try {
      console.log(`Checking product ${productNo}...`);
      const productData = await productApi.fetchProduct(productNo);
      const availability = stockChecker.isProductAvailable(productData);
      const status = stockChecker.getProductStatus(productData);

      newState[productNo] = {
        available: availability.isAvailable,
        reason: availability.reason,
        updatedAt: new Date().toISOString(),
      };

      const previous = previousState[productNo] || { available: false };
      const isManualNotification = forceNotifyOnManual;
      const shouldNotify =
        isManualNotification ||
        (availability.isAvailable && (isInitialRun || !previous.available));

      if (shouldNotify) {
        const statusText = availability.isAvailable ? "구매 가능" : "품절";
        const icon = availability.isAvailable ? "✅" : "❌";
        const message =
          `${icon} 재고 알림\n\n` +
          `상품: ${status.productName} (${status.productNameEn})\n` +
          `상품번호: ${productNo}\n` +
          `상태: ${statusText}\n` +
          `이유: ${availability.reason}\n` +
          `링크: https://store.sony.co.kr/product/${productNo}`;

        console.log("Sending Telegram notification...");
        await notifier.sendMessage(message);
        console.log("Notification sent.");
      } else {
        console.log(`No alert for ${productNo}: ${availability.reason}`);
      }
    } catch (error) {
      console.error(`Error checking product ${productNo}:`, error.message);
    }
  }

  stateStore.saveState(newState);
}

runCheck().catch((error) => {
  console.error("Fatal error:", error.message);
});
