# Contact routes: Calendly and WhatsApp

The homepage uses two direct contact routes:

- Primary: free 15-minute introductory call on Calendly.
  https://calendly.com/max-tijerino/30min
- Secondary: WhatsApp at +357 94 338222.
  https://wa.me/35794338222

The confirmed Calendly event is 15 minutes. Its existing `/30min` URL is retained.
WhatsApp keeps its same-tab behavior to avoid the previous blank-tab problem.

The inactive homepage inquiry form, its jump link, development-mode notice and
homepage inquiry CSS/JavaScript imports have been removed. No Formspree account,
endpoint, payment processing, submission behavior or analytics is needed for the
current contact flow. All service CTAs still link directly to Calendly.

`assets/inquiry.js`, `assets/inquiry.css`, `tests/inquiry.test.cjs` and the unlinked
`thank-you/index.html` remain in the repository as unused legacy implementation.
They are not a working homepage contact path. The homepage does not execute the
form script or its attribution-storage/event hooks. No submission is configured.

If a form is requested later, implement it against the then-current offers and
approved delivery/privacy requirements, and test actual receipt before enabling
it. The legacy form cannot be enabled by adding an endpoint alone: its markup
is no longer on the homepage. Do not restore it without a new request.

Before publishing, visually review desktop/mobile Contact, keyboard focus,
Calendly navigation and WhatsApp handoff on devices with and without WhatsApp.
