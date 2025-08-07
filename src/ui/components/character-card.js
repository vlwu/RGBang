import { LitElement, html, css } from 'lit';
import { characterConfig } from '../../entities/level-definitions.js';
import './bitmap-text.js';

export class CharacterCard extends LitElement {
  static styles = css`
    :host {
      display: flex;
    }
    .character-card {
      background-color: #555; border: 2px solid #777; border-radius: 8px;
      padding: 15px; display: flex; flex-direction: column;
      align-items: center; gap: 10px; transition: all 0.2s ease-in-out;
      position: relative;
      width: 100%;
      box-sizing: border-box;
    }
    .character-card:not(.locked):hover { border-color: #007bff; transform: translateY(-3px); }
    .character-card.locked { opacity: 0.6; cursor: not-allowed; }
    .character-card.selected { border-color: #4CAF50; }

    .char-canvas {
      width: 64px; height: 64px; background-color: #444; border-radius: 6px;
      image-rendering: pixelated;
      flex-shrink: 0;
    }
    .char-name-container {
      margin-top: 5px;
    }
    .char-unlock-container {
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      flex-grow: 1;
    }

    .select-button {
      background-color: #007bff; color: #fff; border: none; padding: 10px 15px;
      border-radius: 6px; cursor: pointer; width: 100%;
      transition: background-color 0.2s;
      display: flex; justify-content: center; align-items: center;
      margin-top: auto;
      flex-shrink: 0;
    }
    .select-button:hover:not(:disabled) { background-color: #0056b3; }

    .selected .select-button { background-color: #4CAF50; cursor: default; }
    .locked .select-button { background-color: #666; cursor: not-allowed; }
  `;

  static properties = {
    characterId: { type: String },
    isLocked: { type: Boolean },
    isSelected: { type: Boolean },
    fontRenderer: { type: Object },
  };

  _handleSelect() {
      if (this.isLocked || this.isSelected) return;
      this.dispatchEvent(new CustomEvent('character-selected', {
          detail: { characterId: this.characterId },
          bubbles: true,
          composed: true
      }));
  }

  render() {
    const config = characterConfig[this.characterId];
    const classes = `character-card ${this.isLocked ? 'locked' : ''} ${this.isSelected ? 'selected' : ''}`;
    const buttonText = this.isLocked ? 'Locked' : (this.isSelected ? 'Selected' : 'Select');

    return html`
      <div class=${classes}>
        <div class="char-canvas"></div>
        <div class="char-name-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} .text=${config.name} scale="2"></bitmap-text>
        </div>
        <div class="char-unlock-container">
          ${this.isLocked
            ? html`
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Complete ${config.unlockRequirement} levels" scale="1.5" color="#ccc"></bitmap-text>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="to unlock" scale="1.5" color="#ccc"></bitmap-text>
              `
            : html`<bitmap-text .fontRenderer=${this.fontRenderer} text="Available" scale="1.5" color="#ccc"></bitmap-text>`
          }
        </div>
        <button class="select-button" @click=${this._handleSelect} ?disabled=${this.isLocked || this.isSelected}>
          <bitmap-text .fontRenderer=${this.fontRenderer} .text=${buttonText} scale="1.8"></bitmap-text>
        </button>
      </div>
    `;
  }
}

customElements.define('character-card', CharacterCard);