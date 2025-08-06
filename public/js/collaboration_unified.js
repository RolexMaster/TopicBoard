/**
 * 통합 협업 관리자 - Python 서버만 사용
 */
class CollaborationManager {
    constructor() {
        // Yjs 라이브러리가 로드되었는지 확인
        if (typeof Y === 'undefined') {
            console.error('Yjs 라이브러리가 로드되지 않았습니다. 협업 기능이 비활성화됩니다.');
            this.ydoc = null;
            this.provider = null;
            this.xmlData = null;
            this.awareness = null;
            this.users = new Map();
            this.currentUser = {
                id: this.generateUserId(),
                name: `사용자_${Math.floor(Math.random() * 1000)}`,
                color: this.generateUserColor()
            };
            
            this.updateConnectionStatus('error');
            
            // Yjs가 없어도 기본 XML 미리보기는 작동하도록 설정
            this.initWithoutYjs();
            return;
        }
        
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
     * Yjs 없이 초기화 (기본 기능만)
     */
    initWithoutYjs() {
        console.log('Yjs 없이 기본 기능으로 초기화합니다.');
        
        // 기본 XML 구조 설정
        this.xmlData = {
            Applications: {
                '@xmlns': 'http://zeromq-topic-manager/schema',
                '@version': '1.0',
                Application: []
            }
        };
        
        // 초기 XML 미리보기 업데이트
        this.updateXMLPreview();
        
        // 오프라인 모드 상태 표시
        this.updatePreviewStatus();
        
        console.log('기본 기능 초기화 완료');
    }

    /**
     * 협업 시스템 초기화
     */
    init() {
        // Yjs가 없는 경우 초기화 건너뛰기
        if (!this.ydoc) {
            console.log('Yjs가 없어서 협업 기능이 비활성화됩니다.');
            return;
        }
        
        try {
            // Python 서버의 Yjs WebSocket에 연결
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = window.location.host;
            
            // WebSocket URL 구성
            const wsUrl = `${wsProtocol}//${wsHost}/yjs-websocket`;
            console.log('Yjs WebSocket 연결 시도:', wsUrl);
            
            this.provider = new Y.WebsocketProvider(wsUrl, 'zeromq-topic-manager', this.ydoc);
            
            // 공유 XML 데이터 타입 가져오기
            this.xmlData = this.ydoc.getXmlElement('Applications');
            
            // 사용자 존재감을 위한 awareness 설정
            this.awareness = this.provider.awareness;
            this.setupAwareness();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 빈 경우 초기 XML 구조 설정
            this.initializeXMLStructure();
            
            console.log('협업 시스템 초기화 완료');
            this.updateConnectionStatus('connecting');
            
        } catch (error) {
            console.error('협업 초기화 실패:', error);
            this.updateConnectionStatus('error');
        }
    }

    /**
     * 사용자 존재감 및 presence 설정
     */
    setupAwareness() {
        if (!this.awareness) {
            console.log('Awareness가 설정되지 않았습니다.');
            return;
        }
        
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
        if (!this.xmlData || !this.provider) {
            console.log('XML 데이터 또는 프로바이더가 설정되지 않았습니다.');
            return;
        }
        
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
        
        // 연결 성공 시 상태 업데이트
        this.provider.on('sync', (isSynced) => {
            console.log('Yjs 동기화 상태:', isSynced);
            if (isSynced) {
                this.updateConnectionStatus('connected');
            }
        });
        
        // 연결 해제 시 상태 업데이트
        this.provider.on('disconnect', () => {
            console.log('Yjs 연결 해제됨');
            this.updateConnectionStatus('disconnected');
        });
    }

    /**
     * 빈 경우 초기 XML 구조 설정
     */
    initializeXMLStructure() {
        if (!this.xmlData) {
            console.log('XML 데이터가 설정되지 않았습니다.');
            return;
        }
        
        // XML 요소가 비어있으면 기본 구조 생성
        if (!this.xmlData.firstChild) {
            // 기본 XML 구조 생성
            const applications = new Y.XmlElement('Applications');
            applications.setAttribute('xmlns', 'http://zeromq-topic-manager/schema');
            applications.setAttribute('version', '1.0');
            
            this.xmlData.appendChild(applications);
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
        
        // 트리 에디터도 업데이트
        if (window.treeEditor) {
            window.treeEditor.refreshTree();
        }
    }

    /**
     * 사용자 존재감 업데이트 처리
     */
    handleAwarenessUpdate(added, updated, removed) {
        console.log('사용자 존재감 업데이트:', { added, updated, removed });
        
        // 사용자 목록 업데이트
        this.updateUserList();
        
        // 원격 변경사항 하이라이트 (event 매개변수 제거)
        this.highlightRemoteChanges();
    }

    /**
     * XML에 응용프로그램 추가
     */
    addApplication(name, description = '') {
        if (!this.xmlData) {
            console.log('XML 데이터가 설정되지 않았습니다.');
            return false;
        }
        
        // Yjs가 없는 경우 기본 방식으로 추가
        if (typeof this.xmlData.get !== 'function') {
            if (!this.xmlData.Applications) {
                this.xmlData.Applications = {
                    '@xmlns': 'http://zeromq-topic-manager/schema',
                    '@version': '1.0',
                    Application: []
                };
            }
            
            const newApp = {
                '@name': name,
                '@description': description,
                Topic: []
            };
            
            this.xmlData.Applications.Application.push(newApp);
            console.log(`응용프로그램 추가됨: ${name}`);
            this.updateXMLPreview();
            return true;
        }
        
        try {
            const applications = this.xmlData.firstChild;
            if (!applications) {
                throw new Error('Applications 루트를 찾을 수 없음');
            }

            const application = new Y.XmlElement('Application');
            application.setAttribute('name', name);
            application.setAttribute('description', description);

            applications.appendChild(application);

            console.log(`응용프로그램 추가됨: ${name}`);
            
            // XML 미리보기 업데이트
            this.updateXMLPreview();
            
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
        // Yjs가 없는 경우 기본 방식으로 추가
        if (typeof this.xmlData.get !== 'function') {
            if (!this.xmlData.Applications || !this.xmlData.Applications.Application) {
                console.error('Applications 구조가 없습니다.');
                return false;
            }
            
            const applications = Array.isArray(this.xmlData.Applications.Application) 
                ? this.xmlData.Applications.Application 
                : [this.xmlData.Applications.Application];
            
            const targetApp = applications.find(app => app['@name'] === appName);
            if (!targetApp) {
                console.error(`응용프로그램 ${appName}을 찾을 수 없음`);
                return false;
            }
            
            const newTopic = {
                '@name': topicName,
                '@proto': proto,
                '@direction': direction,
                '@description': description
            };
            
            if (!targetApp.Topic) {
                targetApp.Topic = [];
            }
            targetApp.Topic.push(newTopic);
            
            console.log(`토픽 ${topicName}을 응용프로그램 ${appName}에 추가됨`);
            this.updateXMLPreview();
            return true;
        }
        
        try {
            const applications = this.xmlData.firstChild;
            if (!applications) {
                throw new Error('Applications 루트를 찾을 수 없음');
            }

            // 응용프로그램 찾기
            let targetApp = null;
            for (let i = 0; i < applications.childNodes.length; i++) {
                const app = applications.childNodes[i];
                if (app.nodeName === 'Application' && app.getAttribute('name') === appName) {
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

            targetApp.appendChild(topic);

            console.log(`토픽 ${topicName}을 응용프로그램 ${appName}에 추가됨`);
            
            // XML 미리보기 업데이트
            this.updateXMLPreview();
            
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
                    
                    // XML 미리보기 업데이트
                    this.updateXMLPreview();
                    
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
                            
                            // XML 미리보기 업데이트
                            this.updateXMLPreview();
                            
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
            // Yjs가 없는 경우 기본 구조 반환
            if (!this.xmlData || typeof this.xmlData.get !== 'function') {
                return this.xmlData || {
                    Applications: {
                        '@xmlns': 'http://zeromq-topic-manager/schema',
                        '@version': '1.0',
                        Application: []
                    }
                };
            }
            
            // XML 요소에서 구조 추출
            const applications = this.xmlData.firstChild;
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

            // Application 요소들 처리
            for (let i = 0; i < applications.childNodes.length; i++) {
                const app = applications.childNodes[i];
                if (app.nodeName === 'Application') {
                    const appData = {
                        '@name': app.getAttribute('name'),
                        '@description': app.getAttribute('description') || '',
                        Topic: []
                    };

                    // Topic 요소들 처리
                    for (let j = 0; j < app.childNodes.length; j++) {
                        const topic = app.childNodes[j];
                        if (topic.nodeName === 'Topic') {
                            const topicData = {
                                '@name': topic.getAttribute('name'),
                                '@proto': topic.getAttribute('proto'),
                                '@direction': topic.getAttribute('direction'),
                                '@description': topic.getAttribute('description') || ''
                            };
                            appData.Topic.push(topicData);
                        }
                    }

                    result.Applications.Application.push(appData);
                }
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
            console.log('XML 미리보기 업데이트 시작');
            const structure = this.getXMLStructure();
            console.log('XML 구조:', structure);
            const xmlString = this.objectToXML(structure);
            console.log('XML 문자열:', xmlString);
            
            const previewElement = $('#xmlPreview code');
            if (previewElement.length > 0) {
                previewElement.text(xmlString);
                console.log('XML 미리보기 업데이트 완료');
                
                // 연결 상태에 따라 미리보기 상태 표시
                this.updatePreviewStatus();
            } else {
                console.error('XML 미리보기 요소를 찾을 수 없습니다');
                // 요소가 없어도 기본 XML 표시
                this.showDefaultXML();
            }
        } catch (error) {
            console.error('XML 미리보기 업데이트 실패:', error);
            // 오류가 발생해도 기본 XML 구조 표시
            this.showDefaultXML();
        }
    }
    
    /**
     * 미리보기 상태 업데이트
     */
    updatePreviewStatus() {
        const previewContainer = $('#xmlPreview');
        if (previewContainer.length > 0) {
            // 연결 상태 확인 - Yjs가 있고 provider가 연결된 상태
            const isConnected = this.ydoc && this.provider && this.provider.wsconnected;
            
            if (isConnected) {
                previewContainer.removeClass('offline-mode');
                previewContainer.attr('title', '실시간 XML 미리보기');
            } else {
                previewContainer.addClass('offline-mode');
                previewContainer.attr('title', '오프라인 모드 - 로컬 XML 미리보기');
            }
        }
    }
    
    /**
     * 기본 XML 구조 표시
     */
    showDefaultXML() {
        const previewElement = $('#xmlPreview code');
        if (previewElement.length > 0) {
            const defaultXML = `<?xml version="1.0" encoding="UTF-8"?>
<Applications xmlns="http://zeromq-topic-manager/schema" version="1.0">
  <!-- 기본 XML 구조 -->
  <Application name="샘플 앱" description="샘플 응용프로그램">
    <Topic name="sample_topic" proto="sample.proto" direction="publish" description="샘플 토픽"/>
  </Application>
</Applications>`;
            previewElement.text(defaultXML);
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
        if (!this.awareness) {
            console.log('Awareness가 설정되지 않았습니다.');
            return;
        }
        
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
                statusEl.removeClass('alert-danger alert-warning alert-info').addClass('alert-success');
                statusEl.find('i').attr('class', 'fas fa-wifi me-2');
                statusEl.find('span').text('실시간 협업 연결됨');
                break;
            case 'connecting':
                statusEl.removeClass('alert-success alert-danger alert-info').addClass('alert-warning');
                statusEl.find('i').attr('class', 'fas fa-spinner fa-spin me-2');
                statusEl.find('span').text('실시간 협업 연결 중...');
                break;
            case 'disconnected':
                statusEl.removeClass('alert-success alert-danger alert-info').addClass('alert-warning');
                statusEl.find('i').attr('class', 'fas fa-exclamation-triangle me-2');
                statusEl.find('span').text('실시간 협업 연결 끊김 (재연결 시도 중)');
                break;
            case 'error':
                statusEl.removeClass('alert-success alert-warning alert-danger').addClass('alert-info');
                statusEl.find('i').attr('class', 'fas fa-info-circle me-2');
                statusEl.find('span').text('오프라인 모드 (기본 기능 사용 가능)');
                break;
            default:
                statusEl.removeClass('alert-success alert-warning alert-danger').addClass('alert-info');
                statusEl.find('i').attr('class', 'fas fa-info-circle me-2');
                statusEl.find('span').text(`상태: ${status}`);
                break;
        }
        
        // 미리보기 상태도 업데이트
        this.updatePreviewStatus();
    }

    /**
     * 원격 변경사항 하이라이트
     */
    highlightRemoteChanges() {
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
        try {
            if (this.provider) {
                this.provider.destroy();
            }
            if (this.ydoc) {
                this.ydoc.destroy();
            }
        } catch (error) {
            console.error('리소스 정리 중 오류:', error);
        }
    }
}