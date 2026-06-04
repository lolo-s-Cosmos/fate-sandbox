#!/usr/bin/env bash
# 一键打包发布包。
# 文件名优先使用当前提交上的 git tag；没有 tag 时使用 package 版本 + git hash。
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "错误: 缺少 Node.js，无法读取 package.json。" >&2
  exit 1
fi
if ! command -v zip >/dev/null 2>&1; then
  echo "错误: 缺少 zip，无法创建发布包。请先安装 zip（例如 Ubuntu/Debian: sudo apt-get install zip；macOS: brew install zip 或使用系统自带 zip）。" >&2
  exit 1
fi

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"
PROJECT_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)"
cd "$PROJECT_ROOT"

PACKAGE_NAME="$(node -p "require('./package.json').name")"
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
SAFE_NAME="${PACKAGE_NAME#@}"
SAFE_NAME="${SAFE_NAME//\//-}"

if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  TAG="$(git tag --points-at HEAD | sort -V | tail -n 1 || true)"
  if [ -n "$TAG" ]; then
    VERSION_PART="$TAG"
  else
    HASH="$(git rev-parse --short HEAD)"
    VERSION_PART="${PACKAGE_VERSION}-${HASH}"
  fi

  if ! git diff --quiet -- . ':!state' ':!sessions' || ! git diff --cached --quiet -- . ':!state' ':!sessions'; then
    echo "警告: 当前有未提交的 tracked 改动；打包内容会包含工作区当前文件。" >&2
  fi
else
  VERSION_PART="$PACKAGE_VERSION"
fi

VERSION_PART="$(printf '%s' "$VERSION_PART" | tr '/ :' '---')"
DIST_DIR="$PROJECT_ROOT/dist"
OUT_PATH="$DIST_DIR/${SAFE_NAME}-${VERSION_PART}.zip"
TMP_DIR="$(mktemp -d)"
STAGE_DIR="$TMP_DIR/package"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$DIST_DIR" "$STAGE_DIR"
rm -f "$OUT_PATH" "$OUT_PATH.sha256"

# 按 package.json#files 组装发布内容，并额外确保 package.json 本身进入包内。
# 这样可以包含 npm/pnpm pack 默认可能忽略的项目运行文件，同时仍排除 node_modules/sessions/state 等运行产物。
node <<'NODE' | while IFS= read -r rel; do
const pkg = require('./package.json');
const files = new Set(['package.json', ...(pkg.files || [])]);
for (const f of files) {
  const normalized = String(f).replace(/\/+$/, '');
  if (normalized) console.log(normalized);
}
NODE
  if [ ! -e "$rel" ]; then
    echo "警告: 打包清单中的路径不存在，已跳过: $rel" >&2
    continue
  fi
  mkdir -p "$STAGE_DIR/$(dirname -- "$rel")"
  cp -R "$rel" "$STAGE_DIR/$rel"
done

# 避免 macOS zip 写入 AppleDouble 扩展属性文件。
(
  cd "$TMP_DIR"
  COPYFILE_DISABLE=1 zip -qry "$OUT_PATH" package -x '*/__MACOSX/*' '*/.DS_Store'
)

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$OUT_PATH" >"$OUT_PATH.sha256"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$OUT_PATH" >"$OUT_PATH.sha256"
fi

echo "✓ 打包完成: $OUT_PATH"
[ -f "$OUT_PATH.sha256" ] && echo "✓ 校验文件: $OUT_PATH.sha256"
