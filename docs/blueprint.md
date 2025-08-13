# **App Name**: RGBang

## Core Features:

- Movement and Aiming: Player control using WASD for movement and mouse for aim.
- Color Mixing and Shooting: Firing primary (Red, Blue, Yellow) and secondary (Purple, Orange, Green) colored bullets with mouse click and shift key combo.
- Wave Spawning: Spawning waves of enemies with color-coded vulnerabilities.
- Enemy System: Enemy hit triggers vulnerability/resistance/consequence logic. Enemies include at least a base enemy that explodes in the proper color if destroyed by the wrong player bullet color, and one other more challenging enemy with different behavior.
- UI Display: Displaying player health, color hotbar, wave number, and score on the canvas.
- Save System: Saving the player's high score and best wave reached using localStorage.

## Style Guidelines:

- Primary color: Saturated purple (#A020F0) to evoke a sense of energy.
- Background color: Very dark purple (#0A020F), near black.
- Accent color: Electric blue (#7DF9FF) for contrast and highlighting important elements.
- Font: 'Space Grotesk', sans-serif. Suitable for headlines and UI elements due to its techy feel. If longer text is anticipated, use this for headlines and 'Inter' for body. Note: currently only Google Fonts are supported.
- Simple, geometric icons representing each color for the hotbar. Icons should be easily distinguishable.
- Brief, impactful color flashes and fades to show impacts. No large particle effects. Animations should have a computerized feel.