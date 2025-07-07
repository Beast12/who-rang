"""Camera platform for WhoRang AI Doorbell integration."""
from __future__ import annotations

import logging
from typing import Optional

from homeassistant.components.camera import Camera
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
    CAMERA_LATEST_IMAGE,
)
from .coordinator import WhoRangDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up WhoRang camera entities."""
    coordinator: WhoRangDataUpdateCoordinator = hass.data[DOMAIN][config_entry.entry_id]

    entities = [
        WhoRangLatestImageCamera(coordinator, config_entry),
    ]

    async_add_entities(entities)


class WhoRangCameraEntity(CoordinatorEntity, Camera):
    """Base class for WhoRang camera entities."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
        camera_type: str,
    ) -> None:
        """Initialize the camera."""
        super().__init__(coordinator)
        Camera.__init__(self)
        self.config_entry = config_entry
        self.camera_type = camera_type
        self._attr_unique_id = f"{config_entry.entry_id}_{camera_type}"
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


class WhoRangLatestImageCamera(WhoRangCameraEntity):
    """Camera entity for the latest doorbell image."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the camera."""
        super().__init__(coordinator, config_entry, CAMERA_LATEST_IMAGE)
        self._attr_name = "Latest Image"
        self._attr_icon = "mdi:camera"
        self._cached_image = None
        self._last_visitor_id = None

    async def async_camera_image(
        self, width: Optional[int] = None, height: Optional[int] = None
    ) -> Optional[bytes]:
        """Return bytes of camera image."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return self._cached_image

        # Check if we have a new visitor
        current_visitor_id = latest_visitor.get("visitor_id")
        if current_visitor_id != self._last_visitor_id:
            self._last_visitor_id = current_visitor_id
            
            # Try to get the latest image from the API
            try:
                image_data = await self.coordinator.api_client.get_latest_image()
                if image_data:
                    self._cached_image = image_data
                    _LOGGER.debug("Updated camera image for visitor: %s", current_visitor_id)
                else:
                    _LOGGER.warning("No image data received for visitor: %s", current_visitor_id)
            except Exception as err:
                _LOGGER.error("Failed to get latest image: %s", err)

        return self._cached_image

    @property
    def extra_state_attributes(self):
        """Return additional state attributes."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return {}

        return {
            "visitor_id": latest_visitor.get("visitor_id"),
            "timestamp": latest_visitor.get("timestamp"),
            "ai_message": latest_visitor.get("ai_message"),
            "location": latest_visitor.get("location"),
            "image_url": latest_visitor.get("image_url"),
            "faces_detected": latest_visitor.get("faces_detected", 0),
            "objects_detected": latest_visitor.get("objects_detected"),
        }

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        # Camera is available if we have coordinator data and system is online
        if not self.coordinator.data:
            return False
            
        system_info = self.coordinator.async_get_system_info()
        health = system_info.get("health", {})
        return health.get("status") == "healthy"
