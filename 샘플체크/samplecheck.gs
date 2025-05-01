// 트리거 설정을 위한 함수
function createTimeDrivenTrigger() {
  ScriptApp.newTrigger('sample')
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .create();
}

function sample() {
  try {
    // 실행 시작 시간 기록
    const startTime = new Date();
    Logger.log(`작업 시작: ${startTime}`);

    // 스프레드시트 열기
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const liveSheet = ss.getSheetByName("Live source data");
    const targetSheet = ss.getSheetByName("시트2");
    const logSheet = ss.getSheetByName("실행로그") || ss.insertSheet("실행로그");
    
    // 시트가 존재하는지 확인
    if (!liveSheet || !targetSheet) {
      throw new Error("필요한 시트를 찾을 수 없습니다.");
    }

    // 필요한 열만 가져오기 (B, E, F, L, S, U열)
    const neededColumns = [2, 5, 6, 12, 19, 21];
    const liveData = liveSheet.getRange(1, 1, liveSheet.getLastRow(), 21).getValues();
    
    if (liveData.length <= 1) {
      logMessage(logSheet, "처리할 데이터가 없습니다.");
      return;
    }

    // F열 데이터 확인 및 필터링
    const filteredData = liveData.filter((row, index) => {
      if (index === 0) return false;
      const fValue = row[5];
      return fValue === "고객 대여" || fValue === "대여 요청";
    });

    // 시트2의 기존 데이터 모두 가져오기
    const targetData = targetSheet.getDataRange().getValues();
    const oldRowCount = targetData.length - 1; // 헤더 제외한 기존 행 수
    
    // 시트2 데이터 초기화 (헤더 제외)
    if (targetData.length > 1) {
      targetSheet.getRange(2, 1, targetData.length - 1, targetData[0].length).clearContent();
      logMessage(logSheet, `기존 데이터 ${oldRowCount}행 삭제 완료`);
    }

    // 필터링된 데이터가 있는 경우에만 처리
    if (filteredData.length > 0) {
      const reorganizedData = filteredData.map(row => {
        let endDate;
        
        if (row[20] && row[20] !== "") {
          const dColumnDate = new Date(row[20]);
          endDate = new Date(dColumnDate);
          endDate.setDate(dColumnDate.getDate() + 7);
        } else {
          const startDate = new Date(row[1]);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
        }
        
        return [
          row[4],   // E열 -> A열
          row[1],   // B열 -> B열
          endDate,  // C열에 대여종료 날짜
          row[20],  // U열 -> D열
          row[5],   // F열 -> E열
          row[18],  // S열 -> F열
          row[11],  // L열 -> G열
        ];
      });

      // 2행부터 새 데이터 입력
      targetSheet.getRange(2, 1, reorganizedData.length, reorganizedData[0].length)
        .setValues(reorganizedData);
      
      logMessage(logSheet, `${reorganizedData.length}개의 새로운 행이 성공적으로 이동되었습니다.`);
    } else {
      logMessage(logSheet, "이동할 새로운 데이터가 없습니다.");
    }

    // 작업 완료 시간 기록
    const endTime = new Date();
    logMessage(logSheet, `작업 완료: ${endTime}`);
    logMessage(logSheet, `소요 시간: ${(endTime - startTime)/1000}초`);

  } catch (error) {
    // 에러 발생 시 로그 기록
    const logSheet = ss.getSheetByName("실행로그") || ss.insertSheet("실행로그");
    logMessage(logSheet, `에러 발생: ${error.message}`);
    Logger.log(`에러 발생: ${error.message}`);
  }
}

// 로그 기록 함수
function logMessage(logSheet, message) {
  const now = new Date();
  logSheet.getRange(logSheet.getLastRow() + 1, 1, 1, 3).setValues([[
    now,
    Session.getActiveUser().getEmail(),
    message
  ]]);
  Logger.log(message);
}
