/**
 * XML Manager for handling XML operations and code generation
 */
class XMLManager {
    constructor() {
        try {
            this.currentXML = null;
            this.setupEventListeners();
        } catch (error) {
            console.error('XMLManager constructor error:', error);
            this.currentXML = null;
        }
    }

    /**
     * Setup event listeners for XML operations
     */
    setupEventListeners() {
        $('#saveBtn').on('click', () => this.saveXML());
        $('#exportBtn').on('click', () => this.exportXML());
        $('#generateCodeBtn').on('click', () => this.showCodeGenerationModal());
        $('#copyXmlBtn').on('click', () => this.copyXMLToClipboard());
        
        // 파일 관리 버튼 추가
        this.addFileManagementButtons();
    }

    /**
     * Save current XML structure to file
     */
    async saveXML() {
        try {
            if (!window.collaborationManager) {
                alert('협업 관리자가 초기화되지 않았습니다.');
                return;
            }

            const response = await fetch('/api/xml/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: 'applications.xml',
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showNotification(`✅ ${result.message}`, 'success');
                console.log(`💾 저장 위치: ${result.file_path}`);
            } else {
                throw new Error(result.detail || '저장 실패');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('❌ 저장 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * Export XML as file download
     */
    exportXML() {
        try {
            if (!window.collaborationManager) {
                alert('협업 관리자가 초기화되지 않았습니다.');
                return;
            }

            const structure = window.collaborationManager.getXMLStructure();
            const xmlString = this.objectToXML(structure);

            // Create downloadable file
            const blob = new Blob([xmlString], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `zeromq-topics-${new Date().toISOString().split('T')[0]}.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showNotification('XML 파일이 다운로드되었습니다.', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('내보내기 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * Copy XML to clipboard
     */
    async copyXMLToClipboard() {
        try {
            const xmlText = $('#xmlPreview code').text();
            
            if (!xmlText) {
                alert('복사할 XML이 없습니다.');
                return;
            }

            await navigator.clipboard.writeText(xmlText);
            this.showNotification('XML이 클립보드에 복사되었습니다.', 'success');
        } catch (error) {
            console.error('Copy error:', error);
            
            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = $('#xmlPreview code').text();
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.showNotification('XML이 클립보드에 복사되었습니다.', 'success');
            } catch (fallbackError) {
                alert('클립보드 복사를 지원하지 않는 브라우저입니다.');
            }
        }
    }

    /**
     * Show code generation modal
     */
    showCodeGenerationModal() {
        if (!window.collaborationManager) {
            alert('협업 관리자가 초기화되지 않았습니다.');
            return;
        }

        const structure = window.collaborationManager.getXMLStructure();
        
        // Create modal dynamically
        const modal = $(`
            <div class="modal fade" id="codeGenModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-code me-2"></i>
                                코드 생성
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <h6>생성 옵션</h6>
                                    <div class="mb-3">
                                        <label class="form-label">언어</label>
                                        <select class="form-select" id="codeLanguage">
                                            <option value="cpp">C++</option>
                                            <option value="python">Python</option>
                                            <option value="java">Java</option>
                                            <option value="csharp">C#</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">응용프로그램</label>
                                        <select class="form-select" id="codeApplication">
                                            <option value="all">모든 응용프로그램</option>
                                            ${this.getApplicationOptions(structure)}
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="includeComments" checked>
                                            <label class="form-check-label" for="includeComments">
                                                주석 포함
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="includeExample" checked>
                                            <label class="form-check-label" for="includeExample">
                                                사용 예제 포함
                                            </label>
                                        </div>
                                    </div>
                                    <button class="btn btn-primary" onclick="xmlManager.generateCode()">
                                        <i class="fas fa-magic me-1"></i>코드 생성
                                    </button>
                                </div>
                                <div class="col-md-8">
                                    <h6>생성된 코드</h6>
                                    <pre id="generatedCode" class="bg-dark text-light p-3 rounded" style="height: 400px; overflow-y: auto;"><code>코드 생성 버튼을 클릭하세요.</code></pre>
                                    <div class="mt-2">
                                        <button class="btn btn-outline-secondary btn-sm" onclick="xmlManager.copyCodeToClipboard()">
                                            <i class="fas fa-copy me-1"></i>복사
                                        </button>
                                        <button class="btn btn-outline-secondary btn-sm" onclick="xmlManager.downloadCode()">
                                            <i class="fas fa-download me-1"></i>다운로드
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Remove existing modal if any
        $('#codeGenModal').remove();
        
        // Add to DOM and show
        $('body').append(modal);
        $('#codeGenModal').modal('show');
        
        // Clean up when modal is hidden
        $('#codeGenModal').on('hidden.bs.modal', () => {
            $('#codeGenModal').remove();
        });
    }

    /**
     * Get application options for select dropdown
     */
    getApplicationOptions(structure) {
        if (!structure.Applications || !structure.Applications.Application) {
            return '';
        }

        const applications = Array.isArray(structure.Applications.Application) 
            ? structure.Applications.Application 
            : [structure.Applications.Application];

        return applications.map(app => 
            `<option value="${app['@name']}">${app['@name']}</option>`
        ).join('');
    }

    /**
     * Generate code based on selected options
     */
    generateCode() {
        try {
            const language = $('#codeLanguage').val();
            const appName = $('#codeApplication').val();
            const includeComments = $('#includeComments').is(':checked');
            const includeExample = $('#includeExample').is(':checked');

            const structure = window.collaborationManager.getXMLStructure();
            
            let code = '';
            
            switch (language) {
                case 'cpp':
                    code = this.generateCppCode(structure, appName, includeComments, includeExample);
                    break;
                case 'python':
                    code = this.generatePythonCode(structure, appName, includeComments, includeExample);
                    break;
                case 'java':
                    code = this.generateJavaCode(structure, appName, includeComments, includeExample);
                    break;
                case 'csharp':
                    code = this.generateCSharpCode(structure, appName, includeComments, includeExample);
                    break;
                default:
                    code = '지원하지 않는 언어입니다.';
            }

            $('#generatedCode code').text(code);
            
        } catch (error) {
            console.error('Code generation error:', error);
            $('#generatedCode code').text('코드 생성 중 오류가 발생했습니다.');
        }
    }

    /**
     * Generate C++ code
     */
    generateCppCode(structure, appName, includeComments, includeExample) {
        let code = '';
        
        if (includeComments) {
            code += `// Auto-generated ZeroMQ Topic Manager Code\n`;
            code += `// Generated at: ${new Date().toISOString()}\n\n`;
        }
        
        code += `#include <zmq.hpp>\n`;
        code += `#include <string>\n`;
        code += `#include <iostream>\n\n`;
        
        const applications = this.getFilteredApplications(structure, appName);
        
        applications.forEach(app => {
            if (includeComments) {
                code += `// Application: ${app['@name']}\n`;
                if (app['@description']) {
                    code += `// Description: ${app['@description']}\n`;
                }
                code += `\n`;
            }
            
            code += `class ${this.toCamelCase(app['@name'])} {\n`;
            code += `private:\n`;
            code += `    zmq::context_t context;\n`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    const socketType = topic['@direction'] === 'publish' ? 'PUB' : 'SUB';
                    code += `    zmq::socket_t ${topic['@name'].toLowerCase()}_socket;\n`;
                });
            }
            
            code += `\npublic:\n`;
            code += `    ${this.toCamelCase(app['@name'])}() : context(1)`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    const socketType = topic['@direction'] === 'publish' ? 'ZMQ_PUB' : 'ZMQ_SUB';
                    code += `,\n        ${topic['@name'].toLowerCase()}_socket(context, ${socketType})`;
                });
            }
            
            code += ` {\n`;
            code += `        // TODO: Configure socket connections\n`;
            code += `    }\n\n`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    if (includeComments) {
                        code += `    // Topic: ${topic['@name']} (${topic['@direction']})\n`;
                        code += `    // Proto: ${topic['@proto']}\n`;
                        if (topic['@description']) {
                            code += `    // Description: ${topic['@description']}\n`;
                        }
                    }
                    
                    if (topic['@direction'] === 'publish') {
                        code += `    void publish_${topic['@name'].toLowerCase()}(const std::string& data) {\n`;
                        code += `        zmq::message_t message(data.size());\n`;
                        code += `        memcpy(message.data(), data.c_str(), data.size());\n`;
                        code += `        ${topic['@name'].toLowerCase()}_socket.send(message, zmq::send_flags::dontwait);\n`;
                        code += `    }\n\n`;
                    } else {
                        code += `    std::string receive_${topic['@name'].toLowerCase()}() {\n`;
                        code += `        zmq::message_t message;\n`;
                        code += `        auto result = ${topic['@name'].toLowerCase()}_socket.recv(message, zmq::recv_flags::dontwait);\n`;
                        code += `        if (result) {\n`;
                        code += `            return std::string(static_cast<char*>(message.data()), message.size());\n`;
                        code += `        }\n`;
                        code += `        return "";\n`;
                        code += `    }\n\n`;
                    }
                });
            }
            
