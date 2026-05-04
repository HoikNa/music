#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
ZIP="$DIST/deployment.zip"

echo "▶ 클린 빌드 시작..."
rm -rf "$DIST"
mkdir -p "$DIST/package"

echo "▶ 의존성 설치 (Lambda 환경: linux/amd64)..."
pip install -r "$ROOT/requirements.txt" \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 3.12 \
  --only-binary=:all: \
  --upgrade \
  -t "$DIST/package" \
  --quiet

echo "▶ 앱 코드 복사..."
cp -r "$ROOT/app" "$DIST/package/"
cp "$ROOT/handler.py" "$DIST/package/"

echo "▶ ZIP 패키징..."
cd "$DIST/package"
zip -r "$ZIP" . -x "*.pyc" -x "*/__pycache__/*" -x "*/tests/*" > /dev/null
cd "$ROOT"

SIZE=$(du -sh "$ZIP" | cut -f1)
echo "✅ 패키지 완료: $ZIP ($SIZE)"
echo ""
echo "배포 명령:"
echo "  aws lambda update-function-code \\"
echo "    --function-name <LAMBDA_FUNCTION_NAME> \\"
echo "    --zip-file fileb://$ZIP \\"
echo "    --region ap-northeast-2"
