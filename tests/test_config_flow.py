"""Test the WhoRang AI Doorbell config flow."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from homeassistant import config_entries
from homeassistant.const import CONF_HOST, CONF_PORT
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.whorang.config_flow import (
    CannotConnect,
    ConfigFlow,
    InvalidAuth,
)
from custom_components.whorang.const import (
    DOMAIN,
    CONF_API_KEY,
    CONF_UPDATE_INTERVAL,
    CONF_ENABLE_WEBSOCKET,
    CONF_ENABLE_COST_TRACKING,
    DEFAULT_PORT,
    DEFAULT_UPDATE_INTERVAL,
    ERROR_CANNOT_CONNECT,
    ERROR_INVALID_AUTH,
    ERROR_UNKNOWN,
)


async def test_form(hass: HomeAssistant) -> None:
    """Test we get the form."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] == FlowResultType.FORM
    assert result["errors"] == {}


async def test_form_valid_input(hass: HomeAssistant, mock_api_client: AsyncMock) -> None:
    """Test we can setup with valid input."""
    with patch(
        "custom_components.whorang.config_flow.WhoRangAPIClient",
        return_value=mock_api_client,
    ):
        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": config_entries.SOURCE_USER}
        )

        result2 = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {
                CONF_HOST: "192.168.1.100",
                CONF_PORT: DEFAULT_PORT,
                CONF_API_KEY: "test_api_key",
            },
        )
        await hass.async_block_till_done()

    assert result2["type"] == FlowResultType.CREATE_ENTRY
    assert result2["title"] == "WhoRang (192.168.1.100:3001)"
    assert result2["data"] == {
        CONF_HOST: "192.168.1.100",
        CONF_PORT: DEFAULT_PORT,
        CONF_API_KEY: "test_api_key",
    }


async def test_form_invalid_host(hass: HomeAssistant) -> None:
    """Test we handle invalid host."""
    with patch(
        "custom_components.whorang.config_flow.WhoRangAPIClient"
    ) as mock_client:
        mock_client.return_value.validate_connection.side_effect = CannotConnect
        mock_client.return_value.close = AsyncMock()

        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": config_entries.SOURCE_USER}
        )

        result2 = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {
                CONF_HOST: "192.168.1.100",
                CONF_PORT: DEFAULT_PORT,
                CONF_API_KEY: "test_api_key",
            },
        )

    assert result2["type"] == FlowResultType.FORM
    assert result2["errors"] == {"base": ERROR_CANNOT_CONNECT}


async def test_form_invalid_auth(hass: HomeAssistant) -> None:
    """Test we handle invalid authentication."""
    with patch(
        "custom_components.whorang.config_flow.WhoRangAPIClient"
    ) as mock_client:
        mock_client.return_value.validate_connection.side_effect = InvalidAuth
        mock_client.return_value.close = AsyncMock()

        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": config_entries.SOURCE_USER}
        )

        result2 = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {
                CONF_HOST: "192.168.1.100",
                CONF_PORT: DEFAULT_PORT,
                CONF_API_KEY: "invalid_key",
            },
        )

    assert result2["type"] == FlowResultType.FORM
    assert result2["errors"] == {"base": ERROR_INVALID_AUTH}


async def test_form_unknown_error(hass: HomeAssistant) -> None:
    """Test we handle unknown errors."""
    with patch(
        "custom_components.whorang.config_flow.WhoRangAPIClient"
    ) as mock_client:
        mock_client.return_value.validate_connection.side_effect = Exception("Unknown error")
        mock_client.return_value.close = AsyncMock()

        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": config_entries.SOURCE_USER}
        )

        result2 = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {
                CONF_HOST: "192.168.1.100",
                CONF_PORT: DEFAULT_PORT,
                CONF_API_KEY: "test_api_key",
            },
        )

    assert result2["type"] == FlowResultType.FORM
    assert result2["errors"] == {"base": ERROR_UNKNOWN}


async def test_form_already_configured(hass: HomeAssistant, mock_config_entry) -> None:
    """Test we handle already configured."""
    mock_config_entry.add_to_hass(hass)

    with patch(
        "custom_components.whorang.config_flow.WhoRangAPIClient"
    ) as mock_client:
        mock_client.return_value.validate_connection.return_value = True
        mock_client.return_value.get_system_info.return_value = {"status": "healthy"}
        mock_client.return_value.close = AsyncMock()

        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": config_entries.SOURCE_USER}
        )

        result2 = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {
                CONF_HOST: "192.168.1.100",
                CONF_PORT: DEFAULT_PORT,
                CONF_API_KEY: "test_api_key",
            },
        )

    assert result2["type"] == FlowResultType.ABORT
    assert result2["reason"] == "already_configured"


async def test_discovery_flow(hass: HomeAssistant, mock_api_client: AsyncMock) -> None:
    """Test discovery flow."""
    discovery_info = {
        CONF_HOST: "192.168.1.100",
        CONF_PORT: DEFAULT_PORT,
    }

    with patch(
        "custom_components.whorang.config_flow.WhoRangAPIClient",
        return_value=mock_api_client,
    ):
        result = await hass.config_entries.flow.async_init(
            DOMAIN,
            context={"source": config_entries.SOURCE_DISCOVERY},
            data=discovery_info,
        )

        assert result["type"] == FlowResultType.FORM
        assert result["step_id"] == "discovery_confirm"

        result2 = await hass.config_entries.flow.async_configure(
            result["flow_id"], {}
        )

    assert result2["type"] == FlowResultType.CREATE_ENTRY
    assert result2["title"] == "WhoRang (192.168.1.100:3001)"
    assert result2["data"] == discovery_info


