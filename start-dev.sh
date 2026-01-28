#!/bin/bash

echo "========================================"
echo "  Stock Analysis Platform - Dev Server"
echo "========================================"
echo ""
echo "Starting Backend and Frontend servers..."
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
echo ""

# 스크립트 디렉토리 경로 저장
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# OS 감지
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - Terminal.app에서 새 탭으로 실행
    echo "Detected macOS - Opening new Terminal windows..."
    
    # Backend 실행
    osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/backend' && echo 'Starting Backend...' && python -m app.main\""
    
    sleep 2
    
    # Frontend 실행
    osascript -e "tell app \"Terminal\" to do script \"cd '$SCRIPT_DIR/frontend' && echo 'Starting Frontend...' && npm run dev\""
    
    echo ""
    echo "========================================"
    echo "  Servers started in new Terminal tabs!"
    echo "========================================"
    echo ""
    echo "- Close the Terminal tabs to stop servers"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - 백그라운드로 실행
    echo "Detected Linux - Starting in background..."
    
    # Backend 실행 (백그라운드)
    cd "$SCRIPT_DIR/backend"
    python -m app.main &
    BACKEND_PID=$!
    cd "$SCRIPT_DIR"
    
    sleep 2
    
    # Frontend 실행 (백그라운드)
    cd "$SCRIPT_DIR/frontend"
    npm run dev &
    FRONTEND_PID=$!
    cd "$SCRIPT_DIR"
    
    echo ""
    echo "========================================"
    echo "  Both servers are running!"
    echo "========================================"
    echo ""
    echo "Backend PID: $BACKEND_PID"
    echo "Frontend PID: $FRONTEND_PID"
    echo ""
    echo "Press Ctrl+C to stop both servers..."
    
    # Ctrl+C 시 두 프로세스 모두 종료
    trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
    
    # 대기
    wait
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi
