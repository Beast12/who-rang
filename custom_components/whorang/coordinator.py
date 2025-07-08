"""Data update coordinator for WhoRang AI Doorbell integration."""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import websockets
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api_client import WhoRangAPIClient, WhoRangConnectionError
from .const import (
    DOMAIN,
    DEFAULT_UPDATE_INTERVAL,
    DEFAULT_WEBSOCKET_TIMEOUT,
    WEBSOCKET_PATH,
    WS_TYPE_NEW_VISITOR,
    WS_TYPE_CONNECTION_STATUS,
    WS_TYPE_AI_ANALYSIS_COMPLETE,
    WS_TYPE_FACE_DETECTION_COMPLETE,
    WS_TYPE_SYSTEM_STATUS,
    EVENT_VISITOR_DETECTED,
    EVENT_KNOWN_VISITOR_DETECTED,
    EVENT_AI_ANALYSIS_COMPLETE,
    EVENT_FACE_DETECTION_COMPLETE,
)

_LOGGER = logging.getLogger(__name__)


class WhoRangDataUpdateCoordinator(DataUpdateCoordinator):
    """Class to manage fetching data from the WhoRang API and WebSocket."""

    def __init__(
        self,
        hass: HomeAssistant,
        api_client: WhoRangAPIClient,
        update_interval: int = DEFAULT_UPDATE_INTERVAL,
        enable_websocket: bool = True,
    ) -> None:
        """Initialize the coordinator."""
        self.api_client = api_client
        self.enable_websocket = enable_websocket
        self._websocket = None
        self._websocket_task = None
        self._reconnect_task = None
        self._last_visitor_id = None
        self._known_persons = {}
        
        # Build WebSocket URL with proper protocol
        self.websocket_url = self._build_websocket_url()
        
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=update_interval),
        )

    def _build_websocket_url(self) -> str:
        """Build WebSocket URL from API client configuration."""
        # Use ws:// for HTTP and wss:// for HTTPS
        scheme = "wss" if self.api_client.use_ssl else "ws"
        host = self.api_client.host
        port = self.api_client.port
        
        # Handle standard ports
        if (self.api_client.use_ssl and port == 443) or (not self.api_client.use_ssl and port == 80):
            return f"{scheme}://{host}{WEBSOCKET_PATH}"
        else:
            return f"{scheme}://{host}:{port}{WEBSOCKET_PATH}"

    async def _async_update_data(self) -> Dict[str, Any]:
        """Fetch data from API."""
        try:
            # Get system information
            system_info = await self.api_client.get_system_info()
            
            # Get latest visitor
            latest_visitor = await self.api_client.get_latest_visitor()
            
            # Get known persons for face recognition
            known_persons = await self.api_client.get_known_persons()
            self._known_persons = {person["id"]: person for person in known_persons}
            
            # Get AI usage stats if cost tracking is enabled
            ai_usage = await self.api_client.get_ai_usage_stats(days=1)
            
            # Get current AI provider and model information
            face_config = system_info.get("face_config", {})
            current_ai_provider = face_config.get("ai_provider", "local")
            current_ai_model = await self.api_client.get_current_ai_model()
            
            # Get available models for all providers
            available_models = await self.api_client.get_available_models()
            
            # Special handling for local/Ollama provider - get dynamic models
            ollama_models = []
            ollama_status = {}
            if current_ai_provider == "local":
                ollama_models = await self.api_client.get_ollama_models()
                ollama_status = await self.api_client.get_ollama_status()
                
                # Update available_models with dynamic Ollama models if available
                if ollama_models:
                    available_models["local"] = [model["name"] for model in ollama_models]
                    _LOGGER.debug("Updated local models with %d Ollama models", len(ollama_models))
            
            # Detect if there's a new visitor
            if latest_visitor and latest_visitor.get("visitor_id") != self._last_visitor_id:
                self._last_visitor_id = latest_visitor.get("visitor_id")
                await self._handle_new_visitor(latest_visitor)
            
            return {
                "system_info": system_info,
                "latest_visitor": latest_visitor,
                "known_persons": known_persons,
                "ai_usage": ai_usage,
                "current_ai_provider": current_ai_provider,
                "current_ai_model": current_ai_model,
                "available_models": available_models,
                "ollama_models": ollama_models,
                "ollama_status": ollama_status,
                "last_update": datetime.now().isoformat(),
                "websocket_connected": self._websocket is not None and not self._websocket.closed,
            }
            
        except Exception as err:
            raise UpdateFailed(f"Error communicating with API: {err}") from err

    async def async_setup(self) -> None:
        """Set up the coordinator."""
        # Start WebSocket connection if enabled
        if self.enable_websocket:
            await self._start_websocket()

    async def async_shutdown(self) -> None:
        """Shutdown the coordinator."""
        await self._stop_websocket()
        await self.api_client.close()

    async def _start_websocket(self) -> None:
        """Start WebSocket connection."""
        if self._websocket_task is not None:
            return
            
        _LOGGER.debug("Starting WebSocket connection to %s", self.websocket_url)
        self._websocket_task = asyncio.create_task(self._websocket_handler())

    async def _stop_websocket(self) -> None:
        """Stop WebSocket connection."""
        if self._websocket_task:
            self._websocket_task.cancel()
            try:
                await self._websocket_task
            except asyncio.CancelledError:
                pass
            self._websocket_task = None
            
        if self._reconnect_task:
            self._reconnect_task.cancel()
            try:
                await self._reconnect_task
            except asyncio.CancelledError:
                pass
            self._reconnect_task = None
            
        if self._websocket:
            await self._websocket.close()
            self._websocket = None

    async def _websocket_handler(self) -> None:
        """Handle WebSocket connection with auto-reconnect."""
        reconnect_delay = 1
        max_reconnect_delay = 60
        
        while True:
            try:
                _LOGGER.debug("Connecting to WebSocket at %s", self.websocket_url)
                
                # Prepare connection parameters
                connect_kwargs = {
                    "timeout": DEFAULT_WEBSOCKET_TIMEOUT,
                    "ping_interval": 20,
                    "ping_timeout": 10,
                }
                
                # Add SSL context if using HTTPS
                if self.api_client.use_ssl and self.api_client._ssl_context:
                    connect_kwargs["ssl"] = self.api_client._ssl_context
                
                # Add headers if API key is present
                if self.api_client.api_key:
                    connect_kwargs["extra_headers"] = {
                        "Authorization": f"Bearer {self.api_client.api_key}"
                    }
                
                async with websockets.connect(
                    self.websocket_url,
                    **connect_kwargs
                ) as websocket:
                    self._websocket = websocket
                    reconnect_delay = 1  # Reset delay on successful connection
                    
                    _LOGGER.info("WebSocket connected to WhoRang")
                    
                    # Listen for messages
                    async for message in websocket:
                        try:
                            await self._handle_websocket_message(message)
                        except Exception as err:
                            _LOGGER.error("Error handling WebSocket message: %s", err)
                            
            except websockets.exceptions.InvalidStatusCode as err:
                if err.status_code == 400:
                    _LOGGER.error("WebSocket connection rejected (400). Check if WebSocket endpoint exists at %s", self.websocket_url)
                elif err.status_code == 401:
                    _LOGGER.error("WebSocket authentication failed (401). Check API key.")
                else:
                    _LOGGER.error("WebSocket connection failed with status %s: %s", err.status_code, err)
                self._websocket = None
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(reconnect_delay * 2, max_reconnect_delay)
                
            except (websockets.exceptions.ConnectionClosed, OSError) as err:
                _LOGGER.warning("WebSocket connection lost: %s", err)
                self._websocket = None
                
                # Exponential backoff for reconnection
                _LOGGER.debug("Reconnecting in %s seconds", reconnect_delay)
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(reconnect_delay * 2, max_reconnect_delay)
                
            except Exception as err:
                _LOGGER.error("Unexpected WebSocket error: %s", err)
                self._websocket = None
                await asyncio.sleep(reconnect_delay)
                reconnect_delay = min(reconnect_delay * 2, max_reconnect_delay)

    async def _handle_websocket_message(self, message: str) -> None:
        """Handle incoming WebSocket message."""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            message_data = data.get("data", {})
            
            _LOGGER.debug("Received WebSocket message: %s", message_type)
            
            if message_type == WS_TYPE_NEW_VISITOR:
                await self._handle_new_visitor(message_data)
                
            elif message_type == WS_TYPE_AI_ANALYSIS_COMPLETE:
                await self._handle_ai_analysis_complete(message_data)
                
            elif message_type == WS_TYPE_FACE_DETECTION_COMPLETE:
                await self._handle_face_detection_complete(message_data)
                
            elif message_type == WS_TYPE_SYSTEM_STATUS:
                await self._handle_system_status(message_data)
                
            elif message_type == WS_TYPE_CONNECTION_STATUS:
                _LOGGER.debug("WebSocket connection status: %s", message_data)
                
            # Trigger coordinator update to refresh entities
            await self.async_request_refresh()
            
        except json.JSONDecodeError as err:
            _LOGGER.error("Failed to decode WebSocket message: %s", err)
        except Exception as err:
            _LOGGER.error("Error processing WebSocket message: %s", err)

    async def _handle_new_visitor(self, visitor_data: Dict[str, Any]) -> None:
        """Handle new visitor event."""
        _LOGGER.info("New visitor detected: %s", visitor_data.get("ai_message", "Unknown"))
        
        # Update last visitor ID
        self._last_visitor_id = visitor_data.get("visitor_id")
        
        # Check if this is a known visitor
        is_known_visitor = self._is_known_visitor(visitor_data)
        
        # Fire Home Assistant events
        event_type = EVENT_KNOWN_VISITOR_DETECTED if is_known_visitor else EVENT_VISITOR_DETECTED
        
        self.hass.bus.async_fire(
            event_type,
            {
                "visitor_id": visitor_data.get("visitor_id"),
                "timestamp": visitor_data.get("timestamp"),
                "ai_message": visitor_data.get("ai_message"),
                "ai_title": visitor_data.get("ai_title"),
                "location": visitor_data.get("location"),
                "image_url": visitor_data.get("image_url"),
                "is_known_visitor": is_known_visitor,
                "confidence_score": visitor_data.get("confidence_score"),
                "faces_detected": visitor_data.get("faces_detected", 0),
            }
        )

    async def _handle_ai_analysis_complete(self, analysis_data: Dict[str, Any]) -> None:
        """Handle AI analysis complete event."""
        _LOGGER.debug("AI analysis complete: %s", analysis_data.get("visitor_id"))
        
        self.hass.bus.async_fire(
            EVENT_AI_ANALYSIS_COMPLETE,
            {
                "visitor_id": analysis_data.get("visitor_id"),
                "ai_provider": analysis_data.get("ai_provider"),
                "processing_time": analysis_data.get("processing_time"),
                "confidence_score": analysis_data.get("confidence_score"),
                "objects_detected": analysis_data.get("objects_detected"),
                "cost_usd": analysis_data.get("cost_usd"),
            }
        )

    async def _handle_face_detection_complete(self, face_data: Dict[str, Any]) -> None:
        """Handle face detection complete event."""
        _LOGGER.debug("Face detection complete: %s", face_data.get("visitor_id"))
        
        self.hass.bus.async_fire(
            EVENT_FACE_DETECTION_COMPLETE,
            {
                "visitor_id": face_data.get("visitor_id"),
                "faces_detected": face_data.get("faces_detected", 0),
                "known_faces": face_data.get("known_faces", []),
                "processing_time": face_data.get("processing_time"),
            }
        )

    async def _handle_system_status(self, status_data: Dict[str, Any]) -> None:
        """Handle system status update."""
        _LOGGER.debug("System status update: %s", status_data.get("status"))

    def _is_known_visitor(self, visitor_data: Dict[str, Any]) -> bool:
        """Check if visitor is a known person based on face recognition."""
        # Check if any detected faces match known persons
        faces_detected = visitor_data.get("faces_detected", 0)
        if faces_detected > 0:
            # This would need to be enhanced with actual face matching logic
            # For now, we'll check if there's a person_id in the visitor data
            return visitor_data.get("person_id") is not None
        return False

    @callback
    def async_get_latest_visitor(self) -> Optional[Dict[str, Any]]:
        """Get the latest visitor data."""
        if self.data:
            return self.data.get("latest_visitor")
        return None

    @callback
    def async_get_system_info(self) -> Dict[str, Any]:
        """Get system information."""
        if self.data:
            return self.data.get("system_info", {})
        return {}

    @callback
    def async_get_known_persons(self) -> List[Dict[str, Any]]:
        """Get known persons list."""
        if self.data:
            return self.data.get("known_persons", [])
        return []

    @callback
    def async_get_ai_usage(self) -> Dict[str, Any]:
        """Get AI usage statistics."""
        if self.data:
            return self.data.get("ai_usage", {})
        return {"total_cost": 0, "total_requests": 0}

    @callback
    def async_is_websocket_connected(self) -> bool:
        """Check if WebSocket is connected."""
        if self.data:
            return self.data.get("websocket_connected", False)
        return False

    async def async_trigger_analysis(self, visitor_id: Optional[str] = None) -> bool:
        """Trigger AI analysis for a visitor."""
        try:
            await self.api_client.trigger_analysis(visitor_id)
            return True
        except Exception as err:
            _LOGGER.error("Failed to trigger analysis: %s", err)
            return False

    async def async_test_webhook(self) -> bool:
        """Test webhook functionality."""
        try:
            await self.api_client.test_webhook()
            return True
        except Exception as err:
            _LOGGER.error("Failed to test webhook: %s", err)
            return False

    async def async_set_ai_provider(self, provider: str, api_key: str = None) -> bool:
        """Set the active AI provider with optional API key."""
        try:
            if api_key:
                success = await self.api_client.set_ai_provider_with_key(provider, api_key)
            else:
                await self.api_client.set_ai_provider(provider)
                success = True
            
            if success:
                # Refresh data after changing provider
                await self.async_request_refresh()
            return success
        except Exception as err:
            _LOGGER.error("Failed to set AI provider: %s", err)
            return False

    async def async_add_known_person(self, name: str, notes: Optional[str] = None) -> bool:
        """Add a new known person."""
        try:
            await self.api_client.create_person(name, notes)
            # Refresh data after adding person
            await self.async_request_refresh()
            return True
        except Exception as err:
            _LOGGER.error("Failed to add known person: %s", err)
            return False

    async def async_remove_known_person(self, person_id: int) -> bool:
        """Remove a known person."""
        try:
            await self.api_client.delete_person(person_id)
            # Refresh data after removing person
            await self.async_request_refresh()
            return True
        except Exception as err:
            _LOGGER.error("Failed to remove known person: %s", err)
            return False

    async def async_export_data(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        format_type: str = "json",
    ) -> Optional[Dict[str, Any]]:
        """Export visitor data."""
        try:
            return await self.api_client.export_visitor_data(start_date, end_date, format_type)
        except Exception as err:
            _LOGGER.error("Failed to export data: %s", err)
            return None
