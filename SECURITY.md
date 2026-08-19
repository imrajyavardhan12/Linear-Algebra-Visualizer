# Security policy

## Reporting a vulnerability

Please do not disclose a suspected vulnerability in a public issue. Use GitHub's private vulnerability reporting for this repository when available, or contact the maintainer privately through the GitHub account that owns the repository.

Include the affected version or commit, reproduction steps, expected impact, and any suggested mitigation. Reports will be acknowledged as soon as practical.

## Supported version

Security fixes are applied to the latest commit on `main`.

## Current threat model

Linear Algebra Playground is a static, client-only application. It has no backend, accounts, cookies, database, file uploads, or API credentials. Its relevant security boundaries are URL scene deserialization, browser DOM rendering, clipboard access, third-party resources, dependency integrity, and deployment response headers.

Scene URL input is restricted to known vector identifiers and finite bounded numbers. Dynamic UI content is rendered through React escaping; the project does not use raw HTML insertion or dynamic code execution. Fonts are self-hosted, dependencies are locked, and CI uses read-only permissions with actions pinned to reviewed commits.

Production hosts should preserve the policies in `public/_headers` or configure equivalent headers. TLS and HSTS remain the responsibility of the hosting provider.
