#!/usr/bin/env python3
"""
Simple server runner for ZeroMQ Topic Manager
"""

import subprocess
import sys
import os

def main():
    print("🚀 ZeroMQ Topic Manager (Python Edition) 시작 중...")
    print("📡 FastAPI + pycrdt 기반 실시간 협업 서버")
    print("🌐 http://localhost:8000 에서 접속 가능")
    print("-" * 50)
    
    try:
        # uvicorn으로 서버 실행
        cmd = [
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ]
        
        subprocess.run(cmd, check=True)
        
    except KeyboardInterrupt:
        print("\n🛑 서버가 중단되었습니다.")
    except subprocess.CalledProcessError as e:
        print(f"❌ 서버 실행 실패: {e}")
        print("\n💡 해결 방법:")
        print("1. Python 의존성 설치: pip3 install fastapi uvicorn pycrdt")
        print("2. 포트 8000이 사용 중인지 확인")
        print("3. 권한 문제인지 확인")
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")

if __name__ == "__main__":
    main()