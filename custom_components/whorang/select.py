"""Select platform for WhoRang AI Doorbell integration."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo, EntityCategory
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
        WhoRangAIModelSelect(coordinator, config_entry),
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


class WhoRangAIModelSelect(WhoRangSelectEntity):
    """Select entity for AI model selection within chosen provider."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the select entity."""
        super().__init__(coordinator, config_entry, "ai_model")
        self._attr_name = "AI Model"
        self._attr_icon = "mdi:brain"
        self._attr_entity_category = EntityCategory.CONFIG
        self._entry = config_entry

    @property
    def options(self) -> List[str]:
        """Return available models for current AI provider."""
        current_provider = self.coordinator.data.get("current_ai_provider", "local")
        
        if current_provider == "local":
            # Use dynamic Ollama models
            ollama_models = self.coordinator.data.get("ollama_models", [])
            if ollama_models:
                return [model["name"] for model in ollama_models]
            else:
                # Fallback to static list if Ollama unavailable
                return ["llava", "llava:7b", "llava:13b", "bakllava"]
        else:
            # Use static lists for external providers
            available_models = self.coordinator.data.get("available_models", {})
            return available_models.get(current_provider, ["default"])

    @property
    def current_option(self) -> Optional[str]:
        """Return currently selected model."""
        return self.coordinator.data.get("current_ai_model", "default")

    async def async_select_option(self, option: str) -> None:
        """Change the selected AI model."""
        if option not in self.options:
            _LOGGER.error("Invalid AI model option: %s", option)
            return

        _LOGGER.debug("Changing AI model to: %s", option)
        
        success = await self.coordinator.api_client.set_ai_model(option)
        if success:
            _LOGGER.info("Successfully changed AI model to: %s", option)
            await self.coordinator.async_request_refresh()
        else:
            _LOGGER.error("Failed to change AI model to: %s", option)

    @property
    def available(self) -> bool:
        """Return if entity is available."""
        current_provider = self.coordinator.data.get("current_ai_provider")
        # Show model selection for all providers including local
        return current_provider is not None

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        current_provider = self.coordinator.data.get("current_ai_provider", "local")
        
        if current_provider == "local":
            ollama_models = self.coordinator.data.get("ollama_models", [])
            ollama_status = self.coordinator.data.get("ollama_status", {})
            current_model = self.current_option
            
            # Find current model info
            model_info = next((m for m in ollama_models if m["name"] == current_model), {})
            
            return {
                "current_provider": current_provider,
                "model_size": self._format_size(model_info.get("size", 0)),
                "model_display_name": model_info.get("display_name", current_model),
                "last_modified": model_info.get("modified_at"),
                "is_vision_model": model_info.get("is_vision", False),
                "total_available_models": len(ollama_models),
                "ollama_status": ollama_status.get("status", "unknown"),
                "ollama_version": ollama_status.get("version"),
                "ollama_url": ollama_status.get("url"),
                "ollama_message": ollama_status.get("message")
            }
        else:
            # External providers
            available_models = self.coordinator.data.get("available_models", {})
            return {
                "current_provider": current_provider,
                "available_models": available_models.get(current_provider, []),
                "total_models": len(available_models.get(current_provider, [])),
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
