import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import openpyxl
from openpyxl.styles import Border, Side
import ctypes
import sys
import traceback
import win32file
import win32con

WATCH_FOLDER = "D:/과잠/캠퍼스룩"

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def run_as_admin():
    ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv), None, 1)

def set_file_permissions(file_path):
    try:
        os.chmod(file_path, 0o666)  # 읽기/쓰기 권한 부여
        print(f"{file_path}의 권한이 변경되었습니다.")
    except Exception as e:
        print(f"권한 변경 중 오류 발생: {str(e)}")

def is_file_locked(file_path):
    try:
        vhandle = win32file.CreateFile(
            file_path, 
            win32file.GENERIC_READ, 
            0,  # 공유 모드 없음
            None, 
            win32con.OPEN_EXISTING, 
            win32file.FILE_ATTRIBUTE_NORMAL, 
            None
        )
    except win32file.error as e:
        if e.winerror == 32:  # ERROR_SHARING_VIOLATION
            return True
        else:
            raise
    else:
        win32file.CloseHandle(vhandle)
    return False

def wait_for_file_unlock(file_path, check_interval=1):
    print(f"파일 {file_path}이(가) 열려 있습니다. 닫힐 때까지 대기 중...")
    while is_file_locked(file_path):
        time.sleep(check_interval)
    print(f"파일 {file_path}이(가) 닫혔습니다.")

class ExcelHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        file_name = os.path.basename(event.src_path).lower()
        if (file_name.endswith('.xlsx') and 
            not file_name.startswith('이니셜_') and 
            not file_name.startswith('~$')):
            self.process_order_file(event.src_path)

    def process_order_file(self, file_path):
        print(f"새 주문서 파일 감지: {file_path}")
        
        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                set_file_permissions(file_path)
                
                order_workbook = openpyxl.load_workbook(file_path)
                
                print(f"워크북의 시트들: {order_workbook.sheetnames}")
                
                if any(sheet.lower() == '일반' for sheet in order_workbook.sheetnames):
                    일반_sheet = next(sheet for sheet in order_workbook.sheetnames if sheet.lower() == '일반')
                    일반_sheet = order_workbook[일반_sheet]
                    
                    initial_workbook = openpyxl.Workbook()
                    initial_sheet = initial_workbook.active
                    initial_sheet.title = '이니셜'
                    
                    original_name = os.path.splitext(os.path.basename(file_path))[0]
                    modified_name = original_name.replace("주문서", "").strip()
                    initial_file_name = f"이니셜_{modified_name}"
                    self.copy_일반_to_initial(일반_sheet, initial_sheet, initial_file_name)
                    
                    output_file = os.path.join(os.path.dirname(file_path), f"{initial_file_name}.xlsx")
                    initial_workbook.save(output_file)
                    print(f"이니셜 파일이 생성되었습니다: {output_file}")
                    break
                else:
                    print("일반 시트를 찾을 수 없습니다.")
                    break
            
            except PermissionError:
                if attempt < max_attempts - 1:
                    print(f"파일 접근 실패. {5-attempt}초 후 재시도...")
                    time.sleep(5)
                else:
                    print(f"파일 처리 실패: {file_path}")
            except Exception as e:
                print(f"파일 처리 중 오류 발생: {str(e)}")
                print(f"오류 타입: {type(e).__name__}")
                print(f"상세 오류 정보:\n{traceback.format_exc()}")
                break

    def copy_일반_to_initial(self, 일반_sheet, initial_sheet, file_name):
        initial_sheet['A1'] = file_name

        headers = ['이름', '이니셜폰트', '사이즈', '이니셜문구', '학번', '연락처', '주소', '함수', '비고']
        for col, header in enumerate(headers, start=1):
            initial_sheet.cell(2, col, header)

        last_row = min(1900, 일반_sheet.max_row)
        
        for row in initial_sheet['A3:I1900']:
            for cell in row:
                cell.value = None
        
        column_widths = [12, 12, 12, 15, 12, 0, 0, 15, 15]
        max_lengths = [0, 0]

        for i in range(59, last_row + 1):
            j = i - 56
            initial_sheet.cell(j, 1).value = 일반_sheet.cell(i, 2).value
            initial_sheet.cell(j, 2).value = 일반_sheet.cell(i, 3).value
            initial_sheet.cell(j, 3).value = 일반_sheet.cell(i, 4).value
            initial_sheet.cell(j, 4).value = 일반_sheet.cell(i, 5).value
            initial_sheet.cell(j, 5).value = 일반_sheet.cell(i, 8).value
            initial_sheet.cell(j, 6).value = 일반_sheet.cell(i, 9).value
            initial_sheet.cell(j, 7).value = 일반_sheet.cell(i, 11).value
            initial_sheet.cell(j, 8).value = f'=UPPER(TRIM(C{j}))'
            initial_sheet.cell(j, 9).value = 일반_sheet.cell(i, 13).value
            
            initial_font = initial_sheet.cell(j, 2).value
            if initial_font:
                initial_font_lower = initial_font.lower().strip()
                if "필기체" in initial_font_lower or "필기" in initial_font_lower:
                    initial_sheet.cell(j, 4).font = openpyxl.styles.Font(name="Brush Script MT", size=11)
            
            max_lengths[0] = max(max_lengths[0], len(str(initial_sheet.cell(j, 6).value or '')))
            max_lengths[1] = max(max_lengths[1], len(str(initial_sheet.cell(j, 7).value or '')))
        
        for row in range(j + 1, 1901):
            initial_sheet.cell(row, 8).value = f'=UPPER(TRIM(C{row}))'
        
        for i, width in enumerate(column_widths, start=1):
            col_letter = openpyxl.utils.get_column_letter(i)
            if i in [6, 7]:
                max_length = max_lengths[i-6]
                initial_sheet.column_dimensions[col_letter].width = max(width, min(max_length + 2, 50))
            else:
                initial_sheet.column_dimensions[col_letter].width = width
        
        initial_sheet.auto_filter.ref = f"A2:I1900"
        
        size_labels = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '총수량']
        for i, label in enumerate(size_labels):
            initial_sheet.cell(10, 13+i, label)
        
        formulas = [
            '=COUNTIF($H$3:$H$899,"XS")',
            '=COUNTIF($H$3:$H$900,"S")',
            '=COUNTIF($H$3:$H$901,"M")',
            '=COUNTIF($H$3:$H$902,"L")',
            '=COUNTIF($H$3:$H$903,"XL")',
            '=COUNTIF($H$3:$H$904, "2XL") + COUNTIF($H$3:$H$904, "XXL")',
            '=COUNTIF($H$3:$H$904, "3XL") + COUNTIF($H$3:$H$904, "XXXL")',
            '=COUNTIF($H$3:$H$904, "4XL") + COUNTIF($H$3:$H$904, "XXXXL")',
            '=COUNTIF($H$3:$H$904, "5XL") + COUNTIF($H$3:$H$904, "XXXXXL")',
            '=SUM(M11:U11)'
        ]
        for i, formula in enumerate(formulas):
            initial_sheet.cell(11, 13+i, formula)

        thin_border = Border(left=Side(style='thin'), 
                             right=Side(style='thin'), 
                             top=Side(style='thin'), 
                             bottom=Side(style='thin'))

        for row in initial_sheet['M10:V11']:
            for cell in row:
                cell.border = thin_border
        
        print(f"데이터가 성공적으로 복사되었습니다. 복사된 행 수: {j - 2}")

    def on_modified(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith('.xlsx') and '주문서' in event.src_path:
            print(f"주문서 파일 수정 감지: {event.src_path}")
            initial_file_path = self.find_related_initial_file(event.src_path)
            if initial_file_path:
                if is_file_locked(initial_file_path):
                    wait_for_file_unlock(initial_file_path)
                self.update_initial_file(event.src_path, initial_file_path)
            else:
                print("관련 이니셜 파일을 찾을 수 없습니다.")

    def find_related_initial_file(self, order_file_path):
        # 주문서 파일의 디렉토리와 파일 이름 가져오기
        dir_path = os.path.dirname(order_file_path)
        file_name = os.path.basename(order_file_path)
        
        # 이니셜 파일 이름 생성
        original_name = os.path.splitext(file_name)[0]
        modified_name = original_name.replace("주문서", "").strip()
        initial_file_name = f"이니셜_{modified_name}.xlsx"
        
        # 이니셜 파일의 전체 경로
        initial_file_path = os.path.join(dir_path, initial_file_name)
        
        if os.path.exists(initial_file_path):
            return initial_file_path
        else:
            print(f"이니셜 파일을 찾을 수 없습니다: {initial_file_path}")
            return None

    def update_initial_file(self, order_file_path, initial_file_path):
        try:
            # 주문서 파일 열기
            order_workbook = openpyxl.load_workbook(order_file_path)
            일반_sheet = order_workbook['일반']  # '일반' 시트 가져오기

            # 이니셜 파일 열기
            initial_workbook = openpyxl.load_workbook(initial_file_path)
            initial_sheet = initial_workbook.active

            # 마지막 행 찾기
            last_row = 일반_sheet.max_row

            # B59부터 시작하여 이니셜 파일 업데이트
            for i in range(59, last_row + 1):
                j = i - 56  # 이니셜 파일의 행 번호

                # 각 열에 대해 데이터 업데이트
                initial_sheet.cell(j, 1).value = 일반_sheet.cell(i, 2).value
                initial_sheet.cell(j, 2).value = 일반_sheet.cell(i, 3).value
                initial_sheet.cell(j, 3).value = 일반_sheet.cell(i, 4).value
                initial_sheet.cell(j, 4).value = 일반_sheet.cell(i, 5).value
                initial_sheet.cell(j, 5).value = 일반_sheet.cell(i, 8).value
                initial_sheet.cell(j, 6).value = 일반_sheet.cell(i, 9).value
                initial_sheet.cell(j, 7).value = 일반_sheet.cell(i, 11).value
                # 8번째 열은 수식이므로 그대로 둡니다
                initial_sheet.cell(j, 9).value = 일반_sheet.cell(i, 13).value

                # 글씨체 업데이트
                initial_font = initial_sheet.cell(j, 2).value
                if initial_font:
                    initial_font_lower = initial_font.lower().strip()
                    if "필기체" in initial_font_lower or "필기" in initial_font_lower:
                        initial_sheet.cell(j, 4).font = openpyxl.styles.Font(name="Brush Script MT", size=11)
                    else:
                        initial_sheet.cell(j, 4).font = openpyxl.styles.Font(name="Arial", size=11)  # 기본 폰트로 설정

            # 변경사항 저장
            initial_workbook.save(initial_file_path)
            print(f"이니셜 파일 업데이트 완료: {initial_file_path}")

        except Exception as e:
            print(f"이니셜 파일 업데이트 중 오류 발생: {str(e)}")

if __name__ == "__main__":
    if not is_admin():
        print("관리자 권한으로 실행합니다...")
        run_as_admin()
    else:
        event_handler = ExcelHandler()
        observer = Observer()
        observer.schedule(event_handler, WATCH_FOLDER, recursive=True)
        observer.start()

        print(f"{WATCH_FOLDER} 폴더와 모든 하위 폴더를 감시하고 있습니다...")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
        observer.join()