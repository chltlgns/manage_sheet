function createOnEditTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger('copyDataToSheet2')
    .forSpreadsheet(ss)
    .onEdit()
    .create();
  Logger.log('트리거가 성공적으로 설정되었습니다.');
}