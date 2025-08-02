"""
File Manager for XML persistence and backup
XML 파일의 영구 저장, 백업, 버전 관리
"""

import os
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
import asyncio
import aiofiles
from xml.dom import minidom


class XMLFileManager:
    """XML 파일 저장 및 관리 클래스"""
    
    def __init__(self, base_dir: str = "data"):
        self.base_dir = Path(base_dir)
        self.xml_dir = self.base_dir / "xml"
        self.backup_dir = self.base_dir / "backups"
        self.metadata_file = self.base_dir / "metadata.json"
        
        # 디렉토리 생성
        self._ensure_directories()
        
        # 메타데이터 로드
        self.metadata = self._load_metadata()
    
    def _ensure_directories(self):
        """필요한 디렉토리 생성"""
        self.base_dir.mkdir(exist_ok=True)
        self.xml_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
        
        print(f"📁 XML 저장 디렉토리: {self.xml_dir.absolute()}")
        print(f"📦 백업 디렉토리: {self.backup_dir.absolute()}")
    
    def _load_metadata(self) -> Dict[str, Any]:
        """메타데이터 파일 로드"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️ 메타데이터 로드 실패: {e}")
        
        # 기본 메타데이터
        return {
            "version": "1.0",
            "created": datetime.now().isoformat(),
            "last_modified": datetime.now().isoformat(),
            "files": {},
            "auto_backup": True,
            "backup_interval": 300,  # 5분
            "max_backups": 10
        }
    
    def _save_metadata(self):
        """메타데이터 파일 저장"""
        try:
            self.metadata["last_modified"] = datetime.now().isoformat()
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"❌ 메타데이터 저장 실패: {e}")
    
    async def save_xml_async(self, xml_content: str, filename: str = "applications.xml") -> bool:
        """XML 파일 비동기 저장"""
        try:
            file_path = self.xml_dir / filename
            
            # 기존 파일 백업
            if file_path.exists() and self.metadata.get("auto_backup", True):
                await self._create_backup_async(filename)
            
            # XML 포맷팅
            formatted_xml = self._format_xml(xml_content)
            
            # 비동기 파일 쓰기
            async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
                await f.write(formatted_xml)
            
            # 메타데이터 업데이트
            self._update_file_metadata(filename, len(formatted_xml))
            
            print(f"✅ XML 저장 완료: {file_path}")
            return True
            
        except Exception as e:
            print(f"❌ XML 저장 실패: {e}")
            return False
    
    def save_xml(self, xml_content: str, filename: str = "applications.xml") -> bool:
        """XML 파일 동기 저장"""
        try:
            file_path = self.xml_dir / filename
            
            # 기존 파일 백업
            if file_path.exists() and self.metadata.get("auto_backup", True):
                self._create_backup(filename)
            
            # XML 포맷팅
            formatted_xml = self._format_xml(xml_content)
            
            # 파일 쓰기
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(formatted_xml)
            
            # 메타데이터 업데이트
            self._update_file_metadata(filename, len(formatted_xml))
            
            print(f"✅ XML 저장 완료: {file_path}")
            return True
            
        except Exception as e:
            print(f"❌ XML 저장 실패: {e}")
            return False
    
    async def load_xml_async(self, filename: str = "applications.xml") -> Optional[str]:
        """XML 파일 비동기 로드"""
        try:
            file_path = self.xml_dir / filename
            
            if not file_path.exists():
                print(f"⚠️ XML 파일 없음: {filename}")
                return None
            
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                content = await f.read()
            
            print(f"📖 XML 로드 완료: {filename}")
            return content
            
        except Exception as e:
            print(f"❌ XML 로드 실패: {e}")
            return None
    
    def load_xml(self, filename: str = "applications.xml") -> Optional[str]:
        """XML 파일 동기 로드"""
        try:
            file_path = self.xml_dir / filename
            
            if not file_path.exists():
                print(f"⚠️ XML 파일 없음: {filename}")
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"📖 XML 로드 완료: {filename}")
            return content
            
        except Exception as e:
            print(f"❌ XML 로드 실패: {e}")
            return None
    
    def _format_xml(self, xml_content: str) -> str:
        """XML 예쁘게 포맷팅"""
        try:
            # XML 선언이 없으면 추가
            if not xml_content.startswith('<?xml'):
                xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_content
            
            # minidom으로 예쁘게 포맷팅
            dom = minidom.parseString(xml_content)
            return dom.toprettyxml(indent="  ", encoding=None)
            
        except Exception as e:
            print(f"⚠️ XML 포맷팅 실패: {e}")
            return xml_content
    
    async def _create_backup_async(self, filename: str):
        """비동기 백업 생성"""
        try:
            source_path = self.xml_dir / filename
            if not source_path.exists():
                return
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"{source_path.stem}_{timestamp}.xml"
            backup_path = self.backup_dir / backup_filename
            
            # 비동기 파일 복사
            async with aiofiles.open(source_path, 'r', encoding='utf-8') as src:
                content = await src.read()
                async with aiofiles.open(backup_path, 'w', encoding='utf-8') as dst:
                    await dst.write(content)
            
            print(f"📦 백업 생성: {backup_filename}")
            
            # 오래된 백업 정리
            await self._cleanup_old_backups_async()
            
        except Exception as e:
            print(f"❌ 백업 생성 실패: {e}")
    
    def _create_backup(self, filename: str):
        """동기 백업 생성"""
        try:
            source_path = self.xml_dir / filename
            if not source_path.exists():
                return
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"{source_path.stem}_{timestamp}.xml"
            backup_path = self.backup_dir / backup_filename
            
            shutil.copy2(source_path, backup_path)
            print(f"📦 백업 생성: {backup_filename}")
            
            # 오래된 백업 정리
            self._cleanup_old_backups()
            
        except Exception as e:
            print(f"❌ 백업 생성 실패: {e}")
    
    async def _cleanup_old_backups_async(self):
        """오래된 백업 파일 정리 (비동기)"""
        try:
            max_backups = self.metadata.get("max_backups", 10)
            backup_files = list(self.backup_dir.glob("*.xml"))
            backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            # 오래된 파일 삭제
            for old_backup in backup_files[max_backups:]:
                old_backup.unlink()
                print(f"🗑️ 오래된 백업 삭제: {old_backup.name}")
                
        except Exception as e:
            print(f"❌ 백업 정리 실패: {e}")
    
    def _cleanup_old_backups(self):
        """오래된 백업 파일 정리 (동기)"""
        try:
            max_backups = self.metadata.get("max_backups", 10)
            backup_files = list(self.backup_dir.glob("*.xml"))
            backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            # 오래된 파일 삭제
            for old_backup in backup_files[max_backups:]:
                old_backup.unlink()
                print(f"🗑️ 오래된 백업 삭제: {old_backup.name}")
                
        except Exception as e:
            print(f"❌ 백업 정리 실패: {e}")
    
    def _update_file_metadata(self, filename: str, file_size: int):
        """파일 메타데이터 업데이트"""
        if "files" not in self.metadata:
            self.metadata["files"] = {}
        
        self.metadata["files"][filename] = {
            "size": file_size,
            "modified": datetime.now().isoformat(),
            "version": self.metadata["files"].get(filename, {}).get("version", 0) + 1
        }
        
        self._save_metadata()
    
    def list_xml_files(self) -> List[Dict[str, Any]]:
        """저장된 XML 파일 목록 조회"""
        files = []
        
        try:
            for xml_file in self.xml_dir.glob("*.xml"):
                stat = xml_file.stat()
                
                file_info = {
                    "name": xml_file.name,
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "path": str(xml_file.relative_to(self.base_dir))
                }
                
                # 메타데이터 추가
                if xml_file.name in self.metadata.get("files", {}):
                    file_info.update(self.metadata["files"][xml_file.name])
                
                files.append(file_info)
                
        except Exception as e:
            print(f"❌ 파일 목록 조회 실패: {e}")
        
        return sorted(files, key=lambda x: x["modified"], reverse=True)
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """백업 파일 목록 조회"""
        backups = []
        
        try:
            for backup_file in self.backup_dir.glob("*.xml"):
                stat = backup_file.stat()
                
                backup_info = {
                    "name": backup_file.name,
                    "size": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "path": str(backup_file.relative_to(self.base_dir))
                }
                
                backups.append(backup_info)
                
        except Exception as e:
            print(f"❌ 백업 목록 조회 실패: {e}")
        
        return sorted(backups, key=lambda x: x["created"], reverse=True)
    
    def restore_backup(self, backup_filename: str, target_filename: str = "applications.xml") -> bool:
        """백업에서 복원"""
        try:
            backup_path = self.backup_dir / backup_filename
            target_path = self.xml_dir / target_filename
            
            if not backup_path.exists():
                print(f"❌ 백업 파일 없음: {backup_filename}")
                return False
            
            # 현재 파일 백업
            if target_path.exists():
                self._create_backup(target_filename)
            
            # 백업에서 복원
            shutil.copy2(backup_path, target_path)
            
            # 메타데이터 업데이트
            stat = target_path.stat()
            self._update_file_metadata(target_filename, stat.st_size)
            
            print(f"🔄 백업에서 복원 완료: {backup_filename} → {target_filename}")
            return True
            
        except Exception as e:
            print(f"❌ 백업 복원 실패: {e}")
            return False
    
    def delete_file(self, filename: str) -> bool:
        """XML 파일 삭제"""
        try:
            file_path = self.xml_dir / filename
            
            if not file_path.exists():
                print(f"⚠️ 삭제할 파일 없음: {filename}")
                return False
            
            # 삭제 전 백업
            self._create_backup(filename)
            
            # 파일 삭제
            file_path.unlink()
            
            # 메타데이터에서 제거
            if filename in self.metadata.get("files", {}):
                del self.metadata["files"][filename]
                self._save_metadata()
            
            print(f"🗑️ 파일 삭제 완료: {filename}")
            return True
            
        except Exception as e:
            print(f"❌ 파일 삭제 실패: {e}")
            return False
    
    def get_storage_info(self) -> Dict[str, Any]:
        """저장소 정보 조회"""
        try:
            xml_files = list(self.xml_dir.glob("*.xml"))
            backup_files = list(self.backup_dir.glob("*.xml"))
            
            xml_size = sum(f.stat().st_size for f in xml_files)
            backup_size = sum(f.stat().st_size for f in backup_files)
            
            return {
                "xml_dir": str(self.xml_dir.absolute()),
                "backup_dir": str(self.backup_dir.absolute()),
                "xml_files_count": len(xml_files),
                "backup_files_count": len(backup_files),
                "xml_total_size": xml_size,
                "backup_total_size": backup_size,
                "total_size": xml_size + backup_size,
                "metadata": self.metadata
            }
            
        except Exception as e:
            print(f"❌ 저장소 정보 조회 실패: {e}")
            return {}


# 전역 파일 매니저 인스턴스
xml_file_manager = XMLFileManager()


# 사용 예제
if __name__ == "__main__":
    import asyncio
    
    async def test_file_manager():
        manager = XMLFileManager()
        
        # 테스트 XML
        test_xml = """<?xml version="1.0" encoding="UTF-8"?>
