import { LitElement, html, css } from 'lit';
import { map } from 'lit/directives/map.js';
import { WEAPON_CONFIG } from '../../entities/weapon-definitions.js';

export class HudInventoryBar extends LitElement {
    static styles = css`
        :host {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            background-color: rgba(0, 0, 0, 0.6);
            padding: 5px;
            border-radius: 6px;
            border: 2px solid #444;
            z-index: 100;
            pointer-events: auto;
        }
        .weapon-slot {
            width: 32px;
            height: 32px;
            background-color: #333;
            border: 2px solid #666;
            border-radius: 4px;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.2s ease;
            position: relative;
        }
        .weapon-slot.active {
            border-color: #00aaff;
            transform: scale(1.1);
        }
        .weapon-icon {
            width: 80%;
            height: 80%;
            image-rendering: pixelated;
        }
        .key-hint {
            position: absolute;
            top: -5px;
            right: -3px;
            background-color: #222;
            color: white;
            padding: 1px 3px;
            border-radius: 2px;
            font-size: 10px;
            font-weight: bold;
            border: 1px solid #555;
        }
    `;

    static properties = {
        weapons: { type: Array },
        activeIndex: { type: Number },
    };

    constructor() {
        super();
        this.weapons = [];
        this.activeIndex = 0;
    }

    _getWeaponImagePath(weaponId) {
        const weaponConfig = WEAPON_CONFIG[weaponId];
        if (!weaponConfig) return '';

        const assetKey = weaponConfig.assetKey;
        const number = assetKey.split('_')[1];

        const placeholderMap = { 'gun_4': '1', 'gun_5': '2', 'gun_6': '3' };
        const imageNumber = placeholderMap[assetKey] || number;

        return `images/guns/${imageNumber}.png`;
    }


    render() {
        return html`
            ${map(this.weapons.slice(0, 3), (weaponId, index) => html`
                <div class="weapon-slot ${this.activeIndex === index ? 'active' : ''}">
                    <img class="weapon-icon" src=${this._getWeaponImagePath(weaponId)} alt=${WEAPON_CONFIG[weaponId]?.name || ''}>
                    <div class="key-hint">${index + 1}</div>
                </div>
            `)}
        `;
    }
}

customElements.define('hud-inventory-bar', HudInventoryBar);