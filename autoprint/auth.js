/**
 * Gmail API 인증 모듈 (OOB 인증 방식으로 수정됨)
 * 
 * OAuth2를 사용하여 Gmail API에 인증하는 기능 제공
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
const { exec } = require('child_process');

// 인증 설정
const TOKEN_PATH = path.join(__dirname, 'data', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'data', 'credentials.json');

// 필요한 OAuth2 스코프
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.modify'
];

/**
 * 인증 토큰 로드 또는 새로 생성
 */
async function authenticate() {
  try {
    // 인증 정보 로드
    const credentials = loadCredentials();
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    
    // OAuth2 클라이언트 생성
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]
    );
    
    // 토큰 확인
    if (fs.existsSync(TOKEN_PATH)) {
      // 기존 토큰 사용
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      oAuth2Client.setCredentials(token);
      
      // 토큰 만료 확인 및 갱신
      if (isTokenExpired(token)) {
        console.log('토큰이 만료되었습니다. 갱신을 시도합니다...');
        await refreshToken(oAuth2Client);
      }
    } else {
      // 새 토큰 생성
      await getNewToken(oAuth2Client);
    }
    
    return oAuth2Client;
  } catch (error) {
    console.error('인증 오류:', error.message);
    throw error;
  }
}

/**
 * 인증 정보 로드
 */
function loadCredentials() {
  try {
    // 인증 정보 파일 확인
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`인증 정보 파일을 찾을 수 없습니다: ${CREDENTIALS_PATH}`);
    }
    
    // 인증 정보 로드
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('인증 정보 로드 오류:', error.message);
    throw new Error(`인증 정보를 로드할 수 없습니다. Google Cloud Console에서 OAuth 클라이언트 ID를 생성하고 ${CREDENTIALS_PATH}에 저장하세요.`);
  }
}

/**
 * 토큰 만료 확인
 */
function isTokenExpired(token) {
  if (!token.expiry_date) {
    return true;
  }
  
  // 현재 시간과 만료 시간 비교 (5분 여유 추가)
  const now = Date.now();
  return token.expiry_date <= (now + 5 * 60 * 1000);
}

/**
 * 토큰 갱신
 */
async function refreshToken(oAuth2Client) {
  try {
    const { tokens } = await oAuth2Client.refreshToken(oAuth2Client.credentials.refresh_token);
    oAuth2Client.setCredentials(tokens);
    
    // 갱신된 토큰 저장
    saveToken(tokens);
    console.log('토큰이 성공적으로 갱신되었습니다.');
  } catch (error) {
    console.error('토큰 갱신 오류:', error.message);
    // 갱신 실패 시 새 토큰 발급
    await getNewToken(oAuth2Client);
  }
}

/**
 * 새 토큰 발급 (OOB 인증 방식 사용)
 */
async function getNewToken(oAuth2Client) {
  // 인증 URL 생성 (OOB 모드 사용)
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'  // OOB 모드 지정
  });
  
  console.log('\n========================================================');
  console.log('아래 URL을 복사하여 웹 브라우저에 붙여넣으세요:');
  console.log(authUrl);
  console.log('========================================================\n');
  
  // 인증 코드 입력 받기
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const code = await new Promise(resolve => {
    rl.question('브라우저에 표시된 인증 코드를 입력하세요: ', code => {
      rl.close();
      resolve(code);
    });
  });
  
  try {
    // 인증 코드로 토큰 발급
    const { tokens } = await oAuth2Client.getToken({
      code: code,
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'  // OOB 모드 지정
    });
    
    oAuth2Client.setCredentials(tokens);
    
    // 토큰 저장
    saveToken(tokens);
    console.log('토큰이 저장되었습니다.');
  } catch (error) {
    console.error('토큰 발급 오류:', error.message);
    throw error;
  }
}

/**
 * 토큰 저장
 */
function saveToken(token) {
  // 데이터 디렉토리 확인
  const dataDir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 토큰 저장
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token), 'utf8');
}

module.exports = { authenticate };
