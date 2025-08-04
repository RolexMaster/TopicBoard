/**
 * 통합 협업 관리자 - Python 서버만 사용
 */
class CollaborationManager {
    constructor() {
        this.ydoc = new Y.Doc();
        this.provider = null;
        this.xmlData = null;
        this.awareness = null;
        this.users = new Map();
        this.currentUser = {
            id: this.generateUserId(),
            name: `사용자_${Math.floor(Math.random() * 1000)}`,
            color: this.generateUserColor()
        };
        
        this.init();
    }

    /**
     * 협업 시스템 초기화
     */
    init() {
        try {
            // Python 서버의 Yjs WebSocket에 연결
            this.provider = new Y.WebsocketProvider('ws://localhost:8000/yjs-websocket', 'zeromq-topic-manager', this.ydoc);
            
            // 공유 XML 데이터 타입 가져오기
            this.xmlData = this.ydoc.getXmlElement('applications');
            
            // 사용자 존재감을 위한 awareness 설정
            this.awareness = this.provider.awareness;
            this.setupAwareness();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 빈 경우 초기 XML 구조 설정
            this.initializeXMLStructure();
            
            console.log('협업 시스템 초기화 완료');
            this.updateConnectionStatus('connected');
            
        } catch (error) {
            console.error('협업 초기화 실패:', error);
            this.updateConnectionStatus('error');
        }
    }

    /**
     * 사용자 존재감 및 presence 설정
     */
    setupAwareness() {
        this.awareness.setLocalStateField('user', this.currentUser);
        
        this.awareness.on('change', () => {
            this.updateUserList();
        });
        
        this.awareness.on('update', ({ added, updated, removed }) => {
            this.handleAwarenessUpdate(added, updated, removed);
        });
    }

    /**
     * 실시간 업데이트를 위한 이벤트 리스너 설정
     */
    setupEventListeners() {
        // XML 구조 변경 감지
        this.xmlData.observe((event) => {
            this.handleXMLChange(event);
        });

        // 프로바이더 연결 상태 변경 감지
        this.provider.on('status', (event) => {
            console.log('프로바이더 상태:', event.status);
            this.updateConnectionStatus(event.status);
        });

        this.provider.on('connection-error', (error) => {
            console.error('연결 오류:', error);
            this.updateConnectionStatus('error');
        });
    }

    /**
     * 빈 경우 초기 XML 구조 설정
     */
    initializeXMLStructure() {
        if (this.xmlData.length === 0) {
            // 기본 XML 구조 생성
            const applications = new Y.XmlElement('Applications');
            applications.setAttribute('xmlns', 'http://zeromq-topic-manager/schema');
            applications.setAttribute('version', '1.0');
            
            this.xmlData.push([applications]);
            console.log('기본 XML 구조 초기화됨');
        }
    }

    /**
     * XML 변경사항 처리
     */
    handleXMLChange(event) {
        console.log('XML 변경 감지:', event);
        
        // XML 미리보기 업데이트
        this.updateXMLPreview();
        
        // 트리 구조 업데이트 이벤트 발생
        $(document).trigger('xml-structure-changed', {
            structure: this.getXMLStructure()
        });
    }

    /**
     * 사용자 존재감 업데이트 처리
     */
    handleAwarenessUpdate(added, updated, removed) {
        console.log('사용자 존재감 업데이트:', { added, updated, removed });
        
        // 사용자 목록 업데이트
        this.updateUserList();
        
        // 원격 변경사항 하이라이트
        this.highlightRemoteChanges(event);
    }

    /**
     * XML에 응용프로그램 추가
     */
    addApplication(name, description = '') {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                throw new Error('Applications 루트를 찾을 수 없음');
            }

            const application = new Y.XmlElement('Application');
            application.setAttribute('name', name);
            application.setAttribute('description', description);

            applications.push([application]);

