#!/usr/bin/env python3
"""
채팅 데이터 삭제 스크립트
루트 디렉토리에서 실행: python clear_chat.py
"""

import sqlite3
import os

# 백엔드 디렉토리의 데이터베이스 경로
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'users.db')

def main():
    """채팅 관련 모든 데이터를 DB에서 삭제"""
    
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # 1. 채팅 메시지 삭제
        cursor.execute('DELETE FROM chat_messages')
        messages_deleted = cursor.rowcount
        
        # 2. 채팅 참가자 삭제
        cursor.execute('DELETE FROM chat_participants')
        participants_deleted = cursor.rowcount
        
        # 3. 채팅방 삭제
        cursor.execute('DELETE FROM chat_rooms')
        rooms_deleted = cursor.rowcount
        
        # 변경사항 저장
        conn.commit()
        conn.close()
        
        total_deleted = messages_deleted + participants_deleted + rooms_deleted
        print(f"채팅 데이터 {total_deleted}개 삭제 완료!")
        
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    main()