#!/usr/bin/env python3
"""
배포용 패키지 생성 스크립트
docker-compose.yml과 backend, frontend 폴더의 필요한 파일들만 압축
"""
import os
import zipfile
from pathlib import Path
from datetime import datetime


# 제외할 패턴들
EXCLUDE_PATTERNS = {
    # 디렉토리
    'node_modules',
    '__pycache__',
    '.git',
    '.venv',
    'venv',
    'dist',
    'build',
    '.next',
    'coverage',
    '.pytest_cache',
    '.mypy_cache',

    # 파일 확장자
    '.pyc',
    '.pyo',
    '.pyd',
    '.so',
    '.dll',
    '.dylib',
    '.log',
    '.pid',

    # 특정 파일
    '.DS_Store',
    'Thumbs.db',
    '.env',  # .env는 제외 (.env.example은 포함)
}

# 반드시 포함할 파일들 (루트)
INCLUDE_ROOT_FILES = [
    'docker-compose.yml',
    '.env.example',
    '.gitignore',
    'README.md',
]

# 반드시 포함할 폴더들
INCLUDE_FOLDERS = [
    'backend',
    'frontend',
]


def should_exclude(path: Path) -> bool:
    """파일/폴더를 제외해야 하는지 판단"""
    # 부모 디렉토리 중 제외 대상이 있는지 확인
    for part in path.parts:
        if part in EXCLUDE_PATTERNS:
            return True

    # 파일 확장자 확인
    if path.suffix in EXCLUDE_PATTERNS:
        return True

    # 파일명 확인
    if path.name in EXCLUDE_PATTERNS:
        return True

    return False


def get_files_to_include(base_path: Path) -> list[Path]:
    """포함할 파일 목록 가져오기"""
    files_to_include = []

    # 루트 파일들
    for filename in INCLUDE_ROOT_FILES:
        file_path = base_path / filename
        if file_path.exists():
            files_to_include.append(file_path)

    # backend, frontend 폴더의 파일들
    for folder_name in INCLUDE_FOLDERS:
        folder_path = base_path / folder_name
        if not folder_path.exists():
            print(f"⚠️  폴더를 찾을 수 없습니다: {folder_name}")
            continue

        # 재귀적으로 모든 파일 탐색
        for item in folder_path.rglob('*'):
            if item.is_file() and not should_exclude(item):
                files_to_include.append(item)

    return files_to_include


def create_deployment_package(output_filename: str = None) -> str:
    """배포 패키지 생성"""
    base_path = Path(__file__).parent

    # 출력 파일명 생성
    if output_filename is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename = f'stock_deployment_{timestamp}.zip'

    output_path = base_path / output_filename

    print(f"📦 배포 패키지 생성 중...")
    print(f"📂 기본 경로: {base_path}")
    print(f"📄 출력 파일: {output_filename}\n")

    # 포함할 파일 목록 가져오기
    files_to_include = get_files_to_include(base_path)

    if not files_to_include:
        print("❌ 포함할 파일을 찾을 수 없습니다.")
        return None

    # ZIP 파일 생성
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in files_to_include:
            # ZIP 내부 경로 (상대 경로)
            arcname = file_path.relative_to(base_path)
            zipf.write(file_path, arcname)
            print(f"  ✓ {arcname}")

    # 결과 출력
    file_size = output_path.stat().st_size
    file_size_mb = file_size / (1024 * 1024)

    print(f"\n✅ 배포 패키지 생성 완료!")
    print(f"📦 파일: {output_path}")
    print(f"📊 크기: {file_size_mb:.2f} MB")
    print(f"📁 포함된 파일: {len(files_to_include)}개\n")

    # 배포 가이드 출력
    print("=" * 60)
    print("🚀 배포 가이드")
    print("=" * 60)
    print("1. zip 파일을 서버에 업로드")
    print("2. 압축 해제: unzip", output_filename)
    print("3. .env 파일 생성: cp .env.example .env")
    print("4. .env 파일 편집하여 환경 변수 설정")
    print("5. Docker 실행: docker-compose up -d")
    print("6. 접속:")
    print("   - Frontend: http://localhost:5348")
    print("   - Backend API: http://localhost:8000")
    print("=" * 60)

    return str(output_path)


def main():
    """메인 함수"""
    import argparse

    parser = argparse.ArgumentParser(
        description='배포용 패키지 생성 (docker-compose.yml + backend + frontend)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  python create_deployment_package.py
  python create_deployment_package.py --output my_package.zip
  python create_deployment_package.py --list-only
        """
    )

    parser.add_argument(
        '-o', '--output',
        help='출력 zip 파일명 (기본값: stock_deployment_YYYYMMDD_HHMMSS.zip)',
        default=None
    )

    parser.add_argument(
        '-l', '--list-only',
        action='store_true',
        help='포함될 파일 목록만 출력 (zip 생성 안 함)'
    )

    args = parser.parse_args()

    # 파일 목록만 출력
    if args.list_only:
        base_path = Path(__file__).parent
        files = get_files_to_include(base_path)

        print(f"📋 포함될 파일 목록 ({len(files)}개):\n")
        for file_path in sorted(files):
            arcname = file_path.relative_to(base_path)
            print(f"  {arcname}")
        return

    # 배포 패키지 생성
    create_deployment_package(args.output)


if __name__ == '__main__':
    main()