            console.log(`응용프로그램 추가됨: ${name}`);
            return true;
        } catch (error) {
            console.error('응용프로그램 추가 실패:', error);
            return false;
        }
    }

    /**
     * 응용프로그램에 토픽 추가
     */
    addTopic(appName, topicName, proto, direction, description = '') {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                throw new Error('Applications 루트를 찾을 수 없음');
            }

            // 응용프로그램 찾기
            let targetApp = null;
            for (let i = 0; i < applications.length; i++) {
                const app = applications.get(i);
                if (app.getAttribute('name') === appName) {
                    targetApp = app;
                    break;
                }
            }

            if (!targetApp) {
                throw new Error(`응용프로그램 ${appName}을 찾을 수 없음`);
            }

            // 토픽 생성
            const topic = new Y.XmlElement('Topic');
            topic.setAttribute('name', topicName);
            topic.setAttribute('proto', proto);
            topic.setAttribute('direction', direction);
            topic.setAttribute('description', description);

            targetApp.push([topic]);

            console.log(`토픽 ${topicName}을 응용프로그램 ${appName}에 추가됨`);
            return true;
        } catch (error) {
            console.error('토픽 추가 실패:', error);
            return false;
        }
    }

    /**
     * 응용프로그램 제거
     */
    removeApplication(appName) {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                throw new Error('Applications 루트를 찾을 수 없음');
            }

            for (let i = 0; i < applications.length; i++) {
                const app = applications.get(i);
                if (app.getAttribute('name') === appName) {
                    applications.delete(i, 1);
                    console.log(`응용프로그램 제거됨: ${appName}`);
                    return true;
                }
            }

            console.error(`응용프로그램 ${appName}을 찾을 수 없음`);
            return false;
        } catch (error) {
            console.error('응용프로그램 제거 실패:', error);
            return false;
        }
    }

    /**
     * 응용프로그램에서 토픽 제거
     */
    removeTopic(appName, topicName) {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                throw new Error('Applications 루트를 찾을 수 없음');
            }

            // 응용프로그램 찾기
            for (let i = 0; i < applications.length; i++) {
                const app = applications.get(i);
                if (app.getAttribute('name') === appName) {
                    // 토픽 찾기
                    for (let j = 0; j < app.length; j++) {
                        const topic = app.get(j);
                        if (topic.getAttribute('name') === topicName) {
                            app.delete(j, 1);
                            console.log(`토픽 ${topicName}을 응용프로그램 ${appName}에서 제거됨`);
                            return true;
                        }
                    }
                    break;
                }
            }

            console.error(`토픽 ${topicName}을 찾을 수 없음`);
            return false;
        } catch (error) {
            console.error('토픽 제거 실패:', error);
            return false;
        }
    }

    /**
     * 응용프로그램 속성 업데이트
     */
    updateApplication(appName, attributes) {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                throw new Error('Applications 루트를 찾을 수 없음');
            }

            for (let i = 0; i < applications.length; i++) {
                const app = applications.get(i);
                if (app.getAttribute('name') === appName) {
                    for (const [key, value] of Object.entries(attributes)) {
                        app.setAttribute(key, value);
                    }
                    console.log(`응용프로그램 ${appName} 업데이트됨:`, attributes);
                    return true;
                }
            }

            console.error(`응용프로그램 ${appName}을 찾을 수 없음`);
            return false;
        } catch (error) {
            console.error('응용프로그램 업데이트 실패:', error);
            return false;
        }
    }

    /**
     * 토픽 속성 업데이트
     */
    updateTopic(appName, topicName, attributes) {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                throw new Error('Applications 루트를 찾을 수 없음');
            }

            // 응용프로그램 찾기
            for (let i = 0; i < applications.length; i++) {
                const app = applications.get(i);
                if (app.getAttribute('name') === appName) {
                    // 토픽 찾기
                    for (let j = 0; j < app.length; j++) {
                        const topic = app.get(j);
                        if (topic.getAttribute('name') === topicName) {
                            for (const [key, value] of Object.entries(attributes)) {
                                topic.setAttribute(key, value);
                            }
                            console.log(`토픽 ${topicName} 업데이트됨:`, attributes);
                            return true;
                        }
                    }
                    break;
                }
            }

            console.error(`토픽 ${topicName}을 찾을 수 없음`);
            return false;
        } catch (error) {
            console.error('토픽 업데이트 실패:', error);
            return false;
        }
    }

    /**
     * 현재 XML 구조 가져오기
     */
    getXMLStructure() {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                return {
                    Applications: {
                        '@xmlns': 'http://zeromq-topic-manager/schema',
                        '@version': '1.0',
                        Application: []
                    }
                };
            }

            const result = {
                Applications: {
                    '@xmlns': applications.getAttribute('xmlns') || 'http://zeromq-topic-manager/schema',
                    '@version': applications.getAttribute('version') || '1.0',
                    Application: []
                }
            };

            for (let i = 0; i < applications.length; i++) {
                const app = applications.get(i);
                const appData = {
                    '@name': app.getAttribute('name'),
                    '@description': app.getAttribute('description') || '',
                    Topic: []
                };

                for (let j = 0; j < app.length; j++) {
                    const topic = app.get(j);
                    const topicData = {
                        '@name': topic.getAttribute('name'),
                        '@proto': topic.getAttribute('proto'),
                        '@direction': topic.getAttribute('direction'),
                        '@description': topic.getAttribute('description') || ''
                    };
                    appData.Topic.push(topicData);
                }

                result.Applications.Application.push(appData);
            }

            return result;
        } catch (error) {
            console.error('XML 구조 가져오기 실패:', error);
            return {
                Applications: {
                    '@xmlns': 'http://zeromq-topic-manager/schema',
                    '@version': '1.0',
                    Application: []
                }
            };
        }
    }

    /**
     * XML 미리보기 업데이트
     */
    updateXMLPreview() {
        try {
            const structure = this.getXMLStructure();
            const xmlString = this.objectToXML(structure);
            
            $('#xmlPreview code').text(xmlString);
        } catch (error) {
            console.error('XML 미리보기 업데이트 실패:', error);
        }
    }

    /**
     * 객체를 XML 문자열로 변환
     */
    objectToXML(obj) {
        function serialize(obj, indent = '') {
            let result = '';
            
            for (const [key, value] of Object.entries(obj)) {
                if (key.startsWith('@')) {
                    // 속성은 건너뛰기 (이미 요소에 포함됨)
                    continue;
                }
                
                if (Array.isArray(value)) {
                    // 배열 처리
                    for (const item of value) {
                        result += serialize(item, indent + '  ');
                    }
                } else if (typeof value === 'object' && value !== null) {
                    // 객체 처리
                    const attrs = Object.entries(obj)
                        .filter(([k, v]) => k.startsWith('@'))
                        .map(([k, v]) => `${k.substring(1)}="${v}"`)
                        .join(' ');
                    
                    const tagName = key;
                    const hasChildren = Object.keys(value).some(k => !k.startsWith('@'));
                    
                    if (hasChildren) {
                        result += `${indent}<${tagName}${attrs ? ' ' + attrs : ''}>\n`;
                        result += serialize(value, indent + '  ');
                        result += `${indent}</${tagName}>\n`;
                    } else {
                        result += `${indent}<${tagName}${attrs ? ' ' + attrs : ''} />\n`;
                    }
                }
            }
            
            return result;
        }
        
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + serialize(obj);
    }

    /**
     * 사용자 목록 업데이트
     */
    updateUserList() {
        try {
            const states = this.awareness.getStates();
            const userList = $('#userList');
            const userCount = $('#userCount');
            
            // 기존 사용자 목록 제거
            userList.find('li:not(:first)').remove();
            
            // 현재 사용자 수 업데이트
            userCount.text(states.size);
            
            // 사용자 목록 추가
            states.forEach((state, clientId) => {
                if (state.user) {
                    const li = $(`<li><span class="dropdown-item-text">${state.user.name}</span></li>`);
                    userList.append(li);
                }
            });
        } catch (error) {
            console.error('사용자 목록 업데이트 실패:', error);
        }
    }

    /**
     * 연결 상태 업데이트
     */
    updateConnectionStatus(status) {
        const statusEl = $('#connectionStatus .alert');
        
        switch (status) {
            case 'connected':
                statusEl.removeClass('alert-danger alert-warning').addClass('alert-success');
                statusEl.find('i').attr('class', 'fas fa-wifi me-2');
                statusEl.find('span').text('연결됨');
                break;
            case 'connecting':
                statusEl.removeClass('alert-success alert-danger').addClass('alert-warning');
                statusEl.find('i').attr('class', 'fas fa-spinner fa-spin me-2');
                statusEl.find('span').text('연결 중...');
                break;
            case 'disconnected':
            case 'error':
                statusEl.removeClass('alert-success alert-warning').addClass('alert-danger');
                statusEl.find('i').attr('class', 'fas fa-exclamation-triangle me-2');
                statusEl.find('span').text('연결 끊김');
                break;
        }
    }

    /**
     * 원격 변경사항 하이라이트
     */
    highlightRemoteChanges(event) {
        // 변경된 요소에 하이라이트 효과 추가
        $('.highlight-change').removeClass('highlight-change');
        
        setTimeout(() => {
            $('.highlight-change').addClass('fade-out');
            setTimeout(() => {
                $('.fade-out').removeClass('highlight-change fade-out');
            }, 2000);
        }, 100);
    }

    /**
     * 사용자 커서 업데이트
     */
    updateUserCursor(clientId, state) {
        // 사용자 커서 위치 업데이트 로직
    }

    /**
     * 사용자 커서 제거
     */
    removeUserCursor(clientId) {
        // 사용자 커서 제거 로직
    }

    /**
     * 사용자 ID 생성
     */
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 사용자 색상 생성
     */
    generateUserColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 리소스 정리
     */
    destroy() {
        if (this.provider) {
            this.provider.destroy();
        }
        if (this.ydoc) {
            this.ydoc.destroy();
        }
    }
}