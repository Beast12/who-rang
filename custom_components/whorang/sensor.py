"""Sensor platform for WhoRang AI Doorbell integration."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.helpers.entity import EntityCategory
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
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
    ATTR_VISITOR_ID,
    ATTR_TIMESTAMP,
    ATTR_AI_MESSAGE,
    ATTR_AI_TITLE,
    ATTR_LOCATION,
    ATTR_WEATHER,
    ATTR_DEVICE_NAME,
    ATTR_CONFIDENCE_SCORE,
    ATTR_OBJECTS_DETECTED,
    ATTR_FACES_DETECTED,
    ATTR_PROCESSING_TIME,
    ATTR_AI_PROVIDER,
    ATTR_COST_USD,
    ATTR_IMAGE_URL,
    UNIT_MILLISECONDS,
    UNIT_CURRENCY_USD,
    UNIT_VISITORS,
    UNIT_FACES,
    STATE_CLASS_MEASUREMENT,
    STATE_CLASS_TOTAL,
    STATE_CLASS_TOTAL_INCREASING,
    DEVICE_CLASS_TIMESTAMP,
    DEVICE_CLASS_DURATION,
    DEVICE_CLASS_MONETARY,
)
from .coordinator import WhoRangDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up WhoRang sensor entities."""
    coordinator: WhoRangDataUpdateCoordinator = hass.data[DOMAIN][config_entry.entry_id]

    entities = [
        WhoRangLatestVisitorSensor(coordinator, config_entry),
        WhoRangVisitorCountTodaySensor(coordinator, config_entry),
        WhoRangVisitorCountWeekSensor(coordinator, config_entry),
        WhoRangVisitorCountMonthSensor(coordinator, config_entry),
        WhoRangSystemStatusSensor(coordinator, config_entry),
        WhoRangAIProviderSensor(coordinator, config_entry),
        WhoRangAICostTodaySensor(coordinator, config_entry),
        WhoRangAIResponseTimeSensor(coordinator, config_entry),
        WhoRangKnownFacesCountSensor(coordinator, config_entry),
    ]

    async_add_entities(entities)


class WhoRangSensorEntity(CoordinatorEntity, SensorEntity):
    """Base class for WhoRang sensor entities."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
        sensor_type: str,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self.config_entry = config_entry
        self.sensor_type = sensor_type
        self._attr_unique_id = f"{config_entry.entry_id}_{sensor_type}"
        self._attr_has_entity_name = True

    @property
    def device_info(self) -> DeviceInfo:
        """Return device information."""
        return DeviceInfo(
            identifiers={(DOMAIN, self.config_entry.entry_id)},
            name="WhoRang AI Doorbell",
            manufacturer=MANUFACTURER,
            model=MODEL,
            sw_version=SW_VERSION,
            configuration_url=f"http://{self.coordinator.api_client.host}:{self.coordinator.api_client.port}",
        )


class WhoRangLatestVisitorSensor(WhoRangSensorEntity):
    """Sensor for the latest visitor information."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, config_entry, SENSOR_LATEST_VISITOR)
        self._attr_name = "Latest Visitor"
        self._attr_icon = "mdi:account-clock"

    @property
    def native_value(self) -> Optional[str]:
        """Return the state of the sensor."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if latest_visitor:
            return latest_visitor.get("ai_title") or latest_visitor.get("ai_message", "Unknown visitor")
        return "No visitors"

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return {}

        return {
            ATTR_VISITOR_ID: latest_visitor.get("visitor_id"),
            ATTR_TIMESTAMP: latest_visitor.get("timestamp"),
            ATTR_AI_MESSAGE: latest_visitor.get("ai_message"),
            ATTR_AI_TITLE: latest_visitor.get("ai_title"),
            ATTR_LOCATION: latest_visitor.get("location"),
            ATTR_WEATHER: latest_visitor.get("weather"),
            ATTR_DEVICE_NAME: latest_visitor.get("device_name"),
            ATTR_CONFIDENCE_SCORE: latest_visitor.get("confidence_score"),
            ATTR_OBJECTS_DETECTED: latest_visitor.get("objects_detected"),
            ATTR_FACES_DETECTED: latest_visitor.get("faces_detected", 0),
            ATTR_PROCESSING_TIME: latest_visitor.get("processing_time"),
            ATTR_IMAGE_URL: latest_visitor.get("image_url"),
        }


class WhoRangVisitorCountTodaySensor(WhoRangSensorEntity):
    """Sensor for today's visitor count."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, config_entry, SENSOR_VISITOR_COUNT_TODAY)
        self._attr_name = "Visitors Today"
        self._attr_icon = "mdi:counter"
        self._attr_native_unit_of_measurement = UNIT_VISITORS
        self._attr_state_class = STATE_CLASS_TOTAL_INCREASING

    @property
    def native_value(self) -> int:
        """Return the state of the sensor."""
        system_info = self.coordinator.async_get_system_info()
        stats = system_info.get("stats", {})
        return stats.get("today", 0)


