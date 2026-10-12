const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const pages = [
  "index.html",
  "cloudwards/index.html",
  "create-elevate/index.html",
  "founder/index.html",
  "portfolio/index.html",
  "thank-you/index.html",
  "privacy/index.html"
];

test("every public HTML route links to the privacy policy", () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /href="\/privacy\/"/, `${file} links to /privacy/`);
  }
});

test("privacy policy reflects the current contact and tracking setup", () => {
  const html = fs.readFileSync(path.join(root, "privacy/index.html"), "utf8");
  assert.match(html, /<title>Privacy Policy \| MVTJ Designs<\/title>/);
  assert.match(html, /Effective date:<\/strong> October 12, 2026/);
  assert.match(html, /Last updated:<\/strong> October 12, 2026/);
  assert.match(html, /does not currently provide an inquiry form/);
  assert.match(html, /does not intentionally use advertising trackers or an analytics service/);
  assert.match(html, /Calendly/);
  assert.match(html, /WhatsApp/);
  assert.match(html, /Google Fonts/);
  assert.match(html, /YouTube/);
  assert.match(html, /mailto:maxtijerino@gmail\.com/);
  assert.doesNotMatch(html, /GDPR compliant|CCPA compliant|Do Not Sell or Share/i);
});

test("thank-you page explains the next step without a response-time promise", () => {
  const html = fs.readFileSync(path.join(root, "thank-you/index.html"), "utf8");
  assert.match(html, /What happens next\?/);
  assert.match(html, /Please check your spam folder/);
});
