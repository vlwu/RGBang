import { LitElement, html, css } from 'lit';
import './bitmap-text.js';

export class HudStats extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
        }
        .health-bar-container {
            width: 250px;
            height: 25px;
            background-color: #333;
            border: 2px solid #555;
            border-radius: 6px;
            overflow: hidden;
        }
        .health-bar-fill {
            height: 100%;
            background-color: #e74c3c;
            transition: width 0.2s ease-in-out;
        }
        .fps-container {
            background-color: rgba(0,0,0,0.5);
            padding: 2px 8px;
            border-radius: 4px;
        }
    `;

    static properties = {
        health: { type: Object },
        fps: { type: Number },
        fontRenderer: { type: Object },
    };

    constructor() {
        super();
        this.health = { current: 100, max: 100 };
        this.fps = 0;
    }

    render() {
        const healthPercentage = (this.health.max > 0 ? (this.health.current / this.health.max) : 0) * 100;
        return html`
            <div class="health-bar-container">
                <div class="health-bar-fill" style="width: ${healthPercentage}%;"></div>
            </div>
            <div class="fps-container">
                <bitmap-text
                    .fontRenderer=${this.fontRenderer}
                    .text=${`FPS: ${this.fps}`}
                    scale="1.5"
                ></bitmap-text>
            </div>
        `;
    }
}

customElements.define('hud-stats', HudStats);