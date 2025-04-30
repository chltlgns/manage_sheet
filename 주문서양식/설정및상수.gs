const CONFIG = {
  // 스프레드시트 ID 관련
  SHEET_IDS: {
    MANAGEMENT: '1JWLqBhhI8iu4ibAiso1yH2gP2jsh-K9PDgowtU1duBU'  // 관리용 스프레드시트
  },

  // 시트 이름 관련
  SHEET_NAMES: {
    MANAGEMENT: '시트1'  // 관리용 시트 이름
  },
  
  // 주문서 양식 템플릿 ID
  ORDER_TEMPLATES: {
    BASEBALL_JUMPER: '1DTMZJhGecqDlSxqyevbx4MEyyta-dbYOC-7UJti3N5E',  // 야구점퍼
    FLIGHT_JUMPER: '1IYBHnAGXr4eisbyHdxjlWTkHpG0nGCOi63m1gWqjuTk',    // 항공점퍼 
    HOODIE: '1w2w6m1iFscSf_jNO7rW_pYj6SRw46yyyDpOaS-SlKno',          // 후드티
    HOODIE_ZIPUP: '168cfWekINFGNqtqbdFi3jTYdsQhnRA-z532JVhbHBFE',    // 후드집업
    FLEECE: '1Pwd-FJM4hys2m7SEC_3vRegHR_DPl7Xd2BIXVL471mk',          // 후리스
    SHORT_DOBBA: '1Hwm8PoaHjXLmrHg2IDkNNljvZI5G3AOmnKlix7dbcQE',     // 숏돕바
    LONG_DOBBA: '1D_NqarBAkNTPWe-NLd1VDrxO1pBGrmZADe0TEKssjlY'       // 롱돕바
  },
  
  // 제품 타입 매핑
  PRODUCT_TYPES: {
    '야구점퍼': 'BASEBALL_JUMPER',
    '항공점퍼': 'FLIGHT_JUMPER',
    '후드티': 'HOODIE',
    '후드집업': 'HOODIE_ZIPUP',
    '후리스': 'FLEECE',
    '숏돕바': 'SHORT_DOBBA',
    '롱돕바': 'LONG_DOBBA'
  },
  
  // 폴더 ID 관련
  FOLDER_IDS: {
    PARENT_FOLDER: '1SkeMUg-1Z8YCaODex0jJixkEsgNYarP5'  // "주문내용" 폴더
  },
  
  // 시트 열 인덱스
  COLUMNS: {
    CUSTOMER_NAME: 1,    // A열: 고객명
    PRODUCT_NAME: 2,     // B열: 제품명
    STATUS: 3,          // C열: 상태
    FILE_URL: 4,        // D열: 파일 URL
    CHECK: 6,           // F열: 확인
    PERMISSION: 7,      // G열: 권한 상태
    EXCEL_CONVERT: 8,   // H열: 엑셀 변환 상태
    INITIAL_CREATE: 9,  // I열: 이니셜 생성
    FACTORY_NAME: 10,   // J열: 공장명
    FOLDER_Q_URL: 17    // Q열: 폴더 URL
  },
  
  // 파일명 관련
  FILE_NAMING: {
    FOLDER_SEPARATOR: '_',
    FILE_SUFFIX: '_주문서'
  },
  
  // 상태 메시지
  STATUS_MESSAGES: {
    SUCCESS: '생성 완료',
    ERROR_PREFIX: '오류: ',
    ERROR_INVALID_INPUT: '잘못된 입력',
    ERROR_DUPLICATE_FOLDER: '이미 존재하는 폴더',
    ERROR_INVALID_PRODUCT: '유효하지 않은 제품명'
  },

  // 파일 공유 설정
  SHARING: {
    ACCESS_TYPE: DriveApp.Access.ANYONE_WITH_LINK,  // 링크가 있는 모든 사용자
    PERMISSION: DriveApp.Permission.EDIT            // 편집 권한
  },

  // 공장 관련
  FACTORIES: {
    NAMES: ['투원', '두웰'],  // 공장명 목록
    EMAILS: {
      TOWON: '9952044@naver.com',          // 투원공장
      DOWELL: 'hobu1004@gmail.com',        // 두웰공장
      MANAGER: 'ky316385@naver.com',       // 관리자
      OFFICIAL: 'campuslook.official@gmail.com'  // 캠퍼스룩 공식
    }
  }
};

// 유틸리티 함수
function getManagementSheet() {
  return SpreadsheetApp.openById(CONFIG.SHEET_IDS.MANAGEMENT)
    .getSheetByName(CONFIG.SHEET_NAMES.MANAGEMENT);
}

function getOrderTemplate() {
  return DriveApp.getFileById(CONFIG.SHEET_IDS.ORDER_TEMPLATE);
}

function getParentFolder() {
  return DriveApp.getFolderById(CONFIG.FOLDER_IDS.PARENT_FOLDER);
}

// 파일명 생성 유틸리티
function createFolderName(customerName, productName) {
  return customerName + CONFIG.FILE_NAMING.FOLDER_SEPARATOR + productName;
}

function createFileName(customerName, productName) {
  return customerName + CONFIG.FILE_NAMING.FOLDER_SEPARATOR + productName + CONFIG.FILE_NAMING.FILE_SUFFIX;
}

function testTemplateId() {
  // 테스트할 제품명
  var productName = "항공점퍼";  // 실제 시트에 입력된 제품명으로 테스트
  
  Logger.log("제품명: " + productName);
  Logger.log("매핑된 키: " + CONFIG.PRODUCT_TYPES[productName]);
  Logger.log("템플릿 ID: " + CONFIG.ORDER_TEMPLATES[CONFIG.PRODUCT_TYPES[productName]]);
  
  try {
    var file = DriveApp.getFileById(CONFIG.ORDER_TEMPLATES[CONFIG.PRODUCT_TYPES[productName]]);
    Logger.log("파일 접근 성공");
  } catch(error) {
    Logger.log("오류 발생: " + error.toString());
  }
}
