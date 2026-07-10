# ==================================================
# 功能说明：印章制作网站后端配置
# 使用方法：由 main.py 自动加载，无需单独运行
# 依赖环境：Python 3.9+，fastapi，uvicorn
# 生成时间：2026-07-10
# ==================================================
"""印章制作网站配置模块。"""

import os
from pathlib import Path

# 项目根目录
BASE_DIR = Path(__file__).resolve().parent

# 前端静态资源目录
FRONTEND_DIR = BASE_DIR.parent / "frontend"

# 服务端口（可通过环境变量覆盖）
PORT = int(os.environ.get("SEAL_PORT", "8088"))

# 服务主机
HOST = os.environ.get("SEAL_HOST", "0.0.0.0")
