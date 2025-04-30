function PERMISSION(e) {
  console.log("=== 권한 수정 함수 시작 ===");
  
  if (!e) {
    console.log("❌ 이벤트 객체가 없음");
    return;
  }
  
  // 수정된 범위 정보 가져오기
  var sheet = e.source;
  var activeSheet = sheet.getActiveSheet();
  var range = e.range;
  
  // 관리 시트인지 확인
  if(sheet.getId() === CONFIG.SHEET_IDS.MANAGEMENT) {
    // G열(권한 상태)이 수정되었는지 확인
    if(range.getColumn() === CONFIG.COLUMNS.PERMISSION) {
      var row = range.getRow();
      
      // 헤더 행(1행) 제외
      if(row > 1) {
        try {
          // 파일 URL 가져오기
          var fileUrl = activeSheet.getRange(row, CONFIG.COLUMNS.FILE_URL).getValue();
          var permissionStatus = range.getValue().toString().trim();
          console.log("🔗 파일 URL:", fileUrl);
          console.log("📝 권한 상태:", permissionStatus);
          
          if(fileUrl) {
            // URL에서 파일 ID 추출
            var fileId = fileUrl.match(/[-\w]{25,}/);
            
            if(fileId) {
              // 파일 접근
              var file = DriveApp.getFileById(fileId[0]);
              
              // permissionStatus 값을 정규화 (공백 제거, 소문자 변환)
              var normalizedStatus = permissionStatus.toString().trim().toLowerCase();
              
              if(normalizedStatus === "완료" || normalizedStatus === "wkrdy") {
                console.log("🔒 권한 변경: 뷰어 권한 설정");
                // 일반 액세스 권한만 변경 (링크가 있는 사용자 - 뷰어)
                file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                activeSheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue("보기 전용으로 변경됨");
              } 
              else {
                console.log("🔓 권한 변경: 편집자 권한 설정");
                // 일반 액세스 권한만 변경 (링크가 있는 사용자 - 편집자)
                file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
                activeSheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue("수정 권한으로 변경됨");
              }
            }
          }
        } catch(error) {
          console.error("❌ 오류 발생:", error.toString());
          activeSheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue("권한 수정 오류: " + error.toString());
        }
      }
    }
  }
  console.log("=== 권한 수정 함수 종료 ===");
}
