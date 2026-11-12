# 3D Hero Room — Design

## Intent

Turn the portfolio's first screen into a welcoming, realistic 3D scene: a cozy dev room with a male character
sitting at a desk, typing. Visitors should feel "wow, this person builds real things" within five seconds.
The rest of the site keeps working exactly as it does today.

## Goals

- Realistic 3D room (desk, office chair, monitors, desk lamp, plants, shelf, books) lit with a real interior light map.
- Mixamo character seated at the desk, looping a typing animation; occasionally blends into a second idle animation
  (stretch / lean back) if one is provided.
- Mouse parallax: the camera orbits a few degrees toward the cursor, smoothly eased.
- Scroll: the camera dollies toward the monitor as the visitor scrolls past the hero; the monitor screen fills the view
  and the page continues into the projects section.
- Monitor screens show live scrolling code (canvas texture), glowing softly.
- Existing hero text + buttons ("FULL STACK & GAME DEV", View Projects, cat about.txt) stay, overlaid on the left.

## Non-goals

- Rebuilding About / Works / Reviews / Admin pages in 3D. They stay as they are.
- Changing the backend (`server.js`, `functions/api/*`).

## Anti-goals (failure even if it "works")

- Any "AI-looking" notifiers: the custom pixel cursor / cursor-following canvas, pulsing/glowing status dots
  (`avail-badge-dot`, `hs-avail-dot`), and similar. These are removed; the normal OS cursor returns.
- A blank or janky first screen: the page must show the 2D hero instantly and fade the 3D in once loaded.
- Breaking the site on phones or slow machines.

## Decided by the user

- Scene: option A, "cozy dev room" (chosen over floating-island and split-layout sketches).
- Style: realistic, not low-poly.
- Assets: free online assets, compiled into one folder. Room assets downloaded by Claude; Mixamo character
  downloaded by the user (needs an Adobe login).

## Assets (already downloaded) — `public/assets/3d/`

- `models/` (Poly Haven, CC0, glTF 1k): modern_arm_chair_01, metal_office_desk, WoodenTable_02, desk_lamp_arm_01,
  potted_plant_01, potted_plant_04, book_encyclopedia_set_01, office_notepads, stationery_supplies, Shelf_01,
  modern_wooden_cabinet.
- `textures/`: laminate_floor_02 (floor), painted_plaster_wall (walls).
- `hdri/lythwood_room_1k.hdr`: interior environment lighting.
- `character/`: user's Mixamo FBX files (`typing.fbx` required, `idle.fbx` optional).
- `CREDITS.md`: sources and licenses.

## Builder's calls (Claude's, not the user's — flag if wrong)

- Engine: Three.js (r160+, ES module from a CDN via import map, no build step — the site has none today).
  FBXLoader for Mixamo files, GLTFLoader for Poly Haven, RGBELoader for the HDRI.
- Monitors and keyboard: built in code (no realistic CC0 versions exist without login). Dark bezel boxes with an
  emissive canvas texture of scrolling code.
- Room shell: floor + two walls (back, left) as textured planes; a window glow or warm lamp light for mood.
- Desk choice: whichever of the two downloaded desks reads better on camera.
- Mobile: same scene, lower pixel ratio, no shadows; parallax from scroll only. If WebGL is unavailable or loading
  fails, the current 2D hero stays as-is.
- Performance: render loop pauses when the hero is off-screen or the tab is hidden.
- Deploy: assets total ~31 MB, each file well under Cloudflare Pages' 25 MB per-file limit.

## Left to the builder

- Exact camera framing, light colors/intensities, prop placement.
- Code-screen content (likely snippets in the site's own stack).
