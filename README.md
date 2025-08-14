
# RGBang

RGBang is a vibrant, fast-paced arcade shooter built with Next.js and the HTML5 Canvas API. The game challenges players to survive waves of colorful enemies by mastering a unique color-mixing mechanic. It's a test of reflexes, strategy, and color theory!

## Features

- **Dynamic Gameplay**: Face endless waves of enemies that increase in difficulty over time.
- **Color-Mixing Mechanic**: Combine primary colors (Red, Yellow, Blue) to create secondary colors (Orange, Purple, Green) to match and destroy your foes.
- **Shape-Based Accessibility**: Each color is paired with a unique shape (Circle, Triangle, Square), making the game accessible to players with color blindness.
- **Challenging Boss Fights**: Every 100 points, a powerful boss spawns, testing your skills with unique attack patterns.
- **Responsive Canvas**: The game dynamically resizes to fit your browser window while maintaining a perfect 16:9 aspect ratio.
- **Customizable Controls**: Rebind your keys to suit your playstyle.
- **High Score Tracking**: Compete against yourself and save your best scores locally.

## How to Play

-   **Move**: Use `W`, `A`, `S`, `D` to move your character.
-   **Aim**: Use the `Mouse` to aim.
-   **Shoot**: `Left Click` to fire projectiles.
-   **Dash**: Press `Spacebar` for a quick burst of speed and temporary invulnerability.
-   **Select Colors**:
    -   Use keys `1`, `2`, `3` or the `Mouse Wheel` to select your primary color (Red, Yellow, Blue).
    -   Hold `Shift` and press a different primary color key to combine them into a secondary color.
-   **Match to Destroy**: To damage an enemy, your bullet's color and shape must match the enemy's. Hitting an enemy with the wrong color will eventually make it stronger!

## Tech Stack

-   **Rendering**: HTML5 Canvas
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
-   **Language**: TypeScript
-   **AI Development**: [Firebase Genkit](https://firebase.google.com/docs/genkit)
-   **Build Tooling**: Node.js, `archiver` for ZIP packaging
