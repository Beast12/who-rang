#!/usr/bin/env python3
"""Test script for WhoRang URL parsing functionality."""

import sys
import os

# Add the custom_components directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'custom_components', 'whorang'))

from config_flow import parse_whorang_url

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
        ("https://api-doorbell.tuxito.be", ("api-doorbell.tuxito.be", 443, True)),  # no port specified
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
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)
