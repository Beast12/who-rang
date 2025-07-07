#!/usr/bin/env python3
"""Standalone test script for WhoRang URL parsing functionality."""

import ipaddress
import urllib.parse
from typing import Tuple

DEFAULT_PORT = 3001

def parse_whorang_url(url_input: str) -> Tuple[str, int, bool]:
    """Parse WhoRang URL input and return (host, port, use_ssl)."""
    
    # Check for empty input
    if not url_input or not url_input.strip():
        raise ValueError("URL cannot be empty")
    
    url_input = url_input.strip()
    
    # Handle full URLs
    if url_input.startswith(('http://', 'https://')):
        parsed = urllib.parse.urlparse(url_input)
        host = parsed.hostname
        port = parsed.port
        use_ssl = parsed.scheme == 'https'
        
        if host is None or not host:
            raise ValueError("Invalid URL: missing hostname")
        
        # Default ports
        if port is None:
            port = 443 if use_ssl else 80
            
        return host, port, use_ssl
    
    # Handle IP:port format
    elif ':' in url_input:
        host, port_str = url_input.split(':', 1)
        if not host:
            raise ValueError("Invalid URL: missing hostname")
        try:
            port = int(port_str)
            # Assume HTTP for IP:port unless port 443
            use_ssl = port == 443
            return host, port, use_ssl
        except ValueError:
            raise ValueError("Invalid port number")
    
    # Handle hostname only
    else:
        if not url_input:
            raise ValueError("Invalid URL: missing hostname")
        # Default to HTTPS for hostnames, HTTP for IP addresses
        try:
            ipaddress.ip_address(url_input)
            # It's an IP address, default to HTTP:3001
            return url_input, DEFAULT_PORT, False
        except ValueError:
            # It's a hostname, default to HTTPS:443
            return url_input, 443, True

def test_url_parsing():
    """Test various URL formats."""
    
    test_cases = [
        # HTTPS URL Testing
        ("https://api-doorbell.tuxito.be", ("api-doorbell.tuxito.be", 443, True)),
        ("https://mydomain.com:8443", ("mydomain.com", 8443, True)),
        ("https://192.168.1.100:443", ("192.168.1.100", 443, True)),
        ("https://localhost:8443", ("localhost", 8443, True)),
        
        # HTTP URL Testing
        ("http://192.168.1.100:3001", ("192.168.1.100", 3001, False)),
        ("http://localhost:3001", ("localhost", 3001, False)),
        ("http://mydomain.com:8080", ("mydomain.com", 8080, False)),
        
        # Legacy Format Support
        ("192.168.1.100:3001", ("192.168.1.100", 3001, False)),  # should default to HTTP
        ("mydomain.com", ("mydomain.com", 443, True)),  # should default to HTTPS:443
        ("192.168.1.100", ("192.168.1.100", 3001, False)),  # should default to HTTP:3001
        
        # Default port handling
        ("http://192.168.1.100", ("192.168.1.100", 80, False)),  # no port specified
    ]
    
    print("Testing WhoRang URL parsing...")
    print("=" * 50)
    
    all_passed = True
    
    for i, (input_url, expected) in enumerate(test_cases, 1):
        try:
            result = parse_whorang_url(input_url)
            if result == expected:
                print(f"✅ Test {i}: {input_url} -> {result}")
            else:
                print(f"❌ Test {i}: {input_url}")
                print(f"   Expected: {expected}")
                print(f"   Got:      {result}")
                all_passed = False
        except Exception as e:
            print(f"❌ Test {i}: {input_url} -> ERROR: {e}")
            all_passed = False
    
    print("=" * 50)
    if all_passed:
        print("🎉 All tests passed!")
        return True
    else:
        print("💥 Some tests failed!")
        return False

def test_error_cases():
    """Test error cases."""
    
    error_cases = [
        "invalid://url",
        "192.168.1.100:invalid_port",
        "https://",
        "",
    ]
    
    print("\nTesting error cases...")
    print("=" * 50)
    
    all_passed = True
    
    for i, input_url in enumerate(error_cases, 1):
        try:
            result = parse_whorang_url(input_url)
            print(f"❌ Test {i}: {input_url} should have failed but got: {result}")
            all_passed = False
        except ValueError as e:
            print(f"✅ Test {i}: {input_url} -> Expected error: {e}")
        except Exception as e:
            print(f"❌ Test {i}: {input_url} -> Unexpected error: {e}")
            all_passed = False
    
    print("=" * 50)
    if all_passed:
        print("🎉 All error tests passed!")
        return True
    else:
        print("💥 Some error tests failed!")
        return False

if __name__ == "__main__":
    success1 = test_url_parsing()
    success2 = test_error_cases()
    
    if success1 and success2:
        print("\n🎉 All tests completed successfully!")
        print("\nThe URL parsing function correctly handles:")
        print("✅ HTTPS URLs: https://api-doorbell.tuxito.be")
        print("✅ HTTP URLs: http://192.168.1.100:3001")
        print("✅ IP:port combinations: 192.168.1.100:3001")
        print("✅ Hostnames with auto-HTTPS: mydomain.com")
        print("✅ IP addresses with auto-HTTP: 192.168.1.100")
        print("✅ Custom ports: https://mydomain.com:8443")
        print("✅ Default port handling")
        print("✅ Error validation")
    else:
        print("\n💥 Some tests failed!")
