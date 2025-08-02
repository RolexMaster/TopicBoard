"""
XML Schema and Data Model for ZeroMQ Topic Management (Python)
pycrdt와 통합된 고급 XML 처리 기능
"""

import json
from datetime import datetime
from typing import Dict, List, Optional, Union
from dataclasses import dataclass, asdict
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom
import xmltodict
from lxml import etree
from pydantic import BaseModel, Field, validator


@dataclass
class TopicInfo:
    """토픽 정보 데이터 클래스"""
    name: str
    proto: str
    direction: str  # "publish" or "subscribe"
    description: str = ""
    
    def __post_init__(self):
        if self.direction not in ["publish", "subscribe"]:
            raise ValueError("Direction must be either 'publish' or 'subscribe'")


@dataclass
class ApplicationInfo:
    """응용프로그램 정보 데이터 클래스"""
    name: str
    description: str = ""
    topics: List[TopicInfo] = None
    
    def __post_init__(self):
        if self.topics is None:
            self.topics = []


class XMLSchemaValidator:
    """XML 스키마 검증기"""
    
    def __init__(self):
        self.schema_namespace = "http://zeromq-topic-manager/schema"
        self.schema_version = "1.0"
    
    def validate_structure(self, data: dict) -> List[str]:
        """XML 구조 검증"""
        errors = []
        
        # 루트 요소 검증
        if "Applications" not in data:
            errors.append("Root element 'Applications' is missing")
            return errors
        
        applications = data["Applications"]
        
        # 네임스페이스 검증
        if applications.get("@xmlns") != self.schema_namespace:
            errors.append(f"Invalid namespace. Expected: {self.schema_namespace}")
        
        # 버전 검증
        if applications.get("@version") != self.schema_version:
            errors.append(f"Invalid version. Expected: {self.schema_version}")
        
        # 응용프로그램 검증
        if "Application" in applications:
            apps = applications["Application"]
            if not isinstance(apps, list):
                apps = [apps]
            
            for i, app in enumerate(apps):
                app_errors = self._validate_application(app, i)
                errors.extend(app_errors)
        
        return errors
    
    def _validate_application(self, app: dict, index: int) -> List[str]:
        """개별 응용프로그램 검증"""
        errors = []
        prefix = f"Application[{index}]"
        
        # 필수 속성 검증
        if "@name" not in app:
            errors.append(f"{prefix}: Missing 'name' attribute")
        elif not app["@name"].strip():
            errors.append(f"{prefix}: Empty 'name' attribute")
        
        # 토픽 검증
        if "Topic" in app:
            topics = app["Topic"]
            if not isinstance(topics, list):
                topics = [topics]
            
            for j, topic in enumerate(topics):
                topic_errors = self._validate_topic(topic, f"{prefix}.Topic[{j}]")
                errors.extend(topic_errors)
        
        return errors
    
    def _validate_topic(self, topic: dict, prefix: str) -> List[str]:
        """개별 토픽 검증"""
        errors = []
        
        # 필수 속성 검증
        required_attrs = ["@name", "@proto", "@direction"]
        for attr in required_attrs:
            if attr not in topic:
                errors.append(f"{prefix}: Missing '{attr[1:]}' attribute")
            elif not topic[attr].strip():
                errors.append(f"{prefix}: Empty '{attr[1:]}' attribute")
        
        # 방향 검증
        if "@direction" in topic:
            direction = topic["@direction"]
            if direction not in ["publish", "subscribe"]:
                errors.append(f"{prefix}: Invalid direction '{direction}'. Must be 'publish' or 'subscribe'")
        
        # 프로토 파일 형식 검증
        if "@proto" in topic:
            proto = topic["@proto"]
            if proto and not proto.endswith(".proto"):
                errors.append(f"{prefix}: Proto file '{proto}' should end with '.proto'")
        
        return errors


