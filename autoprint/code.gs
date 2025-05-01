/**
 * 메일에서 엑셀 첨부파일을 찾아 데이터를 스프레드시트로 가져오는 메인 함수
 * - 캠퍼스룩 관련 메일에서 주문서 엑셀 파일을 검색
 * - 각 파일의 데이터를 시트1에 입력
 * - 중복 데이터 체크 및 건너뛰기
 */
function fetchEmailAndExtractData() {
  // 처리된 메일 라벨 생성 또는 가져오기
  let processedLabel, noOrderLabel;
  try {
    processedLabel = GmailApp.createLabel('캠퍼스룩확인');
    noOrderLabel = GmailApp.createLabel('캠퍼스룩라벨X');
  } catch (e) {
    processedLabel = GmailApp.getUserLabelByName('캠퍼스룩확인');
    noOrderLabel = GmailApp.getUserLabelByName('캠퍼스룩라벨X');
  }

  // 첨부파일 조건을 제거한 검색 쿼리
  const query = 'from:(ky316385@naver.com) ' + 
                'subject:(캠퍼스*룩) ' +  // 캠퍼스와 룩 사이에 어떤 문자가 와도 검색
                'after:2025/01/01 ' + 
                '-label:캠퍼스룩확인 -label:캠퍼스룩라벨X';
                
  const threads = GmailApp.search(query);
  const targetSheet = SpreadsheetApp.openById('19nUW6uuelpz0mRSN-iE5mOgrX7RFSSl988oVRHZFyZc').getSheetByName('시트1');
  
  // T열의 데이터만 확인하여 마지막 행 찾기
  const tColumnValues = targetSheet.getRange("T:T").getValues();
  let lastRow = 1;
  for (let i = tColumnValues.length - 1; i >= 0; i--) {
    if (tColumnValues[i][0] !== "") {
      lastRow = i + 1;
      break;
    }
  }
  lastRow = lastRow < 1 ? 1 : lastRow;

  // 기존 데이터 가져오기
  const existingData = {
    dates: lastRow > 1 ? targetSheet.getRange("L2:L" + lastRow).getValues() : [],
    subjects: lastRow > 1 ? targetSheet.getRange("T2:T" + lastRow).getValues() : [],
    e20Data: lastRow > 1 ? targetSheet.getRange("M2:M" + lastRow).getValues() : [],
    fileNames: []
  };

  // 임시 파일 ID 저장 배열
  const tempFileIds = [];

  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      if (!message.getFrom().includes('ky316385@naver.com')) return;

      const subject = message.getSubject();
      const factoryName = message.getTo().includes('투원공장') ? '투원공장' : 
                         message.getTo().includes('두웰') ? '두웰공장' : '';
      const receivedDate = Utilities.formatDate(message.getDate(), 'Asia/Seoul', 'yy/MM/dd');
      
      // 주문서 파일 확인 강화
      const attachments = message.getAttachments();
      const orderFiles = attachments.filter(att => {
        const fileName = att.getName().toLowerCase(); // 파일명 소문자로 변환
        const fileType = att.getContentType();
        
        // 엑셀 파일 타입 확인 (여러 버전의 엑셀 파일 포함)
        const isExcel = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
          'application/vnd.ms-excel', // xls
          'application/excel',
          'application/x-excel',
          'application/x-msexcel'
        ].includes(fileType);

        // 주문 관련 키워드 확인
        const isOrderFile = fileName.includes('주문') || 
                          fileName.includes('order') ||
                          fileName.includes('발주');

        return isExcel && isOrderFile;
      }).slice(0, 10);

      // 주문서가 없는 경우 처리
      if (orderFiles.length === 0) {
        // 수신자 확인하여 공장명 결정
        if (factoryName) {
          targetSheet.getRange(lastRow + 1, 17).setValue(factoryName);
        }

        // 주문서 양식 확인
        let hasInvalidOrder = false;
        attachments.forEach(att => {
          const fileName = att.getName().toLowerCase();
          if (fileName.includes('주문서') || fileName.includes('order') || fileName.includes('발주')) {
            hasInvalidOrder = true;
          }
        });

        if (hasInvalidOrder) {
          targetSheet.getRange(lastRow + 1, 21).setValue('잘못된 주문서 양식');
          Logger.log(`잘못된 주문서 양식 발견: ${subject}`);
        } else {
          targetSheet.getRange(lastRow + 1, 21).setValue('주문서 없음');
          Logger.log(`주문서 없음: ${subject}`);
        }

        targetSheet.getRange(lastRow + 1, 20).setValue(subject);
        thread.addLabel(noOrderLabel);
        lastRow++;
        return;
      }

      // 주문서가 있는 경우
      Logger.log(`주문서 있음. 처리 시작: ${subject}`);
      
      // 주문서 있음 라벨 처리
      thread.addLabel(processedLabel);

      let processedFiles = 0;

      orderFiles.forEach(attachment => {
        try {
          const fileName = attachment.getName();
          Logger.log(`파일 처리 시작: ${fileName}`);

          const tempSpreadsheet = SpreadsheetApp.create('Temp_' + new Date().getTime());
          tempFileIds.push(tempSpreadsheet.getId());

          const blob = attachment.copyBlob();
          const resource = {
            title: tempSpreadsheet.getName(),
            mimeType: MimeType.GOOGLE_SHEETS
          };
          
          const convertedFile = Drive.Files.insert(resource, blob);
          tempFileIds.push(convertedFile.id);
          
          const excelSheet = SpreadsheetApp.openById(convertedFile.id).getSheets()[0];
          
          // B12:J12 데이터 존재 여부 확인
          let sourceData;
          try {
            sourceData = excelSheet.getRange("B12:J12").getValues();
            if (!sourceData[0] || sourceData[0].every(cell => cell === '')) {
              throw new Error('빈 데이터');
            }
          } catch (error) {
            Logger.log(`잘못된 주문서 양식: ${fileName} - ${error.message}`);
            targetSheet.getRange(lastRow + 1, 21).setValue('잘못된 주문서 양식');
            return;
          }

          const e20Data = excelSheet.getRange("E20").getValue();

          // 중복 데이터 체크
          const isDuplicate = existingData.dates.some((date, index) => 
            date[0] === receivedDate && 
            existingData.subjects[index][0] === subject && 
            existingData.e20Data[index][0] === e20Data && 
            existingData.fileNames.includes(fileName)
          );

          if (!isDuplicate && sourceData[0] && sourceData[0].length > 0) {
            // 새 데이터 입력
            lastRow++;
            
            targetSheet.getRange(lastRow, 3, 1, 9).setValues(sourceData);  // C-K열: B12:J12 데이터
            targetSheet.getRange(lastRow, 12).setValue(receivedDate);      // L열: 날짜
            targetSheet.getRange(lastRow, 13).setValue(e20Data);          // M열: E20 데이터
            if (factoryName) {
              targetSheet.getRange(lastRow, 17).setValue(factoryName);    // Q열: 공장명
            }
            targetSheet.getRange(lastRow, 20).setValue(subject);          // T열: 메일 제목

            // 처리된 데이터 기록
            existingData.fileNames.push(fileName);
            existingData.dates.push([receivedDate]);
            existingData.subjects.push([subject]);
            existingData.e20Data.push([e20Data]);

            Logger.log(`데이터 입력 완료 - 행: ${lastRow}, 파일: ${fileName}`);
          } else {
            Logger.log(`중복 데이터 건너뜀: ${fileName}`);
          }

        } catch (error) {
          Logger.log(`오류 발생: ${error.message}, 파일: ${attachment.getName()}`);
        }
      });
    });
  });

  // 모든 처리가 끝난 후 임시 파일 일괄 삭제
  try {
    tempFileIds.forEach(fileId => {
      DriveApp.getFileById(fileId).setTrashed(true);
    });
    Logger.log(`임시 파일 ${tempFileIds.length}개 삭제 완료`);
  } catch (error) {
    Logger.log(`임시 파일 삭제 중 오류 발생: ${error.message}`);
  }
}

