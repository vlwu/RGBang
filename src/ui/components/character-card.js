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
    .gender-select-container {
      display: flex;
      gap: 10px;
      margin: 10px 0;
      flex-grow: 1;
      align-items: center;
    }
    .gender-button {
      background-color: #666;
      border: 2px solid #888;
      color: white;
      padding: 5px 15px;
      border-radius: 5px;
      cursor: pointer;
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
    selectedGenderInState: { type: String },
    fontRenderer: { type: Object },
  };

  constructor() {
    super();
    this.selectedGender = 'm';
    this.animationFrameId = null;
    this.animState = { frame: 0, timer: 0, lastTime: 0 };
  }
  
  firstUpdated() {
    this.selectedGender = this.isSelected ? (this.selectedGenderInState || 'm') : 'm';
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
      this.selectedGender = gender;
      this.animState.frame = 0;
      this.requestUpdate();
  }

  _handleSelect() {
      if (this.isLocked || (this.isSelected && this.selectedGender === this.selectedGenderInState)) return;
      this.dispatchEvent(new CustomEvent('character-selected', {
          detail: { characterId: `${this.selectedGender}_${this.raceId}` },
          bubbles: true,
          composed: true
      }));
  }

  render() {
    const config = characterConfig[this.raceId];
    const classes = `character-card ${this.isLocked ? 'locked' : ''} ${this.isSelected ? 'selected' : ''}`;
    const buttonText = this.isLocked ? 'Locked' : ((this.isSelected && this.selectedGender === this.selectedGenderInState) ? 'Selected' : 'Select');

    return html`
      <div class=${classes}>
        <canvas class="char-canvas" width="64" height="64"></canvas>
        <div class="char-name-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} .text=${config.name} scale="2"></bitmap-text>
        </div>
        <div class="gender-select-container">
          <button class="gender-button ${this.selectedGender === 'm' ? 'selected' : ''}" @click=${() => this._setGender('m')}>Male</button>
          <button class="gender-button ${this.selectedGender === 'f' ? 'selected' : ''}" @click=${() => this._setGender('f')}>Female</button>
        </div>
        <button class="select-button" @click=${this._handleSelect} ?disabled=${this.isLocked || (this.isSelected && this.selectedGender === this.selectedGenderInState)}>
          <bitmap-text .fontRenderer=${this.fontRenderer} .text=${buttonText} scale="1.8"></bitmap-text>
        </button>
      </div>
    `;
  }
}

customElements.define('character-card', CharacterCard);