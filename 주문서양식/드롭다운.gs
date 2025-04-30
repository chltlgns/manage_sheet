function setValidation() {
  try {
    // 관리자 스프레드시트 열기
    var sheet = SpreadsheetApp.openById(CONFIG.SHEET_IDS.MANAGEMENT).getActiveSheet();
    console.log("시트 열기 성공");
    
    // F열(확인 상태)에 대한 데이터 유효성 검사 규칙 설정
    var checkRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['확인', '재확인'], true)  // 두 옵션 모두 포함
      .setAllowInvalid(false)
      .build();
    
    // G열(권한 상태)에 대한 데이터 유효성 검사 규칙 설정
    var permissionRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['완료', '수정'], true)
      .setAllowInvalid(false)
      .build();
    
    // H열(엑셀 변환 상태)에 대한 데이터 유효성 검사 규칙 설정
    var excelStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['생성', '재생성'], true)
      .setAllowInvalid(false)
      .build();
    
    // I열(이니셜 생성)에 대한 데이터 유효성 검사 규칙 설정
    var initialRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['생성', '재생성'], true)
      .setAllowInvalid(false)
      .build();
    
    // J열(공장명)에 대한 데이터 유효성 검사 규칙 설정
    var factoryRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['투원', '두웰'], true)
      .setAllowInvalid(false)
      .build();
    
    // 각 열에 데이터 유효성 검사 적용
    sheet.getRange("F2:F1000").setDataValidation(checkRule);      // F열
    sheet.getRange("G2:G1000").setDataValidation(permissionRule); // G열
    sheet.getRange("H2:H1000").setDataValidation(excelStatusRule); // H열
    sheet.getRange("I2:I1000").setDataValidation(initialRule);    // I열
    sheet.getRange("J2:J1000").setDataValidation(factoryRule);    // J열
    
    console.log("데이터 유효성 검사 설정 완료");
    SpreadsheetApp.getUi().alert('드롭다운 메뉴가 설정되었습니다.');
    
  } catch(error) {
    console.error("오류 발생:", error.toString());
    SpreadsheetApp.getUi().alert('오류가 발생했습니다: ' + error.toString());
  }
}

// 메뉴에 추가
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('설정')
      .addItem('드롭다운 메뉴 설정', 'setValidation')
      .addToUi();
}