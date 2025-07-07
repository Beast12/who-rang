# WhoRang Integration URL Configuration Fix

## Overview

This document summarizes the comprehensive fix implemented for the WhoRang AI Doorbell Home Assistant integration to support flexible URL configuration, including both direct connections (IP:port) and proxy-based deployments (full HTTPS URLs).

## Issues Fixed

### Original Problems
1. **Rigid Host/Port Schema**: Configuration only accepted separate host and port fields
2. **HTTPS URL Failures**: Failed when users entered full HTTPS URLs like `https://api-doorbell.tuxito.be`
3. **No Proxy Support**: Didn't handle proxy deployments behind reverse proxies/load balancers
4. **Forced Port Specification**: Required users to specify port even for standard HTTPS (443)
5. **No SSL Support**: API client hardcoded HTTP connections only

### Solution Implemented
✅ **Flexible URL Input**: Single URL field accepts multiple formats
✅ **HTTPS Support**: Full SSL/TLS support with configurable verification
✅ **Smart URL Parsing**: Automatic detection of protocol, host, and port
✅ **Backward Compatibility**: Maintains support for existing IP:port configurations
✅ **Enhanced Error Handling**: Clear error messages for various failure scenarios

## Files Modified

### 1. `custom_components/whorang/const.py`
**Changes:**
- Added new configuration constants: `CONF_URL`, `CONF_USE_SSL`, `CONF_VERIFY_SSL`
- Added new error constants: `ERROR_INVALID_URL`, `ERROR_SSL_ERROR`

### 2. `custom_components/whorang/api_client.py`
**Changes:**
- Enhanced constructor to support SSL parameters: `use_ssl`, `verify_ssl`
- Added SSL context handling in `_get_session()` method
- Dynamic base URL construction supporting both HTTP and HTTPS
- Proper SSL certificate verification with option to disable for self-signed certificates
- Enhanced error handling for SSL-related issues

### 3. `custom_components/whorang/config_flow.py`
**Changes:**
- Added `parse_whorang_url()` function for flexible URL parsing
- Updated configuration schema to use single URL field instead of host/port
- Enhanced `validate_input()` function to use URL parsing
- Added `InvalidURL` exception class
- Updated error handling for URL validation
- Modified `async_step_user()` to handle new URL-based flow

### 4. `custom_components/whorang/strings.json`
**Changes:**
- Updated configuration UI text for URL-based input
- Added helpful examples and descriptions
- Enhanced error messages for URL validation and SSL issues
- Updated field descriptions to guide users

## URL Parsing Logic

The new `parse_whorang_url()` function handles multiple input formats:

### Supported URL Formats

| Input Format | Parsed Result | Use Case |
|--------------|---------------|----------|
| `https://api-doorbell.tuxito.be` | `('api-doorbell.tuxito.be', 443, True)` | HTTPS proxy deployment |
| `https://mydomain.com:8443` | `('mydomain.com', 8443, True)` | HTTPS with custom port |
| `http://192.168.1.100:3001` | `('192.168.1.100', 3001, False)` | HTTP direct connection |
| `192.168.1.100:3001` | `('192.168.1.100', 3001, False)` | Legacy IP:port format |
| `mydomain.com` | `('mydomain.com', 443, True)` | Hostname with auto-HTTPS |
| `192.168.1.100` | `('192.168.1.100', 3001, False)` | IP with default port |

### Smart Defaults
- **Hostnames**: Default to HTTPS on port 443
- **IP Addresses**: Default to HTTP on port 3001
- **Full URLs**: Use specified protocol and port
- **Missing Ports**: Use standard ports (80 for HTTP, 443 for HTTPS)

## SSL/TLS Support

### Features
- **Full SSL Support**: Proper HTTPS connections with certificate validation
- **Self-Signed Certificates**: Option to disable SSL verification
- **SSL Context Management**: Proper SSL context creation and handling
- **Enhanced Error Reporting**: Clear SSL-specific error messages

### Configuration Options
- `verify_ssl`: Boolean to enable/disable SSL certificate verification
- Automatic SSL context creation for HTTPS connections
- Graceful fallback for SSL connection issues

## Testing

### Test Coverage
A comprehensive test suite was created (`test_url_parsing_standalone.py`) covering:

✅ **HTTPS URL Testing**
- `https://api-doorbell.tuxito.be`
- `https://mydomain.com:8443`
- `https://192.168.1.100:443`
- `https://localhost:8443`

