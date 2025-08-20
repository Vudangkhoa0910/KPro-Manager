# 🚀 KPro Remote Manager

**KPro** là một ứng dụng GUI hiện đại được thiết kế để quản lý và thao tác trên máy từ xa qua SSH. Ứng dụng hỗ trợ đầy đủ các tính năng quản lý file, editor tích hợp, terminal SSH, và các tác vụ tùy biến thông minh.

![KPro Logo](./src/assets/kpro-logo.svg)

## ✨ Tính năng chính

### 🔐 **SSH Connection Management**
- Hỗ trợ kết nối SSH với 2 user chính:
  - `aa05` (Admin) - Full permission
  - `tele` (User) - Read & Execute permission
- Lưu trữ cấu hình kết nối
- Hiển thị trạng thái kết nối realtime

### 📁 **File Manager**
- Duyệt thư mục trên remote machine
- Hiển thị danh sách file/folder với metadata
- Chức năng: Copy, Move, Delete, Create, Download, Upload
- Hỗ trợ multiple file selection
- Phân quyền theo user (aa05/tele)

### 📝 **Code Editor**
- Editor tích hợp chỉnh sửa file trực tiếp
- Syntax highlighting
- Lưu thay đổi trực tiếp lên remote machine
- Hỗ trợ nhiều ngôn ngữ lập trình

### 💻 **Terminal SSH**
- Terminal tích hợp với WebSocket
- Chạy lệnh shell trực tiếp trên remote machine
- Hiển thị output realtime
- History lệnh

### ⚡ **Task Panel - Tác vụ thông minh**
- **Sync aa05 → tele**: Đồng bộ file từ admin sang user
- **Update Permissions**: Cập nhật quyền truy cập
- **Backup Config**: Sao lưu file cấu hình
- **Deploy Script**: Triển khai ứng dụng
- Hiển thị trạng thái thực hiện (idle, running, success, error)

## 🎨 Design System

KPro sử dụng **gradient xanh dương → bạc → xám** làm tone chính:
```css
Primary: #1E40AF → #3B82F6 (Blue)
Secondary: #94A3B8 (Silver)  
Accent: #475569 (Gray)
```

## 🚀 Hướng dẫn cài đặt & chạy

### **Yêu cầu hệ thống**
- Node.js >= 18
- npm hoặc yarn
- SSH access tới remote machine

### **Cài đặt**

```bash
# 1. Clone repository
git clone https://github.com/Vudangkhoa0910/KPro-Manager.git
cd KPro-Manager

# 2. Cài đặt dependencies
npm install

# 3. Chạy ứng dụng (đồng thời frontend + backend)
npm start
```

### **Chạy riêng biệt**

```bash
# Chỉ frontend (port 8080)
npm run dev

# Chỉ backend (port 3001)
npm run server

# Đồng thời cả hai
npm run dev:full
```

### **Truy cập ứng dụng**
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 📡 API Endpoints

### SSH Connection
```bash
POST /api/ssh/connect      # Kết nối SSH
POST /api/ssh/disconnect   # Ngắt kết nối
```

### File Operations
```bash
POST /api/ssh/list         # Liệt kê file/folder
POST /api/ssh/read-file    # Đọc nội dung file
POST /api/ssh/write-file   # Ghi file
POST /api/ssh/file-operation # Copy/Move/Delete
```

### Terminal
```bash
POST /api/ssh/execute      # Thực thi lệnh
WebSocket: ws://localhost:3001 # Terminal realtime
```

## 🏗️ Kiến trúc dự án

```
kpro-v1/
├── 🎨 Frontend (React + TypeScript + Vite)
│   ├── src/components/     # UI Components
│   │   ├── ConnectionPanel.tsx
│   │   ├── FileManager.tsx
│   │   ├── CodeEditor.tsx
│   │   ├── Terminal.tsx
│   │   └── TaskPanel.tsx
│   ├── src/services/       # Business Logic
│   │   └── sshService.ts   # SSH API Service
│   └── src/pages/          # Pages
│       └── Index.tsx
├── 🔧 Backend (Node.js + Express)
│   └── server.js           # SSH Server + WebSocket
└── 📦 Package Management
    └── package.json
```

## 🔧 Cấu hình mặc định

### **Thư mục làm việc trên Remote Machine:**
- **aa05 (Admin)**: `/home/aa05/Documents/KhoaDevOps/`
- **tele (User)**: `/home/tele/Documents/KhoaDevOps/`

### **Cổng mặc định:**
- SSH: Port 22
- Frontend: Port 8080  
- Backend: Port 3001

## 🧪 Testing SSH Connection

```bash
# Test kết nối SSH thủ công
ssh aa05@your-remote-host
ssh tele@your-remote-host

# Test API endpoint
curl -X POST http://localhost:3001/api/health
```

## 🛠️ Troubleshooting

### **Lỗi kết nối SSH:**
- Kiểm tra SSH server đang chạy trên remote machine
- Xác nhận username/password chính xác
- Kiểm tra network connectivity

### **Lỗi CORS:**
- Backend đã cấu hình CORS cho localhost
- Đảm bảo frontend chạy trên port 8080

### **Lỗi WebSocket:**
- Kiểm tra backend đang chạy trên port 3001
- Xác nhận WebSocket connection tại ws://localhost:3001

## 🔒 Bảo mật

- Passwords được mã hóa trong transmission
- SSH connections sử dụng secure protocols
- File operations được validate permissions
- Backend API có input validation

## 🚀 Deployment

### **Production Build:**
```bash
npm run build
```

### **Docker Support (Coming Soon):**
```bash
docker build -t kpro-manager .
docker run -p 8080:8080 -p 3001:3001 kpro-manager
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

**Developer**: Vudangkhoa  
**Project**: KPro Remote Manager  
**Repository**: [KPro-Manager](https://github.com/Vudangkhoa0910/KPro-Manager)

---

**⭐ Star this repo if you find it helpful!**
