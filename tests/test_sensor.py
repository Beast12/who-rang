"""Test the WhoRang AI Doorbell sensor platform."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.components.sensor import SensorDeviceClass, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo

from custom_components.whorang.const import (
    DOMAIN,
    MANUFACTURER,
    MODEL,
    SW_VERSION,
    SENSOR_LATEST_VISITOR,
    SENSOR_VISITOR_COUNT_TODAY,
    SENSOR_VISITOR_COUNT_WEEK,
    SENSOR_VISITOR_COUNT_MONTH,
    SENSOR_SYSTEM_STATUS,
    SENSOR_AI_PROVIDER_ACTIVE,
    SENSOR_AI_COST_TODAY,
    SENSOR_AI_RESPONSE_TIME,
    SENSOR_KNOWN_FACES_COUNT,
    UNIT_MILLISECONDS,
    UNIT_CURRENCY_USD,
    UNIT_VISITORS,
    UNIT_FACES,
)
from custom_components.whorang.sensor import (
    WhoRangLatestVisitorSensor,
    WhoRangVisitorCountTodaySensor,
    WhoRangVisitorCountWeekSensor,
    WhoRangVisitorCountMonthSensor,
    WhoRangSystemStatusSensor,
    WhoRangAIProviderSensor,
    WhoRangAICostTodaySensor,
    WhoRangAIResponseTimeSensor,
    WhoRangKnownFacesCountSensor,
    async_setup_entry,
)


async def test_async_setup_entry(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_coordinator: AsyncMock,
) -> None:
    """Test sensor platform setup."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][mock_config_entry.entry_id] = mock_coordinator

    with patch(
        "custom_components.whorang.sensor.WhoRangLatestVisitorSensor"
    ) as mock_latest_visitor, patch(
        "custom_components.whorang.sensor.WhoRangVisitorCountTodaySensor"
    ) as mock_count_today, patch(
        "custom_components.whorang.sensor.WhoRangVisitorCountWeekSensor"
    ) as mock_count_week, patch(
        "custom_components.whorang.sensor.WhoRangVisitorCountMonthSensor"
    ) as mock_count_month, patch(
        "custom_components.whorang.sensor.WhoRangSystemStatusSensor"
    ) as mock_system_status, patch(
        "custom_components.whorang.sensor.WhoRangAIProviderSensor"
    ) as mock_ai_provider, patch(
        "custom_components.whorang.sensor.WhoRangAICostTodaySensor"
    ) as mock_ai_cost, patch(
        "custom_components.whorang.sensor.WhoRangAIResponseTimeSensor"
    ) as mock_ai_response, patch(
        "custom_components.whorang.sensor.WhoRangKnownFacesCountSensor"
    ) as mock_known_faces:
        
        async_add_entities = AsyncMock()
        await async_setup_entry(hass, mock_config_entry, async_add_entities)

        # Verify all sensor classes were instantiated
        mock_latest_visitor.assert_called_once_with(mock_coordinator, mock_config_entry)
        mock_count_today.assert_called_once_with(mock_coordinator, mock_config_entry)
        mock_count_week.assert_called_once_with(mock_coordinator, mock_config_entry)
        mock_count_month.assert_called_once_with(mock_coordinator, mock_config_entry)
        mock_system_status.assert_called_once_with(mock_coordinator, mock_config_entry)
        mock_ai_provider.assert_called_once_with(mock_coordinator, mock_config_entry)
        mock_ai_cost.assert_called_once_with(mock_coordinator, mock_config_entry)
        mock_ai_response.assert_called_once_with(mock_coordinator, mock_config_entry)
        mock_known_faces.assert_called_once_with(mock_coordinator, mock_config_entry)

        # Verify entities were added
        async_add_entities.assert_called_once()
        entities = async_add_entities.call_args[0][0]
        assert len(entities) == 9