class XMLProcessor:
    """고급 XML 처리 클래스"""
    
    def __init__(self):
        self.validator = XMLSchemaValidator()
    
    def dict_to_xml(self, data: dict, pretty_print: bool = True) -> str:
        """Python dict를 XML 문자열로 변환"""
        try:
            # lxml 사용한 고품질 XML 생성
            root = self._build_xml_element(data)
            
            if pretty_print:
                # 예쁘게 포맷팅
                rough_string = etree.tostring(root, encoding='unicode')
                reparsed = minidom.parseString(rough_string)
                return reparsed.toprettyxml(indent="  ")[23:]  # XML 선언 제거
            else:
                return etree.tostring(root, encoding='unicode')
                
        except Exception as e:
            raise ValueError(f"XML 변환 실패: {e}")
    
    def _build_xml_element(self, data: dict, parent=None) -> Element:
        """재귀적으로 XML 요소 생성"""
        if parent is None:
            # 루트 요소 생성
            for key, value in data.items():
                if not key.startswith('@'):
                    root = etree.Element(key)
                    self._add_attributes_and_children(root, value)
                    return root
        
        return parent
    
    def _add_attributes_and_children(self, element: Element, data: Union[dict, list, str]):
        """요소에 속성과 자식 추가"""
        if isinstance(data, dict):
            # 속성 먼저 추가
            for key, value in data.items():
                if key.startswith('@'):
                    attr_name = key[1:]  # @ 제거
                    element.set(attr_name, str(value))
            
            # 자식 요소 추가
            for key, value in data.items():
                if not key.startswith('@'):
                    if isinstance(value, list):
                        for item in value:
                            child = etree.SubElement(element, key)
                            self._add_attributes_and_children(child, item)
                    elif isinstance(value, dict):
                        child = etree.SubElement(element, key)
                        self._add_attributes_and_children(child, value)
                    else:
                        child = etree.SubElement(element, key)
                        child.text = str(value)
        
        elif isinstance(data, str):
            element.text = data
    
    def xml_to_dict(self, xml_string: str) -> dict:
        """XML 문자열을 Python dict로 변환"""
        try:
            # xmltodict 사용하여 변환
            result = xmltodict.parse(xml_string)
            return result
        except Exception as e:
            raise ValueError(f"XML 파싱 실패: {e}")
    
    def validate_and_convert(self, data: dict) -> tuple[bool, str, List[str]]:
        """검증 후 XML 변환"""
        # 검증
        errors = self.validator.validate_structure(data)
        
        if errors:
            return False, "", errors
        
        # 변환
        try:
            xml_string = self.dict_to_xml(data)
            return True, xml_string, []
        except Exception as e:
            return False, "", [f"XML 변환 실패: {e}"]


