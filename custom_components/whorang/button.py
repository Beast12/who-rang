"""Button platform for WhoRang AI Doorbell integration."""
from __future__ import annotations

import logging
from typing import Any, Dict

from homeassistant.components.button import ButtonEntity
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
    BUTTON_TRIGGER_ANALYSIS,
    BUTTON_TEST_WEBHOOK,
    BUTTON_REFRESH_DATA,
)
from .coordinator import WhoRangDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up WhoRang button entities."""
    coordinator: WhoRangDataUpdateCoordinator = hass.data[DOMAIN][config_entry.entry_id]

    entities = [
        WhoRangTriggerAnalysisButton(coordinator, config_entry),
        WhoRangTestWebhookButton(coordinator, config_entry),
        WhoRangRefreshDataButton(coordinator, config_entry),
    ]

    async_add_entities(entities)


class WhoRangButtonEntity(CoordinatorEntity, ButtonEntity):
    """Base class for WhoRang button entities."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
        button_type: str,
    ) -> None:
        """Initialize the button."""
        super().__init__(coordinator)
        self.config_entry = config_entry
        self.button_type = button_type
        self._attr_unique_id = f"{config_entry.entry_id}_{button_type}"
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


class WhoRangTriggerAnalysisButton(WhoRangButtonEntity):
    """Button to trigger AI analysis for the latest visitor."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the button."""
        super().__init__(coordinator, config_entry, BUTTON_TRIGGER_ANALYSIS)
        self._attr_name = "Trigger Analysis"
        self._attr_icon = "mdi:brain"

    async def async_press(self) -> None:
        """Handle the button press."""
        _LOGGER.debug("Triggering AI analysis for latest visitor")
        
        success = await self.coordinator.async_trigger_analysis()
        if success:
            _LOGGER.info("Successfully triggered AI analysis")
            # Refresh coordinator data to get updated information
            await self.coordinator.async_request_refresh()
        else:
            _LOGGER.error("Failed to trigger AI analysis")

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return {"status": "No visitor to analyze"}

        return {
            "visitor_id": latest_visitor.get("visitor_id"),
            "timestamp": latest_visitor.get("timestamp"),
            "ai_processing_complete": latest_visitor.get("ai_processing_complete", True),
        }


class WhoRangTestWebhookButton(WhoRangButtonEntity):
    """Button to test webhook functionality."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the button."""
        super().__init__(coordinator, config_entry, BUTTON_TEST_WEBHOOK)
        self._attr_name = "Test Webhook"
        self._attr_icon = "mdi:webhook"

    async def async_press(self) -> None:
        """Handle the button press."""
        _LOGGER.debug("Testing webhook functionality")
        
        success = await self.coordinator.async_test_webhook()
        if success:
            _LOGGER.info("Webhook test successful")
            # Refresh coordinator data to see the test event
            await self.coordinator.async_request_refresh()
        else:
            _LOGGER.error("Webhook test failed")

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        system_info = self.coordinator.async_get_system_info()
        health = system_info.get("health", {})
        
        return {
            "system_status": health.get("status", "unknown"),
            "websocket_connected": self.coordinator.async_is_websocket_connected(),
        }


class WhoRangRefreshDataButton(WhoRangButtonEntity):
    """Button to manually refresh data from WhoRang system."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the button."""
        super().__init__(coordinator, config_entry, BUTTON_REFRESH_DATA)
        self._attr_name = "Refresh Data"
        self._attr_icon = "mdi:refresh"

    async def async_press(self) -> None:
        """Handle the button press."""
        _LOGGER.debug("Manually refreshing data from WhoRang system")
        
        # Force a refresh of the coordinator data
        await self.coordinator.async_request_refresh()
        _LOGGER.info("Data refresh completed")

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        if self.coordinator.data:
            last_update = self.coordinator.data.get("last_update")
            return {
                "last_update": last_update,
                "update_interval": self.coordinator.update_interval.total_seconds(),
            }
        
        return {
            "status": "No data available",
        }
