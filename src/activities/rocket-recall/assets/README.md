# Rocket Recall artwork

Original artwork generated using the built-in OpenAI image-generation tool on 7 September 2026. No external reference images were used. Originals were copied from the tool's generated-images directory; their alpha channels and pixels are unchanged.

- `rocket.png`: 1024 × 1536, RGBA; visually inspected for a clean upright silhouette, clear fins and porthole, no flame, no lettering. Alpha range verified as 0–254.
- `ascent-panorama.png`: 736 × 2135, RGB; visually inspected for continuous launchpad-to-space progression, clear central route and no lettering. The laboratory is represented by an open futuristic launch bay; interactive roof and acid layers belong to the game.

## Generation prompts

**Rocket:** Use case: stylized-concept. Asset type: transparent PNG sprite for a small educational arcade rocket game. Create one original upright rocket, nose pointing straight up, perfectly straight-on front view, centered, entire vehicle visible. White body with deep navy panels, a single cyan circular porthole, cyan edge accents, small magenta fin details. Bold clean readable silhouette, polished 2D game illustration with restrained soft dimensional shading, legible at 80 pixels tall. Genuine transparent background including outside all fins. Rocket only, no flame or smoke (these are animated separately), no ground, no shadow cast outside the rocket, no stars, no text, no logos, no border. Tight composition with a little transparent padding. Canvas portrait or square.

**Panorama:** Use case: stylized-concept. Asset type: tall vertical scrolling backdrop for educational arcade rocket game. Create one original continuous portrait panorama, aspect ratio 1:3. From BOTTOM to TOP: bottom fifth a simple futuristic laboratory interior with a clear central launch bay and cyan floor lights; next fifth laboratory rooftop and distant small city silhouettes; middle fifth towering soft atmospheric clouds; next fifth thin glowing upper atmosphere and slight curved blue planetary horizon; top fifth starry deep space. Central vertical route should stay mostly empty and dark enough for a small white rocket overlay, scenery around sides. Smooth transitions, no dividing lines or labels. Crisp polished 2D game background, restrained painterly detail, deep navy black base, cyan illumination, subtle purple and magenta accents. No rocket, no spacecraft, no people, no acid or liquid, no UI, no text, no numbers, no logos. Full bleed opaque image.

Generation is nondeterministic; retain these checked originals rather than regenerating them during a normal build.
