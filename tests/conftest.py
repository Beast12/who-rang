"""Pytest configuration and fixtures for WhoRang AI Doorbell integration tests."""
from __future__ import annotations

import json
from typing import Any, Dict, Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST, CONF_PORT
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component

from custom_components.whorang.const import (
    DOMAIN,
    CONF_API_KEY,
    CONF_UPDATE_INTERVAL,
    CONF_ENABLE_WEBSOCKET,
    CONF_ENABLE_COST_TRACKING,
    DEFAULT_PORT,
    DEFAULT_UPDATE_INTERVAL,
)


@pytest.fixture
def mock_config_entry() -> ConfigEntry:
    """Return a mock config entry."""
    return ConfigEntry(
        version=1,
        minor_version=1,
        domain=DOMAIN,
        title="WhoRang AI Doorbell",
        data={
            CONF_HOST: "192.168.1.100",
            CONF_PORT: DEFAULT_PORT,
            CONF_API_KEY: "test_api_key",
        },
        options={
            CONF_UPDATE_INTERVAL: DEFAULT_UPDATE_INTERVAL,
            CONF_ENABLE_WEBSOCKET: True,
            CONF_ENABLE_COST_TRACKING: True,
        },
        source="user",
        entry_id="test_entry_id",
        unique_id="192.168.1.100:3001",
    )


@pytest.fixture
def mock_system_info() -> Dict[str, Any]:
    """Return mock system information."""
    return {
        "health": {
            "status": "healthy",
            "uptime": "2 days, 3 hours",
            "environment": "production",
        },
        "stats": {
            "today": 5,
            "week": 25,
            "month": 100,
            "connectedClients": 2,
            "isOnline": True,
        },
        "face_config": {
            "enabled": True,
            "ai_provider": "openai",
            "confidence_threshold": 0.8,
            "cost_tracking_enabled": True,
            "monthly_budget_limit": 50.0,
        },
    }


@pytest.fixture
def mock_visitor_data() -> Dict[str, Any]:
    """Return mock visitor data."""
    return {
        "visitor_id": "visitor_123",
        "timestamp": "2025-01-07T12:00:00Z",
        "ai_message": "A person in casual clothing standing at the front door",
        "ai_title": "Visitor at Front Door",
        "location": "Front Door",
        "weather": "Sunny, 22°C",
        "device_name": "WhoRang Camera",
        "confidence_score": 0.95,
        "objects_detected": ["person", "door", "package"],
        "faces_detected": 1,
        "processing_time": "1250ms",
        "image_url": "/api/visitors/visitor_123/image",
        "person_id": None,
    }


@pytest.fixture
def mock_known_persons() -> list[Dict[str, Any]]:
    """Return mock known persons data."""
    return [
        {
            "id": 1,
            "name": "John Doe",
            "face_count": 5,
            "last_seen": "2025-01-06T18:30:00Z",
            "notes": "Family member",
        },
        {
            "id": 2,
            "name": "Jane Smith",
            "face_count": 3,
            "last_seen": "2025-01-05T14:20:00Z",
            "notes": "Neighbor",
        },
    ]


@pytest.fixture
def mock_ai_usage() -> Dict[str, Any]:
    """Return mock AI usage statistics."""
    return {
        "total_cost": 2.45,
        "total_requests": 15,
        "providers": [
            {
                "name": "openai",
                "requests": 12,
                "cost": 2.10,
            },
            {
                "name": "local",
                "requests": 3,
                "cost": 0.35,
            },
        ],
    }


@pytest.fixture
def mock_websocket_messages() -> list[Dict[str, Any]]:
    """Return mock WebSocket messages."""
    return [
        {
            "type": "new_visitor",
            "data": {
                "visitor_id": "visitor_456",
                "timestamp": "2025-01-07T13:00:00Z",
                "ai_message": "Delivery person with package",
                "ai_title": "Package Delivery",
                "location": "Front Door",
                "confidence_score": 0.92,
                "faces_detected": 1,
            },
        },
        {
            "type": "ai_analysis_complete",
            "data": {
                "visitor_id": "visitor_456",
                "ai_provider": "openai",
                "processing_time": "980ms",
                "confidence_score": 0.92,
                "objects_detected": ["person", "package", "uniform"],
                "cost_usd": 0.15,
            },
        },
        {
            "type": "face_detection_complete",
            "data": {
                "visitor_id": "visitor_456",
                "faces_detected": 1,
                "known_faces": [],
                "processing_time": "450ms",
            },
        },
        {
            "type": "system_status",
            "data": {
                "status": "healthy",
                "connected_clients": 3,
            },
        },
        {
            "type": "connection_status",
            "data": {
                "status": "connected",
                "client_id": "ha_integration",
            },
        },
    ]


