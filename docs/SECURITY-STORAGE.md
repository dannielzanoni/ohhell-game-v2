# Browser credential storage

This project is a responsive web application. It does not assume native keychain, Keystore, secure-enclave, or other mobile-native APIs.

## Current strategy

- Access and refresh tokens are read and written only through the shared browser storage adapter.
- The adapter uses `localStorage` when available and an in-memory fallback when storage is blocked or unavailable.
- Tokens are never placed in application routes, visible messages, analytics payloads, or production console calls.
- The backend's current realtime contract requires the access token in the WebSocket connection query. The authenticated URL is created immediately before the native socket constructor and must never be forwarded to UI errors or telemetry.
- Logout or definitive refresh rejection removes both access and refresh tokens. Guest nickname/avatar remain so the player can explicitly confirm the profile again.

## Threat model and future hardening

Browser storage is readable by JavaScript and therefore depends on preventing XSS. The application avoids dynamic script injection outside the isolated Google Identity adapter, keeps credentials out of diagnostics, and should maintain a strict Content Security Policy at deployment. If the backend later supports secure, same-site, HttpOnly cookies, refresh-token storage should migrate to that model without changing feature views.
