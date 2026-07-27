/**
 * 제품의 구매 가능 여부를 판단
 * @param {Object} productData - API 응답 데이터
 * @returns {Object} - { isAvailable: boolean, reason: string }
 */
function isProductAvailable(productData) {
  if (!productData) {
    return { isAvailable: false, reason: "데이터 없음" };
  }

  const { status, limitations, stock } = productData;

  // 1차: status.soldout 확인
  if (status?.soldout === true) {
    return { isAvailable: false, reason: "soldout: true" };
  }

  // 2차: limitations.canAddToCart 확인
  if (limitations?.canAddToCart !== true) {
    return { isAvailable: false, reason: "canAddToCart: false" };
  }

  // 3차: saleStatusType 확인
  if (status?.saleStatusType !== "ONSALE") {
    return {
      isAvailable: false,
      reason: `saleStatusType: ${status?.saleStatusType}`,
    };
  }

  // 4차: 추가 확인 - 재고 정보
  const stockInfo = {
    stockCnt: stock?.stockCnt,
    mainStockCnt: stock?.mainStockCnt,
    saleCnt: stock?.saleCnt,
  };

  return {
    isAvailable: true,
    reason: "구매 가능",
    stockInfo,
  };
}

/**
 * 제품 상태를 간단히 표시
 * @param {Object} productData - API 응답 데이터
 * @returns {Object} - 간단한 상태 정보
 */
function getProductStatus(productData) {
  if (!productData) {
    return {};
  }

  const { baseInfo, status, limitations, stock } = productData;

  return {
    productNo: baseInfo?.productNo,
    productName: baseInfo?.productName,
    productNameEn: baseInfo?.productNameEn,
    soldout: status?.soldout,
    canAddToCart: limitations?.canAddToCart,
    saleStatusType: status?.saleStatusType,
    stockCnt: stock?.stockCnt,
    mainStockCnt: stock?.mainStockCnt,
  };
}

module.exports = {
  isProductAvailable,
  getProductStatus,
};
