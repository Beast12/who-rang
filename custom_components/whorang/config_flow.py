"""Config flow for WhoRang AI Doorbell integration."""
from __future__ import annotations

import ipaddress
import logging
import urllib.parse
from typing import Any, Dict, Optional, Tuple

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_HOST, CONF_PORT
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResult, FlowResultType
from homeassistant.exceptions import HomeAssistantError

from .api_client import WhoRangAPIClient, WhoRangConnectionError, WhoRangAuthError
from .const import (
    DOMAIN,
    CONF_API_KEY,
    CONF_URL,
    CONF_USE_SSL,
    CONF_VERIFY_SSL,
    CONF_UPDATE_INTERVAL,
    CONF_ENABLE_WEBSOCKET,
    CONF_ENABLE_COST_TRACKING,
    DEFAULT_PORT,
    DEFAULT_UPDATE_INTERVAL,
    ERROR_CANNOT_CONNECT,
    ERROR_INVALID_AUTH,
    ERROR_INVALID_URL,
    ERROR_SSL_ERROR,
    ERROR_TIMEOUT,
    ERROR_UNKNOWN,
)

_LOGGER = logging.getLogger(__name__)


def parse_whorang_url(url_input: str) -> Tuple[str, int, bool]:
    """Parse WhoRang URL input and return (host, port, use_ssl)."""
    
    # Check for empty input
    if not url_input or not url_input.strip():
        raise ValueError("URL cannot be empty")
    
    url_input = url_input.strip()
    
    # Handle full URLs
    if url_input.startswith(('http://', 'https://')):
        parsed = urllib.parse.urlparse(url_input)
        host = parsed.hostname
        port = parsed.port
        use_ssl = parsed.scheme == 'https'
        
        if host is None or not host:
            raise ValueError("Invalid URL: missing hostname")
        
        # Default ports
        if port is None:
            port = 443 if use_ssl else 80
            
        return host, port, use_ssl
    
    # Handle IP:port format
    elif ':' in url_input:
        host, port_str = url_input.split(':', 1)
        if not host:
            raise ValueError("Invalid URL: missing hostname")
        try:
            port = int(port_str)
            # Assume HTTP for IP:port unless port 443
            use_ssl = port == 443
            return host, port, use_ssl
        except ValueError:
            raise ValueError("Invalid port number")
    
    # Handle hostname only
    else:
        if not url_input:
            raise ValueError("Invalid URL: missing hostname")
        # Default to HTTPS for hostnames, HTTP for IP addresses
        try:
            ipaddress.ip_address(url_input)
            # It's an IP address, default to HTTP:3001
            return url_input, DEFAULT_PORT, False
        except ValueError:
            # It's a hostname, default to HTTPS:443
            return url_input, 443, True


STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_URL, description="WhoRang URL"): str,
        vol.Optional(CONF_API_KEY, description="API Key (optional)"): str,
        vol.Optional(CONF_VERIFY_SSL, default=True): bool,
    }
)

STEP_OPTIONS_DATA_SCHEMA = vol.Schema(
    {
        vol.Optional(CONF_UPDATE_INTERVAL, default=DEFAULT_UPDATE_INTERVAL): vol.All(
            int, vol.Range(min=10, max=300)
        ),
        vol.Optional(CONF_ENABLE_WEBSOCKET, default=True): bool,
        vol.Optional(CONF_ENABLE_COST_TRACKING, default=True): bool,
    }
)


