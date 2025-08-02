/**
 * Tree Editor using jsTree for XML structure management
 */
class TreeEditor {
    constructor() {
        this.treeContainer = '#treeContainer';
        this.selectedNode = null;
        this.treeInstance = null;
        
        this.init();
    }

    /**
     * Initialize the tree editor
     */
    init() {
        this.setupTree();
        this.setupEventListeners();
        this.setupContextMenu();
    }

    /**
     * Setup jsTree with configuration
     */
    setupTree() {
        $(this.treeContainer).jstree({
            'core': {
                'check_callback': true,
                'multiple': false,
                'themes': {
                    'name': 'default',
                    'dots': true,
                    'icons': true,
                    'responsive': true
                },
                'data': this.getInitialTreeData()
            },
            'plugins': ['contextmenu', 'types', 'wholerow'],
            'types': {
                'root': {
                    'icon': 'root-icon',
                    'max_children': -1,
                    'valid_children': ['application']
                },
                'application': {
                    'icon': 'app-icon',
                    'max_children': -1,
                    'valid_children': ['topic']
                },
                'topic': {
                    'icon': false, // Will be set dynamically based on direction
                    'max_children': 0,
                    'valid_children': []
                }
            },
            'contextmenu': {
                'items': (node) => this.getContextMenuItems(node)
            }
        });

        this.treeInstance = $(this.treeContainer).jstree(true);
    }

    /**
     * Get initial tree data structure
     */
    getInitialTreeData() {
        return [
            {
                'id': 'applications_root',
                'text': 'Applications',
                'type': 'root',
                'state': {
                    'opened': true
                },
                'children': []
            }
        ];
    }

    /**
     * Setup event listeners for tree interactions
     */
    setupEventListeners() {
        // Node selection
        $(this.treeContainer).on('select_node.jstree', (e, data) => {
            this.handleNodeSelect(data.node);
        });

        // Node deselection
        $(this.treeContainer).on('deselect_node.jstree', (e, data) => {
            this.handleNodeDeselect(data.node);
        });

        // Before node rename
        $(this.treeContainer).on('rename_node.jstree', (e, data) => {
            this.handleNodeRename(data.node, data.text, data.old);
        });

        // Node creation
        $(this.treeContainer).on('create_node.jstree', (e, data) => {
            this.handleNodeCreate(data.node, data.parent);
        });

        // Node deletion
        $(this.treeContainer).on('delete_node.jstree', (e, data) => {
            this.handleNodeDelete(data.node);
        });

        // Listen for XML structure changes from collaboration
        $(document).on('xml-structure-changed', (e, data) => {
            this.updateTreeFromXML(data);
        });

        // Button event listeners
        $('#addAppBtn').on('click', () => this.showAddApplicationModal());
        $('#addTopicBtn').on('click', () => this.showAddTopicModal());
        $('#deleteBtn').on('click', () => this.deleteSelectedNode());
    }

    /**
     * Setup context menu configuration
     */
    setupContextMenu() {
        // Context menu is configured in the jsTree initialization
    }

    /**
     * Get context menu items based on node type
     */
    getContextMenuItems(node) {
        const items = {};

        if (node.type === 'root') {
            items.addApp = {
                'label': '응용프로그램 추가',
                'icon': 'fas fa-plus',
                'action': () => this.showAddApplicationModal()
            };
        } else if (node.type === 'application') {
            items.addTopic = {
                'label': '토픽 추가',
                'icon': 'fas fa-plus',
                'action': () => this.showAddTopicModal()
            };
            items.separator1 = '--------';
            items.rename = {
                'label': '이름 변경',
                'icon': 'fas fa-edit',
                'action': () => this.treeInstance.edit(node)
            };
            items.delete = {
                'label': '삭제',
                'icon': 'fas fa-trash',
                'action': () => this.deleteNode(node)
            };
        } else if (node.type === 'topic') {
            items.edit = {
                'label': '편집',
                'icon': 'fas fa-edit',
                'action': () => this.editTopicNode(node)
            };
            items.delete = {
                'label': '삭제',
                'icon': 'fas fa-trash',
                'action': () => this.deleteNode(node)
            };
        }

        return items;
    }

    /**
     * Handle node selection
     */
    handleNodeSelect(node) {
        this.selectedNode = node;
        this.updateButtonStates();
        this.showNodeProperties(node);
    }

    /**
     * Handle node deselection
     */
    handleNodeDeselect(node) {
        this.selectedNode = null;
        this.updateButtonStates();
        this.clearNodeProperties();
    }