class TestWhoRangLatestVisitorSensor:
    """Test the latest visitor sensor."""

    def test_init(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test sensor initialization."""
        sensor = WhoRangLatestVisitorSensor(mock_coordinator, mock_config_entry)
        
        assert sensor.coordinator == mock_coordinator
        assert sensor.config_entry == mock_config_entry
        assert sensor.sensor_type == SENSOR_LATEST_VISITOR
        assert sensor.unique_id == f"{mock_config_entry.entry_id}_{SENSOR_LATEST_VISITOR}"
        assert sensor.name == "Latest Visitor"
        assert sensor.icon == "mdi:account-clock"
        assert sensor.has_entity_name is True

    def test_device_info(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test device info."""
        sensor = WhoRangLatestVisitorSensor(mock_coordinator, mock_config_entry)
        device_info = sensor.device_info
        
        assert isinstance(device_info, DeviceInfo)
        assert device_info["identifiers"] == {(DOMAIN, mock_config_entry.entry_id)}
        assert device_info["name"] == "WhoRang AI Doorbell"
        assert device_info["manufacturer"] == MANUFACTURER
        assert device_info["model"] == MODEL
        assert device_info["sw_version"] == SW_VERSION
        assert "configuration_url" in device_info

    def test_native_value_with_visitor(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_visitor_data,
    ) -> None:
        """Test native value with visitor data."""
        mock_coordinator.async_get_latest_visitor.return_value = mock_visitor_data
        
        sensor = WhoRangLatestVisitorSensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value == "Visitor at Front Door"

    def test_native_value_with_message_fallback(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test native value with message fallback."""
        visitor_data = {
            "ai_message": "A person at the door",
            "ai_title": None,
        }
        mock_coordinator.async_get_latest_visitor.return_value = visitor_data
        
        sensor = WhoRangLatestVisitorSensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value == "A person at the door"

    def test_native_value_no_visitor(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test native value with no visitor."""
        mock_coordinator.async_get_latest_visitor.return_value = None
        
        sensor = WhoRangLatestVisitorSensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value == "No visitors"

    def test_extra_state_attributes(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_visitor_data,
    ) -> None:
        """Test extra state attributes."""
        mock_coordinator.async_get_latest_visitor.return_value = mock_visitor_data
        
        sensor = WhoRangLatestVisitorSensor(mock_coordinator, mock_config_entry)
        attributes = sensor.extra_state_attributes
        
        assert attributes["visitor_id"] == "visitor_123"
        assert attributes["timestamp"] == "2025-01-07T12:00:00Z"
        assert attributes["ai_message"] == "A person in casual clothing standing at the front door"
        assert attributes["ai_title"] == "Visitor at Front Door"
        assert attributes["location"] == "Front Door"
        assert attributes["confidence_score"] == 0.95
        assert attributes["faces_detected"] == 1

    def test_extra_state_attributes_no_visitor(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test extra state attributes with no visitor."""
        mock_coordinator.async_get_latest_visitor.return_value = None
        
        sensor = WhoRangLatestVisitorSensor(mock_coordinator, mock_config_entry)
        assert sensor.extra_state_attributes == {}


class TestWhoRangVisitorCountTodaySensor:
    """Test the visitor count today sensor."""

    def test_init(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test sensor initialization."""
        sensor = WhoRangVisitorCountTodaySensor(mock_coordinator, mock_config_entry)
        
        assert sensor.name == "Visitors Today"
        assert sensor.icon == "mdi:counter"
        assert sensor.native_unit_of_measurement == UNIT_VISITORS
        assert sensor.state_class == SensorStateClass.TOTAL_INCREASING

    def test_native_value(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_system_info,
    ) -> None:
        """Test native value."""
        mock_coordinator.async_get_system_info.return_value = mock_system_info
        
        sensor = WhoRangVisitorCountTodaySensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value == 5


class TestWhoRangSystemStatusSensor:
    """Test the system status sensor."""

    def test_init(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test sensor initialization."""
        sensor = WhoRangSystemStatusSensor(mock_coordinator, mock_config_entry)
        
        assert sensor.name == "System Status"
        assert sensor.icon == "mdi:server"

    def test_native_value(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_system_info,
    ) -> None:
        """Test native value."""
        mock_coordinator.async_get_system_info.return_value = mock_system_info
        
        sensor = WhoRangSystemStatusSensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value == "healthy"

    def test_extra_state_attributes(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_system_info,
    ) -> None:
        """Test extra state attributes."""
        mock_coordinator.async_get_system_info.return_value = mock_system_info
        mock_coordinator.async_is_websocket_connected.return_value = True
        
        sensor = WhoRangSystemStatusSensor(mock_coordinator, mock_config_entry)
        attributes = sensor.extra_state_attributes
        
        assert attributes["uptime"] == "2 days, 3 hours"
        assert attributes["environment"] == "production"
        assert attributes["connected_clients"] == 2
        assert attributes["is_online"] is True
        assert attributes["websocket_connected"] is True


class TestWhoRangAIProviderSensor:
    """Test the AI provider sensor."""

    def test_init(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test sensor initialization."""
        sensor = WhoRangAIProviderSensor(mock_coordinator, mock_config_entry)
        
        assert sensor.name == "AI Provider"
        assert sensor.icon == "mdi:brain"

    def test_native_value(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_system_info,
    ) -> None:
        """Test native value."""
        mock_coordinator.async_get_system_info.return_value = mock_system_info
        
        sensor = WhoRangAIProviderSensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value == "openai"

    def test_extra_state_attributes(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_system_info,
    ) -> None:
        """Test extra state attributes."""
        mock_coordinator.async_get_system_info.return_value = mock_system_info
        
        sensor = WhoRangAIProviderSensor(mock_coordinator, mock_config_entry)
        attributes = sensor.extra_state_attributes
        
        assert attributes["enabled"] is True
        assert attributes["confidence_threshold"] == 0.8
        assert attributes["cost_tracking_enabled"] is True
        assert attributes["monthly_budget_limit"] == 50.0


class TestWhoRangAICostTodaySensor:
    """Test the AI cost today sensor."""

    def test_init(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test sensor initialization."""
        sensor = WhoRangAICostTodaySensor(mock_coordinator, mock_config_entry)
        
        assert sensor.name == "AI Cost Today"
        assert sensor.icon == "mdi:currency-usd"
        assert sensor.native_unit_of_measurement == UNIT_CURRENCY_USD
        assert sensor.device_class == SensorDeviceClass.MONETARY
        assert sensor.state_class == SensorStateClass.TOTAL_INCREASING

    def test_native_value(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_ai_usage,
    ) -> None:
        """Test native value."""
        mock_coordinator.async_get_ai_usage.return_value = mock_ai_usage
        
        sensor = WhoRangAICostTodaySensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value == 2.45

    def test_extra_state_attributes(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_ai_usage,
    ) -> None:
        """Test extra state attributes."""
        mock_coordinator.async_get_ai_usage.return_value = mock_ai_usage
        
        sensor = WhoRangAICostTodaySensor(mock_coordinator, mock_config_entry)
        attributes = sensor.extra_state_attributes
        
        assert attributes["total_requests"] == 15
        assert len(attributes["providers"]) == 2


class TestWhoRangAIResponseTimeSensor:
    """Test the AI response time sensor."""

    def test_init(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test sensor initialization."""
        sensor = WhoRangAIResponseTimeSensor(mock_coordinator, mock_config_entry)
        
        assert sensor.name == "AI Response Time"
        assert sensor.icon == "mdi:timer"
        assert sensor.native_unit_of_measurement == UNIT_MILLISECONDS
        assert sensor.device_class == SensorDeviceClass.DURATION
        assert sensor.state_class == SensorStateClass.MEASUREMENT

    def test_native_value_with_ms_string(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test native value with milliseconds string."""
        visitor_data = {"processing_time": "1250ms"}
        mock_coordinator.async_get_latest_visitor.return_value = visitor_data
        
        sensor = WhoRangAIResponseTimeSensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value == 1250

    def test_native_value_with_number(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test native value with number."""
        visitor_data = {"processing_time": 1250}
        mock_coordinator.async_get_latest_visitor.return_value = visitor_data
        
        sensor = WhoRangAIResponseTimeSensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value == 1250

    def test_native_value_no_data(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test native value with no data."""
        mock_coordinator.async_get_latest_visitor.return_value = None
        
        sensor = WhoRangAIResponseTimeSensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value is None


class TestWhoRangKnownFacesCountSensor:
    """Test the known faces count sensor."""

    def test_init(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
    ) -> None:
        """Test sensor initialization."""
        sensor = WhoRangKnownFacesCountSensor(mock_coordinator, mock_config_entry)
        
        assert sensor.name == "Known Faces"
        assert sensor.icon == "mdi:face-recognition"
        assert sensor.native_unit_of_measurement == UNIT_FACES
        assert sensor.state_class == SensorStateClass.TOTAL

    def test_native_value(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_known_persons,
    ) -> None:
        """Test native value."""
        mock_coordinator.async_get_known_persons.return_value = mock_known_persons
        
        sensor = WhoRangKnownFacesCountSensor(mock_coordinator, mock_config_entry)
        assert sensor.native_value == 2

    def test_extra_state_attributes(
        self,
        mock_coordinator: AsyncMock,
        mock_config_entry: ConfigEntry,
        mock_known_persons,
    ) -> None:
        """Test extra state attributes."""
        mock_coordinator.async_get_known_persons.return_value = mock_known_persons
        
        sensor = WhoRangKnownFacesCountSensor(mock_coordinator, mock_config_entry)
        attributes = sensor.extra_state_attributes
        
        assert len(attributes["persons"]) == 2
        assert attributes["persons"][0]["id"] == 1
        assert attributes["persons"][0]["name"] == "John Doe"
        assert attributes["persons"][0]["face_count"] == 5
        assert attributes["persons"][1]["id"] == 2
        assert attributes["persons"][1]["name"] == "Jane Smith"
