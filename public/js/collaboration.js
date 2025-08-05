/**
 * Real-time Collaboration Manager using Yjs
 */
class CollaborationManager {
    constructor() {
        try {
            // Check if Yjs is available
            if (typeof Y === 'undefined') {
                console.warn('Yjs library not loaded. Collaboration features will be disabled.');
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
                // Yjs가 없어도 기본 기능은 동작하도록 초기화
                this.init();
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
        } catch (error) {
            console.error('CollaborationManager constructor error:', error);
            // 에러가 발생해도 기본 구조는 생성
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
            this.init();
        }
    }

    /**
     * Initialize collaboration system
     */
    init() {
        // If Yjs is not available, create mock data structure
        if (!this.ydoc) {
            console.log('Collaboration system disabled - Yjs not available, using local mode');
            this.updateConnectionStatus('disabled');
            
            // 로컬 모드에서도 XML 미리보기가 동작하도록 기본 구조 생성
            this.xmlData = {
                get: () => [],
                observe: () => {},
                push: () => {},
                length: 0
            };
            
            // 기본 XML 구조 초기화
            this.initializeXMLStructure();
            return;
        }
        
        try {
            // Connect to Python Yjs WebSocket provider
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = window.location.host;
            this.provider = new Y.WebsocketProvider(`${wsProtocol}//${wsHost}/yjs-websocket`, 'zeromq-topic-manager', this.ydoc);
            
            // Get shared XML data type
            this.xmlData = this.ydoc.getXmlElement('applications');
            
            // Setup awareness for user presence
            this.awareness = this.provider.awareness;
            this.setupAwareness();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Set initial XML structure if empty
            this.initializeXMLStructure();
            
            console.log('Collaboration system initialized');
            this.updateConnectionStatus('connected');
            
        } catch (error) {
            console.error('Failed to initialize collaboration:', error);
            this.updateConnectionStatus('error');
            
            // 에러 발생 시에도 로컬 모드로 동작
            this.xmlData = {
                get: () => [],
                observe: () => {},
                push: () => {},
                length: 0
            };
            this.initializeXMLStructure();
        }
    }

    /**
     * Setup user awareness and presence
     */
    setupAwareness() {
        if (!this.awareness) return;
        
        this.awareness.setLocalStateField('user', this.currentUser);
        
        this.awareness.on('change', () => {
            this.updateUserList();
        });
        
        this.awareness.on('update', ({ added, updated, removed }) => {
            this.handleAwarenessUpdate(added, updated, removed);
        });
    }

    /**
     * Setup event listeners for real-time updates
     */
    setupEventListeners() {
        if (!this.xmlData || !this.provider) return;
        
        // Listen for XML structure changes
        this.xmlData.observe((event) => {
            this.handleXMLChange(event);
        });

        // Listen for provider connection changes
        this.provider.on('status', (event) => {
            console.log('Provider status:', event.status);
            this.updateConnectionStatus(event.status);
        });

        this.provider.on('connection-error', (error) => {
            console.error('Connection error:', error);
            this.updateConnectionStatus('error');
        });
    }

    /**
     * Initialize XML structure if empty
     */
    initializeXMLStructure() {
        if (!this.xmlData) return;
        
        if (this.xmlData.length === 0) {
            // Create default XML structure
            const applications = new Y.XmlElement('Applications');
            applications.setAttribute('xmlns', 'http://zeromq-topic-manager/schema');
            applications.setAttribute('version', '1.0');
            
            this.xmlData.push([applications]);
            console.log('Initialized default XML structure');
        }
    }

    /**
     * Handle XML structure changes
     */
    handleXMLChange(event) {
        console.log('XML changed:', event);
        
        // Emit change event for tree update
        $(document).trigger('xml-structure-changed', {
            event: event,
            xmlData: this.xmlData
        });
        
        // Update XML preview
        this.updateXMLPreview();
        
        // Highlight changes for other users
        if (!event.transaction.local) {
            this.highlightRemoteChanges(event);
        }
    }

    /**
     * Handle awareness updates (user presence)
     */
    handleAwarenessUpdate(added, updated, removed) {
        // Update user list
        this.updateUserList();
        
        // Handle user cursors and selections
        [...added, ...updated].forEach(clientId => {
            const state = this.awareness.getStates().get(clientId);
            if (state && state.user && clientId !== this.awareness.clientID) {
                this.updateUserCursor(clientId, state);
            }
        });
        
        removed.forEach(clientId => {
            this.removeUserCursor(clientId);
        });
    }

    /**
     * Add application to XML
     */
    addApplication(name, description = '') {
        try {
            // Yjs가 없는 로컬 모드인 경우
            if (!this.xmlData || !this.xmlData.get) {
                console.log(`로컬 모드: 응용프로그램 추가됨: ${name}`);
                // XML 미리보기 업데이트
                this.updateXMLPreview();
                return true;
            }
            
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
     * Add topic to application
     */
    addTopic(appName, topicName, proto, direction, description = '') {
        try {
            // Yjs가 없는 로컬 모드인 경우
            if (!this.xmlData || !this.xmlData.get) {
                console.log(`로컬 모드: 토픽 ${topicName}을 응용프로그램 ${appName}에 추가됨`);
                // XML 미리보기 업데이트
                this.updateXMLPreview();
                return true;
            }
            
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
     * Remove application
     */
    removeApplication(appName) {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                return false;
            }

            for (let i = 0; i < applications.length; i++) {
                const app = applications.get(i);
                if (app.getAttribute('name') === appName) {
                    applications.delete(i, 1);
                    console.log(`Removed application: ${appName}`);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Failed to remove application:', error);
            return false;
        }
    }

    /**
     * Remove topic from application
     */
    removeTopic(appName, topicName) {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                return false;
            }

            // Find the application
            for (let i = 0; i < applications.length; i++) {
                const app = applications.get(i);
                if (app.getAttribute('name') === appName) {
                    // Find and remove the topic
                    for (let j = 0; j < app.length; j++) {
                        const topic = app.get(j);
                        if (topic.getAttribute('name') === topicName) {
                            app.delete(j, 1);
                            console.log(`Removed topic ${topicName} from application ${appName}`);
                            return true;
                        }
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('Failed to remove topic:', error);
            return false;
        }
    }

    /**
     * Update application attributes
     */
    updateApplication(appName, attributes) {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                return false;
            }

            for (let i = 0; i < applications.length; i++) {
                const app = applications.get(i);
                if (app.getAttribute('name') === appName) {
                    Object.keys(attributes).forEach(key => {
                        app.setAttribute(key, attributes[key]);
                    });
                    console.log(`Updated application ${appName}:`, attributes);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Failed to update application:', error);
            return false;
        }
    }

    /**
     * Update topic attributes
     */
    updateTopic(appName, topicName, attributes) {
        try {
            const applications = this.xmlData.get(0);
            if (!applications) {
                return false;
            }

            for (let i = 0; i < applications.length; i++) {
                const app = applications.get(i);
                if (app.getAttribute('name') === appName) {
                    for (let j = 0; j < app.length; j++) {
                        const topic = app.get(j);
                        if (topic.getAttribute('name') === topicName) {
                            Object.keys(attributes).forEach(key => {
                                topic.setAttribute(key, attributes[key]);
                            });
                            console.log(`Updated topic ${topicName} in ${appName}:`, attributes);
                            return true;
                        }
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('Failed to update topic:', error);
            return false;
        }
    }

    /**
     * Get current XML structure
     */
    getXMLStructure() {
        try {
            // Yjs가 없는 로컬 모드인 경우
            if (!this.xmlData || !this.xmlData.get) {
                return {
                    Applications: {
                        '@xmlns': 'http://zeromq-topic-manager/schema',
                        '@version': '1.0',
                        Application: []
                    }
                };
            }
            
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
     * Update XML preview
     */
    updateXMLPreview() {
        try {
            const structure = this.getXMLStructure();
            const xmlString = this.objectToXML(structure);
            $('#xmlPreview code').text(xmlString);
        } catch (error) {
            console.error('Failed to update XML preview:', error);
        }
    }

    /**
     * Convert object to XML string
     */
    objectToXML(obj) {
        // Simple XML serialization - could be enhanced with proper formatting
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        
        function serialize(obj, indent = '') {
            let result = '';
            for (const [key, value] of Object.entries(obj)) {
                if (key.startsWith('@')) {
                    continue; // Skip attributes in this pass
                }
                
                result += `${indent}<${key}`;
                
                // Add attributes
                if (typeof value === 'object' && value !== null) {
                    for (const [attrKey, attrValue] of Object.entries(value)) {
                        if (attrKey.startsWith('@')) {
                            const attrName = attrKey.substring(1);
                            result += ` ${attrName}="${attrValue}"`;
                        }
                    }
                }
                
                if (Array.isArray(value)) {
                    result += '>\n';
                    value.forEach(item => {
                        result += serialize({ [key.slice(0, -1)]: item }, indent + '  ');
                    });
                    result += `${indent}</${key}>\n`;
                } else if (typeof value === 'object' && value !== null) {
                    const hasNonAttributeKeys = Object.keys(value).some(k => !k.startsWith('@'));
                    if (hasNonAttributeKeys) {
                        result += '>\n';
                        result += serialize(value, indent + '  ');
                        result += `${indent}</${key}>\n`;
                    } else {
                        result += '/>\n';
                    }
                } else {
                    result += `>${value}</${key}>\n`;
                }
            }
            return result;
        }
        
        return xml + serialize(obj);
    }

    /**
     * Update user list display
     */
    updateUserList() {
        const users = Array.from(this.awareness.getStates().values())
            .filter(state => state.user)
            .map(state => state.user);
        
        $('#userCount').text(users.length);
        
        const userList = $('#userList');
        userList.find('li:not(:first)').remove();
        
        users.forEach(user => {
            const li = $(`
                <li>
                    <span class="dropdown-item d-flex align-items-center">
                        <span class="badge me-2" style="background-color: ${user.color}; width: 12px; height: 12px; border-radius: 50%;"></span>
                        ${user.name}
                    </span>
                </li>
            `);
            userList.append(li);
        });
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(status) {
        const statusEl = $('#connectionStatus .alert');
        const icon = statusEl.find('i');
        const text = statusEl.find('span');
        
        statusEl.removeClass('alert-success alert-warning alert-danger');
        
        switch (status) {
            case 'connected':
                statusEl.addClass('alert-success');
                icon.attr('class', 'fas fa-wifi me-2');
                text.text('연결됨');
                break;
            case 'connecting':
                statusEl.addClass('alert-warning');
                icon.attr('class', 'fas fa-spinner fa-spin me-2');
                text.text('연결 중...');
                break;
            case 'disabled':
                statusEl.addClass('alert-warning');
                icon.attr('class', 'fas fa-ban me-2');
                text.text('협업 기능 비활성화');
                break;
            case 'disconnected':
            case 'error':
                statusEl.addClass('alert-danger');
                icon.attr('class', 'fas fa-exclamation-triangle me-2');
                text.text('연결 끊김');
                break;
        }
    }

    /**
     * Highlight remote changes
     */
    highlightRemoteChanges(event) {
        // Add visual feedback for changes made by other users
        setTimeout(() => {
            $('#treeContainer').addClass('highlight-change');
            setTimeout(() => {
                $('#treeContainer').addClass('fade-out');
            }, 1000);
            setTimeout(() => {
                $('#treeContainer').removeClass('highlight-change fade-out');
            }, 3000);
        }, 100);
    }

    /**
     * Update user cursor position
     */
    updateUserCursor(clientId, state) {
        // Implementation for showing other users' cursors
        // This would be enhanced based on specific UI requirements
    }

    /**
     * Remove user cursor
     */
    removeUserCursor(clientId) {
        // Remove cursor elements for disconnected users
        $(`.user-cursor[data-user-id="${clientId}"]`).remove();
    }

    /**
     * Generate unique user ID
     */
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate random user color
     */
    generateUserColor() {
        const colors = [
            '#007bff', '#28a745', '#dc3545', '#ffc107', 
            '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Cleanup resources
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

// Global collaboration manager instance
window.collaborationManager = null;