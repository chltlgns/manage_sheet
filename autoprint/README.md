# Gmail 일러스트 파일 자동 프린트 시스템

이 시스템은 Gmail에서 특정 발신자로부터 받은 메일에서 일러스트(.ai) 파일을 자동으로 찾아 프린트하는 Node.js 애플리케이션입니다.

## 기능

- Gmail API를 사용하여 특정 발신자(ky316385@naver.com)의 메일 검색
- 메일 첨부파일 중 일러스트(.ai) 파일 식별
- 일러스트 파일 자동 다운로드
- Adobe Illustrator를 사용하여 파일 자동 프린트
- 처리된 메일 기록 관리
- 상세한 로그 기록

## 시스템 요구사항

- Node.js 14.x 이상
- Windows 운영체제
- Adobe Illustrator (2020 이상 버전)
- Google 계정 및 Gmail API 접근 권한

## 설치 방법

1. 저장소 클론 또는 다운로드
   ```
   git clone https://github.com/yourusername/autoprint.git
   cd autoprint
   ```

2. 의존성 설치
   ```
   npm install
   ```

3. Google Cloud Console에서 프로젝트 설정
   - [Google Cloud Console](https://console.cloud.google.com/)에 접속
   - 새 프로젝트 생성
   - Gmail API 활성화
   - OAuth 동의 화면 설정
   - OAuth 클라이언트 ID 생성 (애플리케이션 유형: 데스크톱 앱)
   - 인증 정보 JSON 파일 다운로드

4. 인증 정보 설정
   - 다운로드한 JSON 파일을 `data/credentials.json`으로 저장
   - 데이터 폴더가 없는 경우 생성
   ```
   mkdir -p data
   ```

5. 초기 설정 실행
   ```
   npm run setup
   ```
   - 화면에 표시된 URL로 이동하여 Google 계정으로 인증
   - 인증 코드를 복사하여 터미널에 붙여넣기

## 사용 방법

### 수동 실행

```
npm start
```

### 자동 실행 설정 (Windows)

1. Windows 작업 스케줄러 열기
2. 기본 작업 만들기
3. 트리거 설정: 매일 또는 컴퓨터 시작 시
4. 작업 설정: 프로그램 시작
5. 프로그램 경로: `node` (Node.js 실행 파일 경로)
6. 인수: 프로젝트 폴더의 `index.js` 파일 경로
7. 시작 위치: 프로젝트 폴더 경로

## 설정 옵션

`index.js` 파일의 CONFIG 객체에서 다음 설정을 변경할 수 있습니다:

- `MAIL_QUERY`: Gmail 검색 쿼리
- `PROCESSED_MAIL_FILE`: 처리된 메일 ID 저장 파일 경로
- `DOWNLOAD_FOLDER`: 다운로드 폴더 경로
- `LOG_FILE`: 로그 파일 경로
- `ILLUSTRATOR_PATHS`: 일러스트레이터 실행 파일 경로 목록

## 문제 해결

### 인증 오류

- `data/token.json` 파일을 삭제하고 `npm run setup`을 다시 실행하여 재인증

### 일러스트레이터 실행 오류

- CONFIG.ILLUSTRATOR_PATHS에 올바른 일러스트레이터 실행 파일 경로가 포함되어 있는지 확인
- 일러스트레이터가 설치되어 있고 정상 작동하는지 확인

### 프린트 오류

- 기본 프린터가 설정되어 있는지 확인
- 프린터가 켜져 있고 정상 작동하는지 확인

## 로그 확인

로그 파일은 기본적으로 `C:\AutoPrint\logs.txt`에 저장됩니다. 이 파일을 확인하여 시스템 작동 상태와 오류를 확인할 수 있습니다. 

async function getNewToken(oAuth2Client) {
  // 인증 URL 생성
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',  // 항상 refresh_token을 받기 위해
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'  // 브라우저에 코드 직접 표시
  });
  
  console.log('\n==================================================');
  console.log('아래 URL을 복사하여 브라우저에 붙여넣으세요:');
  console.log(authUrl);
  console.log('==================================================\n');
  
  // 인증 코드 입력 받기
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // ... 나머지 코드 ...
} 