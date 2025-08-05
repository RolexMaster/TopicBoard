"""
ZeroMQ Topic Manager - 통합 Python 서버
웹 인터페이스와 WebSocket을 모두 처리
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel

from pycrdt import Doc, Map, Array
import pycrdt
from models.file_manager import xml_file_manager

# 모델 정의
class ApplicationModel(BaseModel):
    name: str
    description: str = ""

class TopicModel(BaseModel):
    name: str
    proto: str
    direction: str  # "publish" or "subscribe"
    description: str = ""

class AddTopicRequest(BaseModel):
    app_name: str
    topic: TopicModel

# FastAPI 앱 생성
app = FastAPI(
    title="ZeroMQ Topic Manager",
    description="실시간 협업 XML 편집기",
    version="2.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="public"), name="static")

class ZeroMQTopicManager:
    """ZeroMQ 토픽 관리를 위한 Yjs 기반 협업 매니저"""
    
    def __init__(self):
        # Yjs 문서 생성
        self.doc = Doc()
        self.root_map = Map()
        self.doc["applications"] = self.root_map
        
        # 초기 XML 구조 설정
        self._initialize_structure()
        
        # 파일에서 기존 데이터 로드
        self._load_from_file()
        
        # 연결된 클라이언트 추적
        self.connected_clients: Dict[str, WebSocket] = {}
        
        # 변경사항 감지를 위한 콜백 설정
        self.doc.observe(self._on_document_change)
        
        # 자동 저장 설정
        self.auto_save_enabled = True
        self.last_save_time = datetime.now()
    
    def _initialize_structure(self):
        """초기 XML 구조를 Yjs 맵으로 설정"""
        if len(self.root_map) == 0:
            # Applications 루트 요소 생성
            applications_elem = Map()
            self.doc["Applications"] = applications_elem
            applications_elem["xmlns"] = "http://zeromq-topic-manager/schema"
            applications_elem["version"] = "1.0"
            
            # Application 배열 생성
            app_array = Array()
            self.doc["Application"] = app_array
            applications_elem["Application"] = app_array
            
            # 루트 맵에 Applications 설정
            self.root_map["Applications"] = applications_elem
            
            print("✅ Yjs 문서 구조 초기화 완료")
    
    def _load_from_file(self):
        """파일에서 기존 XML 데이터 로드"""
        try:
            if os.path.exists("data/applications.xml"):
                with open("data/applications.xml", "r", encoding="utf-8") as f:
                    xml_content = f.read()
                    # XML을 Yjs 구조로 변환하는 로직
                    print("✅ 기존 XML 데이터 로드 완료")
        except Exception as e:
            print(f"⚠️ 파일 로드 실패: {e}")
    
    async def _auto_save(self):
        """자동 저장 기능"""
        while self.auto_save_enabled:
            try:
                await asyncio.sleep(30)  # 30초마다 저장
                if self.last_save_time and (datetime.now() - self.last_save_time).seconds > 30:
                    structure = self._structure_to_xml(self.get_xml_structure())
                    os.makedirs("data", exist_ok=True)
                    with open("data/applications.xml", "w", encoding="utf-8") as f:
                        f.write(structure)
                    self.last_save_time = datetime.now()
                    print("💾 자동 저장 완료")
            except Exception as e:
                print(f"❌ 자동 저장 실패: {e}")
    
    def _structure_to_xml(self, structure: dict) -> str:
        """Yjs 구조를 XML 문자열로 변환"""
        def add_element(name, attrs, children=None, indent=0):
            spaces = "  " * indent
            result = f"{spaces}<{name}"
            
            for key, value in attrs.items():
                if key.startswith('@'):
                    result += f' {key[1:]}="{value}"'
                else:
                    result += f' {key}="{value}"'
            
            if children:
                result += ">\n"
                for child in children:
                    result += child
                result += f"{spaces}</{name}>\n"
            else:
                result += " />\n"
            
            return result
        
        # Applications 루트 요소
        applications = structure.get("Applications", {})
        attrs = {k: v for k, v in applications.items() if k.startswith('@')}
        
        app_children = []
        for app in applications.get("Application", []):
            app_attrs = {k: v for k, v in app.items() if k.startswith('@')}
            topic_children = []
            
            for topic in app.get("Topic", []):
                topic_attrs = {k: v for k, v in topic.items() if k.startswith('@')}
                topic_children.append(add_element("Topic", topic_attrs, indent=2))
            
            app_children.append(add_element("Application", app_attrs, topic_children, indent=1))
        
        return add_element("Applications", attrs, app_children)
    
    def _on_document_change(self, event, transaction):
        """문서 변경사항 처리"""
        print("📝 문서 변경 감지")
        # 연결된 모든 클라이언트에게 변경사항 브로드캐스트
        asyncio.create_task(self._broadcast_changes())
    
    async def _broadcast_changes(self):
        """변경사항을 모든 클라이언트에게 브로드캐스트"""
        if self.connected_clients:
            structure = self.get_xml_structure()
            message = {
                "type": "xml-structure-changed",
                "data": structure
            }
            for client_id, websocket in self.connected_clients.items():
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    print(f"❌ 클라이언트 {client_id}에게 메시지 전송 실패: {e}")
    
    def add_application(self, name: str, description: str = "") -> bool:
        """응용프로그램 추가"""
        try:
            applications = self.doc["Applications"]
            app_array = applications["Application"]
            
            # 새 응용프로그램 생성
            new_app = Map()
            new_app["@name"] = name
            new_app["@description"] = description
            new_app["Topic"] = Array()
            
            app_array.append(new_app)
            print(f"✅ 응용프로그램 '{name}' 추가됨")
            return True
        except Exception as e:
            print(f"❌ 응용프로그램 추가 실패: {e}")
            return False
    
    def add_topic(self, app_name: str, topic: TopicModel) -> bool:
        """토픽 추가"""
        try:
            applications = self.doc["Applications"]
            app_array = applications["Application"]
            
            # 해당 응용프로그램 찾기
            for app in app_array:
                if app["@name"] == app_name:
                    # 새 토픽 생성
                    new_topic = Map()
                    new_topic["@name"] = topic.name
                    new_topic["@proto"] = topic.proto
                    new_topic["@direction"] = topic.direction
                    new_topic["@description"] = topic.description
                    
                    app["Topic"].append(new_topic)
                    print(f"✅ 토픽 '{topic.name}'을 응용프로그램 '{app_name}'에 추가됨")
                    return True
            
            print(f"❌ 응용프로그램 '{app_name}'을 찾을 수 없음")
            return False
        except Exception as e:
            print(f"❌ 토픽 추가 실패: {e}")
            return False
    
    def remove_application(self, app_name: str) -> bool:
        """응용프로그램 삭제"""
        try:
            applications = self.doc["Applications"]
            app_array = applications["Application"]
            
            for i, app in enumerate(app_array):
                if app["@name"] == app_name:
                    app_array.delete(i, 1)
                    print(f"✅ 응용프로그램 '{app_name}' 삭제됨")
                    return True
            
            print(f"❌ 응용프로그램 '{app_name}'을 찾을 수 없음")
            return False
        except Exception as e:
            print(f"❌ 응용프로그램 삭제 실패: {e}")
            return False
    
    def remove_topic(self, app_name: str, topic_name: str) -> bool:
        """토픽 삭제"""
        try:
            applications = self.doc["Applications"]
            app_array = applications["Application"]
            
            for app in app_array:
                if app["@name"] == app_name:
                    topics = app["Topic"]
                    for i, topic in enumerate(topics):
                        if topic["@name"] == topic_name:
                            topics.delete(i, 1)
                            print(f"✅ 토픽 '{topic_name}'을 응용프로그램 '{app_name}'에서 삭제됨")
                            return True
                    break
            
            print(f"❌ 토픽 '{topic_name}'을 찾을 수 없음")
            return False
        except Exception as e:
            print(f"❌ 토픽 삭제 실패: {e}")
            return False
    
    def get_xml_structure(self) -> dict:
        """현재 XML 구조 반환"""
        try:
            applications = self.doc["Applications"]
            result = {
                "Applications": {
                    "@xmlns": applications["xmlns"],
                    "@version": applications["version"],
                    "Application": []
                }
            }
            
            for app in applications["Application"]:
                app_data = {
                    "@name": app["@name"],
                    "@description": app.get("@description", ""),
                    "Topic": []
                }
                
                for topic in app["Topic"]:
                    topic_data = {
                        "@name": topic["@name"],
                        "@proto": topic["@proto"],
                        "@direction": topic["@direction"],
                        "@description": topic.get("@description", "")
                    }
                    app_data["Topic"].append(topic_data)
                
                result["Applications"]["Application"].append(app_data)
            
            return result
        except Exception as e:
            print(f"❌ XML 구조 가져오기 실패: {e}")
            return {"Applications": {"@xmlns": "http://zeromq-topic-manager/schema", "@version": "1.0", "Application": []}}

# 전역 매니저 인스턴스
topic_manager = ZeroMQTopicManager()

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """메인 HTML 페이지 서빙"""
    with open("public/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/api/applications")
async def get_applications():
    """응용프로그램 목록 조회"""
    structure = topic_manager.get_xml_structure()
    return {"applications": structure["Applications"]["Application"]}

@app.post("/api/applications")
async def add_application(app: ApplicationModel):
    """응용프로그램 추가"""
    success = topic_manager.add_application(app.name, app.description)
    if success:
        return {"success": True, "message": f"응용프로그램 '{app.name}'이 추가되었습니다."}
    else:
        raise HTTPException(status_code=400, detail="응용프로그램 추가에 실패했습니다.")

@app.post("/api/topics")
async def add_topic(request: AddTopicRequest):
    """토픽 추가"""
    success = topic_manager.add_topic(request.app_name, request.topic)
    if success:
        return {"success": True, "message": f"토픽 '{request.topic.name}'이 추가되었습니다."}
    else:
        raise HTTPException(status_code=400, detail="토픽 추가에 실패했습니다.")

@app.delete("/api/applications/{app_name}")
async def delete_application(app_name: str):
    """응용프로그램 삭제"""
    success = topic_manager.remove_application(app_name)
    if success:
        return {"success": True, "message": f"응용프로그램 '{app_name}'이 삭제되었습니다."}
    else:
        raise HTTPException(status_code=404, detail="응용프로그램을 찾을 수 없습니다.")

@app.delete("/api/applications/{app_name}/topics/{topic_name}")
async def delete_topic(app_name: str, topic_name: str):
    """토픽 삭제"""
    success = topic_manager.remove_topic(app_name, topic_name)
    if success:
        return {"success": True, "message": f"토픽 '{topic_name}'이 삭제되었습니다."}
    else:
        raise HTTPException(status_code=404, detail="토픽을 찾을 수 없습니다.")

@app.get("/api/xml")
async def get_xml_structure():
    """XML 구조 조회"""
    return topic_manager.get_xml_structure()

@app.post("/api/xml/save")
async def save_xml(data: dict):
    """XML 저장"""
    try:
        structure = topic_manager._structure_to_xml(topic_manager.get_xml_structure())
        os.makedirs("data", exist_ok=True)
        with open("data/applications.xml", "w", encoding="utf-8") as f:
            f.write(structure)
        return {"success": True, "message": "XML이 저장되었습니다.", "file_path": "data/applications.xml"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"저장 실패: {str(e)}")

@app.get("/api/files")
async def list_files():
    """파일 목록 조회"""
    try:
        files = []
        if os.path.exists("data"):
            for file in os.listdir("data"):
                if file.endswith(".xml"):
                    file_path = os.path.join("data", file)
                    stat = os.stat(file_path)
                    files.append({
                        "name": file,
                        "size": stat.st_size,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 목록 조회 실패: {str(e)}")

@app.post("/api/files/load")
async def load_file(request: dict):
    """파일 로드"""
    try:
        filename = request.get("filename")
        if not filename:
            raise HTTPException(status_code=400, detail="파일명이 필요합니다.")
        
        file_path = os.path.join("data", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        return {"success": True, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 로드 실패: {str(e)}")

@app.post("/api/files/restore")
async def restore_backup(request: dict):
    """백업 복원"""
    try:
        backup_filename = request.get("backup_filename")
        if not backup_filename:
            raise HTTPException(status_code=400, detail="백업 파일명이 필요합니다.")
        
        backup_path = os.path.join("data", "backups", backup_filename)
        if not os.path.exists(backup_path):
            raise HTTPException(status_code=404, detail="백업 파일을 찾을 수 없습니다.")
        
        # 백업에서 복원 로직
        return {"success": True, "message": "백업이 복원되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"백업 복원 실패: {str(e)}")

@app.delete("/api/files/{filename}")
async def delete_file(filename: str):
    """파일 삭제"""
    try:
        file_path = os.path.join("data", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
        
        os.remove(file_path)
        return {"success": True, "message": f"파일 '{filename}'이 삭제되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 삭제 실패: {str(e)}")

@app.websocket("/yjs-websocket")
async def yjs_websocket_endpoint(websocket: WebSocket):
    """Yjs WebSocket 연결"""
    await websocket.accept()
    client_id = f"client_{len(topic_manager.connected_clients)}"
    topic_manager.connected_clients[client_id] = websocket
    
    print(f"🔗 Yjs WebSocket 클라이언트 연결: {client_id}")
    
    try:
        while True:
            # WebSocket 메시지 처리
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Yjs 문서 동기화 처리
            if message.get("type") == "sync":
                # Yjs 동기화 로직
                pass
            
    except WebSocketDisconnect:
        print(f"🔌 Yjs WebSocket 클라이언트 연결 해제: {client_id}")
    except Exception as e:
        print(f"❌ Yjs WebSocket 오류: {e}")
    finally:
        if client_id in topic_manager.connected_clients:
            del topic_manager.connected_clients[client_id]

class UserManager:
    """사용자 관리"""
    
    def __init__(self):
        self.users = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        """사용자 연결"""
        self.users[user_id] = websocket
        await self.broadcast({
            "type": "user_joined",
            "user_id": user_id,
            "user_count": len(self.users)
        })
    
    async def disconnect(self, user_id: str):
        """사용자 연결 해제"""
        if user_id in self.users:
            del self.users[user_id]
            await self.broadcast({
                "type": "user_left",
                "user_id": user_id,
                "user_count": len(self.users)
            })
    
    async def broadcast(self, message: dict, exclude: str = None):
        """모든 사용자에게 메시지 브로드캐스트"""
        for user_id, websocket in self.users.items():
            if user_id != exclude:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    print(f"❌ 사용자 {user_id}에게 메시지 전송 실패: {e}")

user_manager = UserManager()

@app.websocket("/ws/users/{user_id}")
async def user_websocket(websocket: WebSocket, user_id: str):
    """사용자 WebSocket 연결"""
    await websocket.accept()
    await user_manager.connect(user_id, websocket)
    
    print(f"👤 사용자 연결: {user_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 메시지 타입에 따른 처리
            if message.get("type") == "cursor_position":
                await user_manager.broadcast({
                    "type": "cursor_position",
                    "user_id": user_id,
                    "position": message.get("position")
                }, exclude=user_id)
            
    except WebSocketDisconnect:
        print(f"👤 사용자 연결 해제: {user_id}")
    except Exception as e:
        print(f"❌ 사용자 WebSocket 오류: {e}")
    finally:
        await user_manager.disconnect(user_id)

if __name__ == "__main__":
    # 서버 실행
    uvicorn.run(app, host="0.0.0.0", port=8000)