import { LitElement, html, css } from 'lit';
import { formatKeyForDisplay } from '../../utils/ui-utils.js';
import { eventBus } from '../../utils/event-bus.js';
import './bitmap-text.js';

export class InfoModal extends LitElement {
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
      max-width: 600px; max-height: 80vh;
      display: flex;
      flex-direction: column;
    }
    .scrollable-content {
        flex-grow: 1;
        overflow-y: auto;
        padding-right: 15px;
        margin-right: -15px;
    }
    .close-button {
      position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
      background-image: url('images/ui/buttons/Close.png');
      background-size: cover; background-color: transparent;
      border: none; cursor: pointer; border-radius: 50%;
      transition: transform 0.2s ease-in-out;
    }
    .close-button:hover { transform: scale(1.1); }
    .title-container, .subtitle-container {
        display: flex;
        justify-content: center;
        margin-bottom: 10px;
    }
    .subtitle-container {
        border-bottom: 2px solid #666;
        padding-bottom: 10px;
        margin-bottom: 20px;
    }
    .settings-section { padding: 20px; background-color: #444; border-radius: 8px; border: 1px solid #555; margin-bottom: 20px; }
    .how-to-play p { line-height: 1.6; margin-bottom: 20px; text-align: left; }
    .keybind-list { display: flex; flex-direction: column; gap: 15px; }
    .keybind-item {
        display: flex; justify-content: space-between; align-items: center;
        background-color: #555; padding: 12px 15px; border-radius: 8px;
    }
    .keybind-item label { text-align: left; flex-grow: 1; }
    .key-display-container { display: flex; gap: 5px; align-items: center; }
    .key-display {
      background-color: #666; color: #fff; border: 1px solid #777;
      border-radius: 6px; text-align: center;
      min-width: 20px;

      display: flex;
      justify-content: center;
      align-items: center;
      padding: 5px 8px;
    }
  `;

  static properties = {
    keybinds: { type: Object },
    fontRenderer: { type: Object },
  };

  _dispatchClose() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    this.dispatchEvent(new CustomEvent('close-modal', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.keybinds) return html``;

    return html`
      <div class="modal-overlay" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <button class="close-button" @click=${this._dispatchClose}></button>

          <div class="title-container">
            <bitmap-text .fontRenderer=${this.fontRenderer} text="Info Section" scale="3" outlineColor="black" outlineWidth="2"></bitmap-text>
          </div>

          <div class="scrollable-content">
            <div class="settings-section">
              <div class="subtitle-container">
                  <bitmap-text .fontRenderer=${this.fontRenderer} text="How to Play" scale="2"></bitmap-text>
              </div>

              <div class="how-to-play">
                <p>This is a placeholder for game instructions.</p>
                <div class="keybind-list">

                  <div class="keybind-item">
                    <label>Move:</label>
                    <div class="key-display-container">
                      <div class="key-display">
                          <bitmap-text .fontRenderer=${this.fontRenderer} text=${formatKeyForDisplay(this.keybinds.left)} scale="1.5"></bitmap-text>
                      </div>
                      <div class="key-display">
                          <bitmap-text .fontRenderer=${this.fontRenderer} text=${formatKeyForDisplay(this.keybinds.right)} scale="1.5"></bitmap-text>
                      </div>
                       <div class="key-display">
                          <bitmap-text .fontRenderer=${this.fontRenderer} text=${formatKeyForDisplay(this.keybinds.up)} scale="1.5"></bitmap-text>
                      </div>
                       <div class="key-display">
                          <bitmap-text .fontRenderer=${this.fontRenderer} text=${formatKeyForDisplay(this.keybinds.down)} scale="1.5"></bitmap-text>
                      </div>
                    </div>
                  </div>

                  <div class="keybind-item">
                    <label>Pause Game:</label>
                    <div class="key-display">
                      <bitmap-text .fontRenderer=${this.fontRenderer} text="ESC" scale="1.5"></bitmap-text>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('info-modal', InfoModal);