# Accessibility

**Conformance target:** WCAG 2.2 Level AA

Desk Potato (posture-detector) is a webcam posture coach. Alerts are delivered as visible text, an assertive live region announcement, optional desktop notification, and optional voice — never colour or sound alone.

## What was tested

- Automated: axe-core (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) at 1440×900, 390×844, and 320×800 on `/`, `/dashboard`, and the camera-permission-denied state.
- Manual: keyboard operation and focus order, skip link, landmarks/headings, visible focus, names/roles/states, reduced motion, reflow at 320 px, target size, and non-visual posture alerts (text + live region).

## Known limitations

- Live monitoring with a real webcam, LiveKit Cloud credentials, and the posture-analysis backends was not exercised in the automated pass. A camera is required to verify the live preview, capture loop, and end-to-end alert timing.
- Voice alerts and desktop notifications depend on browser permission and optional API keys; the on-page text and live region remain the accessible primary channel.

## Report a barrier

Open an issue in this repository describing the page, assistive technology, and what went wrong.
