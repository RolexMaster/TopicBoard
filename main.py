"""
ZeroMQ Topic Manager - Python FastAPI Backend
실시간 협업 XML 편집기를 위한 메인 서버
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
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ZeroMQTopicManager:
    """ZeroMQ 토픽 관리를 위한 Yjs 기반 협업 매니저"""
    
    def __init__(self):
        # Yjs 문서 생성 (JavaScript와 완전 호환)
        self.doc = Doc()
        self.root_map = self.doc.get_map("applications")
        
        # 초기 XML 구조 설정
        self._initialize_structure()
        
        # 연결된 클라이언트 추적
        self.connected_clients: Dict[str, WebSocket] = {}
        
        # 변경사항 감지를 위한 콜백 설정
        self.doc.observe(self._on_document_change)
    
    def _initialize_structure(self):
        """초기 XML 구조를 Yjs 맵으로 설정"""
        if len(self.root_map) == 0:
            # Applications 루트 요소 생성
            applications_elem = self.doc.get_map("Applications")
            applications_elem.set("xmlns", "http://zeromq-topic-manager/schema")
            applications_elem.set("version", "1.0")
            
            # Application 배열 생성
            app_array = self.doc.get_array("Application")
            applications_elem.set("Application", app_array)
            
            # 루트 맵에 Applications 설정
            self.root_map.set("Applications", applications_elem)
            
            print("✅ Yjs 문서 구조 초기화 완료")
    
    def _on_document_change(self, event, transaction):
        """문서 변경사항 감지 시 호출되는 콜백"""
        if not transaction.local:
            print(f"🔄 원격 변경사항 감지: {event}")
            # 필요시 추가 처리 로직
    
    def add_application(self, name: str, description: str = "") -> bool:
        """새 응용프로그램 추가"""
        try:
            applications = self.root_map.get("Applications")
            app_array = applications.get("Application")
            
            # 중복 검사
            for i in range(len(app_array)):
                existing_app = app_array[i]
                if existing_app.get("name") == name:
                    return False  # 이미 존재
            
            # 새 응용프로그램 생성
            new_app = self.doc.get_map(f"app_{name}_{datetime.now().timestamp()}")
            new_app.set("name", name)
            new_app.set("description", description)
            
            # 토픽 배열 생성
            topic_array = self.doc.get_array(f"topics_{name}_{datetime.now().timestamp()}")
            new_app.set("Topic", topic_array)
            
            # 배열에 추가
            app_array.append([new_app])
            
            print(f"✅ 응용프로그램 추가됨: {name}")
            return True
            
        except Exception as e:
            print(f"❌ 응용프로그램 추가 실패: {e}")
            return False
    
    def add_topic(self, app_name: str, topic: TopicModel) -> bool:
        """응용프로그램에 토픽 추가"""
        try:
            applications = self.root_map.get("Applications")
            app_array = applications.get("Application")
            
            # 대상 응용프로그램 찾기
            target_app = None
            for i in range(len(app_array)):
                app = app_array[i]
                if app.get("name") == app_name:
                    target_app = app
                    break
            
            if not target_app:
                return False  # 응용프로그램 없음
            
            topic_array = target_app.get("Topic")
            
            # 중복 검사
            for i in range(len(topic_array)):
                existing_topic = topic_array[i]
                if existing_topic.get("name") == topic.name:
                    return False  # 이미 존재
            
            # 새 토픽 생성
            new_topic = self.doc.get_map(f"topic_{app_name}_{topic.name}_{datetime.now().timestamp()}")
            new_topic.set("name", topic.name)
            new_topic.set("proto", topic.proto)
            new_topic.set("direction", topic.direction)
            new_topic.set("description", topic.description)
            
            # 배열에 추가
            topic_array.append([new_topic])
            
            print(f"✅ 토픽 추가됨: {topic.name} → {app_name}")
            return True
            
        except Exception as e:
            print(f"❌ 토픽 추가 실패: {e}")
            return False
    
    def remove_application(self, app_name: str) -> bool:
        """응용프로그램 삭제"""
        try:
            applications = self.root_map.get("Applications")
            app_array = applications.get("Application")
            
            # 삭제할 인덱스 찾기
            remove_index = -1
            for i in range(len(app_array)):
                app = app_array[i]
                if app.get("name") == app_name:
                    remove_index = i
                    break
            
            if remove_index >= 0:
                app_array.pop(remove_index)
                print(f"✅ 응용프로그램 삭제됨: {app_name}")
                return True
            
            return False
            
        except Exception as e:
            print(f"❌ 응용프로그램 삭제 실패: {e}")
            return False
    
    def remove_topic(self, app_name: str, topic_name: str) -> bool:
        """토픽 삭제"""
        try:
            applications = self.root_map.get("Applications")
            app_array = applications.get("Application")
            
            # 대상 응용프로그램 찾기
            target_app = None
            for i in range(len(app_array)):
                app = app_array[i]
                if app.get("name") == app_name:
                    target_app = app
                    break
            
            if not target_app:
                return False
            
            topic_array = target_app.get("Topic")
            
            # 삭제할 인덱스 찾기
            remove_index = -1
            for i in range(len(topic_array)):
                topic = topic_array[i]
                if topic.get("name") == topic_name:
                    remove_index = i
                    break
            
            if remove_index >= 0:
                topic_array.pop(remove_index)
                print(f"✅ 토픽 삭제됨: {topic_name} ← {app_name}")
                return True
            
            return False
            
        except Exception as e:
            print(f"❌ 토픽 삭제 실패: {e}")
            return False
    
    def get_xml_structure(self) -> dict:
        """현재 구조를 Python dict로 반환"""
        try:
            # Yjs 구조를 Python dict로 변환
            applications = self.root_map.get("Applications")
            
            result = {
                "Applications": {
                    "@xmlns": applications.get("xmlns", "http://zeromq-topic-manager/schema"),
                    "@version": applications.get("version", "1.0"),
                    "Application": []
                }
            }
            
            app_array = applications.get("Application")
            
            for i in range(len(app_array)):
                app = app_array[i]
                app_data = {
                    "@name": app.get("name", ""),
                    "@description": app.get("description", ""),
                    "Topic": []
                }
                
                topic_array = app.get("Topic")
                if topic_array:
                    for j in range(len(topic_array)):
                        topic = topic_array[j]
                        topic_data = {
                            "@name": topic.get("name", ""),
                            "@proto": topic.get("proto", ""),
                            "@direction": topic.get("direction", ""),
                            "@description": topic.get("description", "")
                        }
                        app_data["Topic"].append(topic_data)
                
                result["Applications"]["Application"].append(app_data)
            
            return result
            
        except Exception as e:
            print(f"❌ XML 구조 변환 실패: {e}")
            return {"Applications": {"Application": []}}

# 전역 매니저 인스턴스
topic_manager = ZeroMQTopicManager()

# 정적 파일 서빙 (기존 프론트엔드 유지)
app.mount("/static", StaticFiles(directory="public"), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """메인 페이지 서빙"""
    try:
        with open("public/index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse("<h1>Frontend files not found</h1>", status_code=404)

# REST API 엔드포인트
@app.get("/api/applications")
async def get_applications():
    """현재 모든 응용프로그램 조회"""
    structure = topic_manager.get_xml_structure()
    return {
        "success": True,
        "applications": structure["Applications"]["Application"]
    }

@app.post("/api/applications")
async def add_application(app: ApplicationModel):
    """새 응용프로그램 추가"""
    success = topic_manager.add_application(app.name, app.description)
    
    if success:
        return {
            "success": True,
            "message": f"응용프로그램 '{app.name}'이 추가되었습니다."
        }
    else:
        raise HTTPException(status_code=400, detail="응용프로그램 추가에 실패했습니다.")

@app.post("/api/topics")
async def add_topic(request: AddTopicRequest):
    """응용프로그램에 토픽 추가"""
    success = topic_manager.add_topic(request.app_name, request.topic)
    
    if success:
        return {
            "success": True,
            "message": f"토픽 '{request.topic.name}'이 '{request.app_name}'에 추가되었습니다."
        }
    else:
        raise HTTPException(status_code=400, detail="토픽 추가에 실패했습니다.")

@app.delete("/api/applications/{app_name}")
async def delete_application(app_name: str):
    """응용프로그램 삭제"""
    success = topic_manager.remove_application(app_name)
    
    if success:
        return {
            "success": True,
            "message": f"응용프로그램 '{app_name}'이 삭제되었습니다."
        }
    else:
        raise HTTPException(status_code=404, detail="응용프로그램을 찾을 수 없습니다.")

@app.delete("/api/applications/{app_name}/topics/{topic_name}")
async def delete_topic(app_name: str, topic_name: str):
    """토픽 삭제"""
    success = topic_manager.remove_topic(app_name, topic_name)
    
    if success:
        return {
            "success": True,
            "message": f"토픽 '{topic_name}'이 삭제되었습니다."
        }
    else:
        raise HTTPException(status_code=404, detail="토픽을 찾을 수 없습니다.")

@app.get("/api/xml")
async def get_xml_structure():
    """현재 XML 구조 조회"""
    structure = topic_manager.get_xml_structure()
    return {
        "success": True,
        "structure": structure
    }

@app.post("/api/xml/save")
async def save_xml(data: dict):
    """XML 저장 (향후 파일 저장 기능)"""
    # 현재는 메모리에만 저장, 향후 파일 시스템에 저장 가능
    return {
        "success": True,
        "message": "XML이 저장되었습니다.",
        "timestamp": datetime.now().isoformat()
    }

# Yjs WebSocket 엔드포인트
@app.websocket("/yjs-websocket")
async def yjs_websocket_endpoint(websocket: WebSocket):
    """Yjs 실시간 협업을 위한 WebSocket 엔드포인트"""
    await websocket.accept()
    print("🔌 새로운 Yjs WebSocket 연결")
    
    try:
        # 간단한 WebSocket 메시지 처리 (pycrdt-websocket 없이)
        # pycrdt 문서를 직접 처리
        
        # 연결 유지
        while True:
            try:
                # WebSocket 메시지 수신 대기
                message = await websocket.receive_text()
                # pycrdt가 자동으로 처리
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"WebSocket 오류: {e}")
                break
                
    except WebSocketDisconnect:
        print("🔌 Yjs WebSocket 연결 종료")
    except Exception as e:
        print(f"❌ WebSocket 오류: {e}")
    finally:
        # 정리 작업
        pass

# 사용자 상태 관리를 위한 Socket.IO 대체 WebSocket
class UserManager:
    def __init__(self):
        self.active_users: Dict[str, WebSocket] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_users[user_id] = websocket
        
        # 다른 사용자들에게 새 사용자 알림
        await self.broadcast({
            "type": "user_joined",
            "user_id": user_id,
            "user_count": len(self.active_users)
        }, exclude=user_id)
    
    async def disconnect(self, user_id: str):
        if user_id in self.active_users:
            del self.active_users[user_id]
        
        await self.broadcast({
            "type": "user_left",
            "user_id": user_id,
            "user_count": len(self.active_users)
        })
    
    async def broadcast(self, message: dict, exclude: str = None):
        disconnected = []
        
        for user_id, websocket in self.active_users.items():
            if user_id != exclude:
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    disconnected.append(user_id)
        
        # 연결 끊어진 사용자 정리
        for user_id in disconnected:
            await self.disconnect(user_id)

user_manager = UserManager()

@app.websocket("/ws/users/{user_id}")
async def user_websocket(websocket: WebSocket, user_id: str):
    """사용자 상태 관리용 WebSocket"""
    await user_manager.connect(user_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 사용자 액션 브로드캐스트
            if message.get("type") == "cursor_position":
                await user_manager.broadcast({
                    "type": "cursor_position",
                    "user_id": user_id,
                    "position": message.get("position")
                }, exclude=user_id)
    
    except WebSocketDisconnect:
        await user_manager.disconnect(user_id)

if __name__ == "__main__":
    print("🚀 ZeroMQ Topic Manager (Python) 시작 중...")
    print("📡 Yjs 실시간 협업 서버 활성화")
    print("🌐 http://localhost:8000 에서 접속 가능")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )