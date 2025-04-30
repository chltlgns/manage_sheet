function createOrderForm() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  for(var i = 2; i <= lastRow; i++) {
    var customerName = sheet.getRange(i, CONFIG.COLUMNS.CUSTOMER_NAME).getValue();
    var productName = sheet.getRange(i, CONFIG.COLUMNS.PRODUCT_NAME).getValue();
    var status = sheet.getRange(i, CONFIG.COLUMNS.STATUS).getValue();
    
    // null 체크 추가
    customerName = customerName ? customerName.toString().trim() : "";
    productName = productName ? productName.toString().trim() : "";
    status = status ? status.toString().trim() : "";
    
    // 필수 정보가 있고, 아직 생성되지 않은 경우에만 처리
    if(customerName && productName && status !== "생성 완료") {
      try {
        // Q열의 폴더 URL 확인 (null 체크 추가)
        var existingFolderUrl = sheet.getRange(i, CONFIG.COLUMNS.FOLDER_Q_URL).getValue() || "";
        if (existingFolderUrl) {
          console.log("이미 폴더가 존재함. 행:", i);
          continue; // 다음 행으로 넘어감
        }

        // 부모 폴더에서 동일한 이름의 폴더 검색
        var folderName = customerName + "_" + productName;
        var parentFolder = DriveApp.getFolderById(CONFIG.FOLDER_IDS.PARENT_FOLDER);
        var existingFolders = parentFolder.getFolders();
        var existingFolder = null;

        while (existingFolders.hasNext()) {
          var folder = existingFolders.next();
          if (folder.getName() === folderName) {
            existingFolder = folder;
            break;
          }
        }

        // 기존 폴더가 있으면 해당 폴더 사용, 없으면 새로 생성
        if (existingFolder) {
          folder = existingFolder;
          console.log("기존 폴더 사용:", folder.getName());
        } else {
          folder = parentFolder.createFolder(folderName);
          console.log("새 폴더 생성됨:", folder.getName());
        }

        // 나머지 코드는 동일하게 진행
        var newFileName = customerName + "_" + productName + "_주문서";
        var templateId = CONFIG.ORDER_TEMPLATES[CONFIG.PRODUCT_TYPES[productName]];
        var newFile = DriveApp.getFileById(templateId).makeCopy(newFileName);
        
        folder.addFile(DriveApp.getFileById(newFile.getId()));
        DriveApp.getRootFolder().removeFile(newFile);
        
        newFile.setSharing(
          CONFIG.SHARING.ACCESS_TYPE,
          CONFIG.SHARING.PERMISSION
        );
        
        var fileUrl = newFile.getUrl();
        sheet.getRange(i, CONFIG.COLUMNS.FILE_URL).setValue(fileUrl);
        
        // Q열에 폴더 링크 저장
        var folderUrl = folder.getUrl();
        sheet.getRange(i, CONFIG.COLUMNS.FOLDER_Q_URL).setValue(folderUrl);
        console.log("폴더 URL 저장됨:", folderUrl);
        
        sheet.getRange(i, CONFIG.COLUMNS.STATUS).setValue("생성 완료");
        
      } catch(error) {
        console.error("오류 발생:", error.toString());
        sheet.getRange(i, CONFIG.COLUMNS.STATUS).setValue("오류: " + error.toString());
      }
    }
  }
}