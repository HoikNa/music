#!/usr/bin/env bash
# 운영 DB에 Alembic 마이그레이션 적용
# 사용법: DATABASE_URL=postgresql://... bash scripts/migrate_prod.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL 환경변수가 필요합니다."
  echo "   사용법: DATABASE_URL=postgresql://... bash scripts/migrate_prod.sh"
  exit 1
fi

if [[ "$DATABASE_URL" == sqlite* ]]; then
  echo "❌ SQLite URL이 감지됐습니다. 운영 PostgreSQL URL을 사용하세요."
  exit 1
fi

echo "▶ 마이그레이션 대상: ${DATABASE_URL%%@*}@..."
echo "▶ 현재 리비전 확인..."
cd "$ROOT"
source venv/bin/activate
alembic current

echo ""
read -p "위 DB에 마이그레이션을 적용합니다. 계속할까요? (yes/no): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "취소됨."
  exit 0
fi

echo "▶ alembic upgrade head..."
alembic upgrade head
echo "✅ 마이그레이션 완료"
