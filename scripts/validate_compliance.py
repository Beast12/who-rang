#!/usr/bin/env python3
"""Validation script for Home Assistant integration compliance."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List

# Add the project root to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class ComplianceValidator:
    """Validator for Home Assistant integration compliance."""

    def __init__(self, integration_path: Path) -> None:
        """Initialize the validator."""
        self.integration_path = integration_path
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.passed: List[str] = []

    def validate_manifest(self) -> None:
        """Validate manifest.json compliance."""
        manifest_path = self.integration_path / "manifest.json"
        
        if not manifest_path.exists():
            self.errors.append("manifest.json not found")
            return

        try:
            with open(manifest_path, encoding="utf-8") as f:
                manifest = json.load(f)
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON in manifest.json: {e}")
            return

        # Required fields
        required_fields = [
            "domain", "name", "codeowners", "config_flow", 
            "documentation", "integration_type", "iot_class", 
            "requirements", "version"
        ]
        
        for field in required_fields:
            if field not in manifest:
                self.errors.append(f"Missing required field in manifest.json: {field}")
            else:
                self.passed.append(f"manifest.json has required field: {field}")

        # Validate specific fields
        if "domain" in manifest:
            domain = manifest["domain"]
            if not domain.islower() or not domain.replace("_", "").isalnum():
                self.errors.append("Domain must be lowercase alphanumeric with underscores")
            else:
                self.passed.append("Domain format is valid")

        if "single_config_entry" in manifest:
            if manifest.get("integration_type") == "hub" and not manifest.get("single_config_entry"):
                self.warnings.append("Hub integrations should typically use single_config_entry: true")
            else:
                self.passed.append("single_config_entry is properly configured")

        if "loggers" in manifest:
            self.passed.append("Loggers field is present for external dependencies")
        else:
            self.warnings.append("Consider adding loggers field for external dependencies")

        # Validate version format
        if "version" in manifest:
            version = manifest["version"]
            if not self._is_valid_version(version):
                self.errors.append(f"Invalid version format: {version}")
            else:
                self.passed.append("Version format is valid")

    def _is_valid_version(self, version: str) -> bool:
        """Check if version follows semantic versioning."""
        parts = version.split(".")
        if len(parts) != 3:
            return False
        return all(part.isdigit() for part in parts)

    def validate_config_flow(self) -> None:
        """Validate config flow implementation."""
        config_flow_path = self.integration_path / "config_flow.py"
        
        if not config_flow_path.exists():
            self.errors.append("config_flow.py not found")
            return

        try:
            with open(config_flow_path, encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            self.errors.append(f"Error reading config_flow.py: {e}")
            return

        # Check for required patterns
        required_patterns = [
            "async def async_step_user",
            "FlowResultType",
            "async_create_entry",
            "vol.Schema",
        ]

        for pattern in required_patterns:
            if pattern in content:
                self.passed.append(f"Config flow has required pattern: {pattern}")
            else:
                self.errors.append(f"Config flow missing required pattern: {pattern}")

        # Check for error handling
        if "except" in content and "errors[" in content:
            self.passed.append("Config flow has proper error handling")
        else:
            self.warnings.append("Config flow should have comprehensive error handling")

        # Check for options flow
        if "OptionsFlowHandler" in content:
            self.passed.append("Options flow is implemented")
        else:
            self.warnings.append("Consider implementing options flow for configuration")

    def validate_entities(self) -> None:
        """Validate entity implementations."""
        entity_files = [
            "sensor.py", "binary_sensor.py", "camera.py", 
            "button.py", "select.py", "device_tracker.py"
        ]

        for entity_file in entity_files:
            entity_path = self.integration_path / entity_file
            if entity_path.exists():
                self._validate_entity_file(entity_path)

    def _validate_entity_file(self, entity_path: Path) -> None:
        """Validate a specific entity file."""
        try:
            with open(entity_path, encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            self.errors.append(f"Error reading {entity_path.name}: {e}")
            return

        entity_type = entity_path.stem

        # Check for proper base class usage
        expected_class = f"{entity_type.title()}Entity"
        if entity_type == "binary_sensor":
            expected_class = "BinarySensorEntity"
        elif entity_type == "device_tracker":
            # Device trackers can use ScannerEntity or TrackerEntity
            if "ScannerEntity" in content or "TrackerEntity" in content:
                self.passed.append(f"{entity_type}.py uses proper base class")
                return
            else:
                self.errors.append(f"{entity_type}.py should use ScannerEntity or TrackerEntity base class")
                return
            
        if expected_class in content:
            self.passed.append(f"{entity_type}.py uses proper base class")
        else:
            self.errors.append(f"{entity_type}.py should use {expected_class} base class")

        # Check for required properties
        required_properties = ["unique_id", "name"]
        for prop in required_properties:
            if f"_{prop}" in content or f"@property" in content and f"def {prop}" in content:
                self.passed.append(f"{entity_type}.py implements {prop}")
            else:
                self.warnings.append(f"{entity_type}.py should implement {prop} property")

        # Check for device_info
        if "device_info" in content:
            self.passed.append(f"{entity_type}.py implements device_info")
        else:
            self.warnings.append(f"{entity_type}.py should implement device_info")

        # Check for entity categories where appropriate
        if entity_type in ["sensor"] and "EntityCategory" in content:
            self.passed.append(f"{entity_type}.py uses entity categories")
        elif entity_type in ["sensor"]:
            self.warnings.append(f"{entity_type}.py should use EntityCategory for diagnostic entities")

    def validate_coordinator(self) -> None:
        """Validate coordinator implementation."""
        coordinator_path = self.integration_path / "coordinator.py"
        
        if not coordinator_path.exists():
            self.warnings.append("coordinator.py not found - consider using DataUpdateCoordinator")
            return

        try:
            with open(coordinator_path, encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            self.errors.append(f"Error reading coordinator.py: {e}")
            return

        # Check for DataUpdateCoordinator usage
        if "DataUpdateCoordinator" in content:
            self.passed.append("Uses DataUpdateCoordinator pattern")
        else:
            self.errors.append("Should inherit from DataUpdateCoordinator")

        # Check for async patterns
        if "async def _async_update_data" in content:
            self.passed.append("Implements async data update method")
        else:
            self.errors.append("Missing _async_update_data method")

        # Check for error handling
        if "UpdateFailed" in content:
            self.passed.append("Proper error handling with UpdateFailed")
        else:
            self.warnings.append("Should use UpdateFailed for error handling")

    def validate_strings(self) -> None:
        """Validate strings.json for localization."""
        strings_path = self.integration_path / "strings.json"
        
        if not strings_path.exists():
            self.errors.append("strings.json not found")
            return

        try:
            with open(strings_path, encoding="utf-8") as f:
                strings = json.load(f)
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON in strings.json: {e}")
            return

        # Check for required sections
        required_sections = ["config", "entity"]
        for section in required_sections:
            if section in strings:
                self.passed.append(f"strings.json has {section} section")
            else:
                self.warnings.append(f"strings.json missing {section} section")

        # Check for service descriptions
        if "services" in strings:
            self.passed.append("Service descriptions are provided")
        else:
            self.warnings.append("Consider adding service descriptions")

    def validate_tests(self) -> None:
        """Validate test coverage."""
        tests_path = project_root / "tests"
        
        if not tests_path.exists():
            self.errors.append("tests directory not found")
            return

        # Check for required test files
        required_test_files = [
            "test_config_flow.py",
            "test_init.py",
            "conftest.py",
        ]

        for test_file in required_test_files:
            test_path = tests_path / test_file
            if test_path.exists():
                self.passed.append(f"Test file exists: {test_file}")
            else:
                self.errors.append(f"Missing required test file: {test_file}")

        # Check for pytest configuration
        pytest_config = project_root / "pytest.ini"
        if pytest_config.exists():
            self.passed.append("pytest.ini configuration exists")
        else:
            self.warnings.append("Consider adding pytest.ini for test configuration")

    def validate_type_hints(self) -> None:
        """Validate type hints usage."""
        python_files = list(self.integration_path.glob("*.py"))
        
        for py_file in python_files:
            if py_file.name.startswith("__"):
                continue
                
            try:
                with open(py_file, encoding="utf-8") as f:
                    content = f.read()
            except Exception:
                continue

            # Check for type hints
            if "from __future__ import annotations" in content:
                self.passed.append(f"{py_file.name} uses future annotations")
            else:
                self.warnings.append(f"{py_file.name} should use future annotations")

            # Check for typing imports
            if "from typing import" in content or "import typing" in content:
                self.passed.append(f"{py_file.name} uses type hints")
            else:
                self.warnings.append(f"{py_file.name} should use type hints")

    def run_validation(self) -> Dict[str, Any]:
        """Run all validation checks."""
        print("🔍 Running Home Assistant integration compliance validation...")
        print()

        self.validate_manifest()
        self.validate_config_flow()
        self.validate_entities()
        self.validate_coordinator()
        self.validate_strings()
        self.validate_tests()
        self.validate_type_hints()

        return {
            "passed": len(self.passed),
            "warnings": len(self.warnings),
            "errors": len(self.errors),
            "details": {
                "passed": self.passed,
                "warnings": self.warnings,
                "errors": self.errors,
            }
        }

    def print_results(self, results: Dict[str, Any]) -> None:
        """Print validation results."""
        print("📊 Validation Results:")
        print(f"✅ Passed: {results['passed']}")
        print(f"⚠️  Warnings: {results['warnings']}")
        print(f"❌ Errors: {results['errors']}")
        print()

        if results["details"]["errors"]:
            print("❌ ERRORS:")
            for error in results["details"]["errors"]:
                print(f"  • {error}")
            print()

        if results["details"]["warnings"]:
            print("⚠️  WARNINGS:")
            for warning in results["details"]["warnings"]:
                print(f"  • {warning}")
            print()

        if results["details"]["passed"]:
            print("✅ PASSED CHECKS:")
            for passed in results["details"]["passed"]:
                print(f"  • {passed}")
            print()

        # Overall compliance score
        total_checks = results['passed'] + results['warnings'] + results['errors']
        if total_checks > 0:
            compliance_score = (results['passed'] / total_checks) * 100
            print(f"📈 Compliance Score: {compliance_score:.1f}%")
            
            if compliance_score >= 90:
                print("🎉 Excellent compliance!")
            elif compliance_score >= 75:
                print("👍 Good compliance, minor improvements needed")
            elif compliance_score >= 50:
                print("⚠️  Moderate compliance, several improvements needed")
            else:
                print("❌ Poor compliance, significant improvements required")


def main() -> None:
    """Main function."""
    integration_path = project_root / "custom_components" / "whorang"
    
    if not integration_path.exists():
        print("❌ Integration directory not found!")
        sys.exit(1)

    validator = ComplianceValidator(integration_path)
    results = validator.run_validation()
    validator.print_results(results)

    # Exit with error code if there are errors
    if results["errors"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