async def test_discovery_flow_already_configured(
    hass: HomeAssistant, mock_config_entry
) -> None:
    """Test discovery flow when already configured."""
    mock_config_entry.add_to_hass(hass)

    discovery_info = {
        CONF_HOST: "192.168.1.100",
        CONF_PORT: DEFAULT_PORT,
    }

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={"source": config_entries.SOURCE_DISCOVERY},
        data=discovery_info,
    )

    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_discovery_flow_cannot_connect(hass: HomeAssistant) -> None:
    """Test discovery flow when cannot connect."""
    discovery_info = {
        CONF_HOST: "192.168.1.100",
        CONF_PORT: DEFAULT_PORT,
    }

    with patch(
        "custom_components.whorang.config_flow.WhoRangAPIClient"
    ) as mock_client:
        mock_client.return_value.validate_connection.side_effect = CannotConnect
        mock_client.return_value.close = AsyncMock()

        result = await hass.config_entries.flow.async_init(
            DOMAIN,
            context={"source": config_entries.SOURCE_DISCOVERY},
            data=discovery_info,
        )

        result2 = await hass.config_entries.flow.async_configure(
            result["flow_id"], {}
        )

    assert result2["type"] == FlowResultType.ABORT
    assert result2["reason"] == ERROR_CANNOT_CONNECT


async def test_options_flow(hass: HomeAssistant, mock_config_entry) -> None:
    """Test options flow."""
    mock_config_entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(mock_config_entry.entry_id)

    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "init"

    result2 = await hass.config_entries.options.async_configure(
        result["flow_id"],
        user_input={
            CONF_UPDATE_INTERVAL: 60,
            CONF_ENABLE_WEBSOCKET: False,
            CONF_ENABLE_COST_TRACKING: False,
        },
    )

    assert result2["type"] == FlowResultType.CREATE_ENTRY
    assert result2["data"] == {
        CONF_UPDATE_INTERVAL: 60,
        CONF_ENABLE_WEBSOCKET: False,
        CONF_ENABLE_COST_TRACKING: False,
    }


async def test_options_flow_defaults(hass: HomeAssistant, mock_config_entry) -> None:
    """Test options flow with default values."""
    mock_config_entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(mock_config_entry.entry_id)

    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "init"

    # Check that default values are populated from current options
    schema = result["data_schema"].schema
    update_interval_default = None
    websocket_default = None
    cost_tracking_default = None

    for key, validator in schema.items():
        if key.schema == CONF_UPDATE_INTERVAL:
            update_interval_default = validator.default()
        elif key.schema == CONF_ENABLE_WEBSOCKET:
            websocket_default = validator.default()
        elif key.schema == CONF_ENABLE_COST_TRACKING:
            cost_tracking_default = validator.default()

    assert update_interval_default == DEFAULT_UPDATE_INTERVAL
    assert websocket_default is True
    assert cost_tracking_default is True


async def test_validate_input_success(hass: HomeAssistant, mock_api_client: AsyncMock) -> None:
    """Test validate_input with successful connection."""
    from custom_components.whorang.config_flow import validate_input

    data = {
        CONF_HOST: "192.168.1.100",
        CONF_PORT: DEFAULT_PORT,
        CONF_API_KEY: "test_api_key",
    }

    with patch(
        "custom_components.whorang.config_flow.WhoRangAPIClient",
        return_value=mock_api_client,
    ):
        result = await validate_input(hass, data)

    assert result["title"] == "WhoRang (192.168.1.100:3001)"
    assert "system_info" in result
    mock_api_client.validate_connection.assert_called_once()
    mock_api_client.get_system_info.assert_called_once()
    mock_api_client.close.assert_called_once()


async def test_validate_input_connection_error(hass: HomeAssistant) -> None:
    """Test validate_input with connection error."""
    from custom_components.whorang.config_flow import validate_input
    from custom_components.whorang.api_client import WhoRangConnectionError

    data = {
        CONF_HOST: "192.168.1.100",
        CONF_PORT: DEFAULT_PORT,
        CONF_API_KEY: "test_api_key",
    }

    with patch(
        "custom_components.whorang.config_flow.WhoRangAPIClient"
    ) as mock_client:
        mock_client.return_value.validate_connection.side_effect = WhoRangConnectionError("Connection failed")
        mock_client.return_value.close = AsyncMock()

        with pytest.raises(CannotConnect):
            await validate_input(hass, data)


async def test_validate_input_auth_error(hass: HomeAssistant) -> None:
    """Test validate_input with authentication error."""
    from custom_components.whorang.config_flow import validate_input
    from custom_components.whorang.api_client import WhoRangAuthError

    data = {
        CONF_HOST: "192.168.1.100",
        CONF_PORT: DEFAULT_PORT,
        CONF_API_KEY: "invalid_key",
    }

    with patch(
        "custom_components.whorang.config_flow.WhoRangAPIClient"
    ) as mock_client:
        mock_client.return_value.validate_connection.side_effect = WhoRangAuthError("Invalid API key")
        mock_client.return_value.close = AsyncMock()

        with pytest.raises(InvalidAuth):
            await validate_input(hass, data)
