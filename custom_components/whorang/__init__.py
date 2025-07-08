"""The WhoRang AI Doorbell integration."""
from __future__ import annotations

import logging
from typing import Any, Dict

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST, CONF_PORT, Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady

from .api_client import WhoRangAPIClient, WhoRangConnectionError
from .const import (
    DOMAIN,
    CONF_API_KEY,
    CONF_UPDATE_INTERVAL,
    CONF_ENABLE_WEBSOCKET,
    CONF_ENABLE_COST_TRACKING,
    DEFAULT_UPDATE_INTERVAL,
    SERVICE_TRIGGER_ANALYSIS,
    SERVICE_ADD_KNOWN_VISITOR,
    SERVICE_REMOVE_KNOWN_VISITOR,
    SERVICE_SET_AI_PROVIDER,
    SERVICE_SET_AI_MODEL,
    SERVICE_GET_AVAILABLE_MODELS,
    SERVICE_REFRESH_OLLAMA_MODELS,
    SERVICE_TEST_OLLAMA_CONNECTION,
    SERVICE_EXPORT_DATA,
    SERVICE_TEST_WEBHOOK,
)
from .coordinator import WhoRangDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [
    Platform.SENSOR,
    Platform.BINARY_SENSOR,
    Platform.CAMERA,
    Platform.DEVICE_TRACKER,
    Platform.BUTTON,
    Platform.SELECT,
]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up WhoRang AI Doorbell from a config entry."""
    host = entry.data[CONF_HOST]
    port = entry.data[CONF_PORT]
    api_key = entry.data.get(CONF_API_KEY)
    
    # Get options with defaults
    update_interval = entry.options.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL)
    enable_websocket = entry.options.get(CONF_ENABLE_WEBSOCKET, True)
    enable_cost_tracking = entry.options.get(CONF_ENABLE_COST_TRACKING, True)

    # Create API client
    api_client = WhoRangAPIClient(host, port, api_key)

    # Test connection
    try:
        if not await api_client.validate_connection():
            raise ConfigEntryNotReady("Unable to connect to WhoRang system")
    except WhoRangConnectionError as err:
        raise ConfigEntryNotReady(f"Error connecting to WhoRang: {err}") from err

    # Create coordinator
    coordinator = WhoRangDataUpdateCoordinator(
        hass,
        api_client,
        update_interval=update_interval,
        enable_websocket=enable_websocket,
    )

    # Fetch initial data
    await coordinator.async_config_entry_first_refresh()

    # Set up coordinator
    await coordinator.async_setup()

    # Store coordinator in hass data
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = coordinator

    # Set up platforms
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register services
    await _async_register_services(hass)

    # Set up options update listener
    entry.async_on_unload(entry.add_update_listener(async_update_options))

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    # Unload platforms
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        # Get coordinator
        coordinator: WhoRangDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
        
        # Shutdown coordinator
        await coordinator.async_shutdown()
        
        # Remove from hass data
        hass.data[DOMAIN].pop(entry.entry_id)

    return unload_ok


async def async_update_options(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Update options."""
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_register_services(hass: HomeAssistant) -> None:
    """Register integration services."""
    
    async def trigger_analysis_service(call) -> None:
        """Handle trigger analysis service call."""
        visitor_id = call.data.get("visitor_id")
        
        # Get all coordinators
        coordinators = [
            coordinator for coordinator in hass.data[DOMAIN].values()
            if isinstance(coordinator, WhoRangDataUpdateCoordinator)
        ]
        
        for coordinator in coordinators:
            success = await coordinator.async_trigger_analysis(visitor_id)
            if success:
                _LOGGER.info("Triggered AI analysis for visitor: %s", visitor_id or "latest")
            else:
                _LOGGER.error("Failed to trigger AI analysis for visitor: %s", visitor_id or "latest")

    async def add_known_visitor_service(call) -> None:
        """Handle add known visitor service call."""
        name = call.data.get("name")
        notes = call.data.get("notes")
        
        if not name:
            _LOGGER.error("Name is required for adding known visitor")
            return
            
        # Get all coordinators
        coordinators = [
            coordinator for coordinator in hass.data[DOMAIN].values()
            if isinstance(coordinator, WhoRangDataUpdateCoordinator)
        ]
        
        for coordinator in coordinators:
            success = await coordinator.async_add_known_person(name, notes)
            if success:
                _LOGGER.info("Added known visitor: %s", name)
            else:
                _LOGGER.error("Failed to add known visitor: %s", name)

    async def remove_known_visitor_service(call) -> None:
        """Handle remove known visitor service call."""
        person_id = call.data.get("person_id")
        
        if not person_id:
            _LOGGER.error("Person ID is required for removing known visitor")
            return
            
        # Get all coordinators
        coordinators = [
            coordinator for coordinator in hass.data[DOMAIN].values()
            if isinstance(coordinator, WhoRangDataUpdateCoordinator)
        ]
        
        for coordinator in coordinators:
            success = await coordinator.async_remove_known_person(person_id)
            if success:
                _LOGGER.info("Removed known visitor: %s", person_id)
            else:
                _LOGGER.error("Failed to remove known visitor: %s", person_id)

    async def set_ai_provider_service(call) -> None:
        """Handle set AI provider service call."""
        provider = call.data.get("provider")
        
        if not provider:
            _LOGGER.error("Provider is required for setting AI provider")
            return
            
        # Get all coordinators
        coordinators = [
            coordinator for coordinator in hass.data[DOMAIN].values()
            if isinstance(coordinator, WhoRangDataUpdateCoordinator)
        ]
        
        for coordinator in coordinators:
            success = await coordinator.async_set_ai_provider(provider)
            if success:
                _LOGGER.info("Set AI provider to: %s", provider)
            else:
                _LOGGER.error("Failed to set AI provider to: %s", provider)

    async def export_data_service(call) -> None:
        """Handle export data service call."""
        start_date = call.data.get("start_date")
        end_date = call.data.get("end_date")
        format_type = call.data.get("format", "json")
        
        # Get all coordinators
        coordinators = [
            coordinator for coordinator in hass.data[DOMAIN].values()
            if isinstance(coordinator, WhoRangDataUpdateCoordinator)
        ]
        
        for coordinator in coordinators:
            result = await coordinator.async_export_data(start_date, end_date, format_type)
            if result:
                _LOGGER.info("Exported visitor data in %s format", format_type)
            else:
                _LOGGER.error("Failed to export visitor data")

    async def test_webhook_service(call) -> None:
        """Handle test webhook service call."""
        # Get all coordinators
        coordinators = [
            coordinator for coordinator in hass.data[DOMAIN].values()
            if isinstance(coordinator, WhoRangDataUpdateCoordinator)
        ]
        
        for coordinator in coordinators:
            success = await coordinator.async_test_webhook()
            if success:
                _LOGGER.info("Webhook test successful")
            else:
                _LOGGER.error("Webhook test failed")

    async def set_ai_model_service(call) -> None:
        """Handle set AI model service call."""
        model = call.data.get("model")
        
        if not model:
            _LOGGER.error("Model is required for setting AI model")
            return
            
        # Get all coordinators
        coordinators = [
            coordinator for coordinator in hass.data[DOMAIN].values()
            if isinstance(coordinator, WhoRangDataUpdateCoordinator)
        ]
        
        for coordinator in coordinators:
            success = await coordinator.api_client.set_ai_model(model)
            if success:
                _LOGGER.info("Set AI model to: %s", model)
                await coordinator.async_request_refresh()
            else:
                _LOGGER.error("Failed to set AI model to: %s", model)

    async def get_available_models_service(call) -> None:
        """Handle get available models service call."""
        provider = call.data.get("provider")
        
        # Get all coordinators
        coordinators = [
            coordinator for coordinator in hass.data[DOMAIN].values()
            if isinstance(coordinator, WhoRangDataUpdateCoordinator)
        ]
        
        for coordinator in coordinators:
            try:
                if provider:
                    models = await coordinator.api_client.get_provider_models(provider)
                    _LOGGER.info("Available models for %s: %s", provider, models)
                else:
                    models = await coordinator.api_client.get_available_models()
                    _LOGGER.info("Available models: %s", models)
            except Exception as err:
                _LOGGER.error("Failed to get available models: %s", err)

    async def refresh_ollama_models_service(call) -> None:
        """Handle refresh Ollama models service call."""
        # Get all coordinators
        coordinators = [
            coordinator for coordinator in hass.data[DOMAIN].values()
            if isinstance(coordinator, WhoRangDataUpdateCoordinator)
        ]
        
        for coordinator in coordinators:
            try:
                # Force refresh of Ollama models
                ollama_models = await coordinator.api_client.get_ollama_models()
                _LOGGER.info("Refreshed Ollama models: found %d models", len(ollama_models))
                
                # Trigger coordinator refresh to update entities
                await coordinator.async_request_refresh()
            except Exception as err:
                _LOGGER.error("Failed to refresh Ollama models: %s", err)

    async def test_ollama_connection_service(call) -> None:
        """Handle test Ollama connection service call."""
        # Get all coordinators
        coordinators = [
            coordinator for coordinator in hass.data[DOMAIN].values()
            if isinstance(coordinator, WhoRangDataUpdateCoordinator)
        ]
        
        for coordinator in coordinators:
            try:
                status = await coordinator.api_client.get_ollama_status()
                if status.get("status") == "connected":
                    _LOGGER.info("Ollama connection test successful: %s", status.get("message", "Connected"))
                else:
                    _LOGGER.warning("Ollama connection test failed: %s", status.get("message", "Disconnected"))
            except Exception as err:
                _LOGGER.error("Failed to test Ollama connection: %s", err)

    # Register services
    hass.services.async_register(
        DOMAIN,
        SERVICE_TRIGGER_ANALYSIS,
        trigger_analysis_service,
        schema=vol.Schema({
            vol.Optional("visitor_id"): str,
        }),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_KNOWN_VISITOR,
        add_known_visitor_service,
        schema=vol.Schema({
            vol.Required("name"): str,
            vol.Optional("notes"): str,
        }),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_REMOVE_KNOWN_VISITOR,
        remove_known_visitor_service,
        schema=vol.Schema({
            vol.Required("person_id"): int,
        }),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_AI_PROVIDER,
        set_ai_provider_service,
        schema=vol.Schema({
            vol.Required("provider"): vol.In(["openai", "local", "claude", "gemini", "google-cloud-vision"]),
        }),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_EXPORT_DATA,
        export_data_service,
        schema=vol.Schema({
            vol.Optional("start_date"): str,
            vol.Optional("end_date"): str,
            vol.Optional("format", default="json"): vol.In(["json", "csv"]),
        }),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_TEST_WEBHOOK,
        test_webhook_service,
        schema=vol.Schema({}),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_AI_MODEL,
        set_ai_model_service,
        schema=vol.Schema({
            vol.Required("model"): str,
        }),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_AVAILABLE_MODELS,
        get_available_models_service,
        schema=vol.Schema({
            vol.Optional("provider"): vol.In(["local", "openai", "claude", "gemini", "google-cloud-vision"]),
        }),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_REFRESH_OLLAMA_MODELS,
        refresh_ollama_models_service,
        schema=vol.Schema({}),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_TEST_OLLAMA_CONNECTION,
        test_ollama_connection_service,
        schema=vol.Schema({}),
    )
