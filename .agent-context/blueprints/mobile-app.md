# Mobile App Blueprint

This blueprint defines the starter shape for a mobile product that needs a clean separation between UI, device integration, and backend contracts.

## Structure

- Transport: device events, navigation entry points, push notifications, and platform channels.
- Service: orchestration, screen-level state, validation, and user-facing workflows.
- Repository: remote API clients, local storage adapters, and persistence abstractions.

## Starter Rules

- Keep screens focused on rendering and user interaction only.
- Move API access, caching, and serialization into adapter layers.
- Use consistent error handling for offline, permission, and platform failures.
- Add release checks for signing, packaging, and crash telemetry before shipping.

## Recommended Stack Pairings

- React Native for teams that want JavaScript or TypeScript alignment.
- Flutter for teams that want a strongly structured UI toolkit.
