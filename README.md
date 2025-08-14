# RGBang

RGBang is a vibrant, fast-paced arcade shooter built with Next.js and the HTML5 Canvas API. The game challenges players to survive procedurally generated waves of colorful enemies by mastering a unique color-mixing mechanic and a deep upgrade system. It's a test of reflexes, strategy, and color theory!

## Features

-   **Dynamic Gameplay**: Face endless, procedurally generated waves of enemies that increase in difficulty over time.
-   **Color & Shape System**: Combine primary colors (Red, Yellow, Blue) to create secondary colors (Orange, Purple, Green) to match and destroy your foes. Each color is also paired with a unique shape (Circle, Triangle, Square), making the game more accessible.
-   **Deep Upgrade System**: Collect fragments from fallen enemies to unlock and level up a wide variety of powerful upgrades that can dramatically change your playstyle.
-   **Challenging Boss Fights**: At key intervals, powerful bosses and mini-bosses will spawn, testing your skills with unique attack patterns.
-   **Responsive Canvas**: The game dynamically resizes to fit your browser window while maintaining a perfect 16:9 aspect ratio.
-   **Customizable Controls**: Rebind your keys to suit your playstyle.
-   **Persistent Progress**: Save your high score and unlocked upgrades between sessions.

## How to Play

-   **Move**: Use `W`, `A`, `S`, `D` to move your character.
-   **Aim**: Use the `Mouse` to aim.
-   **Shoot**: `Left Click` to fire projectiles.
-   **Dash**: Press `Spacebar` for a quick burst of speed and temporary invulnerability.
-   **Select Colors**:
    -   Use keys `1`, `2`, `3` or the `Mouse Wheel` to select a primary color (Red, Yellow, Blue).
    -   Hold `Right Click` to open a radial menu and select a secondary color (Orange, Green, Purple).
-   **Match to Destroy**: To damage an enemy, your bullet's color and shape must match the enemy's. Hitting an enemy with the wrong color multiple times will trigger a punishment, making it stronger!
-   **View Upgrades**: Hold `Shift` during a run to see your currently active upgrades.

## Tech Stack

-   **Rendering**: HTML5 Canvas
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
-   **Language**: TypeScript
-   **AI Development**: [Firebase Genkit](https://firebase.google.com/docs/genkit)
-   **Build Tooling**: Node.js, `archiver` for ZIP packaging