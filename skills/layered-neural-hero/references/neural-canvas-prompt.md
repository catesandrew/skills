# Neural canvas prompt

Use this as the build brief for `NeuralCanvas.tsx`, the component the hero imports dynamically.

> Generate the `NeuralCanvas.tsx` component that the Hero section imports dynamically.
>
> I want a high-performance HTML5 canvas animation with an interactive neural-network (constellation) effect.
>
> ## 1. Elements
>
> - A set of floating nodes (circles) drifting slowly across the screen.
> - When two nodes are within about 200px, draw a thin, semi-transparent line between them.
> - Occasionally spawn a pulse of light that travels along a connecting line to suggest data transfer.
>
> ## 2. Mouse and touch interaction
>
> - Nodes react to the cursor. Within a radius of about 250px they are gently pushed away, a magnetic repulsion effect.
>
> ## 3. Performance and rendering
>
> - Use `requestAnimationFrame` for the render loop.
> - Handle `window.devicePixelRatio` so retina screens are not blurry.
> - Handle window resize so the canvas stays full screen.
> - Render fewer nodes on mobile: 35 when the window width is under 768px, 100 on desktop. Add `will-change: transform` to the canvas style to avoid scroll flicker.
>
> Provide the complete React component.

## Corrections to apply

- **Pointer events:** the original brief asks for `pointer-events: auto` on the canvas, but the hero content layer sits above the canvas and swallows the events. Attach `pointermove` and `pointerleave` listeners to the hero section or to `window`, and convert the coordinates to canvas space. Keep `pointer-events: none` on the canvas.
- **Cleanup:** on unmount, cancel the animation frame and remove the resize and pointer listeners.
- **Reduced motion:** when `prefers-reduced-motion: reduce` is set, draw one static frame and do not start the loop.
- **Pause when hidden:** stop the loop when the tab is hidden or the hero is off-screen (`visibilitychange` or `IntersectionObserver`).
- **Counts and distances:** keep 35 and 100 as named constants at the top of the file, along with the 200px and 250px distances, so they are easy to tune.
