#!/bin/bash

echo "🚀 ZeroMQ Topic Manager 서버들을 시작합니다..."

# Python 가상환경 활성화
source venv/bin/activate

# 백그라운드에서 Python 서버 시작
echo "📡 Python 서버 시작 중... (포트 8000)"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
PYTHON_PID=$!

# 잠시 대기
sleep 2

# 백그라운드에서 Node.js 서버 시작
echo "🌐 Node.js 서버 시작 중... (포트 3000)"
node server.js &
NODE_PID=$!

echo "✅ 서버들이 시작되었습니다!"
echo "📱 웹 인터페이스: http://localhost:3000"
echo "🔧 API 서버: http://localhost:8000"
echo ""
echo "서버를 중지하려면: Ctrl+C"

# 프로세스 종료 함수
cleanup() {
    echo ""
    echo "🛑 서버들을 종료합니다..."
    kill $PYTHON_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    exit 0
}

# Ctrl+C 시그널 처리
trap cleanup SIGINT

# 서버 상태 모니터링
while true; do
    sleep 5
    if ! kill -0 $PYTHON_PID 2>/dev/null; then
        echo "❌ Python 서버가 종료되었습니다."
        break
    fi
    if ! kill -0 $NODE_PID 2>/dev/null; then
        echo "❌ Node.js 서버가 종료되었습니다."
        break
    fi
done

cleanup