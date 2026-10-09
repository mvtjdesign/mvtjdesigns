# MVTJ restrained interaction prototype

Local, unpublished refinement of the existing static homepage. The only changes
in index.html are a comment and references to the new CSS and deferred script.
The motion layer preserves the current copy, pricing, images, project facts/URLs,
booking labels, Cloudwards, contact details and section layouts. The homepage now
uses Calendly and WhatsApp for contact; no inquiry form is loaded.

## Preview

From the repository root:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/. Reuse an existing preview server if already running.
This serves local files without publishing them.

## Final interaction direction

The progress rail, its reserved gutter, pinned Process sequence and overlapping
portfolio exhibition have been removed. There is no additional navigation,
project selector, static-mode toggle, hidden project, inert state or added scroll
length. Process uses the original layout and scrolls normally.

- Hero: restrained desktop image depth, at most 20px background movement and
  12px copy movement; image scale settles from 1.018 to 1.005.
- Services and founder: small vertical entrance offsets. Founder portrait scale
  is capped at 1.015. No rotations or large perspective movement.
- Pricing: no entrance animation; original readable cards and scope disclosure,
  with desktop hover reduced to 2px.
- Selected Work: the signature moment is subtle image-plane depth within each
  existing card. All four projects stay in normal flow and remain readable and
  clickable. Images move at most 6px and scale between 1.02 and 1.04. Existing
  screenshot cropping is retained. Text and links do not follow image parallax.
  Card entrances move at most 12px. Keyboard focus pauses the affected card.
- Care and Experience: small entrance offsets only.
- Contact and footer: no motion added.

No Three.js, GSAP, canvas, framework, build process or dependency is needed.
Normal HTML and CSS preserve readability and conversion clarity.

## Responsive, reduced motion and performance

Desktop image depth requires 1200px width, 700px height, a fine pointer and hover.
Tablet/mobile retain the existing layouts, with entrances reduced to one-quarter
of desktop distance. They have no image parallax, pinned sections or rail.
Reduced motion disables the entire enhancement, including on a live preference
change. Print temporarily restores static sections. Failed CSS loading, missing
observers or disabled JavaScript leave the original page available.

Scroll listeners are passive and events are batched into one requestAnimationFrame.
There is no continuous animation loop. Geometry is cached and measured after
resize, fonts, image loading and section size changes, not each scroll event.
Individual near-view observation limits portfolio image work and will-change.
No assets are duplicated and the existing lazy-loading remains. Actual FPS and
GPU behavior need browser review.

## Verification

The revised mocked-DOM suite checks static fallbacks, normal-flow structure,
all project links remaining available, flat pricing, bounded image movement,
focused-link protection, frame batching, offscreen image updates stopping,
reduced-motion cleanup, resizing and print restoration.

JavaScript syntax, homepage preservation,
HTML nesting, internal anchors, local assets and CSS delimiter balance are
source checks. Local HTTP checks verify that preview files are served.
They do not establish rendered appearance, browser console status or FPS.

## Manual visual review

No browser is connected to this session. Screenshots, rendered overflow,
keyboard interaction in a real browser and console/performance checks remain
outstanding at 1440px, 1280px, 1024px, 768px and 390px (also review 320px).

At each width inspect header/menu, hero, services, prices/details, founder, care,
Process, all four projects, Experience, contact and footer. Check text
clipping, image edges, overflow, card spacing and scroll behavior. Test project
links, native details, menu Escape, anchor navigation, Back/Forward, reduced
motion, print and resizing. Portfolio links must remain available without any
extra navigation step. Check motion with the pointer over a card and keyboard
focus inside it.

The homepage has no inquiry form. Calendly and WhatsApp are its contact routes.
No endpoint, analytics ID, payment behavior or new CTA is introduced.
Existing large portfolio screenshots are retained; asset optimization is separate.

No commit, push or deployment. Review the local prototype before publishing.