<Applications xmlns="http://zeromq-topic-manager/schema" version="1.0">
  <Application name="TestApp" description="테스트 응용프로그램">
    <Topic name="TEST_TOPIC" proto="test.proto" direction="publish" description="테스트 토픽"/>
  </Application>
</Applications>"""
        
        # 저장 테스트
        print("📝 XML 저장 테스트...")
        success = await manager.save_xml_async(test_xml, "test_applications.xml")
        print(f"저장 결과: {success}")
        
        # 로드 테스트
        print("\n📖 XML 로드 테스트...")
        loaded_xml = await manager.load_xml_async("test_applications.xml")
        print(f"로드된 XML: {loaded_xml[:100]}..." if loaded_xml else "로드 실패")
        
        # 파일 목록
        print("\n📁 파일 목록:")
        files = manager.list_xml_files()
        for file_info in files:
            print(f"  - {file_info['name']} ({file_info['size']} bytes)")
        
        # 백업 목록
        print("\n📦 백업 목록:")
        backups = manager.list_backups()
        for backup_info in backups:
            print(f"  - {backup_info['name']} ({backup_info['size']} bytes)")
        
        # 저장소 정보
        print("\n💾 저장소 정보:")
        storage_info = manager.get_storage_info()
        print(f"  XML 파일: {storage_info['xml_files_count']}개")
        print(f"  백업 파일: {storage_info['backup_files_count']}개")
        print(f"  총 크기: {storage_info['total_size']} bytes")
    
    # 비동기 테스트 실행
    asyncio.run(test_file_manager())