class CodeGenerator:
    """다중 언어 코드 생성기"""
    
    def __init__(self):
        self.xml_processor = XMLProcessor()
    
    def generate_code(self, 
                     structure: dict, 
                     language: str, 
                     app_name: str = "all",
                     include_comments: bool = True,
                     include_examples: bool = True) -> str:
        """지정된 언어로 코드 생성"""
        
        generators = {
            "python": self._generate_python_code,
            "cpp": self._generate_cpp_code,
            "java": self._generate_java_code,
            "csharp": self._generate_csharp_code,
            "go": self._generate_go_code,
            "rust": self._generate_rust_code
        }
        
        if language not in generators:
            raise ValueError(f"지원하지 않는 언어: {language}")
        
        applications = self._filter_applications(structure, app_name)
        return generators[language](applications, include_comments, include_examples)
    
    def _filter_applications(self, structure: dict, app_name: str) -> List[dict]:
        """필터링된 응용프로그램 목록 반환"""
        if "Applications" not in structure or "Application" not in structure["Applications"]:
            return []
        
        apps = structure["Applications"]["Application"]
        if not isinstance(apps, list):
            apps = [apps]
        
        if app_name == "all":
            return apps
        
        return [app for app in apps if app.get("@name") == app_name]
    
    def _generate_python_code(self, applications: List[dict], include_comments: bool, include_examples: bool) -> str:
        """Python 코드 생성 (향상된 버전)"""
        code = []
        
        if include_comments:
            code.extend([
                '"""',
                'Auto-generated ZeroMQ Topic Manager Code (Python)',
                f'Generated at: {datetime.now().isoformat()}',
                'Features: Type hints, async/await, error handling',
                '"""',
                '',
                'import zmq',
                'import zmq.asyncio',
                'import asyncio',
                'import json',
                'import logging',
                'from typing import Optional, Callable, Any',
                'from dataclasses import dataclass',
                'from datetime import datetime',
                '',
                '# 로깅 설정',
                'logging.basicConfig(level=logging.INFO)',
                'logger = logging.getLogger(__name__)',
                '',
            ])
        else:
            code.extend([
                'import zmq',
                'import zmq.asyncio',
                'import asyncio',
                'import json',
                'from typing import Optional, Callable, Any',
                '',
            ])
        
        # 각 응용프로그램별 클래스 생성
        for app in applications:
            app_name = app.get("@name", "Unknown")
            app_description = app.get("@description", "")
            
            if include_comments:
                code.extend([
                    f'@dataclass',
                    f'class {self._to_pascal_case(app_name)}Config:',
                    f'    """Configuration for {app_name}"""',
                    f'    host: str = "localhost"',
                    f'    base_port: int = 5555',
                    f'    timeout: int = 1000',
                    '',
                ])
            
            if include_comments:
                code.extend([
                    f'class {self._to_pascal_case(app_name)}:',
                    f'    """',
                    f'    {app_name} - ZeroMQ Topic Manager',
                    f'    Description: {app_description}',
                    f'    """',
                    '',
                ])
            else:
                code.extend([
                    f'class {self._to_pascal_case(app_name)}:',
                    '',
                ])
            
            # 초기화 메서드
            code.extend([
                f'    def __init__(self, config: Optional[{self._to_pascal_case(app_name)}Config] = None):',
                f'        self.config = config or {self._to_pascal_case(app_name)}Config()',
                f'        self.context = zmq.asyncio.Context()',
                f'        self.sockets = {{}}',
                f'        self.running = False',
                f'        self.message_handlers: dict[str, Callable] = {{}}',
                '',
            ])
            
            # 소켓 초기화
            if "Topic" in app:
                topics = app["Topic"]
                if not isinstance(topics, list):
                    topics = [topics]
                
                code.extend([
                    f'    async def initialize(self):',
                    f'        """Initialize all sockets"""',
                    f'        try:',
                ])
                
                for i, topic in enumerate(topics):
                    topic_name = topic.get("@name", f"topic_{i}")
                    direction = topic.get("@direction", "subscribe")
                    proto = topic.get("@proto", "")
                    
                    socket_type = "zmq.PUB" if direction == "publish" else "zmq.SUB"
                    port = f"self.config.base_port + {i}"
                    
                    if include_comments:
                        code.extend([
                            f'            # {topic_name} ({direction}) - {proto}',
                        ])
                    
                    code.extend([
                        f'            self.sockets["{topic_name}"] = self.context.socket({socket_type})',
                    ])
                    
                    if direction == "publish":
                        code.extend([
                            f'            self.sockets["{topic_name}"].bind(f"tcp://{{self.config.host}}:{{' + port + '}}")',
                        ])
                    else:
                        code.extend([
                            f'            self.sockets["{topic_name}"].connect(f"tcp://{{self.config.host}}:{{' + port + '}}")',
                            f'            self.sockets["{topic_name}"].setsockopt(zmq.SUBSCRIBE, b"")',
                        ])
                
                code.extend([
                    f'            self.running = True',
                    f'            logger.info(f"{app_name} initialized successfully")',
                    f'        except Exception as e:',
                    f'            logger.error(f"Failed to initialize {app_name}: {{e}}")',
                    f'            raise',
                    '',
                ])
                
                # 메시지 처리 메서드들
                for topic in topics:
                    topic_name = topic.get("@name", "")
                    direction = topic.get("@direction", "subscribe")
                    description = topic.get("@description", "")
                    
                    if direction == "publish":
                        code.extend([
                            f'    async def publish_{topic_name.lower()}(self, data: Any, topic: str = ""):',
                            f'        """Publish to {topic_name}',
                            f'        Description: {description}"""',
                            f'        try:',
                            f'            message = json.dumps({{',
                            f'                "topic": topic,',
                            f'                "data": data,',
                            f'                "timestamp": datetime.now().isoformat()',
                            f'            }})',
                            f'            await self.sockets["{topic_name}"].send_string(message)',
                            f'            logger.debug(f"Published to {topic_name}: {{message}}")',
                            f'        except Exception as e:',
                            f'            logger.error(f"Failed to publish to {topic_name}: {{e}}")',
                            f'            raise',
                            '',
                        ])
                    else:
                        code.extend([
                            f'    async def receive_{topic_name.lower()}(self) -> Optional[dict]:',
                            f'        """Receive from {topic_name}',
                            f'        Description: {description}"""',
                            f'        try:',
                            f'            message = await self.sockets["{topic_name}"].recv_string(zmq.NOBLOCK)',
                            f'            data = json.loads(message)',
                            f'            logger.debug(f"Received from {topic_name}: {{data}}")',
                            f'            return data',
                            f'        except zmq.Again:',
                            f'            return None',
                            f'        except Exception as e:',
                            f'            logger.error(f"Failed to receive from {topic_name}: {{e}}")',
                            f'            return None',
                            '',
                        ])
                
                # 메시지 핸들러 등록
                code.extend([
                    f'    def set_message_handler(self, topic: str, handler: Callable[[dict], None]):',
                    f'        """Set message handler for specific topic"""',
                    f'        self.message_handlers[topic] = handler',
                    '',
                    f'    async def start_listening(self):',
                    f'        """Start listening for messages"""',
                    f'        while self.running:',
                    f'            try:',
                ])
                
                # 모든 subscribe 토픽에 대해 리스닝
                for topic in topics:
                    if topic.get("@direction") == "subscribe":
                        topic_name = topic.get("@name", "")
                        code.extend([
                            f'                # Listen to {topic_name}',
                            f'                data = await self.receive_{topic_name.lower()}()',
                            f'                if data and "{topic_name}" in self.message_handlers:',
                            f'                    await self.message_handlers["{topic_name}"](data)',
                        ])
                
                code.extend([
                    f'                await asyncio.sleep(0.01)  # Small delay to prevent busy loop',
                    f'            except Exception as e:',
                    f'                logger.error(f"Error in message loop: {{e}}")',
                    f'                await asyncio.sleep(1)',
                    '',
                ])
            
            # 정리 메서드
            code.extend([
                f'    async def close(self):',
                f'        """Clean up resources"""',
                f'        self.running = False',
                f'        for socket in self.sockets.values():',
                f'            socket.close()',
                f'        self.context.term()',
                f'        logger.info(f"{app_name} closed")',
                '',
                f'    async def __aenter__(self):',
                f'        await self.initialize()',
                f'        return self',
                '',
                f'    async def __aexit__(self, exc_type, exc_val, exc_tb):',
                f'        await self.close()',
                '',
            ])
        
        # 사용 예제
        if include_examples:
            code.extend([
                '',
                '# Usage Example',
                'async def main():',
                '    """Example usage"""',
            ])
            
            for app in applications:
                app_name = app.get("@name", "Unknown")
                class_name = self._to_pascal_case(app_name)
                
                code.extend([
                    f'    # {app_name} example',
                    f'    async with {class_name}() as {app_name.lower()}:',
                ])
                
                # 예제 핸들러
                if "Topic" in app:
                    topics = app["Topic"]
                    if not isinstance(topics, list):
                        topics = [topics]
                    
                    for topic in topics:
                        if topic.get("@direction") == "subscribe":
                            topic_name = topic.get("@name", "")
                            code.extend([
                                f'        # Set handler for {topic_name}',
                                f'        {app_name.lower()}.set_message_handler("{topic_name}", ',
                                f'            lambda data: print(f"Received: {{data}}"))',
                            ])
                
                code.extend([
                    f'        ',
                    f'        # Start background listening',
                    f'        listening_task = asyncio.create_task({app_name.lower()}.start_listening())',
                    f'        ',
                ])
                
                # Publish 예제
                if "Topic" in app:
                    for topic in topics:
                        if topic.get("@direction") == "publish":
                            topic_name = topic.get("@name", "")
                            code.extend([
                                f'        # Publish example',
                                f'        await {app_name.lower()}.publish_{topic_name.lower()}(',
                                f'            {{"message": "Hello from {app_name}!"}}, topic="example")',
                            ])
                
                code.extend([
                    f'        ',
                    f'        # Run for a while',
                    f'        await asyncio.sleep(5)',
                    f'        ',
                    f'        # Stop listening',
                    f'        listening_task.cancel()',
                    '',
                ])
            
            code.extend([
                '',
                'if __name__ == "__main__":',
                '    asyncio.run(main())',
            ])
        
        return '\n'.join(code)
    
    def _generate_cpp_code(self, applications: List[dict], include_comments: bool, include_examples: bool) -> str:
        """C++ 코드 생성 (기존 로직 유지)"""
        # 기존 C++ 생성 로직 (향상 가능)
        code = []
        
        if include_comments:
            code.extend([
                "// Auto-generated ZeroMQ Topic Manager Code (C++)",
                f"// Generated at: {datetime.now().isoformat()}",
                "",
                "#include <zmq.hpp>",
                "#include <string>",
                "#include <iostream>",
                "#include <thread>",
                "#include <chrono>",
                "#include <functional>",
                "#include <memory>",
                "",
            ])
        else:
            code.extend([
                "#include <zmq.hpp>",
                "#include <string>",
                "#include <iostream>",
                "",
            ])
        
        # 응용프로그램별 클래스 생성
        for app in applications:
            app_name = app.get("@name", "Unknown")
            class_name = self._to_pascal_case(app_name)
            
            if include_comments:
                code.extend([
                    f"// {app_name} - {app.get('@description', '')}",
                    f"class {class_name} {{",
                    "private:",
                    "    zmq::context_t context;",
                ])
            else:
                code.extend([
                    f"class {class_name} {{",
                    "private:",
                    "    zmq::context_t context;",
                ])
            
            # 소켓 선언
            if "Topic" in app:
                topics = app["Topic"]
                if not isinstance(topics, list):
                    topics = [topics]
                
                for topic in topics:
                    topic_name = topic.get("@name", "")
                    code.append(f"    zmq::socket_t {topic_name.lower()}_socket;")
            
            code.extend([
                "",
                "public:",
                f"    {class_name}() : context(1)",
            ])
            
            # 소켓 초기화
            if "Topic" in app:
                for i, topic in enumerate(topics):
                    topic_name = topic.get("@name", "")
                    direction = topic.get("@direction", "subscribe")
                    socket_type = "ZMQ_PUB" if direction == "publish" else "ZMQ_SUB"
                    
                    if i == 0:
                        code.append(f"        , {topic_name.lower()}_socket(context, {socket_type})")
                    else:
                        code.append(f"        , {topic_name.lower()}_socket(context, {socket_type})")
            
            code.extend([
                "    {",
                "        // TODO: Configure socket connections",
                "    }",
                "",
            ])
            
            # 메서드 생성
            if "Topic" in app:
                for topic in topics:
                    topic_name = topic.get("@name", "")
                    direction = topic.get("@direction", "subscribe")
                    
                    if include_comments:
                        code.extend([
                            f"    // {topic_name} ({direction}) - {topic.get('@proto', '')}",
                        ])
                    
                    if direction == "publish":
                        code.extend([
                            f"    void publish_{topic_name.lower()}(const std::string& data) {{",
                            f"        zmq::message_t message(data.size());",
                            f"        memcpy(message.data(), data.c_str(), data.size());",
                            f"        {topic_name.lower()}_socket.send(message, zmq::send_flags::dontwait);",
                            f"    }}",
                            "",
                        ])
                    else:
                        code.extend([
                            f"    std::string receive_{topic_name.lower()}() {{",
                            f"        zmq::message_t message;",
                            f"        auto result = {topic_name.lower()}_socket.recv(message, zmq::recv_flags::dontwait);",
                            f"        if (result) {{",
                            f"            return std::string(static_cast<char*>(message.data()), message.size());",
                            f"        }}",
                            f"        return \"\";",
                            f"    }}",
                            "",
                        ])
            
            code.extend([
                "};",
                "",
            ])
        
        # 사용 예제
        if include_examples:
            code.extend([
                "// Usage Example",
                "int main() {",
            ])
            
            for app in applications:
                app_name = app.get("@name", "Unknown")
                class_name = self._to_pascal_case(app_name)
                code.append(f"    {class_name} {app_name.lower()};")
            
            code.extend([
                "    ",
                "    // TODO: Implement your logic here",
                "    ",
                "    return 0;",
                "}",
            ])
        
        return '\n'.join(code)
    
    def _generate_java_code(self, applications: List[dict], include_comments: bool, include_examples: bool) -> str:
        """Java 코드 생성"""
        # Java 코드 생성 로직
        return "// Java code generation not yet implemented"
    
    def _generate_csharp_code(self, applications: List[dict], include_comments: bool, include_examples: bool) -> str:
        """C# 코드 생성"""
        # C# 코드 생성 로직
        return "// C# code generation not yet implemented"
    
    def _generate_go_code(self, applications: List[dict], include_comments: bool, include_examples: bool) -> str:
        """Go 코드 생성"""
        # Go 코드 생성 로직
        return "// Go code generation not yet implemented"
    
    def _generate_rust_code(self, applications: List[dict], include_comments: bool, include_examples: bool) -> str:
        """Rust 코드 생성"""
        # Rust 코드 생성 로직
        return "// Rust code generation not yet implemented"
    
    def _to_pascal_case(self, text: str) -> str:
        """문자열을 PascalCase로 변환"""
        return ''.join(word.capitalize() for word in text.replace('_', ' ').replace('-', ' ').split())
    
    def _to_snake_case(self, text: str) -> str:
        """문자열을 snake_case로 변환"""
        import re
        text = re.sub(r'([A-Z])', r'_\1', text).lower()
        return re.sub(r'^_', '', text)


