/**
 * Main Application Entry Point
 */
$(document).ready(function() {
    console.log('ZeroMQ Topic Manager initialized');
    
    // Initialize all components
    initializeApplication();
    
    // Setup global event handlers
    setupGlobalEventHandlers();
});

/**
 * Initialize all application components
 */
function initializeApplication() {
    try {
        console.log('Starting application initialization...');
        
        // Initialize collaboration manager first
        try {
            window.collaborationManager = new CollaborationManager();
            console.log('CollaborationManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CollaborationManager:', error);
            showErrorMessage('협업 관리자 초기화에 실패했습니다: ' + error.message);
            return;
        }
        
        // Initialize user WebSocket client
        try {
            window.userWebSocketClient = new UserWebSocketClient();
            console.log('UserWebSocketClient initialized successfully');
        } catch (error) {
            console.error('Failed to initialize UserWebSocketClient:', error);
            showErrorMessage('웹소켓 클라이언트 초기화에 실패했습니다: ' + error.message);
            return;
        }
        
        // Initialize tree editor
        try {
            window.treeEditor = new TreeEditor();
            console.log('TreeEditor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TreeEditor:', error);
            showErrorMessage('트리 에디터 초기화에 실패했습니다: ' + error.message);
            return;
        }
        
        // Initialize XML manager
        try {
            window.xmlManager = new XMLManager();
            console.log('XMLManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize XMLManager:', error);
            showErrorMessage('XML 관리자 초기화에 실패했습니다: ' + error.message);
            return;
        }
        
        // Setup modal event handlers
        try {
            setupModalHandlers();
            console.log('Modal handlers setup successfully');
        } catch (error) {
            console.error('Failed to setup modal handlers:', error);
            showErrorMessage('모달 핸들러 설정에 실패했습니다: ' + error.message);
            return;
        }
        
        console.log('All components initialized successfully');
        showSuccessMessage('애플리케이션이 성공적으로 초기화되었습니다.');
        
        // 초기 XML 미리보기 업데이트
        setTimeout(() => {
            if (window.collaborationManager) {
                console.log('초기 XML 미리보기 업데이트 시도');
                window.collaborationManager.updateXMLPreview();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showErrorMessage('애플리케이션 초기화에 실패했습니다: ' + error.message);
    }
}

/**
 * Setup global event handlers
 */
function setupGlobalEventHandlers() {
    // Handle window resize
    $(window).on('resize', function() {
        adjustLayout();
    });
    
    // Handle browser close/refresh
    $(window).on('beforeunload', function() {
        if (window.collaborationManager) {
            window.collaborationManager.destroy();
        }
        if (window.userWebSocketClient) {
            window.userWebSocketClient.disconnect();
        }
    });
    
    // Handle keyboard shortcuts
    $(document).on('keydown', function(e) {
        handleKeyboardShortcuts(e);
    });
    
    // Handle online/offline status
    $(window).on('online', function() {
        updateNetworkStatus(true);
    });
    
    $(window).on('offline', function() {
        updateNetworkStatus(false);
    });
}

/**
 * Setup modal event handlers
 */
function setupModalHandlers() {
    // Add Application Modal
    $('#confirmAddApp').on('click', function() {
        handleAddApplication();
    });
    
    // Add Topic Modal
    $('#confirmAddTopic').on('click', function() {
        handleAddTopic();
    });
    
    // Form validation
    $('#addAppForm').on('submit', function(e) {
        e.preventDefault();
        handleAddApplication();
    });
    
    $('#addTopicForm').on('submit', function(e) {
        e.preventDefault();
        handleAddTopic();
    });
}

/**
 * Handle add application
 */
function handleAddApplication() {
    const name = $('#appName').val().trim();
    const description = $('#appDescription').val().trim();
    
    if (!name) {
        showValidationError('appName', '응용프로그램 이름을 입력하세요.');
        return;
    }
    
    // Check for duplicate names
    if (window.collaborationManager) {
        const structure = window.collaborationManager.getXMLStructure();
        if (structure.Applications && structure.Applications.Application) {
            const applications = Array.isArray(structure.Applications.Application) 
                ? structure.Applications.Application 
                : [structure.Applications.Application];
            
            if (applications.some(app => app['@name'] === name)) {
                showValidationError('appName', '이미 존재하는 응용프로그램 이름입니다.');
                return;
            }
        }
    }
    
    // Add application
    if (window.treeEditor) {
        window.treeEditor.addApplication(name, description);
        $('#addAppModal').modal('hide');
        showSuccessMessage(`응용프로그램 "${name}"이 추가되었습니다.`);
    }
}

/**
 * Handle add topic
 */
function handleAddTopic() {
    const name = $('#topicName').val().trim();
    const proto = $('#topicProto').val().trim();
    const direction = $('#topicDirection').val();
    const description = $('#topicDescription').val().trim();
    
    // Validation
    if (!name) {
        showValidationError('topicName', '토픽 이름을 입력하세요.');
        return;
    }
    
    if (!proto) {
        showValidationError('topicProto', 'Proto 파일을 입력하세요.');
        return;
    }
    
    if (!direction) {
        showValidationError('topicDirection', '방향을 선택하세요.');
        return;
    }
    
    // Check for duplicate topic names in the same application
    if (window.treeEditor && window.treeEditor.selectedNode) {
        const selectedApp = window.treeEditor.selectedNode;
        if (selectedApp.type === 'application') {
            const children = window.treeEditor.treeInstance.get_children_dom(selectedApp);
            let isDuplicate = false;
            
            children.each(function() {
                const childNode = window.treeEditor.treeInstance.get_node(this);
                if (childNode.text === name) {
                    isDuplicate = true;
                    return false;
                }
            });
            
            if (isDuplicate) {
                showValidationError('topicName', '이미 존재하는 토픽 이름입니다.');
                return;
            }
        }
    }
    
    // Add topic
    if (window.treeEditor) {
        if (window.treeEditor.addTopic(name, proto, direction, description)) {
            $('#addTopicModal').modal('hide');
            showSuccessMessage(`토픽 "${name}"이 추가되었습니다.`);
        } else {
            showErrorMessage('토픽 추가에 실패했습니다.');
        }
    }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Ctrl+S: Save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (window.xmlManager) {
            window.xmlManager.saveXML();
        }
    }
    
    // Ctrl+E: Export
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        if (window.xmlManager) {
            window.xmlManager.exportXML();
        }
    }
    
    // Ctrl+G: Generate Code
    if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        if (window.xmlManager) {
            window.xmlManager.showCodeGenerationModal();
        }
    }
    
    // Delete: Delete selected node
    if (e.key === 'Delete') {
        if (window.treeEditor && window.treeEditor.selectedNode) {
            window.treeEditor.deleteSelectedNode();
        }
    }
    
    // F2: Rename selected node
    if (e.key === 'F2') {
        if (window.treeEditor && window.treeEditor.selectedNode) {
            const node = window.treeEditor.selectedNode;
            if (node.type === 'application') {
                window.treeEditor.treeInstance.edit(node);
            }
        }
    }
}

