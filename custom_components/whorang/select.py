"""Select platform for WhoRang AI Doorbell integration."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from homeassistant.components.select import SelectEntity
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
    SELECT_AI_PROVIDER,
    AI_PROVIDERS,
)
from .coordinator import WhoRangDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up WhoRang select entities."""
    coordinator: WhoRangDataUpdateCoordinator = hass.data[DOMAIN][config_entry.entry_id]

    entities = [
        WhoRangAIProviderSelect(coordinator, config_entry),
    ]

    async_add_entities(entities)


class WhoRangSelectEntity(CoordinatorEntity, SelectEntity):
    """Base class for WhoRang select entities."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
        select_type: str,
    ) -> None:
        """Initialize the select entity."""
        super().__init__(coordinator)
        self.config_entry = config_entry
        self.select_type = select_type
        self._attr_unique_id = f"{config_entry.entry_id}_{select_type}"
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


class WhoRangAIProviderSelect(WhoRangSelectEntity):
    """Select entity for AI provider selection."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the select entity."""
        super().__init__(coordinator, config_entry, SELECT_AI_PROVIDER)
        self._attr_name = "AI Provider"
        self._attr_icon = "mdi:brain"
        self._entry = config_entry

    @property
    def options(self) -> List[str]:
        """Return available AI provider options based on configured API keys."""
        api_keys = self._entry.data.get("ai_api_keys", {})
        available = ["local"]  # Local is always available
        
        # Add providers that have API keys configured
        if api_keys.get("openai_api_key"):
            available.append("openai")
        if api_keys.get("claude_api_key"):
            available.append("claude")
        if api_keys.get("gemini_api_key"):
            available.append("gemini")
        if api_keys.get("google_cloud_api_key"):
            available.append("google-cloud-vision")
        
        return available

    @property
    def current_option(self) -> Optional[str]:
        """Return the current selected option."""
        system_info = self.coordinator.async_get_system_info()
        face_config = system_info.get("face_config", {})
        current_provider = face_config.get("ai_provider", "local")
        
        # Ensure the current provider is in our options list
        if current_provider in self.options:
            return current_provider
        
        # Default to local if current provider is not recognized
        return "local"

    async def async_select_option(self, option: str) -> None:
        """Change the selected option."""
        if option not in self.options:
            _LOGGER.error("Invalid AI provider option: %s", option)
            return

        _LOGGER.debug("Changing AI provider to: %s", option)
        
        # Get the appropriate API key for the provider
        api_keys = self._entry.data.get("ai_api_keys", {})
        api_key = None
        
        if option != "local":
            key_mapping = {
                "openai": "openai_api_key",
                "claude": "claude_api_key", 
                "gemini": "gemini_api_key",
                "google-cloud-vision": "google_cloud_api_key"
            }
            api_key = api_keys.get(key_mapping.get(option))
        
        # Set the provider with API key
        success = await self.coordinator.api_client.set_ai_provider_with_key(option, api_key)
        if success:
            _LOGGER.info("Successfully changed AI provider to: %s", option)
            # Refresh coordinator data to get updated information
            await self.coordinator.async_request_refresh()
        else:
            _LOGGER.error("Failed to change AI provider to: %s", option)

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        system_info = self.coordinator.async_get_system_info()
        face_config = system_info.get("face_config", {})
        api_keys = self._entry.data.get("ai_api_keys", {})
        
        return {
            "enabled": face_config.get("enabled", False),
            "confidence_threshold": face_config.get("confidence_threshold"),
            "cost_tracking_enabled": face_config.get("cost_tracking_enabled", False),
            "monthly_budget_limit": face_config.get("monthly_budget_limit"),
            "available_providers": self.options,
            "configured_api_keys": list(api_keys.keys()),
        }
