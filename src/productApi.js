const axios = require("axios");
const config = require("./config");

/**
 * Custom error for ClientId expiration
 */
class ClientIdExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = "ClientIdExpiredError";
    this.isClientIdExpired = true;
  }
}

/**
 * Check if API error is related to ClientId expiration
 * @param {Error} error - axios error
 * @returns {boolean}
 */
function isClientIdError(error) {
  if (!error.response) return false;
  const status = error.response.status;
  const data = error.response.data;

  // 401, 403: Unauthorized / Forbidden (likely ClientId issue)
  if (status === 401 || status === 403) return true;

  // 400: Bad Request with specific message
  if (status === 400) {
    const msg = (data && data.message) || (data && data.error) || "";
    if (
      msg.toLowerCase().includes("clientid") ||
      msg.toLowerCase().includes("unauthorized")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * 소니 API에서 상품 정보 조회
 * @param {string} productNo - 상품 번호
 * @returns {Promise<Object>} - 상품 API 응답
 * @throws {ClientIdExpiredError} - ClientId 관련 에러
 * @throws {Error} - 기타 에러
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
    // ClientId 만료 감지
    if (isClientIdError(error)) {
      const clientIdError = new ClientIdExpiredError(
        `ClientId 만료됨 또는 무효함 (상품: ${productNo}, 상태: ${error.response.status})`
      );
      console.error(`[ClientId Error] ${clientIdError.message}`);
      throw clientIdError;
    }

    console.error(`[API Error] 상품 ${productNo} 조회 실패:`, error.message);
    throw error;
  }
}

module.exports = {
  fetchProduct,
  ClientIdExpiredError,
  isClientIdError,
};
