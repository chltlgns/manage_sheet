function upDatacount() {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // 데이터 정의
  const upData = sheet.getRange('B12:R12').getValues()[0];
  
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
    '5XL': sheet.getRange('J12').getValue(),
    '5호': sheet.getRange('M12').getValue(),
    '7호': sheet.getRange('N12').getValue(),
    '9호': sheet.getRange('O12').getValue(),
    '11호': sheet.getRange('P12').getValue(),
    '13호': sheet.getRange('Q12').getValue(),
    '15호': sheet.getRange('R12').getValue()
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
  
  // 데이터 정의 - 모든 값을 숫자로 변환하여 저장
  const upData = {
    'XS': Number(sheet.getRange('B12').getValue()) || 0,
    'S': Number(sheet.getRange('C12').getValue()) || 0,
    'M': Number(sheet.getRange('D12').getValue()) || 0,
    'L': Number(sheet.getRange('E12').getValue()) || 0,
    'XL': Number(sheet.getRange('F12').getValue()) || 0,
    '2XL': Number(sheet.getRange('G12').getValue()) || 0,
    '3XL': Number(sheet.getRange('H12').getValue()) || 0,
    '4XL': Number(sheet.getRange('I12').getValue()) || 0,
    '5XL': Number(sheet.getRange('J12').getValue()) || 0,
    '5호': Number(sheet.getRange('M12').getValue()) || 0,
    '7호': Number(sheet.getRange('N12').getValue()) || 0,
    '9호': Number(sheet.getRange('O12').getValue()) || 0,
    '11호': Number(sheet.getRange('P12').getValue()) || 0,
    '13호': Number(sheet.getRange('Q12').getValue()) || 0,
    '15호': Number(sheet.getRange('R12').getValue()) || 0
  };
  
  const downData = sheet.getRange('D61:D1061').getValues();
  
  // 사이즈별 카운트를 저장할 객체
  let sizeCounts = {
    'XS': 0, 'S': 0, 'M': 0, 'L': 0, 'XL': 0,
    '2XL': 0, '3XL': 0, '4XL': 0, '5XL': 0,
    '5호': 0, '7호': 0, '9호': 0, '11호': 0, '13호': 0, '15호': 0
  };
  
  // downData 카운트 로직
  downData.forEach(([size]) => {
    if (!size) return;
    const upperSize = size.toString().toUpperCase().trim();
    
    // 숫자만 입력된 경우 '호'를 붙여서 처리
    if (['5', '7', '9', '11', '13', '15'].includes(upperSize)) {
      sizeCounts[upperSize + '호']++;
      return;
    }
    
    switch (upperSize) {
      case 'XS': sizeCounts['XS']++; break;
      case 'S': sizeCounts['S']++; break;
      case 'M': sizeCounts['M']++; break;
      case 'L': sizeCounts['L']++; break;
      case 'XL': sizeCounts['XL']++; break;
      case '2XL': case 'XXL': sizeCounts['2XL']++; break;
      case '3XL': case 'XXXL': sizeCounts['3XL']++; break;
      case '4XL': case 'XXXXL': sizeCounts['4XL']++; break;
      case '5XL': case 'XXXXXL': sizeCounts['5XL']++; break;
      case '5호': sizeCounts['5호']++; break;
      case '7호': sizeCounts['7호']++; break;
      case '9호': sizeCounts['9호']++; break;
      case '11호': sizeCounts['11호']++; break;
      case '13호': sizeCounts['13호']++; break;
      case '15호': sizeCounts['15호']++; break;
    }
  });
  
  // 비교 로직 수정
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 
                    '5호', '7호', '9호', '11호', '13호', '15호'];
  
  let isMatch = true;
  let totalUpData = 0;
  let totalDownData = 0;
  
  // 전체 수량 계산 수정
  sizeOrder.forEach(size => {
    totalUpData += Number(upData[size]) || 0;
    totalDownData += Number(sizeCounts[size]) || 0;
    
    // 각 사이즈별 비교
    if (upData[size] !== sizeCounts[size]) {
      isMatch = false;
    }
  });
  
  // 디버깅을 위한 로그
  Logger.log('상단 데이터:', upData);
  Logger.log('하단 데이터 카운트:', sizeCounts);
  Logger.log('전체 상단 수량:', totalUpData);
  Logger.log('전체 하단 수량:', totalDownData);
  Logger.log('사이즈 매칭 여부:', isMatch);

  // 사이즈별 수량 비교 메시지 생성
  let compareMessage = '<div style="font-family: Arial; font-size: 12px;">';
  compareMessage += '<b>=== 사이즈별 수량 비교 ===</b><br><br>';
  
  sizeOrder.forEach(size => {
    const upQuantity = upData[size] || 0;
    const downQuantity = sizeCounts[size] || 0;
    const match = upQuantity === downQuantity ? '✓' : '✗';
    const style = upQuantity !== downQuantity ? 'color: red; font-weight: bold;' : '';
    
    compareMessage += `<div style="${style}">${size}: 상단 ${upQuantity}개 / 하단 ${downQuantity}개 ${match}</div>`;
  });
  
  compareMessage += `<br><div>전체 수량: 상단 ${totalUpData}개 / 하단 ${totalDownData}개</div><br>`;

  // 결과 메시지
  let resultMessage = '';
  if (isMatch && totalUpData === totalDownData) {
    resultMessage = '<div>작성이 완료됐습니다</div>';
  } else if (totalUpData === totalDownData) {
    resultMessage = '<div style="color: red; font-weight: bold;">사이즈 한 번 더 확인 부탁드립니다</div>';
  } else {
    resultMessage = '<div style="color: red; font-weight: bold;">수량 및 전체 사이즈를 한 번 더 확인 부탁드립니다</div>';
  }
  
  compareMessage += resultMessage + '</div>';

  // HTML 모달 대화상자 표시
  try {
    const htmlOutput = HtmlService
      .createHtmlOutput(compareMessage)
      .setWidth(400)
      .setHeight(500);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '데이터 확인');
  } catch (error) {
    Browser.msgBox('오류 발생', '메시지 표시 중 오류가 발생했습니다: ' + error.toString(), Browser.Buttons.OK);
  }
}