    /**
     * Handle node rename
     */
    handleNodeRename(node, newText, oldText) {
        if (node.type === 'application') {
            // Update application name in collaboration manager
            if (window.collaborationManager) {
                window.collaborationManager.updateApplication(oldText, { name: newText });
            }
        }
    }

    /**
     * Handle node creation
     */
    handleNodeCreate(node, parent) {
        console.log('Node created:', node, 'Parent:', parent);
    }

    /**
     * Handle node deletion
     */
    handleNodeDelete(node) {
        console.log('Node deleted:', node);
    }

    /**
     * Update button states based on selection
     */
    updateButtonStates() {
        const hasSelection = this.selectedNode !== null;
        const isApplication = this.selectedNode && this.selectedNode.type === 'application';
        const isRoot = this.selectedNode && this.selectedNode.type === 'root';
        
        $('#addTopicBtn').prop('disabled', !isApplication);
        $('#deleteBtn').prop('disabled', !hasSelection || isRoot);
    }

    /**
     * Show node properties in the properties panel
     */
    showNodeProperties(node) {
        const panel = $('#propertiesPanel');
        panel.empty();

        if (node.type === 'root') {
            this.showRootProperties(panel);
        } else if (node.type === 'application') {
            this.showApplicationProperties(panel, node);
        } else if (node.type === 'topic') {
            this.showTopicProperties(panel, node);
        }
    }

    /**
     * Show root node properties
     */
    showRootProperties(panel) {
        panel.html(`
            <div class="mb-3">
                <h6><i class="fas fa-info-circle me-2"></i>Applications Root</h6>
                <p class="text-muted">최상위 응용프로그램 컨테이너입니다.</p>
            </div>
            <div class="mb-3">
                <label class="form-label">스키마 버전</label>
                <input type="text" class="form-control" value="1.0" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label">네임스페이스</label>
                <input type="text" class="form-control" value="http://zeromq-topic-manager/schema" readonly>
            </div>
        `);
    }

    /**
     * Show application properties
     */
    showApplicationProperties(panel, node) {
        const appData = this.getApplicationData(node.text);
        
        panel.html(`
            <div class="mb-3">
                <h6><i class="fas fa-cogs me-2"></i>Application Properties</h6>
            </div>
            <div class="mb-3">
                <label for="propAppName" class="form-label">이름 *</label>
                <input type="text" class="form-control" id="propAppName" value="${node.text}">
            </div>
            <div class="mb-3">
                <label for="propAppDescription" class="form-label">설명</label>
                <textarea class="form-control" id="propAppDescription" rows="3">${appData.description || ''}</textarea>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary btn-sm" onclick="treeEditor.updateApplicationProperties()">
                    <i class="fas fa-save me-1"></i>저장
                </button>
            </div>
        `);
    }

    /**
     * Show topic properties
     */
    showTopicProperties(panel, node) {
        const topicData = this.getTopicData(node);
        
        panel.html(`
            <div class="mb-3">
                <h6><i class="fas fa-broadcast-tower me-2"></i>Topic Properties</h6>
            </div>
            <div class="mb-3">
                <label for="propTopicName" class="form-label">토픽 이름 *</label>
                <input type="text" class="form-control" id="propTopicName" value="${topicData.name || ''}">
            </div>
            <div class="mb-3">
                <label for="propTopicProto" class="form-label">Proto 파일 *</label>
                <input type="text" class="form-control" id="propTopicProto" value="${topicData.proto || ''}">
            </div>
            <div class="mb-3">
                <label for="propTopicDirection" class="form-label">방향 *</label>
                <select class="form-select" id="propTopicDirection">
                    <option value="publish" ${topicData.direction === 'publish' ? 'selected' : ''}>Publish</option>
                    <option value="subscribe" ${topicData.direction === 'subscribe' ? 'selected' : ''}>Subscribe</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="propTopicDescription" class="form-label">설명</label>
                <textarea class="form-control" id="propTopicDescription" rows="3">${topicData.description || ''}</textarea>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary btn-sm" onclick="treeEditor.updateTopicProperties()">
                    <i class="fas fa-save me-1"></i>저장
                </button>
            </div>
        `);
    }

    /**
     * Clear properties panel
     */
    clearNodeProperties() {
        $('#propertiesPanel').html(`
            <div class="text-muted text-center mt-4">
                <i class="fas fa-hand-pointer fa-2x mb-2"></i>
                <p>좌측에서 항목을 선택하세요</p>
            </div>
        `);
    }

