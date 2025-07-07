"""Device tracker platform for WhoRang AI Doorbell integration."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from homeassistant.components.device_tracker import SourceType
from homeassistant.components.device_tracker.config_entry import ScannerEntity
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
    DEVICE_TRACKER_PREFIX,
    ATTR_PERSON_NAME,
    ATTR_PERSON_ID,
    ATTR_TIMESTAMP,
    ATTR_CONFIDENCE_SCORE,
    ATTR_LOCATION,
)
from .coordinator import WhoRangDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up WhoRang device tracker entities."""
    coordinator: WhoRangDataUpdateCoordinator = hass.data[DOMAIN][config_entry.entry_id]

    # Create device trackers for known persons
    entities = []
    known_persons = coordinator.async_get_known_persons()
    
    for person in known_persons:
        entities.append(
            WhoRangPersonDeviceTracker(coordinator, config_entry, person)
        )

    async_add_entities(entities)


class WhoRangPersonDeviceTracker(CoordinatorEntity, ScannerEntity):
    """Device tracker for a known person."""

    def __init__(
        self,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
        person: Dict[str, Any],
    ) -> None:
        """Initialize the device tracker."""
        super().__init__(coordinator)
        self.config_entry = config_entry
        self.person = person
        self.person_id = person.get("id")
        self.person_name = person.get("name", f"Person {self.person_id}")
        
        self._attr_unique_id = f"{config_entry.entry_id}_{DEVICE_TRACKER_PREFIX}_{self.person_id}"
        self._attr_name = f"{self.person_name} Presence"
        self._attr_has_entity_name = True
        self._attr_icon = "mdi:account-check"

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

    @property
    def source_type(self) -> SourceType:
        """Return the source type of the device tracker."""
        return SourceType.ROUTER

    @property
    def is_connected(self) -> bool:
        """Return true if the person was recently detected."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        if not latest_visitor:
            return False

        # Check if the latest visitor matches this person
        visitor_person_id = latest_visitor.get("person_id")
        if visitor_person_id != self.person_id:
            return False

        # Check if the detection is recent (within last 30 minutes)
        timestamp_str = latest_visitor.get("timestamp")
        if timestamp_str:
            try:
                visitor_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                now = datetime.now(visitor_time.tzinfo)
                return (now - visitor_time) < timedelta(minutes=30)
            except (ValueError, TypeError):
                pass

        return False

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Return additional state attributes."""
        latest_visitor = self.coordinator.async_get_latest_visitor()
        
        # Base attributes from person data
        attributes = {
            ATTR_PERSON_ID: self.person_id,
            ATTR_PERSON_NAME: self.person_name,
            "notes": self.person.get("notes"),
            "face_count": self.person.get("face_count", 0),
            "first_seen": self.person.get("first_seen"),
            "last_seen": self.person.get("last_seen"),
            "avg_confidence": self.person.get("avg_confidence"),
        }

        # Add latest detection info if this person was the latest visitor
        if latest_visitor and latest_visitor.get("person_id") == self.person_id:
            attributes.update({
                "latest_visitor_id": latest_visitor.get("visitor_id"),
                ATTR_TIMESTAMP: latest_visitor.get("timestamp"),
                ATTR_CONFIDENCE_SCORE: latest_visitor.get("confidence_score"),
                ATTR_LOCATION: latest_visitor.get("location"),
                "ai_message": latest_visitor.get("ai_message"),
                "faces_detected": latest_visitor.get("faces_detected", 0),
            })

        return attributes

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        # Device tracker is available if we have coordinator data
        return self.coordinator.data is not None


class WhoRangDynamicDeviceTrackerManager:
    """Manager for dynamically creating/removing device trackers for known persons."""

    def __init__(
        self,
        hass: HomeAssistant,
        coordinator: WhoRangDataUpdateCoordinator,
        config_entry: ConfigEntry,
        async_add_entities: AddEntitiesCallback,
    ) -> None:
        """Initialize the manager."""
        self.hass = hass
        self.coordinator = coordinator
        self.config_entry = config_entry
        self.async_add_entities = async_add_entities
        self._tracked_persons: Dict[int, WhoRangPersonDeviceTracker] = {}

    async def async_update_device_trackers(self) -> None:
        """Update device trackers based on current known persons."""
        current_persons = self.coordinator.async_get_known_persons()
        current_person_ids = {person.get("id") for person in current_persons}
        tracked_person_ids = set(self._tracked_persons.keys())

        # Add new device trackers for new persons
        new_person_ids = current_person_ids - tracked_person_ids
        if new_person_ids:
            new_entities = []
            for person in current_persons:
                person_id = person.get("id")
                if person_id in new_person_ids:
                    tracker = WhoRangPersonDeviceTracker(
                        self.coordinator, self.config_entry, person
                    )
                    self._tracked_persons[person_id] = tracker
                    new_entities.append(tracker)
                    _LOGGER.debug("Added device tracker for person: %s", person.get("name"))

            if new_entities:
                self.async_add_entities(new_entities)

        # Remove device trackers for persons that no longer exist
        removed_person_ids = tracked_person_ids - current_person_ids
        for person_id in removed_person_ids:
            if person_id in self._tracked_persons:
                tracker = self._tracked_persons.pop(person_id)
                # Note: Home Assistant doesn't have a direct way to remove entities
                # They will become unavailable and can be manually removed from the UI
                _LOGGER.debug("Person removed, device tracker will become unavailable: %s", person_id)