class XMLSchemaManager:
    """통합 XML 스키마 관리자"""
    
    def __init__(self):
        self.processor = XMLProcessor()
        self.validator = XMLSchemaValidator()
        self.code_generator = CodeGenerator()
    
    def create_default_structure(self) -> dict:
        """기본 XML 구조 생성"""
        return {
            "Applications": {
                "@xmlns": self.validator.schema_namespace,
                "@version": self.validator.schema_version,
                "Application": []
            }
        }
    
    def add_application(self, structure: dict, app_info: ApplicationInfo) -> dict:
        """응용프로그램 추가"""
        if "Applications" not in structure:
            structure = self.create_default_structure()
        
        if "Application" not in structure["Applications"]:
            structure["Applications"]["Application"] = []
        
        new_app = {
            "@name": app_info.name,
            "@description": app_info.description,
            "Topic": []
        }
        
        # 토픽 추가
        for topic in app_info.topics:
            new_topic = {
                "@name": topic.name,
                "@proto": topic.proto,
                "@direction": topic.direction,
                "@description": topic.description
            }
            new_app["Topic"].append(new_topic)
        
        structure["Applications"]["Application"].append(new_app)
        return structure
    
    def export_xml(self, structure: dict, pretty_print: bool = True) -> str:
        """XML 문자열로 내보내기"""
        return self.processor.dict_to_xml(structure, pretty_print)
    
    def import_xml(self, xml_string: str) -> dict:
        """XML 문자열에서 가져오기"""
        return self.processor.xml_to_dict(xml_string)
    
    def generate_code(self, structure: dict, **kwargs) -> str:
        """코드 생성"""
        return self.code_generator.generate_code(structure, **kwargs)
    
    def validate(self, structure: dict) -> tuple[bool, List[str]]:
        """구조 검증"""
        errors = self.validator.validate_structure(structure)
        return len(errors) == 0, errors


