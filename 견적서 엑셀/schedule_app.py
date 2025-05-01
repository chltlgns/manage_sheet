import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
import json
import os

class ScheduleApp:
    def __init__(self, root):
        self.root = root
        self.root.title("스케줄 관리")
        self.root.geometry("600x400")
        
        # 데이터 저장 파일 경로
        self.data_file = "schedule_data.json"
        self.schedules = self.load_data()
        
        self.create_widgets()
        
    def create_widgets(self):
        # 입력 프레임
        input_frame = ttk.LabelFrame(self.root, text="일정 입력", padding="10")
        input_frame.pack(fill="x", padx=10, pady=5)
        
        # 날짜 입력
        ttk.Label(input_frame, text="날짜:").grid(row=0, column=0, padx=5, pady=5)
        self.date_entry = ttk.Entry(input_frame)
        self.date_entry.grid(row=0, column=1, padx=5, pady=5)
        self.date_entry.insert(0, datetime.now().strftime("%Y-%m-%d"))
        
        # 시간 입력
        ttk.Label(input_frame, text="시간:").grid(row=0, column=2, padx=5, pady=5)
        self.time_entry = ttk.Entry(input_frame)
        self.time_entry.grid(row=0, column=3, padx=5, pady=5)
        self.time_entry.insert(0, datetime.now().strftime("%H:%M"))
        
        # 일정 내용 입력
        ttk.Label(input_frame, text="일정:").grid(row=1, column=0, padx=5, pady=5)
        self.schedule_entry = ttk.Entry(input_frame, width=50)
        self.schedule_entry.grid(row=1, column=1, columnspan=3, padx=5, pady=5)
        
        # 추가 버튼
        ttk.Button(input_frame, text="일정 추가", command=self.add_schedule).grid(row=2, column=0, columnspan=4, pady=10)
        
        # 일정 목록
        list_frame = ttk.LabelFrame(self.root, text="일정 목록", padding="10")
        list_frame.pack(fill="both", expand=True, padx=10, pady=5)
        
        # 트리뷰 생성
        columns = ("날짜", "시간", "일정")
        self.tree = ttk.Treeview(list_frame, columns=columns, show="headings")
        
        # 컬럼 설정
        for col in columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=100)
        
        self.tree.pack(fill="both", expand=True)
        
        # 삭제 버튼
        ttk.Button(list_frame, text="선택 일정 삭제", command=self.delete_schedule).pack(pady=5)
        
        # 일정 목록 표시
        self.update_schedule_list()
        
    def add_schedule(self):
        date = self.date_entry.get()
        time = self.time_entry.get()
        schedule = self.schedule_entry.get()
        
        if not all([date, time, schedule]):
            messagebox.showerror("오류", "모든 필드를 입력해주세요.")
            return
            
        # 날짜와 시간 형식 검증
        try:
            datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
        except ValueError:
            messagebox.showerror("오류", "올바른 날짜와 시간 형식을 입력해주세요.")
            return
            
        # 일정 추가
        self.schedules.append({
            "date": date,
            "time": time,
            "schedule": schedule
        })
        
        # 데이터 저장
        self.save_data()
        
        # 입력 필드 초기화
        self.schedule_entry.delete(0, tk.END)
        
        # 목록 업데이트
        self.update_schedule_list()
        
        messagebox.showinfo("성공", "일정이 추가되었습니다.")
        
    def delete_schedule(self):
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("경고", "삭제할 일정을 선택해주세요.")
            return
            
        if messagebox.askyesno("확인", "선택한 일정을 삭제하시겠습니까?"):
            index = self.tree.index(selected_item[0])
            del self.schedules[index]
            self.save_data()
            self.update_schedule_list()
            messagebox.showinfo("성공", "일정이 삭제되었습니다.")
            
    def update_schedule_list(self):
        # 기존 항목 삭제
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        # 일정 정렬
        sorted_schedules = sorted(self.schedules, key=lambda x: (x["date"], x["time"]))
        
        # 일정 목록 표시
        for schedule in sorted_schedules:
            self.tree.insert("", "end", values=(
                schedule["date"],
                schedule["time"],
                schedule["schedule"]
            ))
            
    def load_data(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                return []
        return []
        
    def save_data(self):
        with open(self.data_file, "w", encoding="utf-8") as f:
            json.dump(self.schedules, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    root = tk.Tk()
    app = ScheduleApp(root)
    root.mainloop() 