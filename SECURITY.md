# Security Policy

## Supported Versions

Currently, only the latest version of Brandex is supported with security updates.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

### How to Report

**Do not** create a public issue for security vulnerabilities.

Instead, please send an email to:
- **Email**: net2outlawzz@gmail.com
- **Subject**: [Security] Brandex Vulnerability Report

### What to Include

Please include the following information in your report:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes or mitigations (if available)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Investigation**: Within 1 week
- **Resolution**: As soon as feasible, depending on severity

### Security Best Practices

When working with Brandex, please follow these security guidelines:

1. **Never commit secrets or credentials**
   - Do not commit API keys, database credentials, or sensitive tokens
   - Use environment variables for sensitive configuration
   - The project uses Replit Secrets for configuration

2. **Keep dependencies updated**
   - Regularly update dependencies to get security patches
   - Use `pnpm audit` to check for known vulnerabilities

3. **Secure database connections**
   - Use the unpooled connection string only for migrations/admin tooling
   - Ensure proper access controls on database resources

4. **Google Sheets security**
   - Protect your Google Sheets API key
   - Use appropriate sharing settings for Google Sheets
   - Validate data before syncing from external sources

## Security Features

Brandex includes several security features:

- **Audit Logging**: All changes are recorded in an audit log
- **Forward-only progression**: Trademark stages progress forward only
- **Environment-based configuration**: Sensitive data stored in environment variables
- **Type safety**: TypeScript helps prevent common security issues

## Dependency Security

The project uses pnpm for package management. To check for security vulnerabilities:

```bash
pnpm audit
```

To update dependencies securely:

```bash
pnpm update
```

## Disclosure Policy

- Security issues will be disclosed after a fix is available
- Credit will be given to reporters in the release notes
- We aim to provide patches within a reasonable timeframe based on severity

## Contact

For security-related questions not related to vulnerability reports:
- **Email**: net2outlawzz@gmail.com
- **GitHub**: [@0utLawzz](https://github.com/0utLawzz)
