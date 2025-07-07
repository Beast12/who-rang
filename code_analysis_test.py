#!/usr/bin/env python3
"""
Code analysis and syntax validation for WhoRang Home Assistant Integration
Performs static analysis, syntax checking, and code quality validation.
"""

import ast
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

class CodeAnalyzer:
    """Analyzes Python code for syntax, structure, and potential issues"""
    
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.recommendations = []
        self.stats = {
            'files_analyzed': 0,
            'lines_of_code': 0,
            'functions': 0,
            'classes': 0,
            'imports': 0
        }
    
    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze a single Python file"""
        result = {
            'file': file_path,
            'syntax_valid': False,
            'issues': [],
            'warnings': [],
            'stats': {},
            'imports': [],
            'classes': [],
            'functions': []
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse AST
            tree = ast.parse(content)
            result['syntax_valid'] = True
            
            # Analyze AST
            analyzer = ASTAnalyzer()
            analyzer.visit(tree)
            
            result['stats'] = {
                'lines': len(content.splitlines()),
                'imports': len(analyzer.imports),
                'classes': len(analyzer.classes),
                'functions': len(analyzer.functions)
            }
            
            result['imports'] = analyzer.imports
            result['classes'] = analyzer.classes
            result['functions'] = analyzer.functions
            result['issues'] = analyzer.issues
            result['warnings'] = analyzer.warnings
            
            # Update global stats
            self.stats['files_analyzed'] += 1
            self.stats['lines_of_code'] += result['stats']['lines']
            self.stats['functions'] += result['stats']['functions']
            self.stats['classes'] += result['stats']['classes']
            self.stats['imports'] += result['stats']['imports']
            
        except SyntaxError as e:
            result['issues'].append(f"Syntax Error: {e}")
            self.issues.append(f"{file_path}: Syntax Error - {e}")
        except Exception as e:
            result['issues'].append(f"Analysis Error: {e}")
            self.issues.append(f"{file_path}: Analysis Error - {e}")
        
        return result
    
    def check_home_assistant_patterns(self, file_path: str, content: str) -> List[str]:
        """Check for Home Assistant specific patterns and best practices"""
        issues = []
        
        # Check for proper async/await usage
        if 'def ' in content and 'async def' not in content and any(
            pattern in content for pattern in ['await ', 'aiohttp', 'asyncio']
        ):
            issues.append("File contains async operations but no async functions")
        
        # Check for proper logging
        if 'logging' not in content and any(
            pattern in content for pattern in ['_LOGGER', 'logger']
        ):
            issues.append("Uses logger without importing logging module")
        
        # Check for proper error handling in API calls
        if 'aiohttp' in content and 'try:' not in content:
            issues.append("Uses aiohttp but lacks proper error handling")
        
        # Check for proper type hints
        if 'def ' in content and '->' not in content and 'typing' not in content:
            issues.append("Functions lack return type hints")
        
        return issues

class ASTAnalyzer(ast.NodeVisitor):
    """AST visitor for analyzing Python code structure"""
    
    def __init__(self):
        self.imports = []
        self.classes = []
        self.functions = []
        self.issues = []
        self.warnings = []
        self.current_class = None
    
    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)
    
    def visit_ImportFrom(self, node):
        module = node.module or ''
        for alias in node.names:
            self.imports.append(f"{module}.{alias.name}")
        self.generic_visit(node)
    
    def visit_ClassDef(self, node):
        bases = []
        for base in node.bases:
            try:
                if hasattr(base, 'id'):
                    bases.append(base.id)
                elif hasattr(base, 'attr') and hasattr(base, 'value'):
                    if hasattr(base.value, 'id'):
                        bases.append(f"{base.value.id}.{base.attr}")
                    else:
                        bases.append(base.attr)
                else:
                    bases.append('Unknown')
            except:
                bases.append('Unknown')
        
        class_info = {
            'name': node.name,
            'line': node.lineno,
            'methods': [],
            'bases': bases
        }
        
        self.current_class = node.name
        self.classes.append(class_info)
        self.generic_visit(node)
        self.current_class = None
    
    def visit_FunctionDef(self, node):
        func_info = {
            'name': node.name,
            'line': node.lineno,
            'is_async': False,
            'class': self.current_class,
            'args': [arg.arg for arg in node.args.args],
            'returns': node.returns is not None
        }
        
        self.functions.append(func_info)
        self.generic_visit(node)
    
    def visit_AsyncFunctionDef(self, node):
        func_info = {
            'name': node.name,
            'line': node.lineno,
            'is_async': True,
            'class': self.current_class,
            'args': [arg.arg for arg in node.args.args],
            'returns': node.returns is not None
        }
        
        self.functions.append(func_info)
        self.generic_visit(node)

class WhoRangCodeTester:
    """Main code testing class"""
    
    def __init__(self):
        self.analyzer = CodeAnalyzer()
        self.base_path = Path('home_assistant/custom_components/whorang')
        self.results = {}
    
    def run_analysis(self):
        """Run comprehensive code analysis"""
        print("Starting WhoRang Integration Code Analysis...")
        
        # Get all Python files
        python_files = list(self.base_path.glob('*.py'))
        
        for file_path in python_files:
            print(f"Analyzing {file_path.name}...")
            result = self.analyzer.analyze_file(str(file_path))
            self.results[file_path.name] = result
            
            # Additional Home Assistant specific checks
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            ha_issues = self.analyzer.check_home_assistant_patterns(str(file_path), content)
            result['ha_issues'] = ha_issues
        
        # Analyze configuration files
        self.analyze_config_files()
        
        return self.generate_report()
    
    def analyze_config_files(self):
        """Analyze configuration files"""
        config_files = {
            'manifest.json': self.analyze_manifest,
            'services.yaml': self.analyze_services,
            'strings.json': self.analyze_strings
        }
        
        for filename, analyzer_func in config_files.items():
            file_path = self.base_path / filename
            if file_path.exists():
                print(f"Analyzing {filename}...")
                result = analyzer_func(file_path)
                self.results[filename] = result
    
    def analyze_manifest(self, file_path: Path) -> Dict[str, Any]:
        """Analyze manifest.json"""
        result = {'file': str(file_path), 'issues': [], 'warnings': []}
        
        try:
            with open(file_path, 'r') as f:
                manifest = json.load(f)
            
            # Check required fields
            required_fields = [
                'domain', 'name', 'config_flow', 'documentation', 
                'integration_type', 'iot_class', 'requirements', 'version'
            ]
            
            for field in required_fields:
                if field not in manifest:
                    result['issues'].append(f"Missing required field: {field}")
            
            # Check version format
            version = manifest.get('version', '')
            if not re.match(r'^\d+\.\d+\.\d+$', version):
                result['issues'].append(f"Invalid version format: {version}")
            
            # Check requirements format
            requirements = manifest.get('requirements', [])
            for req in requirements:
                if not re.match(r'^[a-zA-Z0-9_-]+>=?\d+\.\d+\.\d+$', req):
                    result['warnings'].append(f"Requirement format may be invalid: {req}")
            
            # Check IoT class
            iot_class = manifest.get('iot_class', '')
            valid_iot_classes = ['assumed_state', 'cloud_polling', 'cloud_push', 'local_polling', 'local_push']
            if iot_class not in valid_iot_classes:
                result['warnings'].append(f"Unusual IoT class: {iot_class}")
            
        except json.JSONDecodeError as e:
            result['issues'].append(f"JSON parsing error: {e}")
        except Exception as e:
            result['issues'].append(f"Analysis error: {e}")
        
        return result
    
    def analyze_services(self, file_path: Path) -> Dict[str, Any]:
        """Analyze services.yaml"""
        result = {'file': str(file_path), 'issues': [], 'warnings': []}
        
        try:
            import yaml
            with open(file_path, 'r') as f:
                services = yaml.safe_load(f)
            
            # Check service structure
            for service_name, service_def in services.items():
                if 'name' not in service_def:
                    result['warnings'].append(f"Service {service_name} missing name")
                
                if 'description' not in service_def:
                    result['warnings'].append(f"Service {service_name} missing description")
                
                # Check fields structure
                fields = service_def.get('fields', {})
                for field_name, field_def in fields.items():
                    if 'name' not in field_def:
                        result['warnings'].append(f"Field {field_name} in {service_name} missing name")
        
        except Exception as e:
            result['issues'].append(f"YAML analysis error: {e}")
        
        return result
    
    def analyze_strings(self, file_path: Path) -> Dict[str, Any]:
        """Analyze strings.json"""
        result = {'file': str(file_path), 'issues': [], 'warnings': []}
        
        try:
            with open(file_path, 'r') as f:
                strings = json.load(f)
            
            # Check for required sections
            required_sections = ['config', 'options']
            for section in required_sections:
                if section not in strings:
                    result['warnings'].append(f"Missing section: {section}")
        
        except json.JSONDecodeError as e:
            result['issues'].append(f"JSON parsing error: {e}")
        except Exception as e:
            result['issues'].append(f"Analysis error: {e}")
        
        return result
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive analysis report"""
        total_issues = sum(len(result.get('issues', [])) for result in self.results.values())
        total_warnings = sum(len(result.get('warnings', [])) for result in self.results.values())
        total_ha_issues = sum(len(result.get('ha_issues', [])) for result in self.results.values())
        
        summary = {
            'files_analyzed': len(self.results),
            'total_issues': total_issues,
            'total_warnings': total_warnings,
            'total_ha_issues': total_ha_issues,
            'code_stats': self.analyzer.stats
        }
        
        report = {
            'summary': summary,
            'file_results': self.results,
            'global_issues': self.analyzer.issues,
            'recommendations': self.get_recommendations()
        }
        
        return report
    
    def get_recommendations(self) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []
        
        # Check for common patterns
        python_files = [name for name in self.results.keys() if name.endswith('.py')]
        
        # Check async usage
        async_files = []
        for filename in python_files:
            result = self.results[filename]
            if any(func['is_async'] for func in result.get('functions', [])):
                async_files.append(filename)
        
        if len(async_files) < len(python_files) * 0.5:
            recommendations.append("Consider using more async functions for better Home Assistant integration")
        
        # Check error handling
        error_handling_files = []
        for filename in python_files:
            result = self.results[filename]
            if 'try' in str(result.get('functions', [])):
                error_handling_files.append(filename)
        
        if len(error_handling_files) < len(python_files) * 0.7:
            recommendations.append("Add more comprehensive error handling throughout the codebase")
        
        # Check type hints
        type_hint_files = []
        for filename in python_files:
            result = self.results[filename]
            functions_with_returns = [f for f in result.get('functions', []) if f['returns']]
            if functions_with_returns:
                type_hint_files.append(filename)
        
        if len(type_hint_files) < len(python_files) * 0.8:
            recommendations.append("Add type hints to improve code maintainability")
        
        return recommendations

