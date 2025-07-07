"""Binary sensor platform for WhoRang AI Doorbell integration."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
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
    BINARY_SENSOR_DOORBELL,
    BINARY_SENSOR_MOTION,
    BINARY_SENSOR_KNOWN_VISITOR,
    BINARY_SENSOR_SYSTEM_ONLINE,
    BINARY_SENSOR_AI_PROCESSING,
    ATTR_VISITOR_ID,
    ATTR_TIMESTAMP,
    ATTR_AI_MESSAGE,
    ATTR_LOCATION,
    ATTR_CONFIDENCE_SCORE,
    DEVICE_CLASS_CONNECTIVITY,
    DEVICE_CLASS_MOTION,
    DEVICE_CLASS_OCCUPANCY,
)
from .coordinator import WhoRangDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up WhoRang binary sensor entities."""
    coordinator: WhoRangDataUpdateCoordinator = hass.data[DOMAIN][config_entry.entry_id]

    entities = [
        WhoRangDoorbellBinarySensor(coordinator, config_entry),
        WhoRangMotionBinarySensor(coordinator, config_entry),
        WhoRangKnownVisitorBinarySensor(coordinator, config_entry),
        WhoRangSystemOnlineBinarySensor(coordinator, config_entry),
        WhoRangAIProcessingBinarySensor(coordinator, config_entry),
    ]

    async_add_entities(entities)


class WhoRangBinarySensorEntity(CoordinatorEntity, BinarySensorEntity):
    """Base class for WhoRang binary sensor entities."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
        sensor_type: str,
    ) -> None:
        """Initialize the binary sensor."""
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


class WhoRangDoorbellBinarySensor(WhoRangBinarySensorEntity):
    """Binary sensor for doorbell activity."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator, config_entry, BINARY_SENSOR_DOORBELL)
        self._attr_name = "Doorbell"
        self._attr_icon = "mdi:doorbell"
        self._last_visitor_id = None

    @property
    def is_on(self) -> bool:
        """Return true if doorbell was recently activated."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return False

        # Check if this is a new visitor (different from last known)
        current_visitor_id = latest_visitor.get("visitor_id")
        if current_visitor_id != self._last_visitor_id:
            self._last_visitor_id = current_visitor_id
            
            # Check if the visitor event is recent (within last 5 minutes)
            timestamp_str = latest_visitor.get("timestamp")
            if timestamp_str:
                try:
                    visitor_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    now = datetime.now(visitor_time.tzinfo)
                    return (now - visitor_time) < timedelta(minutes=5)
                except (ValueError, TypeError):
                    pass
        
        return False

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
            ATTR_LOCATION: latest_visitor.get("location"),
        }


class WhoRangMotionBinarySensor(WhoRangBinarySensorEntity):
    """Binary sensor for motion detection."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator, config_entry, BINARY_SENSOR_MOTION)
        self._attr_name = "Motion"
        self._attr_icon = "mdi:motion-sensor"
        self._attr_device_class = BinarySensorDeviceClass.MOTION

    @property
    def is_on(self) -> bool:
        """Return true if motion was recently detected."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return False

        # Check if the visitor event is recent (within last 2 minutes)
        timestamp_str = latest_visitor.get("timestamp")
        if timestamp_str:
            try:
                visitor_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                now = datetime.now(visitor_time.tzinfo)
                return (now - visitor_time) < timedelta(minutes=2)
            except (ValueError, TypeError):
                pass
        
        return False

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return {}

        return {
            ATTR_VISITOR_ID: latest_visitor.get("visitor_id"),
            ATTR_TIMESTAMP: latest_visitor.get("timestamp"),
            "objects_detected": latest_visitor.get("objects_detected"),
            "faces_detected": latest_visitor.get("faces_detected", 0),
        }


class WhoRangKnownVisitorBinarySensor(WhoRangBinarySensorEntity):
    """Binary sensor for known visitor detection."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator, config_entry, BINARY_SENSOR_KNOWN_VISITOR)
        self._attr_name = "Known Visitor"
        self._attr_icon = "mdi:account-check"
        self._attr_device_class = BinarySensorDeviceClass.OCCUPANCY

    @property
    def is_on(self) -> bool:
        """Return true if a known visitor was recently detected."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return False

        # Check if this visitor has a person_id (indicating face recognition match)
        has_person_id = latest_visitor.get("person_id") is not None
        
        if has_person_id:
            # Check if the detection is recent (within last 10 minutes)
            timestamp_str = latest_visitor.get("timestamp")
            if timestamp_str:
                try:
                    visitor_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    now = datetime.now(visitor_time.tzinfo)
                    return (now - visitor_time) < timedelta(minutes=10)
                except (ValueError, TypeError):
                    pass
        
        return False

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return {}

        # Get person information if available
        person_id = latest_visitor.get("person_id")
        person_name = None
        if person_id:
            known_persons = self.coordinator.async_get_known_persons()
            for person in known_persons:
                if person.get("id") == person_id:
                    person_name = person.get("name")
                    break

        return {
            ATTR_VISITOR_ID: latest_visitor.get("visitor_id"),
            ATTR_TIMESTAMP: latest_visitor.get("timestamp"),
            "person_id": person_id,
            "person_name": person_name,
            ATTR_CONFIDENCE_SCORE: latest_visitor.get("confidence_score"),
            "faces_detected": latest_visitor.get("faces_detected", 0),
        }


class WhoRangSystemOnlineBinarySensor(WhoRangBinarySensorEntity):
    """Binary sensor for system online status."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator, config_entry, BINARY_SENSOR_SYSTEM_ONLINE)
        self._attr_name = "System Online"
        self._attr_icon = "mdi:server-network"
        self._attr_device_class = BinarySensorDeviceClass.CONNECTIVITY

    @property
    def is_on(self) -> bool:
        """Return true if system is online."""
        system_info = self.coordinator.async_get_system_info()
        health = system_info.get("health", {})
        return health.get("status") == "healthy"

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        system_info = self.coordinator.async_get_system_info()
        health = system_info.get("health", {})
        stats = system_info.get("stats", {})
        
        return {
            "status": health.get("status"),
            "uptime": health.get("uptime"),
            "environment": health.get("environment"),
            "connected_clients": stats.get("connectedClients", 0),
            "websocket_connected": self.coordinator.async_is_websocket_connected(),
            "last_update": system_info.get("last_update"),
        }


