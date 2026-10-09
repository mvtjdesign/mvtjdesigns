# Project inquiry delivery setup

Delivery is deliberately unconfigured. Do not deploy until delivery, spam protection,
privacy documentation, and real submission tests are complete.

## Configure the real endpoint

1. Create a Formspree form in an account controlled by MVTJ Designs. Verify the
   recipient address and configure provider-side spam protection, permitted domains,
   rate limits, and any required CAPTCHA. The `_gotcha` honeypot is supplementary.
2. Copy the actual HTTPS form endpoint from that account. In `index.html`, find
   `id="project-inquiry-form"` and add `action="ACTUAL_ENDPOINT_COPIED_FROM_YOUR_ACCOUNT"`
   to that form tag, replacing the instruction text with your real endpoint.
   This attribute is the only endpoint configuration location. Never insert a secret
   API key or account password. The script accepts Formspree `/f/` endpoints only.
3. For native submission when JavaScript is unavailable, remove `disabled` from
   `fieldset id="inquiry-fields"` and `button id="inquiry-submit"` ONLY after
   configuring the action. Add `hidden` to `p id="inquiry-setup"`. Do not remove
   these safeguards while the action is missing or empty. Native required/email/URL validation
   remains available without JavaScript. Enhanced validation, campaign persistence,
   loading protection, and event hooks require JavaScript.
4. Configure the provider's successful native-form redirect to
   `https://www.mvtjdesigns.com/thank-you/`. Check the account's support/plan for a
   custom redirect. If unavailable, native submission uses the provider's confirmation
   page; the enhanced JavaScript flow still redirects to `/thank-you/`.
5. Test successful delivery and actual email receipt, invalid fields, service errors,
   network failure, repeated clicks, keyboard navigation, JavaScript disabled,
   blocked browser storage, and the thank-you redirect before deployment.

## Success and failure

`assets/inquiry.js` POSTs `FormData` to the configured endpoint, requesting JSON.
Only an acknowledged successful HTTP response with a valid JSON object and no error
payload emits `lead_form_submit` and redirects. No endpoint means no request,
success, or redirect. Errors/timeouts retain entered data. A timed-out request may
have reached the service; review received inquiries before repeating a live test.
Service acceptance does not guarantee inbox delivery or project acceptance.
The static thank-you page itself cannot authenticate receipt; manually opening its
URL is not a submission test.

## Attribution and prepared event hooks

Only the five specified UTM parameters are retained in sessionStorage for this tab.
Values are bounded and handled as plain text. Latest tagged visits replace the
campaign fields together. Original referrer and submission page URL contain origin
and path only, excluding queries, fragments and credentials. No fingerprints,
advertising trackers, unrelated browsing histories, or third-party SDKs are added.
Blocked storage does not prevent delivery.

`lead_form_start` fires once on input/change; `lead_form_submit` follows service
acknowledgement; `lead_form_error` follows a failed send; `calendly_click` covers
booking alternatives in contact/inquiry areas. Only event names enter dataLayer.
No analytics ID, tag manager, pixel, or tracking service is installed.

## Content and privacy before deployment

No privacy page exists. Provide an approved notice covering inquiry information,
Formspree processing, retention, recipient/contact details, and attribution storage.
Then add its real link near the consent checkbox. Do not invent a route or claim
legal compliance. Review provider data handling and the notice with an appropriate
adviser where needed.

The existing inquiry dropdown reflects the homepage service names and starting
prices. Landing Page Sprint starts from €750, with its scope defined in the
homepage's native scope disclosure. No form-delivery configuration has been added.
All call links retain the confirmed Calendly URL ending in `/30min`; the event is
15 minutes. No payment or checkout is configured.
