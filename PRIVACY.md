# Privacy and open-source release notes

This is a **local, rule-based** document auditor. No external AI API or backend is required.

## What is included
- Static frontend source code, rules, relationship graph, sanitized synthetic examples, and automated tests.
- Locally bundled third-party PDF/Word parsing libraries and their licenses.
- A local Windows launcher using port 8010.

## What was excluded from the public release
- Original private site URL, project/deployment IDs and commit identifiers associated with private hosting.
- User-uploaded documents, browser localStorage and exported audit reports.
- Credentials, access tokens, account identifiers and local development logs (none detected in the reviewed source).

## Important limitations
- Uploaded files are processed in the viewer's browser, but localStorage and downloaded reports remain the viewer's responsibility.
- Browser extensions, malicious content supplied by readers, or custom modifications can change the privacy model.
- The repository is a **V0.9 reconstructed codebase**, not a byte-for-byte snapshot of the older hosted site.
- Do not submit confidential documents as test examples or screenshots to public pull requests.
