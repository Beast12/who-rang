"""API client for WhoRang AI Doorbell integration."""
from __future__ import annotations

import asyncio
import json
import logging
import ssl
from typing import Any, Dict, List, Optional

import aiohttp

from .const import (
    API_HEALTH,
    API_VISITORS,
    API_STATS,
    API_CONFIG_WEBHOOK,
    API_FACES_CONFIG,
    API_FACES_PERSONS,
    API_DETECTED_FACES,
    API_OPENAI,
    DEFAULT_TIMEOUT,
)

_LOGGER = logging.getLogger(__name__)


class WhoRangAPIError(Exception):
    """Exception to indicate a general API error."""


class WhoRangConnectionError(WhoRangAPIError):
    """Exception to indicate a connection error."""


class WhoRangAuthError(WhoRangAPIError):
    """Exception to indicate an authentication error."""


class WhoRangAPIClient:
    """API client for WhoRang system."""

    def __init__(
        self,
        host: str,
        port: int,
        use_ssl: bool = False,
        api_key: Optional[str] = None,
        verify_ssl: bool = True,
        session: Optional[aiohttp.ClientSession] = None,
        timeout: int = DEFAULT_TIMEOUT,
    ) -> None:
        """Initialize the API client."""
        self.host = host
        self.port = port
        self.use_ssl = use_ssl
        self.verify_ssl = verify_ssl
        self.api_key = api_key
        self.timeout = timeout
        self._session = session
        self._close_session = False
        self._ssl_context = None
        
        # Build base URL
        scheme = "https" if use_ssl else "http"
        if (use_ssl and port == 443) or (not use_ssl and port == 80):
            self.base_url = f"{scheme}://{host}"
        else:
            self.base_url = f"{scheme}://{host}:{port}"
        
        # Create SSL context during initialization to avoid blocking in async methods
        if self.use_ssl:
            self._ssl_context = self._create_ssl_context()
    
    def _create_ssl_context(self) -> ssl.SSLContext:
        """Create SSL context in sync method to avoid blocking warnings."""
        ssl_context = ssl.create_default_context()
        if not self.verify_ssl:
            # Disable SSL verification for self-signed certificates
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
        return ssl_context
        
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get aiohttp session with SSL support."""
        if self._session is None or self._session.closed:
            connector = None
            if self.use_ssl and self._ssl_context:
                connector = aiohttp.TCPConnector(ssl=self._ssl_context)
            
            # Create session with proper timeout and headers
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self._session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers=self._get_base_headers()
            )
            self._close_session = True
        return self._session
    
    def _get_base_headers(self) -> Dict[str, str]:
        """Get base headers for session."""
        return {
            "User-Agent": "HomeAssistant-WhoRang/1.0.0",
        }

    async def close(self) -> None:
        """Close the session."""
        if self._close_session and self._session:
            await self._session.close()

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "HomeAssistant-WhoRang/1.0.0",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Make an API request."""
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        session = await self._get_session()
        
        try:
            async def make_request():
                async with session.request(
                    method,
                    url,
                    headers=headers,
                    json=data,
                    params=params,
                ) as response:
                    if response.status == 401:
                        raise WhoRangAuthError("Authentication failed")
                    elif response.status == 404:
                        raise WhoRangAPIError(f"Endpoint not found: {endpoint}")
                    elif response.status >= 400:
                        error_text = await response.text()
                        raise WhoRangAPIError(
                            f"API error {response.status}: {error_text}"
                        )
                    
                    if response.content_type == "application/json":
                        return await response.json()
                    else:
                        return {"data": await response.read()}
            
            return await asyncio.wait_for(make_request(), timeout=self.timeout)
                        
        except asyncio.TimeoutError as err:
            raise WhoRangConnectionError("Request timeout") from err
        except aiohttp.ClientError as err:
            raise WhoRangConnectionError(f"Connection error: {err}") from err

    async def get_health(self) -> Dict[str, Any]:
        """Get system health status."""
        try:
            return await self._request("GET", API_HEALTH)
        except Exception as err:
            _LOGGER.error("Failed to get health status: %s", err)
            raise

    async def get_visitors(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get visitors with pagination."""
        params: Dict[str, Any] = {"page": page, "limit": limit}
        if search:
            params["search"] = search
            
        try:
            return await self._request("GET", API_VISITORS, params=params)
        except Exception as err:
            _LOGGER.error("Failed to get visitors: %s", err)
            raise

    async def get_latest_visitor(self) -> Optional[Dict[str, Any]]:
        """Get the latest visitor."""
        try:
            response = await self.get_visitors(page=1, limit=1)
            visitors = response.get("visitors", [])
            return visitors[0] if visitors else None
        except Exception as err:
            _LOGGER.error("Failed to get latest visitor: %s", err)
            return None

    async def get_visitor_by_id(self, visitor_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific visitor by ID."""
        try:
            return await self._request("GET", f"{API_VISITORS}/{visitor_id}")
        except Exception as err:
            _LOGGER.error("Failed to get visitor %s: %s", visitor_id, err)
            return None

    async def get_stats(self) -> Dict[str, Any]:
        """Get visitor statistics."""
        try:
            return await self._request("GET", API_STATS)
        except Exception as err:
            _LOGGER.error("Failed to get stats: %s", err)
            raise

    async def get_detected_objects(self) -> Dict[str, Any]:
        """Get detected objects statistics."""
        try:
            return await self._request("GET", f"{API_VISITORS}/detected-objects")
        except Exception as err:
            _LOGGER.error("Failed to get detected objects: %s", err)
            raise

    async def get_webhook_config(self) -> Dict[str, Any]:
        """Get webhook configuration."""
        try:
            return await self._request("GET", API_CONFIG_WEBHOOK)
        except Exception as err:
            _LOGGER.error("Failed to get webhook config: %s", err)
            raise

    async def test_webhook(self) -> Dict[str, Any]:
        """Test webhook functionality."""
        try:
            return await self._request("POST", f"{API_CONFIG_WEBHOOK}/test")
        except Exception as err:
            _LOGGER.error("Failed to test webhook: %s", err)
            raise

    async def get_face_config(self) -> Dict[str, Any]:
        """Get face recognition configuration."""
        try:
            return await self._request("GET", API_FACES_CONFIG)
        except Exception as err:
            _LOGGER.error("Failed to get face config: %s", err)
            raise

    async def update_face_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Update face recognition configuration."""
        try:
            return await self._request("PUT", API_FACES_CONFIG, data=config)
        except Exception as err:
            _LOGGER.error("Failed to update face config: %s", err)
            raise

    async def get_known_persons(self) -> List[Dict[str, Any]]:
        """Get list of known persons with robust parsing."""
        try:
            response = await self._request("GET", API_FACES_PERSONS)
            
            # Handle different response formats
            if isinstance(response, dict):
                # Format: {"data": [...]} or {"persons": [...]} or {"known_persons": [...]}
                return (response.get("data") or 
                       response.get("persons") or 
                       response.get("known_persons") or [])
            elif isinstance(response, list):
                # Direct list format
                return response
            else:
                _LOGGER.warning("Unexpected known persons response format: %s", type(response))
                return []
                
        except Exception as err:
            _LOGGER.error("Failed to get known persons: %s", err)
            return []

    async def create_person(self, name: str, notes: Optional[str] = None) -> Dict[str, Any]:
        """Create a new known person."""
        data = {"name": name}
        if notes:
            data["notes"] = notes
            
        try:
            return await self._request("POST", API_FACES_PERSONS, data=data)
        except Exception as err:
            _LOGGER.error("Failed to create person: %s", err)
            raise

    async def delete_person(self, person_id: int) -> Dict[str, Any]:
        """Delete a known person."""
        try:
            return await self._request("DELETE", f"{API_FACES_PERSONS}/{person_id}")
        except Exception as err:
            _LOGGER.error("Failed to delete person %s: %s", person_id, err)
            raise

    async def get_detected_faces(self) -> List[Dict[str, Any]]:
        """Get detected faces."""
        try:
            response = await self._request("GET", API_DETECTED_FACES)
            return response.get("faces", [])
        except Exception as err:
            _LOGGER.error("Failed to get detected faces: %s", err)
            return []

    async def get_ai_providers(self) -> List[Dict[str, Any]]:
        """Get available AI providers."""
        try:
            response = await self._request("GET", f"{API_OPENAI}/providers")
            return response.get("providers", [])
        except Exception as err:
            _LOGGER.error("Failed to get AI providers: %s", err)
            return []

    async def set_ai_provider(self, provider: str) -> Dict[str, Any]:
        """Set the active AI provider."""
        data = {"provider": provider}
        try:
            return await self._request("POST", f"{API_OPENAI}/provider", data=data)
        except Exception as err:
            _LOGGER.error("Failed to set AI provider: %s", err)
            raise

    async def set_ai_provider_with_key(self, provider: str, api_key: Optional[str] = None) -> bool:
        """Set AI provider with API key if required."""
        try:
            payload = {"provider": provider}
            if api_key and provider != "local":
                payload["api_key"] = api_key
            
            response = await self._request("POST", f"{API_OPENAI}/provider", data=payload)
            return response.get("success", False)
        except Exception as err:
            _LOGGER.error("Failed to set AI provider %s: %s", provider, err)
            return False

    async def get_available_providers(self) -> Dict[str, Any]:
        """Get available AI providers and their requirements."""
        try:
            response = await self._request("GET", f"{API_OPENAI}/providers")
            return response.get("data", {
                "local": {"requires_key": False},
                "openai": {"requires_key": True},
                "claude": {"requires_key": True},
                "gemini": {"requires_key": True},
                "google_cloud_vision": {"requires_key": True}
            })
        except Exception as err:
            _LOGGER.error("Failed to get AI providers: %s", err)
            return {
                "local": {"requires_key": False},
                "openai": {"requires_key": True},
                "claude": {"requires_key": True},
                "gemini": {"requires_key": True},
                "google_cloud_vision": {"requires_key": True}
            }

    async def trigger_analysis(self, visitor_id: Optional[str] = None) -> Dict[str, Any]:
        """Trigger AI analysis for a visitor or latest visitor."""
        endpoint = "/api/analysis/trigger"
        data = {}
        if visitor_id:
            data["visitor_id"] = visitor_id
            
        try:
            return await self._request("POST", endpoint, data=data)
        except Exception as err:
            _LOGGER.error("Failed to trigger analysis: %s", err)
            raise

    async def get_latest_image(self) -> Optional[bytes]:
        """Get the latest doorbell image."""
        try:
            response = await self._request("GET", "/api/images/latest")
            if isinstance(response.get("data"), bytes):
                return response["data"]
            return None
        except Exception as err:
            _LOGGER.error("Failed to get latest image: %s", err)
            return None

    async def get_ai_usage_stats(self, days: int = 1) -> Dict[str, Any]:
        """Get AI usage statistics with multiple endpoint fallbacks."""
        endpoints_to_try = [
            "/api/ai/usage",      # Primary endpoint
            "/api/stats/ai",      # Alternative endpoint
            "/api/analytics/ai",  # Another alternative
            "/api/system/usage"   # Fallback endpoint
        ]
        
        params = {"days": days}
        
        for endpoint in endpoints_to_try:
            try:
                response = await self._request("GET", endpoint, params=params)
                if response:
                    # Handle different response formats
                    if isinstance(response, dict):
                        return response.get("data", response) if "data" in response else response
                    return {}
            except Exception as e:
                _LOGGER.debug("AI usage endpoint %s failed: %s", endpoint, e)
                continue
        
        # Return default empty stats if all endpoints fail
        _LOGGER.info("No AI usage stats available, using defaults")
        return {
            "cost_today": 0.0,
            "requests_today": 0,
            "cost_total": 0.0,
            "requests_total": 0
        }

    async def export_visitor_data(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        format_type: str = "json",
    ) -> Dict[str, Any]:
        """Export visitor data."""
        params = {"format": format_type}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
            
        try:
            return await self._request("GET", "/api/export/visitors", params=params)
        except Exception as err:
            _LOGGER.error("Failed to export visitor data: %s", err)
            raise

    async def validate_connection(self) -> bool:
        """Validate connection to WhoRang system."""
        try:
            health = await self.get_health()
            status = health.get("status")
            # Accept both "ok" and "healthy" as valid status values
            return status in ("ok", "healthy")
        except Exception as err:
            _LOGGER.error("Connection validation failed: %s", err)
            return False

    async def get_available_models(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Get available models for AI providers."""
        try:
            endpoint = "/api/openai/models"
            if provider:
                endpoint = f"/api/openai/models/{provider}"
            
            response = await self._request("GET", endpoint)
            return response.get("data", self._get_default_models())
        except Exception as e:
            _LOGGER.error("Failed to get available models: %s", e)
            return self._get_default_models()

    def _get_default_models(self) -> Dict[str, List[str]]:
        """Return default model mappings based on frontend patterns."""
        return {
            "local": ["llava", "llava:7b", "llava:13b", "llava:34b", "bakllava", "cogvlm", "llama-vision"],
            "openai": [
                "gpt-4o",
                "gpt-4o-mini", 
                "gpt-4-turbo",
                "gpt-4-vision-preview",
                "gpt-3.5-turbo"
            ],
            "claude": [
                "claude-3-5-sonnet-20241022",
                "claude-3-5-haiku-20241022", 
                "claude-3-opus-20240229",
                "claude-3-sonnet-20240229",
                "claude-3-haiku-20240307"
            ],
            "gemini": [
                "gemini-1.5-pro",
                "gemini-1.5-flash",
                "gemini-1.0-pro-vision",
                "gemini-1.0-pro"
            ],
            "google-cloud-vision": [
                "vision-api-v1",
                "vision-api-v1p1beta1",
                "vision-api-v1p2beta1"
            ]
        }

    async def set_ai_model(self, model: str) -> bool:
        """Set the active AI model."""
        try:
            response = await self._request("POST", "/api/openai/model", data={"model": model})
            return response.get("success", False)
        except Exception as e:
            _LOGGER.error("Failed to set AI model %s: %s", model, e)
            return False

    async def get_current_ai_model(self) -> str:
        """Get currently selected AI model."""
        try:
            response = await self._request("GET", "/api/openai/model/current")
            return response.get("data", {}).get("model", "default")
        except Exception as e:
            _LOGGER.error("Failed to get current AI model: %s", e)
            return "default"

    async def get_provider_models(self, provider: str) -> List[str]:
        """Get available models for specific provider."""
        try:
            response = await self._request("GET", f"/api/openai/models/{provider}")
            return response.get("data", [])
        except Exception as e:
            _LOGGER.error("Failed to get models for provider %s: %s", provider, e)
            default_models = self._get_default_models()
            return default_models.get(provider, [])

    async def get_ollama_models(self) -> List[Dict[str, Any]]:
        """Get available Ollama models from existing endpoint."""
        try:
            response = await self._request("GET", "/api/faces/ollama/models")
            models_data = response.get("models", [])
            
            # Transform to match HA expectations
            transformed_models = []
            for model in models_data:
                if isinstance(model, dict):
                    transformed_models.append({
                        "name": model.get("value", ""),
                        "display_name": model.get("label", ""),
                        "size": model.get("size", 0),
                        "modified_at": model.get("modified_at"),
                        "is_vision": True  # Backend already filters for vision models
                    })
            
            _LOGGER.debug("Retrieved %d Ollama models", len(transformed_models))
            return transformed_models
            
        except Exception as e:
            _LOGGER.error("Failed to get Ollama models: %s", e)
            return []

    async def get_ollama_status(self) -> Dict[str, Any]:
        """Get Ollama connection status."""
        try:
            response = await self._request("POST", "/api/faces/ollama/test")
            return {
                "status": "connected" if response.get("success") else "disconnected",
                "version": response.get("version"),
                "url": response.get("ollama_url"),
                "message": response.get("message"),
                "last_check": response.get("debug", {}).get("response_data", {})
            }
        except Exception as e:
            _LOGGER.error("Failed to get Ollama status: %s", e)
            return {
                "status": "disconnected", 
                "error": str(e),
                "message": f"Connection failed: {e}"
            }

    def _format_size(self, size_bytes: int) -> str:
        """Format model size for display."""
        if size_bytes == 0:
            return "Unknown"
        
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} PB"

    async def get_system_info(self) -> Dict[str, Any]:
        """Get comprehensive system information."""
        try:
            # Gather multiple pieces of system information
            health = await self.get_health()
            stats = await self.get_stats()
            face_config = await self.get_face_config()
            
            return {
                "health": health,
                "stats": stats,
                "face_config": face_config,
                "connected_clients": stats.get("connectedClients", 0),
                "is_online": stats.get("isOnline", False),
            }
        except Exception as err:
            _LOGGER.error("Failed to get system info: %s", err)
            return {
                "health": {"status": "unhealthy"},
                "stats": {"today": 0, "week": 0, "month": 0, "total": 0},
                "face_config": {"enabled": False},
                "connected_clients": 0,
                "is_online": False,
            }