@pytest.fixture
def mock_api_client(
    mock_system_info: Dict[str, Any],
    mock_visitor_data: Dict[str, Any],
    mock_known_persons: list[Dict[str, Any]],
    mock_ai_usage: Dict[str, Any],
) -> AsyncMock:
    """Return a mock API client."""
    client = AsyncMock()
    client.host = "192.168.1.100"
    client.port = 3001
    client.api_key = "test_api_key"
    
    # Mock API methods
    client.validate_connection.return_value = True
    client.get_system_info.return_value = mock_system_info
    client.get_latest_visitor.return_value = mock_visitor_data
    client.get_known_persons.return_value = mock_known_persons
    client.get_ai_usage_stats.return_value = mock_ai_usage
    client.trigger_analysis.return_value = True
    client.test_webhook.return_value = True
    client.set_ai_provider.return_value = True
    client.create_person.return_value = {"id": 3, "name": "New Person"}
    client.delete_person.return_value = True
    client.export_visitor_data.return_value = {"status": "success", "data": []}
    client.close.return_value = None
    
    return client


@pytest.fixture
def mock_coordinator(mock_api_client: AsyncMock) -> AsyncMock:
    """Return a mock coordinator."""
    coordinator = AsyncMock()
    coordinator.api_client = mock_api_client
    coordinator.data = {
        "system_info": mock_api_client.get_system_info.return_value,
        "latest_visitor": mock_api_client.get_latest_visitor.return_value,
        "known_persons": mock_api_client.get_known_persons.return_value,
        "ai_usage": mock_api_client.get_ai_usage_stats.return_value,
        "last_update": "2025-01-07T12:00:00Z",
        "websocket_connected": True,
    }
    
    # Mock coordinator methods
    coordinator.async_get_latest_visitor.return_value = coordinator.data["latest_visitor"]
    coordinator.async_get_system_info.return_value = coordinator.data["system_info"]
    coordinator.async_get_known_persons.return_value = coordinator.data["known_persons"]
    coordinator.async_get_ai_usage.return_value = coordinator.data["ai_usage"]
    coordinator.async_is_websocket_connected.return_value = True
    coordinator.async_request_refresh.return_value = None
    coordinator.async_setup.return_value = None
    coordinator.async_shutdown.return_value = None
    
    return coordinator


@pytest.fixture
async def hass_with_integration(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_api_client: AsyncMock,
) -> HomeAssistant:
    """Set up Home Assistant with WhoRang integration."""
    with patch(
        "custom_components.whorang.WhoRangAPIClient",
        return_value=mock_api_client,
    ), patch(
        "custom_components.whorang.coordinator.WhoRangDataUpdateCoordinator.async_setup"
    ), patch(
        "custom_components.whorang.coordinator.WhoRangDataUpdateCoordinator.async_config_entry_first_refresh"
    ):
        mock_config_entry.add_to_hass(hass)
        assert await async_setup_component(hass, DOMAIN, {})
        await hass.async_block_till_done()
        
    return hass


@pytest.fixture
def mock_websocket() -> Generator[MagicMock, None, None]:
    """Mock websockets.connect context manager."""
    with patch("websockets.connect") as mock_connect:
        mock_websocket = AsyncMock()
        mock_websocket.closed = False
        mock_websocket.__aenter__ = AsyncMock(return_value=mock_websocket)
        mock_websocket.__aexit__ = AsyncMock(return_value=None)
        mock_connect.return_value = mock_websocket
        yield mock_websocket


@pytest.fixture
def load_fixture():
    """Load a fixture file."""
    def _load_fixture(filename: str) -> str:
        """Load fixture data from file."""
        try:
            with open(f"tests/fixtures/{filename}", encoding="utf-8") as file:
                return file.read()
        except FileNotFoundError:
            # Return empty data if fixture file doesn't exist
            return "{}"
    
    return _load_fixture


@pytest.fixture
def load_json_fixture(load_fixture):
    """Load a JSON fixture file."""
    def _load_json_fixture(filename: str) -> Dict[str, Any]:
        """Load JSON fixture data from file."""
        data = load_fixture(filename)
        return json.loads(data) if data != "{}" else {}
    
    return _load_json_fixture
