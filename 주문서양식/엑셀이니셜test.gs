function onEditTrigger(e) {
  console.log("이니셜 함수 시작");
  
  // 이벤트 객체 검증
  if (!e) {
    console.log("이벤트 객체 없음");
    return;
  }
  
  const range = e.range;
  const sheet = e.source.getActiveSheet();
  
  // I열(INITIAL_CREATE)의 변경사항만 처리
  if (range.getColumn() !== CONFIG.COLUMNS.INITIAL_CREATE) {
    console.log("I열이 아님, 종료");
    return;
  }

  // 값이 "생성"이 아니면 종료
  const value = range.getValue().toString().trim();
  if (value !== "생성") {
    console.log("변환 요청이 아님, 종료");
    return;
  }

  try {
    const row = range.getRow();
    
    // A열(CUSTOMER_NAME)과 B열(PRODUCT_NAME)의 값 가져오기
    const aColumnValue = sheet.getRange(row, CONFIG.COLUMNS.CUSTOMER_NAME).getValue().toString().trim();
    const bColumnValue = sheet.getRange(row, CONFIG.COLUMNS.PRODUCT_NAME).getValue().toString().trim();
    
    if (!aColumnValue || !bColumnValue) {
      throw new Error("A열 또는 B열의 값이 비어있습니다.");
    }
    
    // D열(FILE_URL)에서 스프레드시트 링크 가져오기
    const sourceUrl = sheet.getRange(row, CONFIG.COLUMNS.FILE_URL).getValue();
    console.log("소스 URL:", sourceUrl);
    
    if (!sourceUrl) {
      throw new Error("스프레드시트 링크가 없습니다.");
    }
    
    const sourceId = extractFileId(sourceUrl);
    console.log("추출된 소스 ID:", sourceId);
    
    // Q열(FOLDER_Q_URL)에서 폴더 링크 가져오기
    const folderUrl = sheet.getRange(row, CONFIG.COLUMNS.FOLDER_Q_URL).getValue();
    if (!folderUrl) {
      throw new Error("폴더 링크가 없습니다.");
    }
    const folderId = extractFileId(folderUrl);
    console.log("대상 폴더 ID:", folderId);
    
    // 데이터 복사 및 새 스프레드시트 생성
    const sourceSpreadsheet = SpreadsheetApp.openById(sourceId);
    console.log("스프레드시트 제목:", sourceSpreadsheet.getName());
    
    const sourceSheet = sourceSpreadsheet.getSheets()[0];
    console.log("시트 이름:", sourceSheet.getName());
    
    // B60:M1000 범위의 데이터 가져오기
    const sourceRange = sourceSheet.getRange('B60:M1000');
    const values = sourceRange.getValues();
    console.log("가져온 데이터 행 수:", values.length);
    console.log("원본 첫 번째 행 데이터:", values[0]);
    
    // 중복 제거 및 빈 열 처리
    const processedValues = values.map(rowData => {
      const result = [...rowData];  // 원본 데이터 복사
      
      // E-F-G 열 처리 (이니셜 부분)
      if (!result[4]) result[4] = result[3];  // E열이 비어있으면 D열 값으로
      if (!result[5]) result[5] = result[3];  // F열이 비어있으면 D열 값으로
      
      // I-J 열 처리 (연락처 부분)
      if (!result[8]) result[8] = result[7];  // I열이 비어있으면 H열 값으로
      
      // K-L 열 처리 (주소 부분)
      if (!result[10]) result[10] = result[9];  // K열이 비어있으면 J열 값으로
      
      // 중복 데이터 제거 (빈 문자열로 설정)
      result[4] = '';  // E열 비우기
      result[5] = '';  // F열 비우기
      result[8] = '';  // I열 비우기
      result[10] = ''; // K열 비우기
      
      // 데이터 이동을 위해 임시 저장
      const gColData = result[6];   // G열 데이터 임시 저장
      const hColData = result[7];   // H열 데이터 임시 저장
      const jColData = result[9];   // J열 데이터 임시 저장
      const lColData = result[11];  // L열 데이터 임시 저장
      
      // 데이터 이동
      result[4] = gColData;   // G열 데이터를 E열로
      result[5] = hColData;   // H열 데이터를 F열로
      result[6] = jColData;   // J열 데이터를 G열로
      result[7] = lColData;   // L열 데이터를 H열로
      
      // 원래 위치의 데이터 제거
      result[9] = '';    // J열 비우기
      result[11] = '';   // L열 비우기
      
      return result;
    });
    
    console.log("처리된 첫 번째 행 데이터:", processedValues[0]);
    
    // 새로운 스프레드시트 생성
    const newSpreadsheet = SpreadsheetApp.create("이니셜_test");
    const newSheet = newSpreadsheet.getSheets()[0];
    newSheet.setName("시트1");
    
    // 1행 A열부터 H열까지 병합
    newSheet.getRange(1, 1, 1, 8).merge();
    
    // 파일 이름 생성 및 입력
    const fileName = `${aColumnValue}_${bColumnValue}_이니셜`;
    newSheet.getRange(1, 1).setValue(fileName);
    
    // 제목 행 스타일 설정
    const titleRange = newSheet.getRange(1, 1);
    titleRange.setHorizontalAlignment("center");
    titleRange.setFontSize(12);
    titleRange.setFontWeight("bold");
    
    // 데이터를 2행부터 붙여넣기
    newSheet.getRange(2, 1, processedValues.length, processedValues[0].length).setValues(processedValues);
    
    // 헤더 행 추가 (2행)
    const headers = ['이름', '이니셜폰트', '사이즈', '이니셜', '학번', '연락처', '주소', '비고'];
    newSheet.getRange(2, 1, 1, headers.length).setValues([headers]);
    
    // 필터 설정 (A2:J940 범위)
    const filterRange = newSheet.getRange('A2:J940');
    filterRange.createFilter();
    
    // 데이터 범위만 정렬 (3행부터 끝까지)
    const dataRange = newSheet.getRange(3, 1, processedValues.length - 1, processedValues[0].length);
    dataRange.sort({
      column: 3,  // C열 기준
      ascending: true  // 오름차순
    });
    
    // 데이터 복사 확인
    const copiedValues = newSheet.getRange(2, 1, processedValues.length, processedValues[0].length).getValues();
    console.log("복사된 첫 번째 행 데이터:", copiedValues[0]);
    
    // 스프레드시트를 엑셀로 변환
    const url = "https://docs.google.com/spreadsheets/d/" + newSpreadsheet.getId() + "/export?format=xlsx";
    const token = ScriptApp.getOAuthToken();
    
    const response = UrlFetchApp.fetch(url, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    
    // 대상 폴더 가져오기
    const folder = DriveApp.getFolderById(folderId);
    
    try {
      // 동일한 이름의 파일 검색 및 삭제
      const files = folder.getFilesByName(fileName);
      let filesFound = false;
      
      while (files.hasNext()) {
        filesFound = true;
        const existingFile = files.next();
        console.log('기존 파일 발견:', existingFile.getName(), '(ID:', existingFile.getId(), ')');
        
        try {
          existingFile.setTrashed(true);
          console.log('파일 삭제 성공:', existingFile.getName());
        } catch (deleteError) {
          console.error('파일 삭제 실패:', deleteError.toString());
          // 삭제 실패 시 다른 방법 시도
          try {
            DriveApp.getFileById(existingFile.getId()).setTrashed(true);
            console.log('대체 방법으로 파일 삭제 성공');
          } catch (alternativeDeleteError) {
            console.error('대체 삭제 방법도 실패:', alternativeDeleteError.toString());
            throw new Error('기존 파일 삭제 실패: ' + existingFile.getName());
          }
        }
      }
      
      if (filesFound) {
        // 삭제 후 잠시 대기하여 Drive API 동기화 시간 확보
        Utilities.sleep(1000);
        console.log('기존 파일 삭제 완료');
      }
    } catch (searchError) {
      console.error('파일 검색 중 오류 발생:', searchError.toString());
      throw new Error('파일 검색/삭제 중 오류 발생');
    }
    
    // 새 엑셀 파일 생성
    const blob = response.getBlob().setName(fileName);
    const excelFile = folder.createFile(blob);
    
    console.log('엑셀 파일 생성 완료: ' + excelFile.getUrl());
    
    // 임시 스프레드시트 삭제
    DriveApp.getFileById(newSpreadsheet.getId()).setTrashed(true);
    
    // C열(STATUS)에 상태 메시지 입력 (3번째 열)
    sheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue("이니셜 파일 생성 완료");
    
    // I열 초기화
    range.setValue('');
    
  } catch (error) {
    console.error('오류 발생: ' + error.toString());
    range.setValue('오류: ' + error.toString());
    // C열(STATUS)에 오류 메시지 입력
    sheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue(CONFIG.STATUS_MESSAGES.ERROR_PREFIX + error.toString());
  }
}

function extractFileId(url) {
  // 폴더 URL 패턴 확인
  let folderMatch = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  if (folderMatch) {
    return folderMatch[1];
  }
  
  // 스프레드시트 URL 패턴 확인
  let fileMatch = url.match(/[-\w]{25,}/);
  if (fileMatch) {
    return fileMatch[0];
  }
  
  throw new Error("올바른 Google Drive 링크가 아닙니다.");
} 