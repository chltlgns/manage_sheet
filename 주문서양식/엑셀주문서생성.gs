function excelCreate(e) {
  console.log("함수 시작");

  if (!e) {
    console.log("이벤트 객체 없음");
    return;
  }

  var sheet = e.source;
  var activeSheet = sheet.getActiveSheet();
  var range = e.range;
  
  console.log("현재 스프레드시트 ID:", sheet.getId());
  console.log("설정된 관리 시트 ID:", CONFIG.SHEET_IDS.MANAGEMENT);

  if (sheet.getId() !== CONFIG.SHEET_IDS.MANAGEMENT) {
    console.log("관리 시트가 아님, 종료");
    return;
  }

  if (range.getColumn() !== CONFIG.COLUMNS.EXCEL_CONVERT) {
    console.log("H열이 수정되지 않음, 종료");
    return;
  }

  var row = range.getRow();
  if (row <= 1) return; // 헤더 행 제외

  try {
    var convertStatus = range.getValue().toString().trim();

    if (convertStatus !== "생성") {
      console.log("변환 요청이 아님, 종료");
      return;
    }

    // Q열에서 폴더 URL 가져오기 (FOLDER_Q_URL 사용)
    var folderUrl = activeSheet.getRange(row, CONFIG.COLUMNS.FOLDER_Q_URL).getValue();
    if (!folderUrl) {
      throw new Error("폴더 URL이 없습니다.");
    }
    console.log("폴더 URL:", folderUrl);

    // URL에서 폴더 ID 추출
    var folderId = folderUrl.match(/folders\/([a-zA-Z0-9-_]+)/);
    if (!folderId) {
      throw new Error("올바른 폴더 URL이 아닙니다.");
    }
    
    // 폴더 접근
    var targetFolder = DriveApp.getFolderById(folderId[1]);
    console.log("폴더 접근:", targetFolder.getName());

    // 폴더 내 스프레드시트 찾기
    var files = targetFolder.getFiles();
    var originalFile = null;
    var existingExcelFile = null;

    while (files.hasNext()) {
      var file = files.next();
      if (file.getMimeType() === MimeType.GOOGLE_SHEETS) {
        originalFile = file;
      }
      // 기존 엑셀 파일 중 "주문서"가 포함된 파일 찾기
      if ((file.getName().endsWith(".xlsx") || file.getName().endsWith(" (Excel)")) 
          && file.getName().includes("주문서")) {
        existingExcelFile = file;
      }
    }

    if (!originalFile) {
      console.log("폴더 내 스프레드시트 파일을 찾을 수 없음");
      activeSheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue("스프레드시트 파일이 없습니다.");
      range.setValue("");
      return;
    }

    console.log("스프레드시트 파일 찾음:", originalFile.getName());

    // 기존 엑셀 파일이 있다면 삭제
    if (existingExcelFile) {
      console.log("기존 주문서 엑셀 파일 삭제:", existingExcelFile.getName());
      existingExcelFile.setTrashed(true);
    }

    // Export 방식으로 새 Excel 파일 생성
    var url = "https://docs.google.com/spreadsheets/d/" + originalFile.getId() + "/export?format=xlsx";
    var token = ScriptApp.getOAuthToken();
    
    var response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    var excelBlob = response.getBlob().setName(originalFile.getName() + ".xlsx");
    var excelFile = targetFolder.createFile(excelBlob);

    console.log("새 엑셀 파일 생성 완료:", excelFile.getName());

    activeSheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue("엑셀 파일 생성 완료");
    range.setValue(""); // H열 초기화
    console.log("상태 업데이트 완료");

  } catch (error) {
    console.error("오류 발생:", error.toString());
    activeSheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue("엑셀 변환 오류: " + error.toString());
    range.setValue("");
  }

  console.log("함수 종료");
}

