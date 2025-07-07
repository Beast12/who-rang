# Changelog

All notable changes to the WhoRang Home Assistant Integration will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-07

### Added

#### Core Integration
- Complete Home Assistant custom integration for WhoRang AI Doorbell system
- Configuration flow with auto-discovery support
- Options flow for advanced configuration
- Real-time WebSocket integration with auto-reconnection
- Comprehensive error handling and logging

#### Entities
- **Sensors (9 entities)**:
  - Latest visitor information with AI analysis
  - Visitor statistics (today, week, month)
  - System status and health monitoring
  - AI provider tracking
  - AI cost monitoring and response time metrics
  - Known faces count

- **Binary Sensors (5 entities)**:
  - Doorbell activity detection
  - Motion detection with device class
  - Known visitor presence detection
  - System connectivity monitoring
  - AI processing status

- **Camera (1 entity)**:
  - Latest doorbell image with automatic updates
  - Integration with Home Assistant camera features

- **Buttons (3 entities)**:
  - Manual AI analysis trigger
  - Webhook testing functionality
  - Data refresh controls

- **Select (1 entity)**:
  - AI provider selection with live switching

- **Device Trackers (Dynamic)**:
  - Automatic creation for known persons
  - Presence tracking based on face recognition

#### Services
- `whorang.trigger_analysis` - Manual AI analysis trigger
- `whorang.add_known_visitor` - Add new known persons
- `whorang.remove_known_visitor` - Remove known persons
- `whorang.set_ai_provider` - Change active AI provider
- `whorang.export_data` - Export visitor data (JSON/CSV)
- `whorang.test_webhook` - Test webhook functionality

#### Events
- `whorang_visitor_detected` - Any visitor detection
- `whorang_known_visitor_detected` - Known visitor detection
- `whorang_ai_analysis_complete` - AI analysis completion
- `whorang_face_detection_complete` - Face detection completion

#### Features
- **Multi-AI Provider Support**: OpenAI, Ollama, Claude, Gemini, Google Cloud Vision
- **Face Recognition Integration**: Known visitor tracking and management
- **Cost Tracking**: AI usage monitoring and budget alerts
- **Real-time Updates**: WebSocket integration for instant notifications
- **Comprehensive Monitoring**: System health, statistics, and performance metrics
- **Automation Ready**: Rich attributes and events for complex automations

#### Documentation
- Complete installation and configuration guide
- Comprehensive entity documentation
- Service usage examples
- Automation and dashboard examples
- Troubleshooting guide

#### Localization
- English translations for all UI elements
- Configurable entity names and descriptions
- Service documentation and help text

#### Technical Features
- **API Client**: Robust HTTP client with timeout and error handling
- **Data Coordinator**: Efficient data management with WebSocket support
- **Device Information**: Proper device registry integration
- **Entity Management**: Dynamic entity creation and cleanup
- **Configuration Validation**: Input validation and connection testing
- **Memory Management**: Efficient data caching and cleanup

### Technical Details

#### Architecture
- Modular design with separate platform files
- Coordinator pattern for data management
- WebSocket integration for real-time updates
- Comprehensive error handling and recovery

#### Dependencies
- `aiohttp>=3.8.0` for HTTP client functionality
- `websockets>=11.0` for WebSocket connections
- Home Assistant 2023.1+ compatibility

#### Performance
- Configurable update intervals (10-300 seconds)
- WebSocket for efficient real-time updates
- Intelligent caching and data management
- Minimal resource usage

#### Security
- Optional API key authentication
- Secure WebSocket connections
- Input validation and sanitization
- Error message sanitization

### Installation Methods
- HACS integration support
- Manual installation instructions
- Automatic dependency management
- Configuration validation

### Compatibility
- Home Assistant 2023.1+
- WhoRang backend API v1.0+
- All supported AI providers
- Cross-platform compatibility

---

## Future Releases

### Planned Features
- [ ] Multi-language support (Spanish, French, German)
- [ ] Advanced automation templates
- [ ] Mobile app integration
- [ ] Cloud synchronization support
- [ ] Enhanced dashboard widgets
- [ ] Integration with other security systems
- [ ] Advanced analytics and reporting
- [ ] Custom notification templates

### Under Consideration
- [ ] Video streaming support
- [ ] Two-way audio integration
- [ ] Advanced face recognition features
- [ ] Machine learning model updates
- [ ] Integration with smart locks
- [ ] Geofencing capabilities
- [ ] Advanced scheduling features

---

## Support

For issues, feature requests, or questions:
- [GitHub Issues](https://github.com/Beast12/who-rang/issues)
- [GitHub Discussions](https://github.com/Beast12/who-rang/discussions)
- [Documentation](https://github.com/Beast12/who-rang/blob/main/home_assistant/README.md)
