/**
 * User WebSocket Client for Python backend
 * Socket.IO 대신 WebSocket 사용
 */
class UserWebSocketClient {
    constructor() {
        try {
            this.socket = null;
            this.userId = this.generateUserId();
            this.userName = `사용자_${Math.floor(Math.random() * 1000)}`;
            this.userColor = this.generateUserColor();
            this.isConnected = false;
            
            this.connect();
        } catch (error) {
            console.error('UserWebSocketClient constructor error:', error);
            // 기본값으로 초기화
            this.socket = null;
            this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
            this.userName = `사용자_${Math.floor(Math.random() * 1000)}`;
            this.userColor = '#007bff';
            this.isConnected = false;
        }
    }
    
    connect() {
        try {
            // 연결 상태를 '연결 중'으로 설정
            this.updateConnectionStatus('connecting');
            
            // Python 서버의 사용자 WebSocket에 연결
            this.socket = new WebSocket(`ws://localhost:8000/ws/users/${this.userId}`);
            
            this.socket.onopen = () => {
                console.log('User WebSocket 연결됨');
                this.isConnected = true;
                
                // 사용자 입장 알림
                this.emit('user-joined', {
                    userId: this.userId,
                    userName: this.userName,
                    userColor: this.userColor
                });
                
                this.updateConnectionStatus('connected');
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('메시지 파싱 오류:', error);
                }
            };
            
            this.socket.onclose = () => {
                console.log('User WebSocket 연결 종료');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                
                // 재연결 시도 (최대 5회)
                if (!this.reconnectAttempts) {
                    this.reconnectAttempts = 0;
                }
                
                if (this.reconnectAttempts < 5) {
                    this.reconnectAttempts++;
                    setTimeout(() => {
                        if (!this.isConnected) {
                            console.log(`재연결 시도 ${this.reconnectAttempts}/5`);
                            this.connect();
                        }
                    }, 3000);
                } else {
                    console.log('재연결 시도 횟수 초과');
                    this.updateConnectionStatus('error');
                }
            };
            
            this.socket.onerror = (error) => {
                console.error('User WebSocket 오류:', error);
                this.updateConnectionStatus('error');
            };
            
        } catch (error) {
            console.error('WebSocket 연결 실패:', error);
            this.updateConnectionStatus('error');
        }
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'user_joined':
                this.handleUserJoined(data);
                break;
            case 'user_left':
                this.handleUserLeft(data);
                break;
            case 'cursor_position':
                this.handleCursorPosition(data);
                break;
            default:
                console.log('알 수 없는 메시지 타입:', data.type);
        }
    }
    
    handleUserJoined(data) {
        console.log('사용자 입장:', data);
        
        // 사용자 목록 업데이트
        this.updateUserCount(data.user_count);
        
        // 사용자 목록에 추가
        this.addUserToList(data);
        
        // 알림 표시
        if (window.AppUtils) {
            window.AppUtils.showInfoMessage(`${data.user_id}님이 입장했습니다.`);
        }
    }
    
    handleUserLeft(data) {
        console.log('사용자 퇴장:', data);
        
        // 사용자 목록 업데이트
        this.updateUserCount(data.user_count);
        
        // 사용자 목록에서 제거
        this.removeUserFromList(data.user_id);
        
        // 알림 표시
        if (window.AppUtils) {
            window.AppUtils.showInfoMessage(`${data.user_id}님이 퇴장했습니다.`);
        }
    }
    
    handleCursorPosition(data) {
        // 다른 사용자의 커서 위치 표시
        this.updateUserCursor(data.user_id, data.position);
    }
    
    emit(type, data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = {
                type: type,
                ...data
            };
            this.socket.send(JSON.stringify(message));
        }
    }
    
    updateUserCount(count) {
        const userCountEl = document.getElementById('userCount');
        if (userCountEl) {
            userCountEl.textContent = count || 1;
        }
    }
    
    addUserToList(userData) {
        const userList = document.getElementById('userList');
        if (!userList) return;
        
        // 중복 확인
        const existingUser = userList.querySelector(`[data-user-id="${userData.user_id}"]`);
        if (existingUser) return;
        
        const li = document.createElement('li');
        li.setAttribute('data-user-id', userData.user_id);
        li.innerHTML = `
            <span class="dropdown-item d-flex align-items-center">
                <span class="badge me-2" style="background-color: ${userData.userColor || '#007bff'}; width: 12px; height: 12px; border-radius: 50%;"></span>
                ${userData.userName || userData.user_id}
            </span>
        `;
        
        userList.appendChild(li);
    }
    
    removeUserFromList(userId) {
        const userList = document.getElementById('userList');
        if (!userList) return;
        
        const userElement = userList.querySelector(`[data-user-id="${userId}"]`);
        if (userElement) {
            userElement.remove();
        }
    }
    
    updateUserCursor(userId, position) {
        // 사용자 커서 위치 업데이트 로직
        // 실제 구현은 UI 요구사항에 따라 달라질 수 있음
        console.log(`사용자 ${userId} 커서 위치:`, position);
    }
    
    updateConnectionStatus(status) {
        const statusEl = document.querySelector('#connectionStatus .alert');
        if (!statusEl) return;
        
        const icon = statusEl.querySelector('i');
        const text = statusEl.querySelector('span');
        
        statusEl.className = 'alert d-flex align-items-center';
        
        switch (status) {
            case 'connected':
                statusEl.classList.add('alert-success');
                if (icon) icon.className = 'fas fa-wifi me-2';
                if (text) text.textContent = '실시간 협업 연결됨';
                break;
            case 'connecting':
                statusEl.classList.add('alert-warning');
                if (icon) icon.className = 'fas fa-spinner fa-spin me-2';
                if (text) text.textContent = '실시간 협업 연결 중...';
                break;
            case 'disconnected':
                statusEl.classList.add('alert-warning');
                if (icon) icon.className = 'fas fa-exclamation-triangle me-2';
                if (text) text.textContent = '실시간 협업 연결 끊김 (재연결 시도 중)';
                break;
            case 'error':
                statusEl.classList.add('alert-info');
                if (icon) icon.className = 'fas fa-info-circle me-2';
                if (text) text.textContent = '오프라인 모드 (기본 기능 사용 가능)';
                break;
        }
    }
    
    sendCursorPosition(position) {
        this.emit('cursor_position', { position });
    }
    
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateUserColor() {
        const colors = [
            '#007bff', '#28a745', '#dc3545', '#ffc107',
            '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
    }
}

// 전역 사용자 WebSocket 클라이언트
window.userWebSocketClient = null;