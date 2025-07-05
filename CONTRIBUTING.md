# 🤝 Contributing to WhoRang

Thank you for your interest in contributing to WhoRang! We welcome contributions from the community and are excited to see what you'll build.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/who-rang.git
   cd who-rang
   ```
3. **Create a feature branch** from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and test them
5. **Submit a pull request** against the `develop` branch

## 📋 Contribution Guidelines

### **Branching Strategy**
- Always branch off from `develop`
- Use descriptive branch names:
  - `feature/add-new-ai-provider`
  - `fix/mobile-layout-issue`
  - `docs/update-installation-guide`

### **Pull Request Requirements**
- Submit your pull request **against the `develop` branch**
- Include a clear description of what your PR does
- One feature/fix per PR (keep changes focused)
- Make sure your code follows the existing style
- All PRs require at least one approval before merging

### **Code Style**
- **Frontend**: Follow existing React/TypeScript patterns
- **Backend**: Use consistent Node.js/Express conventions
- **Documentation**: Use clear, concise language with examples

## 🧪 Testing Your Changes

### **Local Development Setup**
```bash
# Build and start the development environment
docker-compose up -d --build

# Access the application
open http://localhost:8080
```

### **Testing Checklist**
- [ ] Frontend builds without errors (`npm run build`)
- [ ] Backend starts successfully
- [ ] Docker containers build and run properly
- [ ] New features work as expected
- [ ] Existing functionality isn't broken

## 📝 Types of Contributions

### **🐛 Bug Fixes**
- Fix existing issues or unexpected behavior
- Include steps to reproduce the bug
- Add tests if applicable

### **✨ New Features**
- Add new AI providers
- Enhance mobile experience
- Improve analytics and reporting
- Extend Home Assistant integration

### **📖 Documentation**
- Improve installation guides
- Add configuration examples
- Update API documentation
- Create tutorials and how-tos

### **🎨 UI/UX Improvements**
- Enhance mobile responsiveness
- Improve accessibility
- Optimize user workflows
- Add new themes or customization options

## 🔧 Development Guidelines

### **Frontend Development**
- Use TypeScript for type safety
- Follow React best practices
- Ensure mobile-first responsive design
- Use existing UI components from shadcn/ui

### **Backend Development**
- Maintain RESTful API conventions
- Add proper error handling
- Include input validation
- Document new endpoints

### **AI Integration**
- Follow the existing provider pattern
- Add proper error handling for API failures
- Include cost tracking for new providers
- Test with various image types and sizes

## 📚 Project Structure

```
who-rang/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service functions
│   └── types/             # TypeScript type definitions
├── backend/               # Node.js backend
│   ├── controllers/       # Route handlers
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   └── websocket/        # WebSocket handlers
├── docs/                 # Documentation files
└── docker-compose.yml    # Container orchestration
```

## 🎯 Contribution Ideas

Looking for ways to contribute? Here are some ideas:

### **High Priority**
- 🤖 Add support for new AI providers (Anthropic Claude 3.5, etc.)
- 📱 Improve mobile performance and offline capabilities
- 🔒 Enhance security features and authentication
- 📊 Add more analytics and reporting features

### **Medium Priority**
- 🌍 Add internationalization (i18n) support
- 🎨 Create additional themes and customization options
- 🔌 Extend Home Assistant integration features
- 📧 Add email/SMS notification capabilities

### **Good First Issues**
- 📝 Improve documentation and examples
- 🐛 Fix minor UI bugs or inconsistencies
- ✨ Add small quality-of-life improvements
- 🧪 Write additional tests

## 🆘 Getting Help

- 📖 Check the [README](README.md) for setup instructions
- 🐛 Search [existing issues](https://github.com/Beast12/who-rang/issues) before creating new ones
- 💬 Join community discussions for questions and ideas
- 📧 Contact maintainers for complex contributions

## 📄 License

By contributing to WhoRang, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

---

**Happy coding! 🚪🔔**

*Thank you for helping make WhoRang better for everyone!*
