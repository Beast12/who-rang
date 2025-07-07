#!/usr/bin/env python3
"""Test script to verify WhoRang HTTPS connection."""

import asyncio
import aiohttp
import ssl
import sys

async def test_whorang_connection():
    """Test connection to WhoRang HTTPS endpoint."""
    
    url = "https://api-doorbell.tuxito.be/health"
    
    print(f"Testing connection to: {url}")
    print("=" * 50)
    
    try:
        # Create SSL context
        ssl_context = ssl.create_default_context()
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        
        async with aiohttp.ClientSession(connector=connector) as session:
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "HomeAssistant-WhoRang/1.0.0",
            }
            
            async with session.get(url, headers=headers, timeout=10) as response:
                print(f"✅ Status Code: {response.status}")
                print(f"✅ Content Type: {response.content_type}")
                
                if response.content_type == "application/json":
                    data = await response.json()
                    print(f"✅ Response Data: {data}")
                    
                    status = data.get("status")
                    if status in ("ok", "healthy"):
                        print(f"✅ Health Status: {status} (Valid)")
                        return True
                    else:
                        print(f"❌ Health Status: {status} (Invalid)")
                        return False
                else:
                    text = await response.text()
                    print(f"❌ Non-JSON Response: {text}")
                    return False
                    
    except aiohttp.ClientError as e:
        print(f"❌ Connection Error: {e}")
        return False
    except asyncio.TimeoutError:
        print("❌ Connection Timeout")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

async def test_url_parsing():
    """Test URL parsing for the specific endpoint."""
    
    # Simulate the URL parsing logic
    url_input = "https://api-doorbell.tuxito.be"
    
    print(f"\nTesting URL parsing for: {url_input}")
    print("=" * 50)
    
    import urllib.parse
    
    if url_input.startswith(('http://', 'https://')):
        parsed = urllib.parse.urlparse(url_input)
        host = parsed.hostname
        port = parsed.port
        use_ssl = parsed.scheme == 'https'
        
        # Default ports
        if port is None:
            port = 443 if use_ssl else 80
        
        print(f"✅ Parsed Host: {host}")
        print(f"✅ Parsed Port: {port}")
        print(f"✅ Use SSL: {use_ssl}")
        
        # Build the expected base URL
        if (use_ssl and port == 443) or (not use_ssl and port == 80):
            base_url = f"{'https' if use_ssl else 'http'}://{host}"
        else:
            base_url = f"{'https' if use_ssl else 'http'}://{host}:{port}"
        
        health_url = f"{base_url}/health"
        print(f"✅ Health URL: {health_url}")
        
        return host, port, use_ssl, health_url
    
    return None, None, None, None

async def main():
    """Main test function."""
    
    print("WhoRang HTTPS Connection Test")
    print("=" * 50)
    
    # Test URL parsing
    host, port, use_ssl, health_url = await test_url_parsing()
    
    if not host:
        print("❌ URL parsing failed")
        return False
    
    # Test actual connection
    success = await test_whorang_connection()
    
    if success:
        print("\n🎉 All tests passed!")
        print("\nThe WhoRang integration should now work with:")
        print(f"URL: https://api-doorbell.tuxito.be")
        print(f"Parsed to: {host}:{port} (SSL: {use_ssl})")
        print(f"Health endpoint: {health_url}")
        return True
    else:
        print("\n💥 Connection test failed!")
        return False

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        sys.exit(1)
