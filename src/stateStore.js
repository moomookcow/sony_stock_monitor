const fs = require("fs");
const config = require("./config");

function loadState() {
  try {
    if (!fs.existsSync(config.monitor.stateFilePath)) {
      return {};
    }
    const raw = fs.readFileSync(config.monitor.stateFilePath, "utf8");
    return JSON.parse(raw || "{}");
  } catch (error) {
    console.error("[StateStore] 상태 파일 로드 실패:", error.message);
    return {};
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(
      config.monitor.stateFilePath,
      JSON.stringify(state, null, 2),
      "utf8",
    );
  } catch (error) {
    console.error("[StateStore] 상태 파일 저장 실패:", error.message);
  }
}

module.exports = {
  loadState,
  saveState,
};