✅ **HTTP URL Testing**
- `http://192.168.1.100:3001`
- `http://localhost:3001`
- `http://mydomain.com:8080`

✅ **Legacy Format Support**
- `192.168.1.100:3001` (defaults to HTTP)
- `mydomain.com` (defaults to HTTPS:443)
- `192.168.1.100` (defaults to HTTP:3001)

✅ **Error Validation**
- Invalid URL formats
- Missing hostnames
- Invalid port numbers
- Empty input handling

### Test Results
```
🎉 All tests completed successfully!

The URL parsing function correctly handles:
✅ HTTPS URLs: https://api-doorbell.tuxito.be
✅ HTTP URLs: http://192.168.1.100:3001
✅ IP:port combinations: 192.168.1.100:3001
✅ Hostnames with auto-HTTPS: mydomain.com
✅ IP addresses with auto-HTTP: 192.168.1.100
✅ Custom ports: https://mydomain.com:8443
✅ Default port handling
✅ Error validation
```

## User Experience Improvements

### Before
```yaml
# Old configuration
host: api-doorbell.tuxito.be
port: 443
# User had to manually figure out HTTPS wasn't supported
```

### After
```yaml
# New configuration
url: https://api-doorbell.tuxito.be
verify_ssl: true
api_key: optional_key
```

### Configuration UI
- **Single URL Field**: Intuitive input with helpful examples
- **Smart Validation**: Real-time URL format validation
- **Clear Examples**: Shows various supported formats
- **SSL Options**: Easy toggle for SSL verification
- **Better Error Messages**: Specific guidance for common issues

## Backward Compatibility

The implementation maintains full backward compatibility:
- Existing configurations continue to work
- Legacy host/port combinations are supported
- No breaking changes to existing integrations
- Smooth migration path for users

## Security Considerations

### SSL/TLS Security
- **Default SSL Verification**: Enabled by default for security
- **Configurable Verification**: Option to disable for development/self-signed certificates
- **Proper SSL Context**: Uses Python's secure SSL defaults
- **Certificate Validation**: Full certificate chain validation when enabled

### Input Validation
- **URL Sanitization**: Proper input cleaning and validation
- **Error Handling**: Prevents injection attacks through malformed URLs
- **Type Safety**: Strong typing throughout the parsing logic

## Deployment Scenarios Supported

### 1. Direct IP Connection
```
URL: 192.168.1.100:3001
Result: HTTP connection to local WhoRang instance
```

### 2. HTTPS Proxy Deployment
```
URL: https://api-doorbell.tuxito.be
Result: HTTPS connection through reverse proxy/load balancer
```

### 3. Custom Port HTTPS
```
URL: https://mydomain.com:8443
Result: HTTPS connection on custom port
```

### 4. Development/Local Testing
```
URL: http://localhost:3001
verify_ssl: false
Result: Local HTTP connection for development
```

## Future Enhancements

The new architecture supports future enhancements:
- **Authentication Methods**: Easy to add API key, OAuth, etc.
- **Connection Pooling**: SSL session reuse and connection pooling
- **Health Monitoring**: Enhanced connection health checks
- **Load Balancing**: Support for multiple backend URLs
- **WebSocket Support**: SSL-enabled WebSocket connections

## Migration Guide

### For Existing Users
1. **No Action Required**: Existing configurations continue to work
2. **Optional Upgrade**: Users can switch to URL format for better experience
3. **HTTPS Migration**: Easy upgrade path from HTTP to HTTPS deployments

### For New Users
1. **Simple Setup**: Enter full URL in single field
2. **Smart Defaults**: System automatically detects best configuration
3. **Clear Guidance**: Helpful examples and error messages

## Conclusion

This comprehensive fix transforms the WhoRang integration from a rigid host/port configuration to a flexible, modern URL-based system that supports:

- ✅ **Production HTTPS deployments** behind reverse proxies
- ✅ **Development HTTP setups** for local testing
- ✅ **Legacy IP:port configurations** for backward compatibility
- ✅ **Self-signed certificates** for development environments
- ✅ **Custom ports** for non-standard deployments
- ✅ **Enhanced security** with proper SSL/TLS support

The solution directly addresses the original issue with `https://api-doorbell.tuxito.be` while providing a robust foundation for all deployment scenarios.
