# 🎉 WhoRang v1.0.0 - AI-Powered Doorbell Intelligence

**Transform your doorbell into an intelligent visitor identification system with advanced face recognition, multi-provider AI analysis, and comprehensive visitor insights.**

## 🚀 Core Features

### 🧠 **Multi-Provider AI Intelligence**
- **5 AI Providers Supported**: OpenAI Vision, Anthropic Claude, Google Gemini, Google Cloud Vision, and Local Ollama
- **Smart Scene Analysis**: Comprehensive visitor and object detection
- **Cost Tracking**: Real-time monitoring of AI usage and costs across all providers
- **Provider Comparison**: Analytics to help you choose the best AI provider for your needs

### 👤 **Advanced Face Recognition System**
- **Automatic Face Detection**: Extract and identify faces from visitor images
- **Person Management**: Create and assign faces to known individuals
- **Unknown Face Dashboard**: Review and categorize unidentified visitors
- **Confidence Scoring**: Accurate face matching with confidence levels
- **Face Cropping**: Automatic thumbnail generation for easy identification

### 📱 **Mobile-First Experience**
- **Responsive Design**: Native-like mobile interface optimized for all devices
- **Touch Gestures**: Pull-to-refresh and intuitive mobile interactions
- **Bottom Navigation**: Easy mobile navigation with floating action buttons
- **Mobile Analytics**: Touch-friendly charts and statistics
- **Offline Capability**: Works seamlessly even with poor connectivity

### 📊 **Comprehensive Analytics & Insights**
- **Visitor Tracking**: Daily, weekly, and monthly visitor trends
- **Peak Activity Analysis**: Understand when visitors arrive most frequently
- **Object Detection Stats**: Track what objects are detected at your door
- **Export Capabilities**: Generate PDF reports and CSV data exports
- **Real-time Dashboard**: Live updates via WebSocket connections

### 🔒 **Privacy-First Design**
- **Self-Hosted Solution**: Complete control over your data
- **Local AI Processing**: Option to use Ollama for complete privacy
- **No Cloud Dependencies**: Works entirely offline with local AI
- **Secure by Default**: Built with security best practices

## 🛠️ **Technical Highlights**

### **Modern Frontend Stack**
- ⚛️ React 18 + TypeScript for type-safe development
- ⚡ Vite for lightning-fast builds
- 🎨 Tailwind CSS + shadcn/ui for beautiful, responsive design
- 🔄 React Query for efficient server state management
- 📱 Mobile-optimized components and interactions

### **Robust Backend Architecture**
- 🟢 Node.js + Express server
- 🗄️ SQLite database for reliable data storage
- 🔌 WebSocket for real-time communication
- 🤖 Unified AI provider interface
- 🛡️ Built-in security and error handling

### **Production-Ready Deployment**
- 🐳 Docker containerization for easy deployment
- 🌐 Nginx reverse proxy configuration
- 📦 One-command setup with docker-compose
- 🔧 Environment-based configuration
- 📊 Health checks and monitoring

## 🎯 **Perfect For**

- 🏠 **Smart Home Enthusiasts** - Integrate with existing home automation
- 🔒 **Security-Conscious Users** - Monitor and analyze visitor patterns
- 👨‍💻 **Developers** - Extensible, well-documented API
- 📊 **Data Lovers** - Rich analytics and export capabilities
- 🏢 **Small Businesses** - Track customer visits and patterns

## 🚀 **Quick Start**

```bash
# Clone and start in under 2 minutes
git clone https://github.com/Beast12/who-rang.git
cd who-rang
docker-compose up -d

# Access your dashboard
open http://localhost:8080
```

## 📚 **Documentation**

- 📖 [Installation Guide](INSTALLATION.md) - Step-by-step setup
- ⚙️ [Configuration Guide](CONFIGURATION.md) - Customize your setup  
- 🔌 [API Reference](API.md) - Complete API documentation
- 🚀 [Deployment Guide](DEPLOY.md) - Production deployment
- 🔧 [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

## 🔧 **What's Included in v1.0.0**

### **Core Components**
- Complete visitor management system
- Multi-provider AI integration
- Face recognition and person management
- Real-time dashboard with WebSocket updates
- Mobile-responsive interface
- Comprehensive analytics and reporting

### **API Endpoints**
- `/api/visitors` - Visitor management and pagination
- `/api/visitors/detected-objects` - Object detection analytics
- `/api/faces` - Face recognition management
- `/api/stats` - System statistics and analytics
- `/api/config` - Configuration management
- `/api/database` - Database operations and backups

### **Recent Fixes & Improvements**
- ✅ Fixed route ordering for `/detected-objects` endpoint
- 📱 Enhanced mobile filter components
- 🔄 Improved real-time data synchronization
- 🛡️ Better error handling and user feedback
- 📊 Enhanced analytics and export capabilities
- 🏠 **Home Assistant Integration** - Complete guide for seamless HA integration

### **🏠 Home Assistant Integration**
- **REST Command Setup** - Easy webhook configuration for Home Assistant
- **Automation Examples** - Ready-to-use automation templates
- **Weather Integration** - Correlate visitor patterns with weather data
- **Multiple Camera Support** - Handle multiple doorbell/camera devices
- **Troubleshooting Guide** - Comprehensive debugging and setup help

## 💖 **Support the Project**

If you find WhoRang useful, consider [buying me a coffee](https://www.buymeacoffee.com/koen1203) to support continued development!

## 🤝 **Contributing**

We welcome contributions! Whether it's:
- 🐛 Bug reports and fixes
- 💡 Feature requests and implementations
- 📖 Documentation improvements
- 🔧 Code optimizations

## 📄 **License**

This project is open source and available under the [MIT License](LICENSE).

---

**Made with ❤️ for the smart home community**

⭐ **Star this repo** if you find it useful!

**Download:** [Source code (zip)](https://github.com/Beast12/who-rang/archive/refs/tags/v1.0.0.zip) | [Source code (tar.gz)](https://github.com/Beast12/who-rang/archive/refs/tags/v1.0.0.tar.gz)
