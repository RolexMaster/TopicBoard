#!/usr/bin/env python3
"""
의존성 검증 스크립트
requirements.txt의 모든 패키지가 정상적으로 import되는지 확인
"""

import sys
import importlib
from typing import List, Tuple

def test_import(module_name: str, package_name: str = None) -> Tuple[bool, str]:
    """패키지 import 테스트"""
    try:
        if package_name:
            importlib.import_module(package_name)
        else:
            importlib.import_module(module_name)
        return True, f"✅ {module_name} import 성공"
    except ImportError as e:
        return False, f"❌ {module_name} import 실패: {e}"
    except Exception as e:
        return False, f"⚠️ {module_name} import 중 오류: {e}"

def main():
    """메인 검증 함수"""
    print("🔍 Python 의존성 검증 시작...")
    print("=" * 50)
    
    # requirements.txt의 의존성 목록
    dependencies = [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn"),
        ("websockets", "websockets"),
        ("pycrdt", "pycrdt"),
        ("pycrdt-websocket", "pycrdt_websocket"),
        ("pydantic", "pydantic"),
        ("python-multipart", "multipart"),
        ("aiofiles", "aiofiles"),
        ("jinja2", "jinja2"),
        ("lxml", "lxml"),
        ("xmltodict", "xmltodict"),
        ("python-dotenv", "dotenv"),
    ]
    
    success_count = 0
    total_count = len(dependencies)
    
    for display_name, import_name in dependencies:
        success, message = test_import(display_name, import_name)
        print(message)
        if success:
            success_count += 1
    
    print("=" * 50)
    print(f"📊 검증 결과: {success_count}/{total_count} 패키지 성공")
    
    if success_count == total_count:
        print("🎉 모든 의존성이 정상적으로 설치되었습니다!")
        return 0
    else:
        print("⚠️ 일부 의존성에 문제가 있습니다. pip install -r requirements.txt를 다시 실행해주세요.")
        return 1

if __name__ == "__main__":
    sys.exit(main())