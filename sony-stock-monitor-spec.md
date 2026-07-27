# Sony 제품 재입고 모니터링 명세

## 개요

소니 온라인스토어 상품의 페이지를 매번 새로고침하지 않고, 제품 재고가 구매 가능 상태로 바뀌면 즉시 알림을 받기 위한 API 기반 모니터링 명세.

현재 확인된 두 개의 상품 엔드포인트:

- `https://shop-api.e-ncp.com/products/131844013` → `SEL100M28GM`
- `https://shop-api.e-ncp.com/products/133673523` → `SEL100400MC`

이 API는 페이지 렌더링과 별개로 상품 상태를 JSON으로 제공하므로, 이 값을 이용해 재고 모니터링을 할 수 있다.

---

## 엔드포인트 및 응답 구조 핵심 필드

### 공통 엔드포인트

`GET https://shop-api.e-ncp.com/products/{productNo}`

### 주요 응답 필드

- `baseInfo.productNo`: 상품 번호
- `baseInfo.productName`: 상품 코드명
- `baseInfo.productNameEn`: 상품 영문명/타이틀
- `baseInfo.promotionText`: 프로모션 텍스트
- `status.saleStatusType`: 판매 상태 (`ONSALE` 등)
- `status.soldout`: 품절 여부 (`true`/`false`)
- `status.display`: 화면 표시 여부
- `limitations.canAddToCart`: 장바구니 담기 가능 여부
- `stock.stockCnt`: 재고 수량
- `stock.mainStockCnt`: 메인 재고 수량
- `stock.saleCnt`: 판매 가능 수량
- `baseInfo.usableRestockNoti`: 재입고 알림 사용 가능 여부

---

## 두 상품 응답 차이 분석

### 1. `131844013` (SEL100M28GM)

- `status.saleStatusType`: `ONSALE`
- `status.soldout`: `false`
- `limitations.canAddToCart`: `true`
- `stock` 값: `saleCnt = -999`, `stockCnt = -999`, `mainStockCnt = -999`
- `baseInfo.usableRestockNoti`: `false`

이 결과는 실제로 "구매 가능" 상태에 가까운 응답이다.

- `soldout: false`
- `canAddToCart: true`
- `saleStatusType: ONSALE`

물론 재고 수량 필드가 음수(-999)로 표시되고 있기 때문에, 숫자 재고 카운트만으로 판별하기는 위험하다.

### 2. `133673523` (SEL100400MC)

- `status.saleStatusType`: `ONSALE`
- `status.soldout`: `true`
- `limitations.canAddToCart`: `true`
- `stock` 값: `saleCnt = -999`, `stockCnt = 0`, `mainStockCnt = 0`
- `baseInfo.usableRestockNoti`: `false`

이 결과는 "판매 중이지만 품절" 상태이다.

- `soldout: true`
- `stockCnt: 0`
- `mainStockCnt: 0`

`ONSALE`과 `soldout: true` 조합은 `바로 구매하기` 버튼이 없는 상태로 해석된다.

---

## 모니터링 판단 기준

### 1차 우선 판단: `status.soldout`

- `false` → 구매 가능으로 판단
- `true` → 구매 불가로 판단

### 2차 판단: `limitations.canAddToCart`

- `true`이면 구매 인터랙션이 가능함
- `false`이면 구매 버튼이 없거나, 장바구니 담기 자체가 불가함

### 3차 판단: 재고 수량 필드

- `stock.stockCnt`와 `stock.mainStockCnt`가 `0`이면 품절 상태일 가능성이 높음
- `-999` 같은 값은 의미가 없는 경우일 수 있으므로 보조 지표로 사용

### 4차 판단: `saleStatusType`

- `ONSALE`이면 정상 판매 가능 상태
- `PREORDER`나 `SOLDOUT` 등의 다른 값이 있으면 구매 불가일 가능성이 높음

### 최종 판별 논리 제안

```text
if status.soldout == false and limitations.canAddToCart == true and status.saleStatusType == 'ONSALE'
    -> 구매 가능 (알림 발송)
else
    -> 구매 불가
```

추가로 `stockCnt > 0`이나 `mainStockCnt > 0`이면 보수적으로 구매 가능 상태를 더욱 확신할 수 있다.

---

## 개발 로드맵

### 1. Node.js 개발 순서

1. 프로젝트 초기화
   - `npm init -y`
   - `npm install axios dotenv`
   - `npm install node-telegram-bot-api --save` 또는 `npm install axios form-data` (텔레그램 API 직접 호출 시)

2. 설정 파일 구성
   - `.env`에 `TARGET_PRODUCTS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` 저장
   - `config.js` 또는 `src/config.js`로 환경 변수 로드

3. API 호출 모듈 작성
   - `src/productApi.js`
   - `axios`로 `GET https://shop-api.e-ncp.com/products/{productNo}` 요청
   - 기본 헤더(`User-Agent`, `Accept`) 설정

