# 鑫泽农场印章制作

免费在线制作村委会圆形公章，支持做旧效果，直接下载 PNG。

## 本地启动

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8088 --reload
```

浏览器访问 http://localhost:8088

## 服务器部署（供其他电脑访问）

### 方式一：一键脚本（推荐）

将 `seal` 文件夹上传到服务器后执行：

```bash
cd seal
chmod +x deploy/deploy.sh
bash deploy/deploy.sh /home/renxinyu/seal 8088
```

脚本会自动：
1. 安装 Python 依赖
2. 注册 systemd 服务 `xinzhe-seal`
3. 绑定 `0.0.0.0:8088`，允许外网访问

### 方式二：手动启动

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
SEAL_PORT=8088 uvicorn main:app --host 0.0.0.0 --port 8088
```

### 防火墙

确保服务器安全组/防火墙放行端口（以 8088 为例）：

```bash
# 腾讯云/阿里云：在安全组入站规则中添加 TCP 8088
# ufw 示例：
sudo ufw allow 8088/tcp
```

### 外网访问地址

```
http://你的服务器公网IP:8088
```

若 WebMd 与印章站部署在同一台机器，WebMd 用 8000，印章站用 8088，互不冲突。

### Nginx 反向代理（可选，绑定域名）

```nginx
server {
    listen 80;
    server_name seal.你的域名.com;

    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SEAL_PORT` | 8088 | 服务端口 |
| `SEAL_HOST` | 0.0.0.0 | 监听地址 |
