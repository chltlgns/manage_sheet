/**
 * Gmail 이미지 파일 자동 프린트 시스템
 * 
 * 특정 발신자로부터 받은 메일에서 이미지 파일(.jpg, .jpeg, .png)을 찾아 자동으로 프린트하는 Node.js 애플리케이션
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { authenticate } = require('./auth');
const { exec } = require('child_process');
const { Base64 } = require('js-base64');

// 설정
const CONFIG = {
  // 메일 검색 쿼리 (2025년 4월 23일 이후 메일만 처리)
  MAIL_QUERY: 'from:ky316385@naver.com subject:캠퍼스룩 has:attachment after:2025/04/23',
  // 처리된 메일 ID 저장 파일
  PROCESSED_MAIL_FILE: path.join(__dirname, 'data', 'processed_mails.json'),
  // 다운로드 폴더
  DOWNLOAD_FOLDER: path.join('C:', 'AutoPrint', 'Downloads'),
  // 로그 파일
  LOG_FILE: path.join('C:', 'AutoPrint', 'logs.txt'),
  // Gmail 라벨 설정
  GMAIL_LABEL: 'print'
};

// 로그 함수
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  // 로그 디렉토리 확인
  const logDir = path.dirname(CONFIG.LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // 로그 파일에 기록
  fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n', { encoding: 'utf8' });
}

// 폴더 생성 함수
function ensureFolderExists(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    log(`폴더 생성됨: ${folderPath}`);
  }
}

// 처리된 메일 ID 관리
function getProcessedMails() {
  ensureFolderExists(path.dirname(CONFIG.PROCESSED_MAIL_FILE));
  
  if (!fs.existsSync(CONFIG.PROCESSED_MAIL_FILE)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(CONFIG.PROCESSED_MAIL_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log(`처리된 메일 목록 읽기 오류: ${error.message}`);
    return [];
  }
}

function saveProcessedMail(mailId) {
  const processedMails = getProcessedMails();
  if (!processedMails.includes(mailId)) {
    processedMails.push(mailId);
    
    try {
      fs.writeFileSync(CONFIG.PROCESSED_MAIL_FILE, JSON.stringify(processedMails), 'utf8');
    } catch (error) {
      log(`처리된 메일 목록 저장 오류: ${error.message}`);
    }
  }
}

// 일러스트레이터 실행 경로 찾기
function findIllustratorPath() {
  for (const path of CONFIG.ILLUSTRATOR_PATHS) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  throw new Error('일러스트레이터 실행 파일을 찾을 수 없습니다.');
}

// 파일 프린트 함수 (SumatraPDF 사용 - 가로 방향 인쇄)
function printFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      log(`파일 인쇄 시작 (가로 방향): ${filePath}`);
      
      // SumatraPDF 경로 설정
      const sumatraPath = "C:\\Users\\jstar\\AppData\\Local\\SumatraPDF\\SumatraPDF.exe";
      
      // 특정 프린터로 인쇄 (가로 방향 설정)
      const printerName = "HP OfficeJet Pro 7740 series [674F92]";
      
      // -print-settings 옵션으로 가로 방향 설정 추가
      // orientation=landscape: 가로 방향 인쇄
      const command = `"${sumatraPath}" -print-to "${printerName}" -print-settings "orientation=landscape,scale=100,color=color" "${filePath}"`;
      
      log(`인쇄 명령: ${command}`);
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          log(`SumatraPDF 인쇄 오류: ${error.message}`);
          
          // 대체 방법: mspaint 사용 시도
          log(`그림판으로 대체 인쇄를 시도합니다...`);
          const paintCommand = `mspaint /pt "${filePath}"`;
          
          exec(paintCommand, (paintError) => {
            if (paintError) {
              log(`그림판 인쇄 오류: ${paintError.message}`);
              
              // 최종 대안: 파일 열기
              exec(`start "" "${filePath}"`, () => {
                log(`파일이 열렸습니다. 수동으로 가로 방향 인쇄 설정 후 인쇄해주세요.`);
                resolve();
              });
              return;
            }
            
            log(`그림판으로 인쇄 명령이 전송되었습니다 (가로 방향 설정이 필요할 수 있음).`);
            resolve();
          });
          return;
        }
        
        log(`가로 방향으로 인쇄 완료: ${filePath}`);
        resolve();
      });
    } catch (error) {
      log(`인쇄 실행 오류: ${error.message}`);
      reject(error);
    }
  });
}

// 첨부파일 다운로드 및 처리
async function downloadAttachment(gmail, messageId, attachmentId, filename) {
  try {
    log(`첨부파일 다운로드 시작: ${filename} (메시지 ID: ${messageId}, 첨부파일 ID: ${attachmentId})`);
    
    const res = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId
    });
    
    const data = res.data.data;
    const buffer = Buffer.from(data, 'base64');
    
    const filePath = path.join(CONFIG.DOWNLOAD_FOLDER, filename);
    fs.writeFileSync(filePath, buffer);
    
    log(`첨부파일 다운로드 완료: ${filePath}`);
    return filePath;
  } catch (error) {
    log(`첨부파일 다운로드 오류: ${error.message}`);
    throw error;
  }
}

// 메일 처리 함수
async function processEmail(gmail, message) {
  const messageId = message.id;
  
  try {
    // 메일 상세 정보 가져오기
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });
    
    const email = res.data;
    const headers = email.payload.headers;
    
    // 제목 찾기
    const subjectHeader = headers.find(header => header.name.toLowerCase() === 'subject');
    const subject = subjectHeader ? subjectHeader.value : '(제목 없음)';
    
    // 발신자 찾기
    const fromHeader = headers.find(header => header.name.toLowerCase() === 'from');
    const from = fromHeader ? fromHeader.value : '(발신자 불명)';
    
    log(`메일 처리 시작: "${subject}" (발신자: ${from})`);
    
    // 첨부파일 찾기
    const parts = getAllParts(email.payload);
    const attachments = parts.filter(part => {
      return part.filename && part.filename.length > 0 && part.body && part.body.attachmentId;
    });
    
    log(`첨부파일 발견: ${attachments.length}개`);
    
    // 이미지 파일 필터링
    const imageFiles = attachments.filter(attachment => {
      const filename = attachment.filename.toLowerCase();
      const mimeType = attachment.mimeType;
      
      return filename.endsWith('.jpg') || 
             filename.endsWith('.jpeg') || 
             filename.endsWith('.png') ||
             mimeType === 'image/jpeg' || 
             mimeType === 'image/jpg' || 
             mimeType === 'image/png';
    });
    
    if (imageFiles.length === 0) {
      log(`이미지 파일 없음: ${subject}`);
      return false;
    }
    
    log(`이미지 파일 발견: ${imageFiles.length}개`);
    
    // 각 이미지 파일 처리
    let successCount = 0;
    
    for (const file of imageFiles) {
      try {
        // 파일 다운로드
        const filePath = await downloadAttachment(
          gmail, 
          messageId, 
          file.body.attachmentId, 
          file.filename
        );
        
        // 파일 프린트
        await printFile(filePath);
        successCount++;
        
      } catch (error) {
        log(`파일 처리 오류: ${error.message}`);
      }
    }
    
    log(`메일 처리 완료: ${subject} (${successCount}/${imageFiles.length} 파일 처리됨)`);
    return successCount > 0;
    
  } catch (error) {
    log(`메일 처리 오류 (ID: ${messageId}): ${error.message}`);
    return false;
  }
}

// 모든 MIME 파트 추출 (재귀적)
function getAllParts(part, parts = []) {
  if (part.parts) {
    part.parts.forEach(subPart => {
      getAllParts(subPart, parts);
    });
  }
  
  parts.push(part);
  return parts;
}

// Gmail 라벨 생성 또는 가져오기
async function ensureLabelExists(gmail) {
  try {
    // 기존 라벨 검색
    const res = await gmail.users.labels.list({
      userId: 'me'
    });
    
    const existingLabel = res.data.labels.find(label => label.name === CONFIG.GMAIL_LABEL);
    if (existingLabel) {
      log(`기존 라벨 발견: ${CONFIG.GMAIL_LABEL}`);
      return existingLabel.id;
    }
    
    // 새 라벨 생성
    const newLabel = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: CONFIG.GMAIL_LABEL,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show'
      }
    });
    
    log(`새 라벨 생성됨: ${CONFIG.GMAIL_LABEL}`);
    return newLabel.data.id;
  } catch (error) {
    log(`라벨 처리 오류: ${error.message}`);
    throw error;
  }
}

// 메일에 라벨 추가
async function addLabelToEmail(gmail, messageId, labelId) {
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [labelId],
        removeLabelIds: []
      }
    });
    log(`메일(ID: ${messageId})에 라벨 추가됨: ${CONFIG.GMAIL_LABEL}`);
  } catch (error) {
    log(`라벨 추가 오류 (메일 ID: ${messageId}): ${error.message}`);
    throw error;
  }
}

// 메인 함수
async function main() {
  log('===== Gmail 이미지 파일 자동 프린트 시스템 시작 =====');
  
  try {
    // 필요한 폴더 생성
    ensureFolderExists(CONFIG.DOWNLOAD_FOLDER);
    
    // 인증
    const auth = await authenticate();
    const gmail = google.gmail({ version: 'v1', auth });
    
    // 라벨 확인
    const labelId = await ensureLabelExists(gmail);
    
    // 처리된 메일 목록 가져오기
    const processedMails = getProcessedMails();
    
    // 메일 검색 (라벨이 없는 메일만 검색)
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `${CONFIG.MAIL_QUERY} -label:${CONFIG.GMAIL_LABEL}`
    });
    
    const messages = res.data.messages || [];
    log(`검색된 메일: ${messages.length}개`);
    
    // 처리되지 않은 메일만 필터링
    const unprocessedMessages = messages.filter(message => !processedMails.includes(message.id));
    log(`처리되지 않은 메일: ${unprocessedMessages.length}개`);
    
    if (unprocessedMessages.length === 0) {
      log('처리할 메일이 없습니다.');
      return;
    }
    
    // 각 메일 처리
    for (const message of unprocessedMessages) {
      const success = await processEmail(gmail, message);
      
      // 성공적으로 처리된 메일은 목록에 추가하고 라벨 부여
      if (success) {
        saveProcessedMail(message.id);
        await addLabelToEmail(gmail, message.id, labelId);
      }
    }
    
  } catch (error) {
    log(`오류 발생: ${error.message}`);
  }
  
  log('===== Gmail 이미지 파일 자동 프린트 시스템 종료 =====');
}

// 프로그램 시작
if (require.main === module) {
  main().catch(error => {
    log(`치명적 오류: ${error.message}`);
    process.exit(1);
  });
} 