/**
 * Adjust layout for responsive design
 */
function adjustLayout() {
    const windowHeight = $(window).height();
    const headerHeight = $('.navbar').outerHeight();
    const remainingHeight = windowHeight - headerHeight - 20; // 20px for padding
    
    $('.row.h-100').css('height', remainingHeight + 'px');
}

/**
 * Update network status
 */
function updateNetworkStatus(isOnline) {
    const statusEl = $('#connectionStatus .alert');
    
    if (isOnline) {
        statusEl.removeClass('alert-danger').addClass('alert-warning');
        statusEl.find('i').attr('class', 'fas fa-spinner fa-spin me-2');
        statusEl.find('span').text('재연결 중...');
        
        // Try to reconnect collaboration
        if (window.collaborationManager) {
            setTimeout(() => {
                window.collaborationManager.updateConnectionStatus('connected');
            }, 2000);
        }
    } else {
        statusEl.removeClass('alert-success alert-warning').addClass('alert-danger');
        statusEl.find('i').attr('class', 'fas fa-exclamation-triangle me-2');
        statusEl.find('span').text('오프라인');
    }
}

/**
 * Show validation error
 */
function showValidationError(fieldId, message) {
    const field = $('#' + fieldId);
    field.addClass('is-invalid');
    
    // Remove existing feedback
    field.siblings('.invalid-feedback').remove();
    
    // Add error message
    field.after(`<div class="invalid-feedback">${message}</div>`);
    
    // Remove error styling after user starts typing
    field.one('input', function() {
        $(this).removeClass('is-invalid');
        $(this).siblings('.invalid-feedback').remove();
    });
    
    // Focus on the field
    field.focus();
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    showNotification(message, 'success');
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    showNotification(message, 'error');
}

/**
 * Show info message
 */
function showInfoMessage(message) {
    showNotification(message, 'info');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 'alert-info';
    
    const icon = type === 'success' ? 'fas fa-check-circle' :
                 type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle';
    
    const notification = $(`
        <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
             style="top: 80px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;">
            <i class="${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    $('body').append(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.alert('close');
    }, 4000);
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce function for performance optimization
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(context, args);
    };
}

/**
 * Throttle function for performance optimization
 */
function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Generate random ID
 */
function generateId(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// Export global utilities
window.AppUtils = {
    showNotification,
    showSuccessMessage,
    showErrorMessage,
    showInfoMessage,
    formatFileSize,
    debounce,
    throttle,
    escapeHtml,
    generateId,
    deepClone
};