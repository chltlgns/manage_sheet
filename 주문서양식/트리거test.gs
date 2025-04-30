// 단순 트리거
function onEdit(e) {
  // 이벤트 객체가 없는 경우 실행 중단
  if (!e) return;
  if (!e.range) return;

  // 수정된 범위 정보 가져오기
  const range = e.range;
  const column = range.getColumn();
  
  // 수정된 열에 따라 해당 함수를 설치된 트리거로 실행
  switch(column) {
    case 7:  // G열
      PERMISSION(e);
      break;
    case 8:  // H열
      // 설치된 트리거로 실행
      createTriggerForExcelCreate(e);
      break;
    case 9:  // I열
      onEditTrigger(e);
      break;
    case 6:  // F열
      // 설치된 트리거로 실행하도록 수정
      createTriggerForQuantityCheck(e);
      break;
    default:
      return;
  }
}

// 기존 트리거 삭제 함수
function deleteTriggersByFunctionName(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  
  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

// 설치된 트리거를 생성하는 함수
function createTriggerForExcelCreate(e) {
  const sheet = e.source;
  const range = e.range;
  
  // 현재 값이 "생성"인 경우에만 트리거 생성
  if (range.getValue().toString().trim() === "생성") {
    // 기존 트리거 삭제
    deleteTriggersByFunctionName('excelCreate');
    
    // 새 트리거 생성
    ScriptApp.newTrigger('excelCreate')
      .forSpreadsheet(sheet)
      .onEdit()
      .create();
  }
}

// 수량체크를 위한 설치된 트리거 생성 함수
function createTriggerForQuantityCheck(e) {
  const sheet = e.source;
  const range = e.range;
  const value = range.getValue().toString().trim();
  
  // 현재 값이 "확인"인 경우에만 트리거 생성
  if (value === "확인") {
    // 기존 트리거 삭제
    deleteTriggersByFunctionName('onEditTriggerQuantityCheck');
    
    // 새 트리거 생성
    ScriptApp.newTrigger('onEditTriggerQuantityCheck')
      .forSpreadsheet(sheet)
      .onEdit()
      .create();
  }
}