class WhoRangAIProcessingBinarySensor(WhoRangBinarySensorEntity):
    """Binary sensor for AI processing status."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator, config_entry, BINARY_SENSOR_AI_PROCESSING)
        self._attr_name = "AI Processing"
        self._attr_icon = "mdi:brain"
        self._processing_start_time = None

    @property
    def is_on(self) -> bool:
        """Return true if AI is currently processing."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return False

        # Check if AI processing is complete
        ai_processing_complete = latest_visitor.get("ai_processing_complete", True)
        
        # If processing is not complete and we have a recent visitor, assume processing
        if not ai_processing_complete:
            timestamp_str = latest_visitor.get("timestamp")
            if timestamp_str:
                try:
                    visitor_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    now = datetime.now(visitor_time.tzinfo)
                    # Consider processing active if visitor is less than 2 minutes old
                    return (now - visitor_time) < timedelta(minutes=2)
                except (ValueError, TypeError):
                    pass
        
        return False

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return {}

        system_info = self.coordinator.async_get_system_info()
        face_config = system_info.get("face_config", {})

        return {
            ATTR_VISITOR_ID: latest_visitor.get("visitor_id"),
            ATTR_TIMESTAMP: latest_visitor.get("timestamp"),
            "ai_provider": face_config.get("ai_provider"),
            "processing_time": latest_visitor.get("processing_time"),
            "ai_processing_complete": latest_visitor.get("ai_processing_complete", True),
            "faces_processed": latest_visitor.get("faces_processed", False),
        }
