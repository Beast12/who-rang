# 🔔 WhoRang - AI-Powered Doorbell Intelligence

> **Transform your doorbell into an intelligent visitor identification system with advanced face recognition, multi-provider AI analysis, and comprehensive visitor insights.**

<div align="center">

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/get-started/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-FF6B6B?style=for-the-badge&logo=openai&logoColor=white)](#-ai-powered-intelligence)
[![Mobile First](https://img.shields.io/badge/Mobile-First-4ECDC4?style=for-the-badge&logo=mobile&logoColor=white)](#-mobile-first-experience)
[![Self Hosted](https://img.shields.io/badge/Self-Hosted-45B7D1?style=for-the-badge&logo=server&logoColor=white)](#-privacy-first)

</div>

---

## ✨ **What Makes WhoRang Special?**

🧠 **Multi-Provider AI Intelligence** - Choose from 5 AI providers (OpenAI, Claude, Gemini, Google Cloud Vision, Ollama)  
👤 **Advanced Face Recognition** - Identify and track recurring visitors automatically  
📱 **Mobile-Optimized Experience** - Native-like mobile interface with pull-to-refresh  
📊 **Comprehensive Analytics** - Track AI usage, costs, and visitor patterns with export capabilities  
🔒 **Privacy-First Design** - Self-hosted solution that keeps your data secure  
⚡ **Real-Time Updates** - WebSocket-powered live notifications and dashboard  

---

## 🚀 **Quick Start**

Get up and running in under 5 minutes:

### **Prerequisites**
- 🐳 [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- 💾 At least 2GB free disk space
- 🌐 Internet connection for initial build

### **Installation**

```bash
# Clone the repository
git clone https://github.com/Beast12/door-scribe-ai-view.git
cd door-scribe-ai-view

# Build and start the containers (first run will take a few minutes)
docker-compose up -d --build

# Access your dashboard
open http://localhost:8080
```

That's it! 🎉 Your AI-powered doorbell dashboard is ready.

> 📖 **Need help?** Check our [Installation Guide](INSTALLATION.md) for detailed setup instructions.

### **First Run Notes**
- ⏱️ **Initial build** takes 3-5 minutes to download dependencies and build containers
- 🔄 **Subsequent starts** are much faster (under 30 seconds)
- 📊 **Dashboard** will be available at `http://localhost:8080`
- 🔌 **API** will be available at `http://localhost:3001`

---

## 🧠 **AI-Powered Intelligence**

WhoRang supports **5 different AI providers** - choose what works best for you:

<div align="center">

| Provider | Best For | Cost Model |
|----------|----------|------------|
| 🤖 **OpenAI Vision** | Highest accuracy | Pay-per-token |
| 🧠 **Anthropic Claude** | Detailed analysis | Pay-per-token |
| ⚡ **Google Gemini** | Cost-effective | Pay-per-token |
| ☁️ **Google Cloud Vision** | Enterprise features | Pay-per-image |
| 🏠 **Local Ollama** | Complete privacy | Free (self-hosted) |

</div>

### **Smart Features**

- **🎯 Intelligent Scene Analysis** - Comprehensive visitor and object detection
- **👥 Face Recognition & Tracking** - Automatically identify recurring visitors
- **📈 Usage Analytics** - Track AI costs, performance, and accuracy across providers
- **📄 Export Reports** - Generate CSV/PDF analytics reports
- **🔄 Real-Time Processing** - Instant AI analysis of doorbell events

---

## 📱 **Mobile-First Experience**

Built from the ground up for mobile devices:

- **📱 Native-like Interface** - Optimized for touch interactions
- **🔄 Pull-to-Refresh** - Intuitive mobile gestures
- **📊 Mobile Analytics** - Responsive charts and statistics
- **🎛️ Touch-Friendly Controls** - Large buttons and easy navigation
- **⚡ Fast Performance** - Optimized for mobile networks

---

## 📊 **Analytics & Insights**

Get deep insights into your doorbell activity:

### **Visitor Analytics**
- 📈 Daily, weekly, and monthly visitor trends
- 🕐 Peak activity time analysis
- 🌍 Location-based visitor tracking
- 🌤️ Weather correlation insights

### **AI Performance Tracking**
- 💰 Real-time cost monitoring across all AI providers
- ⚡ Response time and accuracy metrics
- 📊 Provider comparison analytics
- 📈 Usage optimization recommendations

### **Export Capabilities**
- 📄 **PDF Reports** - Professional analytics summaries
- 📊 **CSV Data** - Raw data for further analysis
- 🔄 **Automated Exports** - Schedule regular reports

---

## 🔧 **Modern Tech Stack**

Built with cutting-edge technologies:

### **Frontend**
- ⚛️ **React 18** + TypeScript - Modern, type-safe development
- ⚡ **Vite** - Lightning-fast build tool
- 🎨 **Tailwind CSS** + shadcn/ui - Beautiful, responsive design
- 📱 **Mobile-First** - Responsive across all devices
- 🔄 **React Query** - Efficient server state management

### **Backend**
- 🟢 **Node.js** + Express - Robust server architecture
- 🗄️ **SQLite** - Lightweight, reliable database
- 🔌 **WebSocket** - Real-time communication
- 🤖 **Multi-AI Integration** - Unified AI provider interface

### **Deployment**
- 🐳 **Docker** - One-command deployment
- 🌐 **Nginx** - Production-ready web server
- 🔒 **Security** - Built-in security best practices

---

## 🏠 **Privacy-First Design**

Your data stays **yours**:

- 🔒 **Self-Hosted** - Complete control over your data
- 🏠 **Local Processing** - Option to use local AI (Ollama)
- 🛡️ **No Cloud Dependencies** - Works entirely offline (with local AI)
- 🔐 **Secure by Default** - Built with security best practices

---

## 📚 **Documentation**

Comprehensive guides to get you started:

- 📖 [**Installation Guide**](INSTALLATION.md) - Step-by-step setup
- ⚙️ [**Configuration**](CONFIGURATION.md) - Customize your setup
- 🏠 [**Home Assistant Integration**](HOME_ASSISTANT.md) - Connect with Home Assistant
- 🔌 [**API Reference**](API.md) - Complete API documentation
- 🚀 [**Deployment**](DEPLOY.md) - Production deployment guide
- 🔧 [**Troubleshooting**](TROUBLESHOOTING.md) - Common issues and solutions

---

## 🎯 **Use Cases**

Perfect for:

- 🏠 **Smart Home Enthusiasts** - Integrate with Home Assistant
- 🔒 **Security-Conscious Users** - Monitor and analyze visitor patterns
- 👨‍💻 **Developers** - Extensible AI-powered platform
- 📊 **Data Lovers** - Rich analytics and insights
- 🏢 **Small Businesses** - Track customer visits and patterns

---

## 💖 **Support the Project**

If you find WhoRang useful, consider supporting its development:

<div align="center">

<a href="https://www.buymeacoffee.com/koen1203" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
</a>

**Or scan the QR code:**

<img src="bmc_qr.png" alt="Buy Me A Coffee QR Code" width="150" height="150">

*Your support helps maintain and improve WhoRang!*

</div>

---

## 🤝 **Contributing**

We welcome contributions! Whether it's:

- 🐛 **Bug Reports** - Help us improve
- 💡 **Feature Requests** - Share your ideas
- 🔧 **Code Contributions** - Submit pull requests
- 📖 **Documentation** - Improve our guides

---

## 📄 **License**

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Made with ❤️ for the smart home community**

⭐ **Star this repo** if you find it useful!

</div>