class WhoRangVisitorCountWeekSensor(WhoRangSensorEntity):
    """Sensor for this week's visitor count."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, config_entry, SENSOR_VISITOR_COUNT_WEEK)
        self._attr_name = "Visitors This Week"
        self._attr_icon = "mdi:counter"
        self._attr_native_unit_of_measurement = UNIT_VISITORS
        self._attr_state_class = STATE_CLASS_TOTAL_INCREASING

    @property
    def native_value(self) -> int:
        """Return the state of the sensor."""
        system_info = self.coordinator.async_get_system_info()
        stats = system_info.get("stats", {})
        return stats.get("week", 0)


class WhoRangVisitorCountMonthSensor(WhoRangSensorEntity):
    """Sensor for this month's visitor count."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, config_entry, SENSOR_VISITOR_COUNT_MONTH)
        self._attr_name = "Visitors This Month"
        self._attr_icon = "mdi:counter"
        self._attr_native_unit_of_measurement = UNIT_VISITORS
        self._attr_state_class = STATE_CLASS_TOTAL_INCREASING

    @property
    def native_value(self) -> int:
        """Return the state of the sensor."""
        system_info = self.coordinator.async_get_system_info()
        stats = system_info.get("stats", {})
        return stats.get("month", 0)


class WhoRangSystemStatusSensor(WhoRangSensorEntity):
    """Sensor for system status."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, config_entry, SENSOR_SYSTEM_STATUS)
        self._attr_name = "System Status"
        self._attr_icon = "mdi:server"
        self._attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def native_value(self) -> str:
        """Return the state of the sensor."""
        system_info = self.coordinator.async_get_system_info()
        health = system_info.get("health", {})
        return health.get("status", "unknown")

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        system_info = self.coordinator.async_get_system_info()
        health = system_info.get("health", {})
        stats = system_info.get("stats", {})
        
        return {
            "uptime": health.get("uptime"),
            "environment": health.get("environment"),
            "connected_clients": stats.get("connectedClients", 0),
            "is_online": stats.get("isOnline", False),
            "websocket_connected": self.coordinator.async_is_websocket_connected(),
        }


class WhoRangAIProviderSensor(WhoRangSensorEntity):
    """Sensor for active AI provider."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, config_entry, SENSOR_AI_PROVIDER_ACTIVE)
        self._attr_name = "AI Provider"
        self._attr_icon = "mdi:brain"
        self._attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def native_value(self) -> str:
        """Return the state of the sensor."""
        system_info = self.coordinator.async_get_system_info()
        face_config = system_info.get("face_config", {})
        return face_config.get("ai_provider", "unknown")

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        system_info = self.coordinator.async_get_system_info()
        face_config = system_info.get("face_config", {})
        
        return {
            "enabled": face_config.get("enabled", False),
            "confidence_threshold": face_config.get("confidence_threshold"),
            "cost_tracking_enabled": face_config.get("cost_tracking_enabled", False),
            "monthly_budget_limit": face_config.get("monthly_budget_limit"),
        }


class WhoRangAICostTodaySensor(WhoRangSensorEntity):
    """Sensor for today's AI processing costs."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, config_entry, SENSOR_AI_COST_TODAY)
        self._attr_name = "AI Cost Today"
        self._attr_icon = "mdi:currency-usd"
        self._attr_native_unit_of_measurement = UNIT_CURRENCY_USD
        self._attr_device_class = SensorDeviceClass.MONETARY
        self._attr_state_class = STATE_CLASS_TOTAL  # Use TOTAL instead of TOTAL_INCREASING for monetary

    @property
    def native_value(self) -> float:
        """Return the state of the sensor."""
        ai_usage = self.coordinator.async_get_ai_usage()
        return round(ai_usage.get("total_cost", 0), 4)

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        ai_usage = self.coordinator.async_get_ai_usage()
        
        return {
            "total_requests": ai_usage.get("total_requests", 0),
            "providers": ai_usage.get("providers", []),
        }


class WhoRangAIResponseTimeSensor(WhoRangSensorEntity):
    """Sensor for latest AI response time."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, config_entry, SENSOR_AI_RESPONSE_TIME)
        self._attr_name = "AI Response Time"
        self._attr_icon = "mdi:timer"
        self._attr_native_unit_of_measurement = UNIT_MILLISECONDS
        self._attr_device_class = SensorDeviceClass.DURATION
        self._attr_state_class = STATE_CLASS_MEASUREMENT

    @property
    def native_value(self) -> Optional[int]:
        """Return the state of the sensor."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if latest_visitor and latest_visitor.get("processing_time"):
            # Convert processing_time to milliseconds if needed
            processing_time = latest_visitor.get("processing_time")
            if isinstance(processing_time, str) and "ms" in processing_time:
                return int(processing_time.replace("ms", ""))
            elif isinstance(processing_time, (int, float)):
                return int(processing_time)
        return None


class WhoRangKnownFacesCountSensor(WhoRangSensorEntity):
    """Sensor for known faces count."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, config_entry, SENSOR_KNOWN_FACES_COUNT)
        self._attr_name = "Known Faces"
        self._attr_icon = "mdi:face-recognition"
        self._attr_native_unit_of_measurement = UNIT_FACES
        self._attr_state_class = STATE_CLASS_TOTAL

    @property
    def native_value(self) -> int:
        """Return the state of the sensor."""
        known_persons = self.coordinator.async_get_known_persons()
        return len(known_persons)

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        known_persons = self.coordinator.async_get_known_persons()
        
        return {
            "persons": [
                {
                    "id": person.get("id"),
                    "name": person.get("name"),
                    "face_count": person.get("face_count", 0),
                    "last_seen": person.get("last_seen"),
                }
                for person in known_persons
            ]
        }
