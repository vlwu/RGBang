
# RGBang

RGBang is a vibrant, fast-paced arcade shooter built with Next.js and the HTML5 Canvas API. The game challenges players to survive waves of colorful enemies by mastering a unique color-mixing mechanic. It's a test of reflexes, strategy, and color theory!

This project was built entirely within **Firebase Studio**, an AI-powered IDE for bootstrapping and iterating on web applications.

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

## Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn

### Running the Development Server

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run the Game**:
    ```bash
    npm run dev
    ```

The game will be available at `http://localhost:9002`.

### Building for Production

To create a production-ready build, run:

```bash
npm run build
```

This command will build the Next.js application and then automatically package the necessary files into a `dist.zip` archive, ready for distribution (e.g., uploading to the Chrome Web Store).

### Testing as a Chrome Extension

You can easily test the game as a Chrome Extension without needing to zip it up first.

1.  **Build the project**:
    ```bash
    npm run build
    ```
    This will generate a static version of your app in a folder named `out`.

2.  **Open Chrome Extensions**:
    -   Navigate to `chrome://extensions` in your Chrome browser.

3.  **Enable Developer Mode**:
    -   In the top right corner of the Extensions page, toggle "Developer mode" on.

4.  **Load the Extension**:
    -   Click the "Load unpacked" button that appears.
    -   In the file dialog, navigate to your project directory and select the `out` folder.
    -   Click "Select Folder".

5.  **Launch the Game**:
    -   The RGBang extension should now appear in your list of extensions.
    -   Click the Extensions icon (puzzle piece) in your Chrome toolbar, find RGBang, and click it to launch the game in a popup!

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (React)
-   **Rendering**: HTML5 Canvas
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
-   **Language**: TypeScript
-   **AI Development**: [Firebase Genkit](https://firebase.google.com/docs/genkit)
-   **Build Tooling**: Node.js, `archiver` for ZIP packaging