async def validate_input(hass: HomeAssistant, data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate the user input allows us to connect.

    Data has the keys from STEP_USER_DATA_SCHEMA with values provided by the user.
    """
    try:
        # Parse URL input
        host, port, use_ssl = parse_whorang_url(data[CONF_URL])
        api_key = data.get(CONF_API_KEY)
        verify_ssl = data.get(CONF_VERIFY_SSL, True)

        api_client = WhoRangAPIClient(
            host=host,
            port=port,
            use_ssl=use_ssl,
            api_key=api_key,
            verify_ssl=verify_ssl
        )

        # Test the connection
        is_valid = await api_client.validate_connection()
        if not is_valid:
            raise CannotConnect("Failed to connect to WhoRang system")

        # Get system info for additional validation
        system_info = await api_client.get_system_info()
        
        # Return info that you want to store in the config entry.
        return {
            "title": f"WhoRang ({host}:{port})",
            "system_info": system_info,
            "parsed_data": {
                CONF_HOST: host,
                CONF_PORT: port,
                CONF_USE_SSL: use_ssl,
                CONF_VERIFY_SSL: verify_ssl,
                CONF_API_KEY: api_key,
                CONF_URL: data[CONF_URL],  # Store original URL for reference
            }
        }
    except ValueError as err:
        raise InvalidURL(str(err)) from err
    except WhoRangAuthError as err:
        raise InvalidAuth from err
    except WhoRangConnectionError as err:
        raise CannotConnect from err
    except Exception as err:
        _LOGGER.exception("Unexpected exception")
        raise CannotConnect from err
    finally:
        if 'api_client' in locals():
            await api_client.close()


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for WhoRang AI Doorbell."""

    VERSION = 1

    def __init__(self) -> None:
        """Initialize the config flow."""
        self._discovered_info: Optional[Dict[str, Any]] = None

    async def async_step_user(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Handle the initial step."""
        errors: Dict[str, str] = {}

        if user_input is not None:
            try:
                info = await validate_input(self.hass, user_input)
                parsed_data = info["parsed_data"]
            except InvalidURL:
                errors["base"] = ERROR_INVALID_URL
            except CannotConnect:
                errors["base"] = ERROR_CANNOT_CONNECT
            except InvalidAuth:
                errors["base"] = ERROR_INVALID_AUTH
            except Exception:  # pylint: disable=broad-except
                _LOGGER.exception("Unexpected exception")
                errors["base"] = ERROR_UNKNOWN
            else:
                # Check if already configured using parsed host:port
                await self.async_set_unique_id(
                    f"{parsed_data[CONF_HOST]}:{parsed_data[CONF_PORT]}"
                )
                self._abort_if_unique_id_configured()

                return self.async_create_entry(title=info["title"], data=parsed_data)

        return self.async_show_form(
            step_id="user", data_schema=STEP_USER_DATA_SCHEMA, errors=errors
        )

    async def async_step_discovery(
        self, discovery_info: Dict[str, Any]
    ) -> FlowResult:
        """Handle discovery of a WhoRang instance."""
        self._discovered_info = discovery_info
        
        # Check if already configured
        await self.async_set_unique_id(
            f"{discovery_info[CONF_HOST]}:{discovery_info[CONF_PORT]}"
        )
        self._abort_if_unique_id_configured()

        # Set title and show confirmation form
        self.context["title_placeholders"] = {
            "name": f"WhoRang ({discovery_info[CONF_HOST]})"
        }

        return await self.async_step_discovery_confirm()

    async def async_step_discovery_confirm(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Confirm discovery."""
        if user_input is not None:
            try:
                info = await validate_input(self.hass, self._discovered_info)
            except CannotConnect:
                return self.async_abort(reason=ERROR_CANNOT_CONNECT)
            except InvalidAuth:
                return self.async_abort(reason=ERROR_INVALID_AUTH)
            except Exception:  # pylint: disable=broad-except
                _LOGGER.exception("Unexpected exception")
                return self.async_abort(reason=ERROR_UNKNOWN)
            else:
                return self.async_create_entry(
                    title=info["title"], data=self._discovered_info
                )

        return self.async_show_form(
            step_id="discovery_confirm",
            description_placeholders={
                "host": self._discovered_info[CONF_HOST],
                "port": self._discovered_info[CONF_PORT],
            },
        )

    @staticmethod
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> OptionsFlowHandler:
        """Create the options flow."""
        return OptionsFlowHandler(config_entry)


class OptionsFlowHandler(config_entries.OptionsFlow):
    """Handle options flow for WhoRang AI Doorbell."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        # Get current options with defaults
        current_options = self.config_entry.options
        
        options_schema = vol.Schema(
            {
                vol.Optional(
                    CONF_UPDATE_INTERVAL,
                    default=current_options.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL),
                ): vol.All(int, vol.Range(min=10, max=300)),
                vol.Optional(
                    CONF_ENABLE_WEBSOCKET,
                    default=current_options.get(CONF_ENABLE_WEBSOCKET, True),
                ): bool,
                vol.Optional(
                    CONF_ENABLE_COST_TRACKING,
                    default=current_options.get(CONF_ENABLE_COST_TRACKING, True),
                ): bool,
            }
        )

        return self.async_show_form(
            step_id="init",
            data_schema=options_schema,
        )


class CannotConnect(HomeAssistantError):
    """Error to indicate we cannot connect."""


class InvalidAuth(HomeAssistantError):
    """Error to indicate there is invalid auth."""


class InvalidURL(HomeAssistantError):
    """Error to indicate there is an invalid URL."""
