"""Test the WhoRang AI Doorbell integration setup."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST, CONF_PORT
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady

from custom_components.whorang import async_setup_entry, async_unload_entry
from custom_components.whorang.const import DOMAIN


async def test_setup_entry_success(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_api_client: AsyncMock,
    mock_coordinator: AsyncMock,
) -> None:
    """Test successful setup of config entry."""
    with patch(
        "custom_components.whorang.WhoRangAPIClient",
        return_value=mock_api_client,
    ), patch(
        "custom_components.whorang.WhoRangDataUpdateCoordinator",
        return_value=mock_coordinator,
    ), patch(
        "homeassistant.config_entries.ConfigEntries.async_forward_entry_setups"
    ) as mock_forward_setup:
        result = await async_setup_entry(hass, mock_config_entry)

    assert result is True
    assert DOMAIN in hass.data
    assert mock_config_entry.entry_id in hass.data[DOMAIN]
    
    # Verify API client was created with correct parameters
    mock_api_client.validate_connection.assert_called_once()
    
    # Verify coordinator was set up
    mock_coordinator.async_config_entry_first_refresh.assert_called_once()
    mock_coordinator.async_setup.assert_called_once()
    
    # Verify platforms were set up
    mock_forward_setup.assert_called_once()


async def test_setup_entry_connection_error(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
) -> None:
    """Test setup with connection error."""
    with patch(
        "custom_components.whorang.WhoRangAPIClient"
    ) as mock_client:
        mock_client.return_value.validate_connection.return_value = False

        with pytest.raises(ConfigEntryNotReady):
            await async_setup_entry(hass, mock_config_entry)


async def test_setup_entry_api_exception(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
) -> None:
    """Test setup with API exception."""
    from custom_components.whorang.api_client import WhoRangConnectionError

    with patch(
        "custom_components.whorang.WhoRangAPIClient"
    ) as mock_client:
        mock_client.return_value.validate_connection.side_effect = WhoRangConnectionError("Connection failed")

        with pytest.raises(ConfigEntryNotReady):
            await async_setup_entry(hass, mock_config_entry)


async def test_unload_entry_success(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_coordinator: AsyncMock,
) -> None:
    """Test successful unload of config entry."""
    # Set up the integration first
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][mock_config_entry.entry_id] = mock_coordinator

    with patch(
        "homeassistant.config_entries.ConfigEntries.async_unload_platforms",
        return_value=True,
    ) as mock_unload_platforms:
        result = await async_unload_entry(hass, mock_config_entry)

    assert result is True
    assert mock_config_entry.entry_id not in hass.data[DOMAIN]
    
    # Verify platforms were unloaded
    mock_unload_platforms.assert_called_once()
    
    # Verify coordinator was shut down
    mock_coordinator.async_shutdown.assert_called_once()


async def test_unload_entry_platform_failure(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_coordinator: AsyncMock,
) -> None:
    """Test unload with platform failure."""
    # Set up the integration first
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][mock_config_entry.entry_id] = mock_coordinator

    with patch(
        "homeassistant.config_entries.ConfigEntries.async_unload_platforms",
        return_value=False,
    ) as mock_unload_platforms:
        result = await async_unload_entry(hass, mock_config_entry)

    assert result is False
    assert mock_config_entry.entry_id in hass.data[DOMAIN]
    
    # Verify platforms unload was attempted
    mock_unload_platforms.assert_called_once()
    
    # Verify coordinator was not shut down due to failure
    mock_coordinator.async_shutdown.assert_not_called()


async def test_update_options(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
) -> None:
    """Test options update triggers reload."""
    from custom_components.whorang import async_update_options

    with patch(
        "homeassistant.config_entries.ConfigEntries.async_reload"
    ) as mock_reload:
        await async_update_options(hass, mock_config_entry)

    mock_reload.assert_called_once_with(mock_config_entry.entry_id)


async def test_service_registration(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_api_client: AsyncMock,
    mock_coordinator: AsyncMock,
) -> None:
    """Test that services are registered during setup."""
    with patch(
        "custom_components.whorang.WhoRangAPIClient",
        return_value=mock_api_client,
    ), patch(
        "custom_components.whorang.WhoRangDataUpdateCoordinator",
        return_value=mock_coordinator,
    ), patch(
        "homeassistant.config_entries.ConfigEntries.async_forward_entry_setups"
    ), patch.object(hass.services, "async_register") as mock_register:
        await async_setup_entry(hass, mock_config_entry)

    # Verify all services were registered
    expected_services = [
        "trigger_analysis",
        "add_known_visitor",
        "remove_known_visitor",
        "set_ai_provider",
        "export_data",
        "test_webhook",
    ]
    
    assert mock_register.call_count == len(expected_services)
    
    # Check that each service was registered with correct domain
    for call in mock_register.call_args_list:
        args, _ = call
        assert args[0] == DOMAIN  # Domain
        assert args[1] in expected_services  # Service name


async def test_service_trigger_analysis(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_coordinator: AsyncMock,
) -> None:
    """Test trigger analysis service."""
    # Set up the integration
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][mock_config_entry.entry_id] = mock_coordinator

    # Import and call the service function
    from custom_components.whorang import _async_register_services
    await _async_register_services(hass)

    # Call the service
    await hass.services.async_call(
        DOMAIN,
        "trigger_analysis",
        {"visitor_id": "test_visitor"},
        blocking=True,
    )

    # Verify coordinator method was called
    mock_coordinator.async_trigger_analysis.assert_called_once_with("test_visitor")


async def test_service_add_known_visitor(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_coordinator: AsyncMock,
) -> None:
    """Test add known visitor service."""
    # Set up the integration
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][mock_config_entry.entry_id] = mock_coordinator

    # Import and call the service function
    from custom_components.whorang import _async_register_services
    await _async_register_services(hass)

    # Call the service
    await hass.services.async_call(
        DOMAIN,
        "add_known_visitor",
        {"name": "Test Person", "notes": "Test notes"},
        blocking=True,
    )

    # Verify coordinator method was called
    mock_coordinator.async_add_known_person.assert_called_once_with("Test Person", "Test notes")


async def test_service_remove_known_visitor(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_coordinator: AsyncMock,
) -> None:
    """Test remove known visitor service."""
    # Set up the integration
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][mock_config_entry.entry_id] = mock_coordinator

    # Import and call the service function
    from custom_components.whorang import _async_register_services
    await _async_register_services(hass)

    # Call the service
    await hass.services.async_call(
        DOMAIN,
        "remove_known_visitor",
        {"person_id": 123},
        blocking=True,
    )

    # Verify coordinator method was called
    mock_coordinator.async_remove_known_person.assert_called_once_with(123)


async def test_service_set_ai_provider(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_coordinator: AsyncMock,
) -> None:
    """Test set AI provider service."""
    # Set up the integration
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][mock_config_entry.entry_id] = mock_coordinator

    # Import and call the service function
    from custom_components.whorang import _async_register_services
    await _async_register_services(hass)

    # Call the service
    await hass.services.async_call(
        DOMAIN,
        "set_ai_provider",
        {"provider": "openai"},
        blocking=True,
    )

    # Verify coordinator method was called
    mock_coordinator.async_set_ai_provider.assert_called_once_with("openai")


async def test_service_export_data(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_coordinator: AsyncMock,
) -> None:
    """Test export data service."""
    # Set up the integration
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][mock_config_entry.entry_id] = mock_coordinator

    # Import and call the service function
    from custom_components.whorang import _async_register_services
    await _async_register_services(hass)

    # Call the service
    await hass.services.async_call(
        DOMAIN,
        "export_data",
        {
            "start_date": "2025-01-01",
            "end_date": "2025-01-07",
            "format": "json",
        },
        blocking=True,
    )

    # Verify coordinator method was called
    mock_coordinator.async_export_data.assert_called_once_with("2025-01-01", "2025-01-07", "json")


async def test_service_test_webhook(
    hass: HomeAssistant,
    mock_config_entry: ConfigEntry,
    mock_coordinator: AsyncMock,
) -> None:
    """Test webhook test service."""
    # Set up the integration
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][mock_config_entry.entry_id] = mock_coordinator

    # Import and call the service function
    from custom_components.whorang import _async_register_services
    await _async_register_services(hass)

    # Call the service
    await hass.services.async_call(
        DOMAIN,
        "test_webhook",
        {},
        blocking=True,
    )

    # Verify coordinator method was called
    mock_coordinator.async_test_webhook.assert_called_once()


async def test_setup_with_options(
    hass: HomeAssistant,
    mock_api_client: AsyncMock,
    mock_coordinator: AsyncMock,
) -> None:
    """Test setup with custom options."""
    from custom_components.whorang.const import (
        CONF_UPDATE_INTERVAL,
        CONF_ENABLE_WEBSOCKET,
        CONF_ENABLE_COST_TRACKING,
    )

    config_entry = ConfigEntry(
        version=1,
        minor_version=1,
        domain=DOMAIN,
        title="WhoRang AI Doorbell",
        data={
            CONF_HOST: "192.168.1.100",
            CONF_PORT: 3001,
        },
        options={
            CONF_UPDATE_INTERVAL: 60,
            CONF_ENABLE_WEBSOCKET: False,
            CONF_ENABLE_COST_TRACKING: False,
        },
        source="user",
        entry_id="test_entry_id",
        unique_id="192.168.1.100:3001",
    )

    with patch(
        "custom_components.whorang.WhoRangAPIClient",
        return_value=mock_api_client,
    ), patch(
        "custom_components.whorang.WhoRangDataUpdateCoordinator",
        return_value=mock_coordinator,
    ) as mock_coordinator_class, patch(
        "homeassistant.config_entries.ConfigEntries.async_forward_entry_setups"
    ):
        result = await async_setup_entry(hass, config_entry)

    assert result is True
    
    # Verify coordinator was created with custom options
    mock_coordinator_class.assert_called_once()
    args, kwargs = mock_coordinator_class.call_args
    assert kwargs["update_interval"] == 60
    assert kwargs["enable_websocket"] is False
