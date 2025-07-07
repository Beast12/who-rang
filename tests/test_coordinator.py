"""Test the WhoRang AI Doorbell coordinator."""
from __future__ import annotations

import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import UpdateFailed

from custom_components.whorang.coordinator import WhoRangDataUpdateCoordinator
from custom_components.whorang.const import (
    WS_TYPE_NEW_VISITOR,
    WS_TYPE_AI_ANALYSIS_COMPLETE,
    WS_TYPE_FACE_DETECTION_COMPLETE,
    WS_TYPE_SYSTEM_STATUS,
    WS_TYPE_CONNECTION_STATUS,
    EVENT_VISITOR_DETECTED,
    EVENT_KNOWN_VISITOR_DETECTED,
    EVENT_AI_ANALYSIS_COMPLETE,
    EVENT_FACE_DETECTION_COMPLETE,
)


class TestWhoRangDataUpdateCoordinator:
    """Test the WhoRang data update coordinator."""

    async def test_init(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test coordinator initialization."""
        coordinator = WhoRangDataUpdateCoordinator(
            hass,
            mock_api_client,
            update_interval=30,
            enable_websocket=True,
        )

        assert coordinator.api_client == mock_api_client
        assert coordinator.enable_websocket is True
        assert coordinator.websocket_url == f"ws://{mock_api_client.host}:{mock_api_client.port}/ws"
        assert coordinator._websocket is None
        assert coordinator._websocket_task is None
        assert coordinator._last_visitor_id is None

    async def test_async_update_data_success(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
        mock_system_info,
        mock_visitor_data,
        mock_known_persons,
        mock_ai_usage,
    ) -> None:
        """Test successful data update."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)

        data = await coordinator._async_update_data()

        assert data["system_info"] == mock_system_info
        assert data["latest_visitor"] == mock_visitor_data
        assert data["known_persons"] == mock_known_persons
        assert data["ai_usage"] == mock_ai_usage
        assert "last_update" in data
        assert data["websocket_connected"] is False

        # Verify API calls were made
        mock_api_client.get_system_info.assert_called_once()
        mock_api_client.get_latest_visitor.assert_called_once()
        mock_api_client.get_known_persons.assert_called_once()
        mock_api_client.get_ai_usage_stats.assert_called_once_with(days=1)

    async def test_async_update_data_api_error(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test data update with API error."""
        mock_api_client.get_system_info.side_effect = Exception("API Error")
        
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)

        with pytest.raises(UpdateFailed, match="Error communicating with API: API Error"):
            await coordinator._async_update_data()

    async def test_async_update_data_new_visitor_detection(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
        mock_visitor_data,
    ) -> None:
        """Test new visitor detection during data update."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        
        # Mock the _handle_new_visitor method
        coordinator._handle_new_visitor = AsyncMock()

        # First call - no previous visitor
        await coordinator._async_update_data()
        coordinator._handle_new_visitor.assert_called_once_with(mock_visitor_data)

        # Reset mock
        coordinator._handle_new_visitor.reset_mock()

        # Second call - same visitor, should not trigger
        await coordinator._async_update_data()
        coordinator._handle_new_visitor.assert_not_called()

        # Third call - new visitor
        new_visitor = {**mock_visitor_data, "visitor_id": "visitor_456"}
        mock_api_client.get_latest_visitor.return_value = new_visitor
        
        await coordinator._async_update_data()
        coordinator._handle_new_visitor.assert_called_once_with(new_visitor)

    async def test_async_setup(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test coordinator setup."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client, enable_websocket=True)
        
        with patch.object(coordinator, "_start_websocket") as mock_start_ws:
            await coordinator.async_setup()
            mock_start_ws.assert_called_once()

    async def test_async_setup_no_websocket(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test coordinator setup without WebSocket."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client, enable_websocket=False)
        
        with patch.object(coordinator, "_start_websocket") as mock_start_ws:
            await coordinator.async_setup()
            mock_start_ws.assert_not_called()

    async def test_async_shutdown(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test coordinator shutdown."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        
        with patch.object(coordinator, "_stop_websocket") as mock_stop_ws:
            await coordinator.async_shutdown()
            mock_stop_ws.assert_called_once()
            mock_api_client.close.assert_called_once()

    async def test_websocket_message_handling(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
        mock_websocket_messages,
    ) -> None:
        """Test WebSocket message handling."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        
        # Mock the handler methods
        coordinator._handle_new_visitor = AsyncMock()
        coordinator._handle_ai_analysis_complete = AsyncMock()
        coordinator._handle_face_detection_complete = AsyncMock()
        coordinator._handle_system_status = AsyncMock()
        coordinator.async_request_refresh = AsyncMock()

        # Test new visitor message
        new_visitor_msg = mock_websocket_messages[0]
        await coordinator._handle_websocket_message(json.dumps(new_visitor_msg))
        
        coordinator._handle_new_visitor.assert_called_once_with(new_visitor_msg["data"])
        coordinator.async_request_refresh.assert_called()

        # Reset mocks
        coordinator._handle_new_visitor.reset_mock()
        coordinator.async_request_refresh.reset_mock()

        # Test AI analysis complete message
        ai_analysis_msg = mock_websocket_messages[1]
        await coordinator._handle_websocket_message(json.dumps(ai_analysis_msg))
        
        coordinator._handle_ai_analysis_complete.assert_called_once_with(ai_analysis_msg["data"])
        coordinator.async_request_refresh.assert_called()

    async def test_websocket_message_invalid_json(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test WebSocket message handling with invalid JSON."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        
        # Should not raise an exception
        await coordinator._handle_websocket_message("invalid json")

    async def test_handle_new_visitor_unknown(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test handling new unknown visitor."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        
        visitor_data = {
            "visitor_id": "visitor_123",
            "timestamp": "2025-01-07T12:00:00Z",
            "ai_message": "Unknown person at door",
            "ai_title": "Visitor",
            "location": "Front Door",
            "confidence_score": 0.85,
            "faces_detected": 1,
        }

        with patch.object(hass.bus, "async_fire") as mock_fire:
            await coordinator._handle_new_visitor(visitor_data)
            
            mock_fire.assert_called_once_with(
                EVENT_VISITOR_DETECTED,
                {
                    "visitor_id": "visitor_123",
                    "timestamp": "2025-01-07T12:00:00Z",
                    "ai_message": "Unknown person at door",
                    "ai_title": "Visitor",
                    "location": "Front Door",
                    "image_url": None,
                    "is_known_visitor": False,
                    "confidence_score": 0.85,
                    "faces_detected": 1,
                }
            )

    async def test_handle_new_visitor_known(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test handling new known visitor."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        
        visitor_data = {
            "visitor_id": "visitor_456",
            "timestamp": "2025-01-07T13:00:00Z",
            "ai_message": "John Doe at door",
            "ai_title": "Known Visitor: John Doe",
            "location": "Front Door",
            "confidence_score": 0.95,
            "faces_detected": 1,
            "person_id": 1,
        }

        with patch.object(hass.bus, "async_fire") as mock_fire:
            await coordinator._handle_new_visitor(visitor_data)
            
            mock_fire.assert_called_once_with(
                EVENT_KNOWN_VISITOR_DETECTED,
                {
                    "visitor_id": "visitor_456",
                    "timestamp": "2025-01-07T13:00:00Z",
                    "ai_message": "John Doe at door",
                    "ai_title": "Known Visitor: John Doe",
                    "location": "Front Door",
                    "image_url": None,
                    "is_known_visitor": True,
                    "confidence_score": 0.95,
                    "faces_detected": 1,
                }
            )

    async def test_handle_ai_analysis_complete(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test handling AI analysis complete event."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        
        analysis_data = {
            "visitor_id": "visitor_123",
            "ai_provider": "openai",
            "processing_time": "1200ms",
            "confidence_score": 0.92,
            "objects_detected": ["person", "package"],
            "cost_usd": 0.15,
        }

        with patch.object(hass.bus, "async_fire") as mock_fire:
            await coordinator._handle_ai_analysis_complete(analysis_data)
            
            mock_fire.assert_called_once_with(
                EVENT_AI_ANALYSIS_COMPLETE,
                analysis_data
            )

    async def test_handle_face_detection_complete(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test handling face detection complete event."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        
        face_data = {
            "visitor_id": "visitor_123",
            "faces_detected": 2,
            "known_faces": ["John Doe"],
            "processing_time": "450ms",
        }

        with patch.object(hass.bus, "async_fire") as mock_fire:
            await coordinator._handle_face_detection_complete(face_data)
            
            mock_fire.assert_called_once_with(
                EVENT_FACE_DETECTION_COMPLETE,
                face_data
            )

    async def test_is_known_visitor(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test known visitor detection logic."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)

        # Test with person_id (known visitor)
        visitor_with_person_id = {
            "visitor_id": "visitor_123",
            "faces_detected": 1,
            "person_id": 1,
        }
        assert coordinator._is_known_visitor(visitor_with_person_id) is True

        # Test without person_id but with faces (unknown visitor)
        visitor_without_person_id = {
            "visitor_id": "visitor_456",
            "faces_detected": 1,
            "person_id": None,
        }
        assert coordinator._is_known_visitor(visitor_without_person_id) is False

        # Test without faces detected
        visitor_no_faces = {
            "visitor_id": "visitor_789",
            "faces_detected": 0,
        }
        assert coordinator._is_known_visitor(visitor_no_faces) is False

    async def test_async_trigger_analysis(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test triggering AI analysis."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)

        # Test successful trigger
        result = await coordinator.async_trigger_analysis("visitor_123")
        assert result is True
        mock_api_client.trigger_analysis.assert_called_once_with("visitor_123")

        # Test with API error
        mock_api_client.trigger_analysis.side_effect = Exception("API Error")
        result = await coordinator.async_trigger_analysis("visitor_456")
        assert result is False

    async def test_async_test_webhook(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test webhook testing."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)

        # Test successful webhook test
        result = await coordinator.async_test_webhook()
        assert result is True
        mock_api_client.test_webhook.assert_called_once()

        # Test with API error
        mock_api_client.test_webhook.side_effect = Exception("API Error")
        result = await coordinator.async_test_webhook()
        assert result is False

    async def test_async_set_ai_provider(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test setting AI provider."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        coordinator.async_request_refresh = AsyncMock()

        # Test successful provider change
        result = await coordinator.async_set_ai_provider("openai")
        assert result is True
        mock_api_client.set_ai_provider.assert_called_once_with("openai")
        coordinator.async_request_refresh.assert_called_once()

        # Test with API error
        mock_api_client.set_ai_provider.side_effect = Exception("API Error")
        result = await coordinator.async_set_ai_provider("claude")
        assert result is False

    async def test_async_add_known_person(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test adding known person."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        coordinator.async_request_refresh = AsyncMock()

        # Test successful person addition
        result = await coordinator.async_add_known_person("John Doe", "Family member")
        assert result is True
        mock_api_client.create_person.assert_called_once_with("John Doe", "Family member")
        coordinator.async_request_refresh.assert_called_once()

        # Test with API error
        mock_api_client.create_person.side_effect = Exception("API Error")
        result = await coordinator.async_add_known_person("Jane Doe", "Friend")
        assert result is False

    async def test_async_remove_known_person(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test removing known person."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        coordinator.async_request_refresh = AsyncMock()

        # Test successful person removal
        result = await coordinator.async_remove_known_person(123)
        assert result is True
        mock_api_client.delete_person.assert_called_once_with(123)
        coordinator.async_request_refresh.assert_called_once()

        # Test with API error
        mock_api_client.delete_person.side_effect = Exception("API Error")
        result = await coordinator.async_remove_known_person(456)
        assert result is False

    async def test_async_export_data(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
    ) -> None:
        """Test data export."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)

        export_result = {"status": "success", "data": []}
        mock_api_client.export_visitor_data.return_value = export_result

        # Test successful export
        result = await coordinator.async_export_data("2025-01-01", "2025-01-07", "json")
        assert result == export_result
        mock_api_client.export_visitor_data.assert_called_once_with("2025-01-01", "2025-01-07", "json")

        # Test with API error
        mock_api_client.export_visitor_data.side_effect = Exception("API Error")
        result = await coordinator.async_export_data("2025-01-01", "2025-01-07", "csv")
        assert result is None

    async def test_callback_methods(
        self,
        hass: HomeAssistant,
        mock_api_client: AsyncMock,
        mock_system_info,
        mock_visitor_data,
        mock_known_persons,
        mock_ai_usage,
    ) -> None:
        """Test callback methods."""
        coordinator = WhoRangDataUpdateCoordinator(hass, mock_api_client)
        coordinator.data = {
            "system_info": mock_system_info,
            "latest_visitor": mock_visitor_data,
            "known_persons": mock_known_persons,
            "ai_usage": mock_ai_usage,
            "websocket_connected": True,
        }

        # Test callback methods
        assert coordinator.async_get_latest_visitor() == mock_visitor_data
        assert coordinator.async_get_system_info() == mock_system_info
        assert coordinator.async_get_known_persons() == mock_known_persons
        assert coordinator.async_get_ai_usage() == mock_ai_usage
        assert coordinator.async_is_websocket_connected() is True

        # Test with no data
        coordinator.data = None
        assert coordinator.async_get_latest_visitor() is None
        assert coordinator.async_get_system_info() == {}
        assert coordinator.async_get_known_persons() == []
        assert coordinator.async_get_ai_usage() == {"total_cost": 0, "total_requests": 0}
        assert coordinator.async_is_websocket_connected() is False
