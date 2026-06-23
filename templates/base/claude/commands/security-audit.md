Run a comprehensive security audit on the codebase.

Steps:
1. Dependency vulnerabilities:
{{SECURITY_DEP_STEPS}}

2. Code patterns (OWASP Top 10):
   - Injection: search for string concatenation in queries
   - XSS: search for unsafe HTML rendering
   - SSRF: check that URLs are validated before HTTP calls
   - Secrets: search for hardcoded API keys, passwords, connection strings
   - Auth: verify all handlers check authorization
   - Input validation: ensure all DTOs have validation

3. Infrastructure:
{{SECURITY_INFRA_STEPS}}

4. Output a security report with: CRITICAL, HIGH, MEDIUM, LOW severity
   Include file path, line number, and remediation guidance for each finding
