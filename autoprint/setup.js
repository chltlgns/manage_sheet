/**
 * 초기 설정 스크립트
 * 
 * 시스템 초기화 및 필요한 디렉토리 생성
 */

const fs = require('fs');
const path = require('path');
const { authenticate } = require('./auth');

// 설정
const CONFIG = {
  DATA_DIR: path.join(__dirname, 'data'),
  DOWNLOAD_DIR: path.join('C:', 'AutoPrint', 'Downloads'),
  LOG_DIR: path.join('C:', 'AutoPrint')
};

/**
 * 필요한 디렉토리 생성
 */
function createDirectories() {
  console.log('필요한 디렉토리를 생성합니다...');
  
  // 데이터 디렉토리
  if (!fs.existsSync(CONFIG.DATA_DIR)) {
    fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
    console.log(`데이터 디렉토리 생성됨: ${CONFIG.DATA_DIR}`);
  } else {
    console.log(`데이터 디렉토리 이미 존재함: ${CONFIG.DATA_DIR}`);
  }
  
  // 다운로드 디렉토리
  if (!fs.existsSync(CONFIG.DOWNLOAD_DIR)) {
    fs.mkdirSync(CONFIG.DOWNLOAD_DIR, { recursive: true });
    console.log(`다운로드 디렉토리 생성됨: ${CONFIG.DOWNLOAD_DIR}`);
  } else {
    console.log(`다운로드 디렉토리 이미 존재함: ${CONFIG.DOWNLOAD_DIR}`);
  }
  
  // 로그 디렉토리
  if (!fs.existsSync(CONFIG.LOG_DIR)) {
    fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
    console.log(`로그 디렉토리 생성됨: ${CONFIG.LOG_DIR}`);
  } else {
    console.log(`로그 디렉토리 이미 존재함: ${CONFIG.LOG_DIR}`);
  }
}

/**
 * 인증 정보 확인
 */
function checkCredentials() {
  const credentialsPath = path.join(CONFIG.DATA_DIR, 'credentials.json');
  
  if (!fs.existsSync(credentialsPath)) {
    console.log('\n인증 정보 파일이 없습니다.');
    console.log('다음 단계를 따라 인증 정보를 설정하세요:');
    console.log('1. Google Cloud Console(https://console.cloud.google.com/)에 접속');
    console.log('2. 프로젝트 생성 또는 선택');
    console.log('3. API 및 서비스 > 사용자 인증 정보에서 OAuth 클라이언트 ID 생성');
    console.log('4. 애플리케이션 유형: 데스크톱 앱');
    console.log('5. 생성된 JSON 파일을 다운로드하여 다음 경로에 저장:');
    console.log(`   ${credentialsPath}`);
    return false;
  }
  
  console.log('인증 정보 파일이 확인되었습니다.');
  return true;
}

/**
 * 메인 함수
 */
async function main() {
  console.log('===== Gmail 일러스트 파일 자동 프린트 시스템 설정 =====\n');
  
  // 디렉토리 생성
  createDirectories();
  
  // 인증 정보 확인
  if (!checkCredentials()) {
    console.log('\n인증 정보를 설정한 후 다시 실행하세요.');
    return;
  }
  
  // 인증 시도
  try {
    console.log('\nGmail API 인증을 시작합니다...');
    await authenticate();
    console.log('인증이 완료되었습니다.');
  } catch (error) {
    console.error('인증 오류:', error.message);
    return;
  }
  
  console.log('\n===== 설정 완료 =====');
  console.log('이제 다음 명령으로 프로그램을 실행할 수 있습니다:');
  console.log('npm start');
  
  // 작업 스케줄러 설정 안내
  console.log('\n자동 실행을 위한 Windows 작업 스케줄러 설정:');
  console.log('1. 작업 스케줄러 열기');
  console.log('2. 기본 작업 만들기');
  console.log('3. 트리거: 매일 또는 시작 시');
  console.log('4. 작업: 프로그램 시작');
  console.log('5. 프로그램 경로: node');
  console.log(`6. 인수: ${path.resolve('index.js')}`);
  console.log(`7. 시작 위치: ${__dirname}`);
}

// 프로그램 시작
main().catch(error => {
  console.error('설정 오류:', error.message);
  process.exit(1);
}); 