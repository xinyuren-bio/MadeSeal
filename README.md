# 鑫泽农场印章制作

免费在线制作村委会圆形公章，支持做旧效果，直接下载 PNG。

## 本地启动

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8088 --reload
```

浏览器访问 http://localhost:8088

## 推送到 GitHub

```bash
# 在 GitHub 新建空仓库：xinyuren-bio/seal（不要勾选 README）
cd seal
git remote add origin git@github.com:xinyuren-bio/seal.git
git push -u origin main
```

## 阿里云服务器部署

以你的 ECS 为例：
- 公网 IP：`8.219.168.5`
- 系统：Alibaba Cloud Linux 3
- 建议端口：`8088`

### 1. 登录服务器

```bash
ssh root@8.219.168.5
```

### 2. 安装依赖

```bash
yum install -y git python3 python3-pip
```

### 3. 拉取代码

```bash
cd ~
git clone git@github.com:xinyuren-bio/seal.git
cd seal
```

### 4. 一键部署

```bash
chmod +x deploy/deploy.sh
bash deploy/deploy.sh ~/seal 8088
```

### 5. 阿里云安全组放行端口

在阿里云控制台 → 安全组 → 入方向，添加规则：
- 协议：TCP
- 端口：8088
- 授权对象：0.0.0.0/0（或你的办公网 IP）

### 6. 其他电脑访问

```
http://8.219.168.5:8088
```

### 常用命令

```bash
# 查看服务状态
sudo systemctl status xinzhe-seal

# 重启服务
sudo systemctl restart xinzhe-seal

# 查看日志
sudo journalctl -u xinzhe-seal -f

# 更新代码后重新部署
cd ~/seal && git pull && sudo systemctl restart xinzhe-seal
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SEAL_PORT` | 8088 | 服务端口 |
| `SEAL_HOST` | 0.0.0.0 | 监听地址 |
