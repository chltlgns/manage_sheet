function filterAndWriteData() {
  // 스프레드시트 및 시트2 참조
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('시트2');
  
  // 데이터 가져오기 (헤더 제외)
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  
  // 날짜 포맷 함수
  function formatDate(date) {
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    }
    return date; // 날짜가 아닌 경우 그대로 반환
  }
  
  // "두웰" 조건에 맞는 데이터 필터링 및 포맷팅
  const duewellData = data
    .filter(row => row[2] === '두웰')
    .map(row => `- ${row[0]}, ${formatDate(row[1])}`);

  // "투원" 조건에 맞는 데이터 필터링 및 포맷팅
  const twowonData = data
    .filter(row => row[2] === '투원')
    .map(row => `- ${row[0]}, ${formatDate(row[1])}`);

  // 결과 작성
  const header = '안녕하세요, 두웰 사장님,\n\n아래는 마감일이 체크된 항목들입니다:\n\n';
  const footer = '\n\n감사합니다.';
  
  // G 열과 I 열에 데이터 작성
  const duewellContent = duewellData.length > 0 
    ? header + duewellData.join('\n') + footer 
    : '조건에 맞는 데이터가 없습니다.';
  sheet.getRange(2, 7).setValue(duewellContent);

  const twowonContent = twowonData.length > 0 
    ? header.replace('두웰 사장님', '투원 사장님') + twowonData.join('\n') + footer 
    : '조건에 맞는 데이터가 없습니다.';
  sheet.getRange(2, 9).setValue(twowonContent);

  // 두 회사 모두에 이메일 보내기
  sendEmail(sheet, 'G'); // 두웰 이메일
  sendEmail(sheet, 'I'); // 투원 이메일
}

function sendEmail(sheet, column) {
  // 지정된 열에서 데이터 가져오기
  const factoryName = sheet.getRange(`${column}1`).getValue(); // 공장명
  const emailBody = sheet.getRange(`${column}2`).getValue(); // 이메일 본문
  const recipient1 = sheet.getRange(`${column}4`).getValue(); // 첫 번째 수신자 이메일
  const recipient2 = sheet.getRange(`${column}5`).getValue(); // 두 번째 수신자 이메일
  
  // 이메일 제목
  const subject = `안녕하세요 ${factoryName}사장님 마감일 체크 메일입니다`;
  
  // 두 명의 수신자에게 이메일 전송
  const recipients = [recipient1, recipient2].filter(email => email).join(',');
  
  if (recipients && emailBody) {
    try {
      MailApp.sendEmail({
        to: recipients,
        subject: subject,
        body: emailBody
      });
      Logger.log(`${factoryName}에 이메일이 성공적으로 전송되었습니다.`);
    } catch (error) {
      Logger.log(`${factoryName} 이메일 전송 중 오류가 발생했습니다: ${error.toString()}`);
    }
  }
}

// 매일 오전 10시에 실행되도록 트리거 설정
function createTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  
  // 기존 트리거 모두 삭제
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'filterAndWriteData') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 오전 9시 트리거 생성
  ScriptApp.newTrigger('filterAndWriteData')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();
    
  // 오후 7시 50분 트리거 생성
  ScriptApp.newTrigger('filterAndWriteData')
    .timeBased()
    .atHour(19)
    .nearMinute(50)
    .everyDays(1)
    .create();
}

// 이메일 전송을 위한 새로운 트리거 함수
function createEmailTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  
  // 기존 이메일 트리거만 삭제
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendEmailToAll') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 월요일 트리거 생성
  ScriptApp.newTrigger('sendEmailToAll')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(10)
    .nearMinute(30)
    .create();
    
  // 목요일 트리거 생성
  ScriptApp.newTrigger('sendEmailToAll')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.THURSDAY)
    .atHour(10)
    .nearMinute(30)
    .create();
}

// 이메일 전송만을 위한 새로운 함수
function sendEmailToAll() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('시트2');
  sendEmail(sheet, 'G'); // 두웰 이메일
  sendEmail(sheet, 'I'); // 투원 이메일
}