# 사용 예제
if __name__ == "__main__":
    # 스키마 매니저 생성
    schema_manager = XMLSchemaManager()
    
    # 기본 구조 생성
    structure = schema_manager.create_default_structure()
    
    # 응용프로그램 추가
    video_viewer = ApplicationInfo(
        name="VideoViewer",
        description="비디오 뷰어 응용프로그램",
        topics=[
            TopicInfo("PTZ_CONTROL", "ptz_ctl.proto", "publish", "PTZ 제어 명령"),
            TopicInfo("PTZ_STATUS", "ptz_info.proto", "subscribe", "PTZ 상태 정보")
        ]
    )
    
    structure = schema_manager.add_application(structure, video_viewer)
    
    # 검증
    is_valid, errors = schema_manager.validate(structure)
    print(f"유효성 검증: {'통과' if is_valid else '실패'}")
    if errors:
        for error in errors:
            print(f"  - {error}")
    
    # XML 내보내기
    xml_output = schema_manager.export_xml(structure)
    print("\nXML 출력:")
    print(xml_output)
    
    # Python 코드 생성
    python_code = schema_manager.generate_code(
        structure, 
        language="python",
        include_comments=True,
        include_examples=True
    )
    print("\nPython 코드:")
    print(python_code[:500] + "..." if len(python_code) > 500 else python_code)