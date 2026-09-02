# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 1.x | Supported |
| < 1.0.0 | Not supported |

## Reporting a Vulnerability

If you discover a security vulnerability in sorokit-ui, please do not open a public GitHub issue. Instead:

1. Email the maintainers at security@sorokit.dev with a detailed report.
2. Include the affected package version, a description of the issue, and reproduction steps when available.
3. Allow a reasonable amount of time for the maintainers to investigate and prepare a fix.

Please avoid public disclosure until the issue has been triaged and a fix or mitigation is available.

## Disclosure Process

We will acknowledge reports as quickly as possible and coordinate a responsible disclosure timeline with the reporter. Once a fix is ready, we will publish the relevant advisory and release notes so downstream users can update safely.

## Security Best Practices

When using sorokit-ui:

- Validate user input before passing it to contract methods or transaction builders.
- Keep dependencies updated and run `npm audit` regularly.
- Use HTTPS when communicating with Horizon or Soroban RPC endpoints.
- Never expose private keys; wallet SDKs should manage signing keys securely.
- Review contract code before invoking Soroban methods with user funds.
- Test thoroughly on testnet before deploying to mainnet.

## Dependency Security

This project uses:

- `sorokit-core` for Stellar and Soroban logic
- `@creit.tech/stellar-wallets-kit` for wallet integration
- Standard React and TypeScript tooling

All dependencies are regularly reviewed. You can check for known package issues with:

```bash
npm audit
```

## Support

For general security questions or best practices, please open a GitHub discussion or issue. For vulnerability reports, use the private contact method above.
