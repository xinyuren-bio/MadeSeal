# ==================================================
# 功能说明：印章制作网站 FastAPI 入口，托管前端静态资源
# 使用方法：cd seal/backend && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8088 --reload
# 依赖环境：pip install fastapi uvicorn
# 生成时间：2026-07-10
# ==================================================
"""印章制作网站后端入口。"""

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import FRONTEND_DIR, HOST, PORT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="鑫泽农场印章制作", description="免费在线制作印章，直接下载 PNG")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    """健康检查接口。"""
    return {"status": "ok", "message": "鑫泽农场印章制作服务运行中"}


# 托管前端静态文件
frontend_dir = Path(FRONTEND_DIR)
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
    logger.info("前端目录已挂载: %s", frontend_dir)
else:
    logger.warning("前端目录不存在: %s", frontend_dir)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
