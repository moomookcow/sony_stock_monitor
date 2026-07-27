const axios = require("axios");
const config = require("./config");

/**
 * 소니 API에서 상품 정보 조회
 * @param {string} productNo - 상품 번호
 * @returns {Promise<Object>} - 상품 API 응답
 */
async function fetchProduct(productNo) {
  try {
    const url = `${config.api.baseUrl}/products/${productNo}`;

    // ClientId 확인
    if (!config.api.clientId) {
      throw new Error(
        "API_CLIENT_ID 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.",
      );
    }

    const headers = {
      ...config.api.headers,
      ClientId: config.api.clientId,
    };

    const response = await axios.get(url, {
      headers,
      timeout: config.api.timeout,
    });
    return response.data;
  } catch (error) {
    console.error(`[API Error] 상품 ${productNo} 조회 실패:`, error.message);
    throw error;
  }
}

module.exports = {
  fetchProduct,
};
