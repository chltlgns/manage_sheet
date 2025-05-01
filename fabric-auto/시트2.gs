function copyDataToSheet2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName('시트1');
  const doowellSheet = ss.getSheetByName('두웰');
  const twooneSheet = ss.getSheetByName('투원');

  // T열의 마지막 행 찾기
  const tColumnValues = sourceSheet.getRange("T:T").getValues();
  let lastTRow = 1;
  for (let i = tColumnValues.length - 1; i >= 0; i--) {
    if (tColumnValues[i][0] !== "") {
      lastTRow = i + 1;
      break;
    }
  }
  Logger.log(`T열 마지막 행: ${lastTRow}`);

  // A열의 배경색 확인
  const backgroundColors = sourceSheet.getRange(2, 1, lastTRow - 1, 1).getBackgrounds();
  
  // 색이 칠해지지 않은 행만 필터링
  const unprocessedRows = backgroundColors.map((color, index) => {
    return {
      rowIndex: index,
      isUnprocessed: color[0] === '#ffffff' || color[0] === ''
    };
  }).filter(row => row.isUnprocessed);

  Logger.log(`처리할 행 수: ${unprocessedRows.length}`);

  // 공장별 데이터 분류
  const doowellData = [];
  const twooneData = [];

  // 필터링된 행만 처리
  unprocessedRows.forEach(({rowIndex}) => {
    const rowNum = rowIndex + 2;  // 실제 행 번호
    const row = sourceSheet.getRange(rowNum, 1, 1, 17).getValues()[0];
    const calculatedValues = sourceSheet.getRange(rowNum, 15, 1, 2).getDisplayValues()[0];
    
    const qValue = row[16];    // Q열: 공장명
    const oValue = parseFloat(calculatedValues[0]) || 0;  // O열: 계산값1
    const tValue = tColumnValues[rowNum - 1][0];  // T열 데이터
    const range = sourceSheet.getRange(rowNum, 1);  // A열 셀

    // T열에 데이터가 없는 경우 처리하지 않음
    if (!tValue || tValue.toString().trim() === '') {
      Logger.log(`${rowNum}행: T열 데이터 없음 (처리 안함)`);
      return;
    }

    // Q열 값에 따라 처리
    if (qValue && qValue.toString().trim() !== '') {
      const data = {
        aValue: row[0] || '',
        bValue: row[1] || '',
        lValue: row[11] || '',
        mValue: row[12] || '',
        nValue: row[13] || '',
        oValue: calculatedValues[0] || '',
        pValue: calculatedValues[1] || ''
      };

      // 날짜 포맷팅
      if (data.lValue instanceof Date) {
        data.lValue = Utilities.formatDate(data.lValue, Session.getScriptTimeZone(), "MM/dd");
      }

      if (oValue !== 0) {
        // Q열 있고 O열이 0이 아닌 경우: 주황색
        range.setBackground('#FFA500');
        Logger.log(`${rowNum}행: 정상 처리 (주황색)`);
      } else {
        // Q열 있고 O열이 0인 경우: 파란색
        range.setBackground('#4A86E8');
        Logger.log(`${rowNum}행: O열 0 (파란색)`);
      }

      // 공장별로 데이터 분류
      if (qValue === '두웰공장') {
        doowellData.push(data);
      } else if (qValue === '투원공장') {
        twooneData.push(data);
      }
    } else {
      // Q열이 없는 경우: 노란색
      range.setBackground('#FFFF00');
      Logger.log(`${rowNum}행: Q열 없음 (노란색)`);
    }
  });

  // 두웰공장 데이터가 있는 경우 처리
  if (doowellData.length > 0) {
    // 메시지 초기화 (인사말 제외)
    const message = "";
    
    // 데이터 포맷팅
    // aValue: 스타일번호
    // bValue: 원단명
    // mValue: 컬러
    // oValue: 발주량(yard)
    const formattedData = doowellData.map(data => 
      `${data.aValue} / ${data.bValue} / ${data.mValue}(${data.oValue}yard)`
    ).join('\n');
    
    // A열의 마지막 데이터가 있는 행 번호 찾기
    const lastRow = getLastContentRow(doowellSheet, 1);
    
    // 현재 날짜를 MM/dd 형식으로 포맷팅
    const today = new Date();
    const formattedDate = Utilities.formatDate(today, Session.getScriptTimeZone(), "MM/dd");
    
    // A열에 포맷팅된 데이터 입력
    doowellSheet.getRange(lastRow + 1, 1).setValue(formattedData);
    // C열에 현재 날짜 입력
    doowellSheet.getRange(lastRow + 1, 3).setValue(formattedDate);
    Logger.log('두웰 데이터 작성 완료');
  }

  // 투원공장 데이터가 있는 경우 처리
  if (twooneData.length > 0) {
    // 메시지 초기화 (인사말 제외)
    const message = "";
    
    // 데이터 포맷팅
    // aValue: 스타일번호
    // bValue: 원단명
    // mValue: 컬러
    // oValue: 발주량(yard)
    const formattedData = twooneData.map(data => 
      `${data.aValue} / ${data.bValue} / ${data.mValue}(${data.oValue}yard)`
    ).join('\n');
    
    // A열의 마지막 데이터가 있는 행 번호 찾기
    const lastRow = getLastContentRow(twooneSheet, 1);
    
    // 현재 날짜를 MM/dd 형식으로 포맷팅
    const today = new Date();
    const formattedDate = Utilities.formatDate(today, Session.getScriptTimeZone(), "MM/dd");
    
    // A열에 포맷팅된 데이터 입력
    twooneSheet.getRange(lastRow + 1, 1).setValue(formattedData);
    // C열에 현재 날짜 입력
    twooneSheet.getRange(lastRow + 1, 3).setValue(formattedDate);
    Logger.log('투원 데이터 작성 완료');
  }
}

// 특정 열의 마지막 데이터가 있는 행 번호를 찾는 함수
function getLastContentRow(sheet, column) {
  if (sheet.getLastRow() === 0) {
    return 1;
  }
  
  const values = sheet.getRange(1, column, sheet.getLastRow(), 1).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i][0] !== '') {
      return i + 1;
    }
  }
  return 1;
}