#!/bin/bash
# ==================================================
# 功能说明：鑫泽农场印章制作 - 服务器部署脚本
# 使用方法：bash deploy/deploy.sh [安装目录] [端口]
# 依赖环境：Python 3.9+、pip、（可选）systemd
# ==================================================
set -euo pipefail

INSTALL_DIR="${1:-/home/renxinyu/seal}"
PORT="${2:-8088}"
SERVICE_NAME="xinzhe-seal"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ">>> 部署目录: $INSTALL_DIR"
echo ">>> 服务端口: $PORT"

mkdir -p "$INSTALL_DIR"
rsync -av --delete \
  --exclude '.git' \
  --exclude '__pycache__' \
  --exclude '.venv' \
  "$PROJECT_DIR/" "$INSTALL_DIR/"

cd "$INSTALL_DIR/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -q

# 生成 systemd 服务文件
UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
sudo tee "$UNIT_FILE" > /dev/null <<EOF
[Unit]
Description=鑫泽农场印章制作
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=${INSTALL_DIR}/backend
Environment=SEAL_PORT=${PORT}
Environment=SEAL_HOST=0.0.0.0
ExecStart=${INSTALL_DIR}/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port ${PORT}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

echo ""
echo ">>> 部署完成！"
echo ">>> 本机访问: http://127.0.0.1:${PORT}"
echo ">>> 外网访问: http://$(curl -s ifconfig.me 2>/dev/null || echo '你的服务器IP'):${PORT}"
echo ">>> 查看状态: sudo systemctl status ${SERVICE_NAME}"
echo ">>> 查看日志: sudo journalctl -u ${SERVICE_NAME} -f"
