import { LitElement, html, css } from 'lit';
import { characterConfig } from '../../entities/level-definitions.js';
import { eventBus } from '../../utils/event-bus.js';
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
      min-height: 50px;
    }
    .gender-select-container {
      display: flex;
      gap: 10px;
      margin: 10px 0;
      flex-grow: 1;
      align-items: center;
      justify-content: center;
    }
    .gender-button {
      background-color: #666;
      border: 2px solid #888;
      color: white;
      padding: 5px 15px;
      border-radius: 5px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 50px;
      height: 40px;
      box-sizing: border-box;
      transition: all 0.2s ease-in-out;
    }
    .gender-button:hover {
      border-color: #aaa;
    }
    .gender-button.selected {
      background-color: #007bff;
      border-color: #0056b3;
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
    raceId: { type: String },
    mSpritesheet: { type: Object },
    fSpritesheet: { type: Object },
    isLocked: { type: Boolean },
    isSelected: { type: Boolean },
    selectedGender: { type: String },
    fontRenderer: { type: Object },
  };

  constructor() {
    super();
    this.animationFrameId = null;
    this.animState = { frame: 0, timer: 0, lastTime: 0 };
  }

  connectedCallback() {
    super.connectedCallback();
    this.animationFrameId = requestAnimationFrame(this._animatePreview);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  _animatePreview = (timestamp) => {
    const canvas = this.shadowRoot.querySelector('.char-canvas');
    const currentSpritesheet = this.selectedGender === 'm' ? this.mSpritesheet : this.fSpritesheet;
    if (!canvas || !currentSpritesheet) {
      this.animationFrameId = requestAnimationFrame(this._animatePreview);
      return;
    }

    const idleAnim = currentSpritesheet.animations.idle;
    if (!idleAnim) {
        this.animationFrameId = requestAnimationFrame(this._animatePreview);
        return;
    }

    if (this.animState.lastTime === 0) this.animState.lastTime = timestamp;

    const deltaTime = (timestamp - this.animState.lastTime) / 1000;
    this.animState.lastTime = timestamp;
    this.animState.timer += deltaTime;

    const animationSpeed = 0.15;
    const frameCount = idleAnim.length;

    if (this.animState.timer >= animationSpeed) {
      this.animState.timer = 0;
      this.animState.frame = (this.animState.frame + 1) % frameCount;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const texture = idleAnim[this.animState.frame];
      if (texture && texture.source) {
          ctx.drawImage(texture.source.resource, texture.frame.x, texture.frame.y, texture.frame.w, texture.frame.h, 0, 0, canvas.width, canvas.height);
      }
    }
    this.animationFrameId = requestAnimationFrame(this._animatePreview);
  }

  _setGender(gender) {
      if(this.selectedGender !== gender) {
        eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
        this.dispatchEvent(new CustomEvent('character-selected', {
            detail: { characterId: `${gender}_${this.raceId}` },
            bubbles: true,
            composed: true
        }));
      }
  }

  _handleSelect() {
      if (this.isLocked || this.isSelected) return;
      this.dispatchEvent(new CustomEvent('character-selected', {
          detail: { characterId: `${this.selectedGender}_${this.raceId}` },
          bubbles: true,
          composed: true
      }));
  }

  render() {
    const config = characterConfig[this.raceId];
    const classes = `character-card ${this.isLocked ? 'locked' : ''} ${this.isSelected ? 'selected' : ''}`;
    const buttonText = this.isLocked ? 'Locked' : (this.isSelected ? 'Selected' : 'Select');

    return html`
      <div class=${classes}>
        <canvas class="char-canvas" width="64" height="64"></canvas>
        <div class="char-name-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} .text=${config.name} scale="2"></bitmap-text>
        </div>
        <div class="char-unlock-container">
          ${this.isLocked
            ? html`
                <bitmap-text .fontRenderer=${this.fontRenderer} text="Complete ${config.unlockRequirement} levels" scale="1.5" color="#ccc"></bitmap-text>
                <bitmap-text .fontRenderer=${this.fontRenderer} text="to unlock" scale="1.5" color="#ccc"></bitmap-text>
              `
            : html`
                <div class="gender-select-container">
                  <button class="gender-button ${this.selectedGender === 'm' ? 'selected' : ''}" @click=${() => this._setGender('m')}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="M" scale="1.8"></bitmap-text>
                  </button>
                  <button class="gender-button ${this.selectedGender === 'f' ? 'selected' : ''}" @click=${() => this._setGender('f')}>
                    <bitmap-text .fontRenderer=${this.fontRenderer} text="F" scale="1.8"></bitmap-text>
                  </button>
                </div>
              `
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