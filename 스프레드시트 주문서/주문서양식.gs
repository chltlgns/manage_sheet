function upDatacount() {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // 데이터 정의
  const upData = sheet.getRange('B12:J12').getValues()[0];
  
  // 사이즈별 데이터 가져오기
  const sizeData = {
    'XS': sheet.getRange('B12').getValue(),
    'S': sheet.getRange('C12').getValue(),
    'M': sheet.getRange('D12').getValue(),
    'L': sheet.getRange('E12').getValue(),
    'XL': sheet.getRange('F12').getValue(),
    '2XL': sheet.getRange('G12').getValue(),
    '3XL': sheet.getRange('H12').getValue(),
    '4XL': sheet.getRange('I12').getValue(),
    '5XL': sheet.getRange('J12').getValue()
  };
  
  // 결과를 저장할 배열
  let results = [];
  
  // 각 사이즈별 데이터 확인
  for (let size in sizeData) {
    const quantity = sizeData[size];
    
    // 수량이 0이거나 비어있는지 확인
    if (!quantity || quantity === 0) {
      results.push(`${size} 사이즈: 데이터 없음`);
    } else {
      results.push(`${size} 사이즈: ${quantity}개`);
    }
  }
}

function downdatacount() {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // 데이터 정의
  const upData = sheet.getRange('B12:J12').getValues()[0];
  const downData = sheet.getRange('D61:D1061').getValues();
  
  // 사이즈별 카운트를 저장할 객체
  let sizeCounts = {
    'XS': 0,
    'S': 0,
    'M': 0,
    'L': 0,
    'XL': 0,
    '2XL': 0,
    '3XL': 0,
    '4XL': 0,
    '5XL': 0
  };
  
  // downData 각 셀을 순회하면서 사이즈 카운트
  downData.forEach(([size]) => {
    if (!size) return;
    
    const upperSize = size.toString().toUpperCase().trim();
    
    switch (upperSize) {
      case 'XS':
        sizeCounts['XS']++;
        break;
      case 'S':
        sizeCounts['S']++;
        break;
      case 'M':
        sizeCounts['M']++;
        break;
      case 'L':
        sizeCounts['L']++;
        break;
      case 'XL':
        sizeCounts['XL']++;
        break;
      case '2XL':
      case 'XXL':
        sizeCounts['2XL']++;
        break;
      case '3XL':
      case 'XXXL':
        sizeCounts['3XL']++;
        break;
      case '4XL':
      case 'XXXXL':
        sizeCounts['4XL']++;
        break;
      case '5XL':
      case 'XXXXXL':
        sizeCounts['5XL']++;
        break;
    }
  });
  
  // 수정된 일치 여부 확인 로직
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  let isMatch = true;
  let totalUpData = 0;
  let totalDownData = 0;
  
  // 전체 수량 계산
  upData.forEach(count => totalUpData += (count || 0));
  Object.values(sizeCounts).forEach(count => totalDownData += count);
  
  // 사이즈별 비교
  for (let i = 0; i < sizeOrder.length; i++) {
    const upValue = upData[i] || 0;
    const downValue = sizeCounts[sizeOrder[i]];
    
    if (upValue !== downValue && (upValue !== 0 || downValue !== 0)) {
      isMatch = false;
      break;
    }
  }
  
  // 최종 결과 메시지만 표시
  if (isMatch && totalUpData === totalDownData) {
    Browser.msgBox('데이터 확인', '작성이 완료됐습니다', Browser.Buttons.OK);
  } else if (totalUpData === totalDownData) {
    Browser.msgBox('데이터 확인', '사이즈 한 번 더 확인 부탁드립니다', Browser.Buttons.OK);
  } else {
    Browser.msgBox('데이터 확인', '수량 및 전체 수량을 한 번 더 확인 부탁드립니다', Browser.Buttons.OK);
  }
}