    /**
     * Show add application modal
     */
    showAddApplicationModal() {
        $('#addAppForm')[0].reset();
        $('#addAppModal').modal('show');
    }

    /**
     * Show add topic modal
     */
    showAddTopicModal() {
        if (!this.selectedNode || this.selectedNode.type !== 'application') {
            alert('토픽을 추가할 응용프로그램을 선택하세요.');
            return;
        }
        
        $('#addTopicForm')[0].reset();
        $('#addTopicModal').modal('show');
    }

    /**
     * Add application to tree
     */
    addApplication(name, description) {
        const nodeId = 'app_' + Date.now();
        const newNode = {
            'id': nodeId,
            'text': name,
            'type': 'application',
            'data': {
                'description': description
            },
            'children': []
        };

        this.treeInstance.create_node('applications_root', newNode, 'last');
        
        // Add to collaboration manager
        if (window.collaborationManager) {
            window.collaborationManager.addApplication(name, description);
        }

        // Expand parent and select new node
        this.treeInstance.open_node('applications_root');
        this.treeInstance.select_node(nodeId);
    }

    /**
     * Add topic to selected application
     */
    addTopic(topicName, proto, direction, description) {
        if (!this.selectedNode || this.selectedNode.type !== 'application') {
            return false;
        }

        const nodeId = 'topic_' + Date.now();
        const iconClass = direction === 'publish' ? 'topic-publish-icon' : 'topic-subscribe-icon';
        
        const newNode = {
            'id': nodeId,
            'text': topicName,
            'type': 'topic',
            'icon': iconClass,
            'data': {
                'proto': proto,
                'direction': direction,
                'description': description
            }
        };

        this.treeInstance.create_node(this.selectedNode.id, newNode, 'last');
        
        // Add to collaboration manager
        if (window.collaborationManager) {
            window.collaborationManager.addTopic(this.selectedNode.text, topicName, proto, direction, description);
        }

        // Expand parent and select new node
        this.treeInstance.open_node(this.selectedNode.id);
        this.treeInstance.select_node(nodeId);
        
        return true;
    }

    /**
     * Delete selected node
     */
    deleteSelectedNode() {
        if (!this.selectedNode) {
            return;
        }

        this.deleteNode(this.selectedNode);
    }

    /**
     * Delete specific node
     */
    deleteNode(node) {
        if (!node || node.type === 'root') {
            return;
        }

        const confirmMessage = node.type === 'application' 
            ? `응용프로그램 "${node.text}"를 삭제하시겠습니까? 모든 토픽도 함께 삭제됩니다.`
            : `토픽 "${node.text}"를 삭제하시겠습니까?`;

        if (confirm(confirmMessage)) {
            // Remove from collaboration manager first
            if (window.collaborationManager) {
                if (node.type === 'application') {
                    window.collaborationManager.removeApplication(node.text);
                } else if (node.type === 'topic') {
                    const parentNode = this.treeInstance.get_node(node.parent);
                    window.collaborationManager.removeTopic(parentNode.text, node.text);
                }
            }

            // Remove from tree
            this.treeInstance.delete_node(node);
        }
    }

    /**
     * Edit topic node
     */
    editTopicNode(node) {
        this.treeInstance.select_node(node.id);
        this.showNodeProperties(node);
    }

    /**
     * Update application properties
     */
    updateApplicationProperties() {
        if (!this.selectedNode || this.selectedNode.type !== 'application') {
            return;
        }

        const newName = $('#propAppName').val().trim();
        const newDescription = $('#propAppDescription').val().trim();

        if (!newName) {
            alert('응용프로그램 이름을 입력하세요.');
            return;
        }

        const oldName = this.selectedNode.text;

        // Update collaboration manager
        if (window.collaborationManager && newName !== oldName) {
            window.collaborationManager.updateApplication(oldName, { name: newName });
        }

        if (window.collaborationManager) {
            window.collaborationManager.updateApplication(newName, { description: newDescription });
        }

        // Update tree node
        this.treeInstance.rename_node(this.selectedNode, newName);
        this.selectedNode.data.description = newDescription;

        alert('저장되었습니다.');
    }