/**
 * 스프레드시트 초기화 함수 (필요시 사용)
 * - 시트의 모든 데이터를 지우고 초기 상태로 되돌림
 */
function clearSheet() {
  const sheet = SpreadsheetApp.openById('19nUW6uuelpz0mRSN-iE5mOgrX7RFSSl988oVRHZFyZc').getSheetByName('시트1');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clear();
  }
  Logger.log('시트 초기화 완료');
}

/**
 * 라벨이 제거된 메일을 재처리하는 함수
 * 매일 실행되도록 트리거 설정 필요
 */
function recheckRemovedLabels() {
  // 캠퍼스룩 메일 중 라벨이 없는 메일 검색
  const query = 'from:(ky316385@naver.com) subject:"캠퍼스룩" has:attachment ' + 
                'filename:xlsx after:2025/01/01 ' + 
                '-label:캠퍼스룩확인 -label:캠퍼스룩라벨X';
                
  const threads = GmailApp.search(query);
  
  if (threads.length > 0) {
    Logger.log(`라벨이 제거된 메일 발견: ${threads.length}개`);
    // 메인 함수 실행
    fetchEmailAndExtractData();
  } else {
    Logger.log('재처리할 메일 없음');
  }
}

function resetAllTriggers() {
  // 기존 트리거 모두 삭제
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  // 메인 함수 트리거 (매일 오전 10시, 오후 6시)
  ScriptApp.newTrigger('fetchEmailAndExtractData')
    .timeBased()
    .atHour(10)
    .everyDays(1)
    .create();
  
  ScriptApp.newTrigger('fetchEmailAndExtractData')
    .timeBased()
    .atHour(18)
    .everyDays(1)
    .create();
    
  // 라벨 재확인 트리거 (매시간)
  ScriptApp.newTrigger('recheckRemovedLabels')
    .timeBased()
    .everyHours(1)
    .create();
    
  Logger.log('모든 트리거가 재설정되었습니다.');
} 