4. 상태 판단 모듈 작성
   - `src/stockChecker.js`
   - 응답 JSON에서 `status.soldout`, `limitations.canAddToCart`, `status.saleStatusType` 확인
   - `true`/`false`로 구매 가능 여부 반환

5. 알림 모듈 작성
   - `src/telegramNotifier.js`
   - Telegram Bot API를 사용해 메시지 전송
   - 재고 발생 시 `chat_id`로 알림 보내기

6. 상태 저장 및 중복 방지
   - `src/stateStore.js`
   - 로컬 JSON 파일(`state.json`)에 마지막 감지 결과 저장
   - 상태가 `soldout=true` → `soldout=false`로 바뀔 때만 알림

7. 실행 엔트리 작성
   - `src/index.js`
   - 대상 상품 목록 순회
   - API 호출 → 상태 판단 → 변화 감지 → 알림
   - 실패 시 로깅 및 예외 처리
   - Google Cloud Functions HTTP 엔트리로 래핑
   - `ClientId` 만료/실패 시 Telegram 에러 메시지 발송
   - 새 `ClientId`를 채팅으로 받으면 함수 재실행 또는 재구성 가능하도록 설계

8. 주기 실행 구성
   - `cron` 또는 서버 스케줄러 설정
   - 5분 간격 추천

### 2. API 모니터링 스크립트

- 대상 상품 번호 배열 유지
- 각 상품에 `GET https://shop-api.e-ncp.com/products/{productNo}` 요청
- 응답 JSON 파싱
- 위 판단 기준으로 구매 가능 여부 판단
- 상태 변화를 감지하면 알림 전송
- 마지막 상태를 로컬 파일/DB에 저장하여 중복 알림 방지

### 3. Telegram 알림

- Telegram Bot 생성 후 `BOT_TOKEN` 확보
- `chat_id` 확인
- 구매 가능 상태가 감지되면 메시지 발송
- 예: `SEL100400MC 재고 있었음! https://sony.co.kr/...`

### 4. 실행 환경

- 현재 개발 완료 상태
  - `src/index.js`로 재고 체크 및 Telegram 알림 로직 구현 완료
  - `src/productApi.js`에서 `ClientId` 헤더를 포함한 API 호출 구현
  - `src/stockChecker.js`로 `soldout`, `canAddToCart`, `saleStatusType` 판단 구현
  - `src/telegramNotifier.js`로 Telegram 메시지 전송 구현 완료
  - `src/stateStore.js`로 `state.json` 기반 중복 알림 방지 구현
  - `package.json`에 `npm run monitor`, `npm run monitor:manual` 스크립트 추가 완료
  - `ClientId` 만료 시 Telegram으로 에러 알림 발송 및 새 값 수동 주입 대응 설계 필요
- 로컬 PC 대신 Google Cloud Functions + Cloud Scheduler 권장
  - PC가 꺼져 있어도 실행 가능
  - 주기 실행은 Cloud Scheduler에서 30분 또는 60분 간격으로 설정
  - 함수는 `src/index.js`를 호출하는 엔트리로 동작
  - 환경 변수는 GCP Secret Manager 또는 Cloud Functions 환경 변수로 관리 가능
- 대안
  - 작은 VPS / Raspberry Pi

### 5. 요청 주기

- Cloud Scheduler에서는 1시간에 1번 또는 1시간에 2번(30분 간격) 사용 권장
- 너무 자주 호출하면 차단 위험이 있으므로 최소 5분 이상 간격 유지

---

## 구현 예시

### Python 예시 판단 코드

```python
is_available = (
    data['status']['soldout'] is False and
    data['limitations']['canAddToCart'] is True and
    data['status']['saleStatusType'] == 'ONSALE'
)
```

### 상태 변화 감지

- 이전 상태: `soldout=true`
- 현재 상태: `soldout=false`
- 조건 충족 시 알림 전송

---

## 추가 고려사항

- 공식 API 접근에 인증이 필요할 수 있는지 확인
- User-Agent 및 헤더 설정으로 정상 요청 시도
- 페이지가 아니라 API를 직접 호출하는 방식이므로 렌더링 상태와 무관하게 동작
- `baseInfo.usableRestockNoti`가 `false`인 경우, 사이트 자체 재입고 알림은 사용 불가

---

## 결론

- `131844013`은 현재 API 상 구매 가능 상태로 보임
- `133673523`은 API 상 품절 상태로 보임
- 재입고 알림을 만들려면 API 응답에서 `status.soldout`, `limitations.canAddToCart`, `status.saleStatusType`을 핵심 조건으로 사용하면 된다
- `stock.*` 값은 보조 지표로 함께 확인하되, 숫자가 유효하지 않을 수 있으므로 단독 기준으로 사용하지 않는다