    /**
     * Update topic properties
     */
    updateTopicProperties() {
        if (!this.selectedNode || this.selectedNode.type !== 'topic') {
            return;
        }

        const newName = $('#propTopicName').val().trim();
        const newProto = $('#propTopicProto').val().trim();
        const newDirection = $('#propTopicDirection').val();
        const newDescription = $('#propTopicDescription').val().trim();

        if (!newName || !newProto || !newDirection) {
            alert('필수 필드를 모두 입력하세요.');
            return;
        }

        const parentNode = this.treeInstance.get_node(this.selectedNode.parent);
        const oldName = this.selectedNode.text;

        // Update collaboration manager
        if (window.collaborationManager) {
            if (newName !== oldName) {
                // Remove old and add new (since we can't easily rename in collaboration)
                window.collaborationManager.removeTopic(parentNode.text, oldName);
                window.collaborationManager.addTopic(parentNode.text, newName, newProto, newDirection, newDescription);
            } else {
                window.collaborationManager.updateTopic(parentNode.text, newName, {
                    proto: newProto,
                    direction: newDirection,
                    description: newDescription
                });
            }
        }

        // Update tree node
        this.treeInstance.rename_node(this.selectedNode, newName);
        const iconClass = newDirection === 'publish' ? 'topic-publish-icon' : 'topic-subscribe-icon';
        this.treeInstance.set_icon(this.selectedNode, iconClass);
        
        this.selectedNode.data = {
            proto: newProto,
            direction: newDirection,
            description: newDescription
        };

        alert('저장되었습니다.');
    }

    /**
     * Update tree from XML structure changes
     */
    updateTreeFromXML(data) {
        // This method would be called when XML structure changes from collaboration
        // Implementation would rebuild tree structure based on current XML state
        console.log('Updating tree from XML changes:', data);
        
        // For now, just refresh the XML preview
        if (window.collaborationManager) {
            window.collaborationManager.updateXMLPreview();
        }
    }

    /**
     * Get application data from collaboration manager
     */
    getApplicationData(appName) {
        if (!window.collaborationManager) {
            return { description: '' };
        }

        const structure = window.collaborationManager.getXMLStructure();
        const app = structure.Applications.Application.find(a => a['@name'] === appName);
        
        return {
            description: app ? app['@description'] : ''
        };
    }

    /**
     * Get topic data from node
     */
    getTopicData(node) {
        if (node.data) {
            return {
                name: node.text,
                proto: node.data.proto || '',
                direction: node.data.direction || 'publish',
                description: node.data.description || ''
            };
        }

        // Fallback to collaboration manager
        if (window.collaborationManager) {
            const parentNode = this.treeInstance.get_node(node.parent);
            const structure = window.collaborationManager.getXMLStructure();
            const app = structure.Applications.Application.find(a => a['@name'] === parentNode.text);
            
            if (app) {
                const topic = app.Topic.find(t => t['@name'] === node.text);
                if (topic) {
                    return {
                        name: topic['@name'],
                        proto: topic['@proto'],
                        direction: topic['@direction'],
                        description: topic['@description']
                    };
                }
            }
        }

        return {
            name: node.text,
            proto: '',
            direction: 'publish',
            description: ''
        };
    }

    /**
     * Refresh tree structure
     */
    refreshTree() {
        if (window.collaborationManager) {
            const structure = window.collaborationManager.getXMLStructure();
            this.buildTreeFromStructure(structure);
        }
    }

    /**
     * Build tree from XML structure
     */
    buildTreeFromStructure(structure) {
        const rootNode = this.treeInstance.get_node('applications_root');
        
        // Clear existing children
        const children = this.treeInstance.get_children_dom(rootNode);
        children.each((i, child) => {
            this.treeInstance.delete_node(child);
        });

        // Add applications
        if (structure.Applications && structure.Applications.Application) {
            const applications = Array.isArray(structure.Applications.Application) 
                ? structure.Applications.Application 
                : [structure.Applications.Application];

            applications.forEach(app => {
                const appNode = {
                    'id': 'app_' + app['@name'].replace(/\s+/g, '_'),
                    'text': app['@name'],
                    'type': 'application',
                    'data': {
                        'description': app['@description'] || ''
                    },
                    'children': []
                };

                // Add topics
                if (app.Topic) {
                    const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                    topics.forEach(topic => {
                        const iconClass = topic['@direction'] === 'publish' ? 'topic-publish-icon' : 'topic-subscribe-icon';
                        appNode.children.push({
                            'id': 'topic_' + app['@name'] + '_' + topic['@name'].replace(/\s+/g, '_'),
                            'text': topic['@name'],
                            'type': 'topic',
                            'icon': iconClass,
                            'data': {
                                'proto': topic['@proto'],
                                'direction': topic['@direction'],
                                'description': topic['@description'] || ''
                            }
                        });
                    });
                }

                this.treeInstance.create_node('applications_root', appNode, 'last');
            });
        }

        this.treeInstance.open_node('applications_root');
    }
}

// Global tree editor instance
window.treeEditor = null;