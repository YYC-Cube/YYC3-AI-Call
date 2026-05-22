# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 2.1.x   | ✅ |
| < 2.0   | ❌ |

## Reporting a Vulnerability

**Do not open public issues for security vulnerabilities.**

Email: security@yyc3.dev

Include:
- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Suggested fix (if any)

We will respond within 48 hours and provide a fix within 7 days.

## Built-in Security Features

@yyc3/i18n-core includes enterprise-grade security:

- **ReDoS Protection**: Safe regex compilation prevents Regular Expression Denial of Service
- **Timing Attack Prevention**: Constant-time string comparison via `safeEqualSecret`
- **Path Traversal Guards**: `isPathInside` prevents directory escape attacks
- **Dangerous Operation Detection**: Identifies SQL injection, command injection patterns
- **Secure Random**: Cryptographically secure random number generation (no `Math.random`)
- **Rate Limiting**: Built-in fixed window rate limiter for API protection

## Security Audit

Last audit: 2026-04 | Result: **93/100 (Grade A)**
- 443 tests passing
- 92.5% code coverage
- OWASP Level 4 compliance