def main():
    """Main execution"""
    tester = WhoRangCodeTester()
    report = tester.run_analysis()
    
    # Print summary
    summary = report['summary']
    print(f"\n{'='*60}")
    print("WHORANG INTEGRATION CODE ANALYSIS REPORT")
    print(f"{'='*60}")
    print(f"Files Analyzed: {summary['files_analyzed']}")
    print(f"Total Issues: {summary['total_issues']}")
    print(f"Total Warnings: {summary['total_warnings']}")
    print(f"HA-Specific Issues: {summary['total_ha_issues']}")
    print(f"Lines of Code: {summary['code_stats']['lines_of_code']}")
    print(f"Functions: {summary['code_stats']['functions']}")
    print(f"Classes: {summary['code_stats']['classes']}")
    
    # Print issues by file
    print(f"\n{'='*60}")
    print("ISSUES BY FILE")
    print(f"{'='*60}")
    
    for filename, result in report['file_results'].items():
        issues = result.get('issues', [])
        warnings = result.get('warnings', [])
        ha_issues = result.get('ha_issues', [])
        
        if issues or warnings or ha_issues:
            print(f"\n{filename}:")
            for issue in issues:
                print(f"  ERROR: {issue}")
            for warning in warnings:
                print(f"  WARNING: {warning}")
            for ha_issue in ha_issues:
                print(f"  HA-ISSUE: {ha_issue}")
    
    # Print recommendations
    if report['recommendations']:
        print(f"\n{'='*60}")
        print("RECOMMENDATIONS")
        print(f"{'='*60}")
        for rec in report['recommendations']:
            print(f"• {rec}")
    
    # Save detailed report
    with open('code_analysis_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nDetailed report saved to: code_analysis_report.json")
    
    # Return success if no critical issues
    return summary['total_issues'] == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
