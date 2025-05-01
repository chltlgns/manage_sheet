/**
 * 토큰 재설정 스크립트
 * 
 * 저장된 인증 토큰을 삭제하여 새로운 권한으로 재인증을 받도록 함
 */

const fs = require('fs');
const path = require('path');

// 토큰 파일 경로
const TOKEN_PATH = path.join(__dirname, 'data', 'token.json');

console.log('토큰 재설정을 시작합니다...');

// 토큰 파일 존재 여부 확인
if (fs.existsSync(TOKEN_PATH)) {
  // 토큰 파일 삭제
  try {
    fs.unlinkSync(TOKEN_PATH);
    console.log(`토큰 파일이 삭제되었습니다: ${TOKEN_PATH}`);
    console.log('이제 "npm run setup" 명령을 실행하여 새로운 권한으로 재인증을 받으세요.');
  } catch (error) {
    console.error(`토큰 파일 삭제 오류: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log(`토큰 파일이 존재하지 않습니다: ${TOKEN_PATH}`);
  console.log('이미 재설정된 상태입니다. "npm run setup" 명령을 실행하여 인증을 진행하세요.');
} 