            code += `};\n\n`;
        });
        
        if (includeExample) {
            code += `// Usage Example\n`;
            code += `int main() {\n`;
            applications.forEach(app => {
                code += `    ${this.toCamelCase(app['@name'])} ${app['@name'].toLowerCase()};\n`;
            });
            code += `    \n`;
            code += `    // TODO: Implement your logic here\n`;
            code += `    \n`;
            code += `    return 0;\n`;
            code += `}\n`;
        }
        
        return code;
    }

    /**
     * Generate Python code
     */
    generatePythonCode(structure, appName, includeComments, includeExample) {
        let code = '';
        
        if (includeComments) {
            code += `# Auto-generated ZeroMQ Topic Manager Code\n`;
            code += `# Generated at: ${new Date().toISOString()}\n\n`;
        }
        
        code += `import zmq\nimport json\nfrom typing import Optional\n\n`;
        
        const applications = this.getFilteredApplications(structure, appName);
        
        applications.forEach(app => {
            if (includeComments) {
                code += `# Application: ${app['@name']}\n`;
                if (app['@description']) {
                    code += `# Description: ${app['@description']}\n`;
                }
                code += `\n`;
            }
            
            code += `class ${this.toPascalCase(app['@name'])}:\n`;
            code += `    def __init__(self):\n`;
            code += `        self.context = zmq.Context()\n`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    const socketType = topic['@direction'] === 'publish' ? 'zmq.PUB' : 'zmq.SUB';
                    code += `        self.${topic['@name'].toLowerCase()}_socket = self.context.socket(${socketType})\n`;
                });
            }
            
            code += `        # TODO: Configure socket connections\n\n`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    if (includeComments) {
                        code += `    # Topic: ${topic['@name']} (${topic['@direction']})\n`;
                        code += `    # Proto: ${topic['@proto']}\n`;
                        if (topic['@description']) {
                            code += `    # Description: ${topic['@description']}\n`;
                        }
                    }
                    
                    if (topic['@direction'] === 'publish') {
                        code += `    def publish_${topic['@name'].toLowerCase()}(self, data: str) -> None:\n`;
                        code += `        self.${topic['@name'].toLowerCase()}_socket.send_string(data, zmq.NOBLOCK)\n\n`;
                    } else {
                        code += `    def receive_${topic['@name'].toLowerCase()}(self) -> Optional[str]:\n`;
                        code += `        try:\n`;
                        code += `            return self.${topic['@name'].toLowerCase()}_socket.recv_string(zmq.NOBLOCK)\n`;
                        code += `        except zmq.Again:\n`;
                        code += `            return None\n\n`;
                    }
                });
            }
            
            code += `    def close(self):\n`;
            code += `        self.context.term()\n\n`;
        });
        
        if (includeExample) {
            code += `# Usage Example\n`;
            code += `if __name__ == "__main__":\n`;
            applications.forEach(app => {
                code += `    ${app['@name'].toLowerCase()} = ${this.toPascalCase(app['@name'])}()\n`;
            });
            code += `    \n`;
            code += `    # TODO: Implement your logic here\n`;
            code += `    \n`;
            applications.forEach(app => {
                code += `    ${app['@name'].toLowerCase()}.close()\n`;
            });
        }
        
        return code;
    }

    /**
     * Generate Java code
     */
    generateJavaCode(structure, appName, includeComments, includeExample) {
        let code = '';
        
        if (includeComments) {
            code += `// Auto-generated ZeroMQ Topic Manager Code\n`;
            code += `// Generated at: ${new Date().toISOString()}\n\n`;
        }
        
        code += `import org.zeromq.ZMQ;\nimport org.zeromq.ZContext;\n\n`;
        
        const applications = this.getFilteredApplications(structure, appName);
        
        applications.forEach(app => {
            if (includeComments) {
                code += `/**\n`;
                code += ` * Application: ${app['@name']}\n`;
                if (app['@description']) {
                    code += ` * Description: ${app['@description']}\n`;
                }
                code += ` */\n`;
            }
            
            code += `public class ${this.toPascalCase(app['@name'])} {\n`;
            code += `    private ZContext context;\n`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    code += `    private ZMQ.Socket ${topic['@name'].toLowerCase()}Socket;\n`;
                });
            }
            
            code += `\n    public ${this.toPascalCase(app['@name'])}() {\n`;
            code += `        context = new ZContext();\n`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    const socketType = topic['@direction'] === 'publish' ? 'ZMQ.PUB' : 'ZMQ.SUB';
                    code += `        ${topic['@name'].toLowerCase()}Socket = context.createSocket(${socketType});\n`;
                });
            }
            
            code += `        // TODO: Configure socket connections\n`;
            code += `    }\n\n`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    if (includeComments) {
                        code += `    /**\n`;
                        code += `     * Topic: ${topic['@name']} (${topic['@direction']})\n`;
                        code += `     * Proto: ${topic['@proto']}\n`;
                        if (topic['@description']) {
                            code += `     * Description: ${topic['@description']}\n`;
                        }
                        code += `     */\n`;
                    }
                    
                    if (topic['@direction'] === 'publish') {
                        code += `    public void publish${this.toPascalCase(topic['@name'])}(String data) {\n`;
                        code += `        ${topic['@name'].toLowerCase()}Socket.send(data, ZMQ.NOBLOCK);\n`;
                        code += `    }\n\n`;
                    } else {
                        code += `    public String receive${this.toPascalCase(topic['@name'])}() {\n`;
                        code += `        return ${topic['@name'].toLowerCase()}Socket.recvStr(ZMQ.NOBLOCK);\n`;
                        code += `    }\n\n`;
                    }
                });
            }
            
            code += `    public void close() {\n`;
            code += `        context.close();\n`;
            code += `    }\n`;
            code += `}\n\n`;
        });
        
        if (includeExample) {
            code += `// Usage Example\n`;
            code += `public class Example {\n`;
            code += `    public static void main(String[] args) {\n`;
            applications.forEach(app => {
                code += `        ${this.toPascalCase(app['@name'])} ${app['@name'].toLowerCase()} = new ${this.toPascalCase(app['@name'])}();\n`;
            });
            code += `        \n`;
            code += `        // TODO: Implement your logic here\n`;
            code += `        \n`;
            applications.forEach(app => {
                code += `        ${app['@name'].toLowerCase()}.close();\n`;
            });
            code += `    }\n`;
            code += `}\n`;
        }
        
        return code;
    }

    /**
     * Generate C# code
     */
    generateCSharpCode(structure, appName, includeComments, includeExample) {
        let code = '';
        
        if (includeComments) {
            code += `// Auto-generated ZeroMQ Topic Manager Code\n`;
            code += `// Generated at: ${new Date().toISOString()}\n\n`;
        }
        
        code += `using NetMQ;\nusing NetMQ.Sockets;\nusing System;\n\n`;
        
        const applications = this.getFilteredApplications(structure, appName);
        
        applications.forEach(app => {
            if (includeComments) {
                code += `/// <summary>\n`;
                code += `/// Application: ${app['@name']}\n`;
                if (app['@description']) {
                    code += `/// Description: ${app['@description']}\n`;
                }
                code += `/// </summary>\n`;
            }
            
            code += `public class ${this.toPascalCase(app['@name'])} : IDisposable\n{\n`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    const socketType = topic['@direction'] === 'publish' ? 'PublisherSocket' : 'SubscriberSocket';
                    code += `    private ${socketType} ${topic['@name'].toLowerCase()}Socket;\n`;
                });
            }
            
            code += `\n    public ${this.toPascalCase(app['@name'])}()\n    {\n`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    const socketType = topic['@direction'] === 'publish' ? 'PublisherSocket' : 'SubscriberSocket';
                    code += `        ${topic['@name'].toLowerCase()}Socket = new ${socketType}();\n`;
                });
            }
            
            code += `        // TODO: Configure socket connections\n`;
            code += `    }\n\n`;
            
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    if (includeComments) {
                        code += `    /// <summary>\n`;
                        code += `    /// Topic: ${topic['@name']} (${topic['@direction']})\n`;
                        code += `    /// Proto: ${topic['@proto']}\n`;
                        if (topic['@description']) {
                            code += `    /// Description: ${topic['@description']}\n`;
                        }
                        code += `    /// </summary>\n`;
                    }
                    
                    if (topic['@direction'] === 'publish') {
                        code += `    public void Publish${this.toPascalCase(topic['@name'])}(string data)\n    {\n`;
                        code += `        ${topic['@name'].toLowerCase()}Socket.TrySendFrame(data, TimeSpan.Zero);\n`;
                        code += `    }\n\n`;
                    } else {
                        code += `    public string Receive${this.toPascalCase(topic['@name'])}()\n    {\n`;
                        code += `        string message;\n`;
                        code += `        if (${topic['@name'].toLowerCase()}Socket.TryReceiveFrameString(TimeSpan.Zero, out message))\n`;
                        code += `            return message;\n`;
                        code += `        return null;\n`;
                        code += `    }\n\n`;
                    }
                });
            }
            
            code += `    public void Dispose()\n    {\n`;
            if (app.Topic) {
                const topics = Array.isArray(app.Topic) ? app.Topic : [app.Topic];
                topics.forEach(topic => {
                    code += `        ${topic['@name'].toLowerCase()}Socket?.Dispose();\n`;
                });
            }
            code += `    }\n`;
            code += `}\n\n`;
        });
        
        if (includeExample) {
            code += `// Usage Example\n`;
            code += `class Program\n{\n`;
            code += `    static void Main(string[] args)\n    {\n`;
            applications.forEach(app => {
                code += `        using var ${app['@name'].toLowerCase()} = new ${this.toPascalCase(app['@name'])}();\n`;
            });
            code += `        \n`;
            code += `        // TODO: Implement your logic here\n`;
            code += `    }\n`;
            code += `}\n`;
        }
        
        return code;
    }

    /**
     * Get filtered applications based on selection
     */
    getFilteredApplications(structure, appName) {
        if (!structure.Applications || !structure.Applications.Application) {
            return [];
        }

        const applications = Array.isArray(structure.Applications.Application) 
            ? structure.Applications.Application 
            : [structure.Applications.Application];

        if (appName === 'all') {
            return applications;
        }

        return applications.filter(app => app['@name'] === appName);
    }

    /**
     * Copy generated code to clipboard
     */
    async copyCodeToClipboard() {
        try {
            const code = $('#generatedCode code').text();
            await navigator.clipboard.writeText(code);
            this.showNotification('코드가 클립보드에 복사되었습니다.', 'success');
        } catch (error) {
            console.error('Copy error:', error);
            alert('클립보드 복사를 지원하지 않는 브라우저입니다.');
        }
    }

    /**
     * Download generated code as file
     */
    downloadCode() {
        try {
            const code = $('#generatedCode code').text();
            const language = $('#codeLanguage').val();
            const appName = $('#codeApplication').val();
            
            const extensions = {
                'cpp': 'cpp',
                'python': 'py',
                'java': 'java',
                'csharp': 'cs'
            };
            
            const filename = `${appName === 'all' ? 'all_applications' : appName}.${extensions[language]}`;
            
            const blob = new Blob([code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showNotification('코드 파일이 다운로드되었습니다.', 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('다운로드 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * Convert object to XML string
     */
    objectToXML(obj) {
        return window.collaborationManager.objectToXML(obj);
    }

    /**
     * Convert string to camelCase
     */
    toCamelCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    }

    /**
     * Convert string to PascalCase
     */
    toPascalCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
            return word.toUpperCase();
        }).replace(/\s+/g, '');
    }

    /**
     * Add file management buttons to header
     */
    addFileManagementButtons() {
        const headerActions = $('.navbar-nav.ms-auto');
        
        // 파일 관리 버튼 추가
        const fileManagerBtn = $(`
            <button class="btn btn-outline-light ms-2" id="fileManagerBtn" title="파일 관리">
                <i class="fas fa-folder-open"></i>
            </button>
        `);
        
        fileManagerBtn.on('click', () => this.showFileManagerModal());
        headerActions.prepend(fileManagerBtn);
    }

    /**
     * Show file manager modal
     */
    async showFileManagerModal() {
        try {
            // 파일 목록 가져오기
            const response = await fetch('/api/files');
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error('파일 목록을 가져올 수 없습니다.');
            }
            
            const modal = $(`
                <div class="modal fade" id="fileManagerModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-folder-open me-2"></i>
                                    파일 관리
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6><i class="fas fa-file-code me-2"></i>XML 파일</h6>
                                        <div id="xmlFilesList" class="file-list">
                                            ${this.renderFileList(data.files)}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6><i class="fas fa-archive me-2"></i>백업 파일</h6>
                                        <div id="backupFilesList" class="file-list">
                                            ${this.renderBackupList(data.backups)}
                                        </div>
                                    </div>
                                </div>
                                
                                <hr>
                                
                                <div class="row">
                                    <div class="col-12">
                                        <h6><i class="fas fa-info-circle me-2"></i>저장소 정보</h6>
                                        <div class="storage-info">
                                            <small class="text-muted">
                                                📁 XML 파일: ${data.storage_info.xml_files_count}개 
                                                (${this.formatBytes(data.storage_info.xml_total_size)})<br>
                                                📦 백업 파일: ${data.storage_info.backup_files_count}개 
                                                (${this.formatBytes(data.storage_info.backup_total_size)})<br>
                                                📍 저장 위치: ${data.storage_info.xml_dir}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                                <button type="button" class="btn btn-primary" onclick="xmlManager.refreshFileList()">
                                    <i class="fas fa-sync-alt"></i> 새로고침
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            
            // 기존 모달 제거
            $('#fileManagerModal').remove();
            
            // 새 모달 추가 및 표시
            $('body').append(modal);
            $('#fileManagerModal').modal('show');
            
            // 모달 숨김 시 제거
            $('#fileManagerModal').on('hidden.bs.modal', () => {
                $('#fileManagerModal').remove();
            });
            
        } catch (error) {
            console.error('File manager error:', error);
            this.showNotification('파일 관리자를 열 수 없습니다.', 'error');
        }
    }

    /**
     * Render file list HTML
     */
    renderFileList(files) {
        if (!files || files.length === 0) {
            return '<div class="text-muted">저장된 파일이 없습니다.</div>';
        }
        
        return files.map(file => `
            <div class="file-item d-flex justify-content-between align-items-center p-2 border-bottom">
                <div>
                    <strong>${file.name}</strong><br>
                    <small class="text-muted">
                        ${new Date(file.modified).toLocaleString()} 
                        (${this.formatBytes(file.size)})
                    </small>
                </div>
                <div class="btn-group-vertical btn-group-sm">
                    <button class="btn btn-outline-primary btn-sm" onclick="xmlManager.loadFile('${file.name}')" title="로드">
                        <i class="fas fa-folder-open"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="xmlManager.deleteFile('${file.name}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render backup list HTML
     */
    renderBackupList(backups) {
        if (!backups || backups.length === 0) {
            return '<div class="text-muted">백업 파일이 없습니다.</div>';
        }
        
        return backups.map(backup => `
            <div class="file-item d-flex justify-content-between align-items-center p-2 border-bottom">
                <div>
                    <strong>${backup.name}</strong><br>
                    <small class="text-muted">
                        ${new Date(backup.created).toLocaleString()} 
                        (${this.formatBytes(backup.size)})
                    </small>
                </div>
                <div>
                    <button class="btn btn-outline-success btn-sm" onclick="xmlManager.restoreBackup('${backup.name}')" title="복원">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load XML file
     */
    async loadFile(filename) {
        try {
            const response = await fetch('/api/files/load', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showNotification(`📂 ${result.message}`, 'success');
                // TODO: XML 내용을 Yjs 문서에 로드
                console.log('로드된 XML:', result.xml_content);
                $('#fileManagerModal').modal('hide');
            } else {
                throw new Error(result.detail || '파일 로드 실패');
            }
        } catch (error) {
            console.error('Load file error:', error);
            this.showNotification('파일 로드에 실패했습니다.', 'error');
        }
    }

    /**
     * Delete XML file
     */
    async deleteFile(filename) {
        if (!confirm(`파일 '${filename}'을 삭제하시겠습니까?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/files/${filename}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showNotification(`🗑️ ${result.message}`, 'success');
                await this.refreshFileList();
            } else {
                throw new Error(result.detail || '파일 삭제 실패');
            }
        } catch (error) {
            console.error('Delete file error:', error);
            this.showNotification('파일 삭제에 실패했습니다.', 'error');
        }
    }

    /**
     * Restore backup file
     */
    async restoreBackup(backupFilename) {
        if (!confirm(`백업 '${backupFilename}'에서 복원하시겠습니까?`)) {
            return;
        }
        
        try {
            const response = await fetch('/api/files/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    backup_filename: backupFilename,
                    target_filename: 'applications.xml'
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showNotification(`🔄 ${result.message}`, 'success');
                await this.refreshFileList();
            } else {
                throw new Error(result.detail || '백업 복원 실패');
            }
        } catch (error) {
            console.error('Restore backup error:', error);
            this.showNotification('백업 복원에 실패했습니다.', 'error');
        }
    }

    /**
     * Refresh file list
     */
    async refreshFileList() {
        const modal = $('#fileManagerModal');
        if (modal.length > 0) {
            modal.modal('hide');
            setTimeout(() => this.showFileManagerModal(), 300);
        }
    }

    /**
     * Format bytes to human readable string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 'alert-info';
        
        const notification = $(`
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        $('body').append(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.alert('close');
        }, 3000);
    }
}

// Global XML manager instance
window.xmlManager = null;