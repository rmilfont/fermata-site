# Design System Document

## 1. Overview & Creative North Star: "The Rhythmic Atelier"

This design system is built to transform a functional metronome into a high-end musical instrument. Our Creative North Star is **"The Rhythmic Atelier."** We move away from the "software utility" aesthetic and toward a premium, editorial experience that mirrors the tactility of a physical music studio.

The interface rejects the rigid, boxy constraints of traditional web apps. Instead, we embrace **Intentional Asymmetry** and **Tonal Depth**. By utilizing large-scale typography and overlapping elements (like the Fermata logo’s curve gently breaking the edge of a container), we create a sense of movement and "flow" essential to the musical craft. The goal is a digital space that feels curated, quiet, and professional.

---

## 2. Colors

The palette is rooted in high-contrast sophistication, using an off-white paper-like base with vibrant, rhythmic accents.

### Color Tokens
*   **Primary (`#895100` / `#EA9939`):** The "Fermata Orange." Used for primary actions and rhythmic focus.
*   **Secondary (`#006E29` / `#50EB72`):** The "Tempo Green." Used for "Start" states and active tempo indicators.
*   **Tertiary (`#745B00` / `#F6C72F`):** The "Accent Yellow." Used for highlights and subtle subdivisions.
*   **Neutral Background (`#FCF9F8`):** An off-white, warm "paper" base that prevents eye strain and feels more premium than pure white.
*   **On-Surface (`#1B1B1B`):** Deep charcoal for maximum legibility and an authoritative editorial feel.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Structural boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit on a `surface` background to create a "pocket" of content. Lines are clinical; tonal shifts are musical.

### Signature Textures & Glass
To move beyond a "flat" feel, use **Glassmorphism** for floating controls (e.g., a BPM adjustment overlay). Use semi-transparent versions of `surface` with a `backdrop-blur` of 20px. 
*   **CTA Soul:** Apply a subtle linear gradient from `primary` to `primary_container` on main buttons to provide a soft, "weighted" feel that flat hex codes lack.

---

## 3. Typography

The typographic system is a dialogue between the character-rich **Moonclaw** and the technical precision of **Akrobat**.

*   **Display & Headlines (Moonclaw Regular):** These are the "voice" of the brand. Use `display-lg` (3.5rem) for the BPM readout. The high-contrast serifs of Moonclaw should feel like a printed musical score.
*   **Titles & Body (Akrobat ExtraLight / Work Sans):** Akrobat provides a tall, condensed, and modern feel for labels and settings. Its "ExtraLight" weight creates a sophisticated, airy atmosphere.
*   **Hierarchy Note:** Always maintain high contrast between the "Musical" font (Moonclaw) and the "Technical" font (Akrobat). If everything is bold, nothing is rhythmic.

---

## 4. Elevation & Depth: Tonal Layering

We convey hierarchy through "stacking" rather than traditional drop shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a soft, natural lift.
*   **Ambient Shadows:** For "floating" elements like a rhythm selector, use extra-diffused shadows.
    *   *Shadow:* `0px 24px 48px rgba(27, 27, 27, 0.06)`
    *   The shadow must be tinted with the `on-surface` color to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` at **15% opacity**. Never use 100% opaque borders.
*   **Glassmorphism:** Use semi-transparent layers for elements that "hover" over the metronome's visualizer, allowing the rhythm to bleed through the UI.

---

## 5. Components

### Buttons
*   **Primary:** A pill-shaped (radius: `full`) container using the Primary Gradient. No border. Text in `on-primary` using Akrobat.
*   **Tertiary (Iconic):** Clear backgrounds with high-contrast icons. Use the Fermata logo elements as inspiration for custom icon shapes.

### The Rhythm Strip (Custom Component)
Instead of a standard list, use a horizontal scroll of **Rhythm Chips**. 
*   **Style:** `surface-container-high` background. When selected, they transition to `secondary_container` with a `secondary` icon.
*   **Spacing:** Use `spacing-6` (1.5rem) between rhythmic units to allow the UI to "breathe."

### Input Fields (BPM Entry)
*   **Editorial Style:** No box. Just a bottom-aligned `surface-variant` indicator with the number set in `display-lg` (Moonclaw).
*   **Interaction:** On focus, the indicator expands into a soft `primary_container` glow.

### Cards & Lists
*   **Rule:** Forbid divider lines. Separate "Song Presets" using vertical white space (`spacing-8`) or subtle background shifts between `surface-container-low` and `surface-container-highest`.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. Let the BPM number sit slightly off-center to create visual interest.
*   **Do** use the Fermata "arch" (from the logo) as a masking shape for images or as a subtle background watermark.
*   **Do** lean into the "ExtraLight" weight of Akrobat for a high-end, luxury feel.

### Don’t
*   **Don't** use pure black (#000000) for text; it is too harsh for the premium "Paper" feel of the system. Use `on-surface` (#1B1B1B).
*   **Don't** use standard Material Design "elevated" shadows. They look like software; we want to look like a brand.
*   **Don't** cram elements together. If the UI feels crowded, increase the spacing by two increments on the scale. High-end design is 50% about what you *don't* put on the screen.