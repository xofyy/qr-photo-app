#!/usr/bin/env python3
"""
Secrets scanner for QR PhotoShare application
Scans for hardcoded secrets and sensitive information
"""

import os
import re
import json
from pathlib import Path
from typing import List, Dict, Any

class SecretsScanner:
    """Scanner for detecting hardcoded secrets"""
    
    def __init__(self):
        self.patterns = {
            'aws_access_key': r'AKIA[0-9A-Z]{16}',
            'aws_secret_key': r'[0-9a-zA-Z/+]{40}',
            'google_api_key': r'AIza[0-9A-Za-z\\-_]{35}',
            'jwt_secret': r'(jwt[_-]?secret|secret[_-]?key)["\']?\s*[:=]\s*["\']([^"\']+)["\']',
            'mongodb_uri': r'mongodb(\+srv)?://[^/\s]+',
            'cloudinary_url': r'cloudinary://[^/\s]+',
            'private_key': r'-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----',
            'password': r'(password|passwd|pwd)["\']?\s*[:=]\s*["\']([^"\']+)["\']',
            'api_key': r'(api[_-]?key|apikey)["\']?\s*[:=]\s*["\']([^"\']+)["\']',
            'access_token': r'(access[_-]?token|accesstoken)["\']?\s*[:=]\s*["\']([^"\']+)["\']',
        }
        
        self.exclude_patterns = [
            r'\.git/',
            r'node_modules/',
            r'__pycache__/',
            r'\.pyc$',
            r'\.log$',
            r'package-lock\.json$',
            r'yarn\.lock$',
        ]
        
        self.safe_values = {
            'your-secret-key',
            'your_secret_key',
            'change-me',
            'change_me',
            'placeholder',
            'example',
            'test',
            'demo',
            'default-secret',
            'your-api-key',
            'your_api_key',
        }
    
    def scan_directory(self, directory: str) -> List[Dict[str, Any]]:
        """Scan directory for secrets"""
        findings = []
        
        for root, dirs, files in os.walk(directory):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if not any(re.search(pattern, os.path.join(root, d)) for pattern in self.exclude_patterns)]
            
            for file in files:
                file_path = os.path.join(root, file)
                
                # Skip excluded files
                if any(re.search(pattern, file_path) for pattern in self.exclude_patterns):
                    continue
                
                findings.extend(self.scan_file(file_path))
        
        return findings
    
    def scan_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Scan single file for secrets"""
        findings = []
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            for secret_type, pattern in self.patterns.items():
                matches = re.finditer(pattern, content, re.IGNORECASE)
                
                for match in matches:
                    # Extract the potential secret value
                    secret_value = match.group(2) if match.lastindex and match.lastindex >= 2 else match.group(0)
                    
                    # Skip if it's a safe/placeholder value
                    if secret_value.lower() in self.safe_values:
                        continue
                    
                    # Calculate line number
                    line_number = content[:match.start()].count('\n') + 1
                    
                    findings.append({
                        'type': secret_type,
                        'file': file_path,
                        'line': line_number,
                        'match': match.group(0)[:100],  # Truncate for safety
                        'severity': self._get_severity(secret_type)
                    })
                    
        except (UnicodeDecodeError, PermissionError, FileNotFoundError):
            # Skip files we can't read
            pass
        
        return findings
    
    def _get_severity(self, secret_type: str) -> str:
        """Get severity level for secret type"""
        high_severity = ['aws_access_key', 'aws_secret_key', 'private_key']
        medium_severity = ['jwt_secret', 'api_key', 'access_token']
        
        if secret_type in high_severity:
            return 'HIGH'
        elif secret_type in medium_severity:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def generate_report(self, findings: List[Dict[str, Any]]) -> str:
        """Generate security report"""
        if not findings:
            return "[OK] No secrets found in scan!"
        
        report = f"[SECURITY] Security Scan Report - Found {len(findings)} potential issues:\n\n"
        
        # Group by severity
        by_severity = {}
        for finding in findings:
            severity = finding['severity']
            if severity not in by_severity:
                by_severity[severity] = []
            by_severity[severity].append(finding)
        
        for severity in ['HIGH', 'MEDIUM', 'LOW']:
            if severity in by_severity:
                report += f"{severity} SEVERITY ({len(by_severity[severity])} issues):\n"
                for finding in by_severity[severity]:
                    report += f"  [FILE] {finding['file']}:{finding['line']}\n"
                    report += f"     Type: {finding['type']}\n"
                    report += f"     Match: {finding['match']}\n\n"
        
        report += "\n[RECOMMENDATIONS] Recommended Actions:\n"
        report += "1. Move secrets to environment variables\n"
        report += "2. Use .env files (ensure they're in .gitignore)\n"
        report += "3. Consider using secret management services\n"
        report += "4. Review and rotate any exposed secrets\n"
        
        return report

def main():
    """Main scanner function"""
    scanner = SecretsScanner()
    
    # Scan current directory
    current_dir = os.getcwd()
    print(f"[SCAN] Scanning {current_dir} for secrets...")
    
    findings = scanner.scan_directory(current_dir)
    report = scanner.generate_report(findings)
    
    print(report)
    
    # Save report to file
    with open('security-scan-report.txt', 'w') as f:
        f.write(report)
    
    # Return exit code based on findings
    high_severity_count = len([f for f in findings if f['severity'] == 'HIGH'])
    return 1 if high_severity_count > 0 else 0

if __name__ == "__main__":
    exit(main())