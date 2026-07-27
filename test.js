/**
 * 테스트 스크립트: API 호출 및 상태 확인
 */

const productApi = require("./src/productApi");
const stockChecker = require("./src/stockChecker");
const config = require("./src/config");

async function testApiCall() {
  console.log("=== Sony Stock Monitor - API 테스트 ===\n");
  console.log(`테스트 대상 제품: ${config.products.targetIds.join(", ")}\n`);

  for (const productNo of config.products.targetIds) {
    console.log(`--- 제품 ${productNo} 확인 중 ---`);
    try {
      // 1. API 호출
      console.log(
        `[요청] GET https://shop-api.e-ncp.com/products/${productNo}`,
      );
      const productData = await productApi.fetchProduct(productNo);
      console.log("✓ API 호출 성공\n");

      // 2. 상태 정보 추출
      const status = stockChecker.getProductStatus(productData);
      console.log("[상태 정보]");
      console.log(`  상품명: ${status.productName} (${status.productNameEn})`);
      console.log(`  품절 여부: ${status.soldout}`);
      console.log(`  장바구니 추가 가능: ${status.canAddToCart}`);
      console.log(`  판매 상태: ${status.saleStatusType}`);
      console.log(`  재고(stockCnt): ${status.stockCnt}`);
      console.log(`  재고(mainStockCnt): ${status.mainStockCnt}\n`);

      // 3. 구매 가능 여부 판단
      const availability = stockChecker.isProductAvailable(productData);
      console.log("[판단 결과]");
      console.log(
        `  구매 가능: ${availability.isAvailable ? "✓ YES" : "✗ NO"}`,
      );
      console.log(`  판정 사유: ${availability.reason}`);
      if (availability.stockInfo) {
        console.log(`  재고 정보:`, availability.stockInfo);
      }
      console.log("\n");
    } catch (error) {
      console.error(`✗ 오류 발생: ${error.message}\n`);
    }
  }

  console.log("=== 테스트 완료 ===");
}

testApiCall().catch(console.error);
