import { LitElement, html, css } from 'lit';
import { formatTime } from '../../utils/ui-utils.js';
import './bitmap-text.js';

export class PauseModal extends LitElement {
  static styles = css`
    :host {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .modal-overlay {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 200;
    }
    .modal-content {
      background-color: #333; padding: 30px; border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5); color: #eee;
      text-align: center; position: relative; width: 90%;
      max-width: 500px;
    }
    .title-container {
      margin: 0 0 10px 0;
      display: flex;
      justify-content: center;
    }
    .subtitle-container {
      margin: 0 0 25px 0;
      display: flex;
      justify-content: center;
    }
    .stats-container {
        display: flex; flex-direction: column; align-items: center;
        gap: 12px; margin-bottom: 25px; padding: 15px;
        background-color: #444; border-radius: 8px;
    }

    .button-container { display: flex; justify-content: center; gap: 15px; }
    .modal-image-button {
        background: transparent; border: none; padding: 0;
        cursor: pointer; width: 48px; height: 48px;
        transition: transform 0.2s ease-in-out;
    }
    .modal-image-button:hover { transform: scale(1.1); }
    .modal-image-button img { width: 100%; height: 100%; }
    .exit-button-container {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #555;
    }
    .exit-button {
      background-color: #e74c3c;
      color: #fff;
      border: 2px solid #c0392b;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.2s ease-in-out;
      width: 100%;
      box-sizing: border-box;
    }
    .exit-button:hover {
      background-color: #c0392b;
    }
  `;

  static properties = {
    stats: { type: Object },
    fontRenderer: { type: Object },
  };

  constructor() {
    super();
    this.stats = { collectedFruits: 0, totalFruits: 0, deathCount: 0, levelTime: 0 };
  }

  _dispatch(eventName) {
    this.dispatchEvent(new CustomEvent(eventName, { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="title-container">
            <bitmap-text
              .fontRenderer=${this.fontRenderer}
              text="Game Paused"
              scale="3"
              outlineColor="black"
              outlineWidth="2"
            ></bitmap-text>
          </div>

          <div class="subtitle-container">
            <bitmap-text
                .fontRenderer=${this.fontRenderer}
                text="Press ESC to resume"
                scale="1.5"
                color="#ccc"
              ></bitmap-text>
          </div>

          <div class="button-container">
            <button class="modal-image-button" title="Resume" @click=${() => this._dispatch('resume-game')}>
              <img src="images/ui/buttons/Play.png" alt="Resume">
            </button>
            <button class="modal-image-button" title="Restart" @click=${() => this._dispatch('restart-level')}>
              <img src="images/ui/buttons/Restart.png" alt="Restart">
            </button>
            <button class="modal-image-button" title="Levels Menu" @click=${() => this._dispatch('open-levels-menu')}>
              <img src="images/ui/buttons/Levels.png" alt="Main Menu">
            </button>
          </div>
          <div class="exit-button-container">
            <button class="exit-button" @click=${() => this._dispatch('exit-to-menu')}>
              <bitmap-text .fontRenderer=${this.fontRenderer} text="Exit to Main Menu" scale="1.8"></bitmap-text>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('pause-modal', PauseModal);