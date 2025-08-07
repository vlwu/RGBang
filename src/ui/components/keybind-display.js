import { LitElement, html, css } from 'lit';
import { formatKeyForDisplay } from '../../utils/ui-utils.js';
import { eventBus } from '../../utils/event-bus.js';
import './bitmap-text.js';

export class KeybindDisplay extends LitElement {
  static styles = css`
    .keybind-display {
      background-color: #666;
      border: 1px solid #777;
      padding: 10px 15px;
      border-radius: 6px;
      width: 120px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s ease;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 20px;
      box-sizing: border-box;
    }
    .keybind-display:hover {
      background-color: #777;
    }
    .keybind-display.active-rebind {
      border-color: #ff9800;
      background-color: #444;
      box-shadow: 0 0 5px rgba(255, 152, 0, 0.5);
    }
  `;

  static properties = {
    action: { type: String },
    currentKey: { type: String },
    isRemapping: { type: Boolean, state: true },
    fontRenderer: { type: Object },
  };

  constructor() {
    super();
    this.isRemapping = false;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this._handleGlobalKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._handleGlobalKeydown);
  }

  _handleGlobalKeydown = (e) => {
    if (!this.isRemapping) return;
    e.preventDefault();
    e.stopPropagation();

    const newKey = e.key.toLowerCase();
    this.dispatchEvent(new CustomEvent('keybind-changed', {
      detail: { action: this.action, newKey: newKey },
      bubbles: true,
      composed: true
    }));

    this.isRemapping = false;
  };

  _startRemap(e) {
    e.stopPropagation();
    this.isRemapping = true;
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
  }

  render() {
    const displayText = this.isRemapping
      ? 'Press key...'
      : formatKeyForDisplay(this.currentKey);

    return html`
      <div
        class="keybind-display ${this.isRemapping ? 'active-rebind' : ''}"
        @click=${this._startRemap}
      >
        <bitmap-text
          .fontRenderer=${this.fontRenderer}
          .text=${displayText}
          scale="1.8"
        ></bitmap-text>
      </div>
    `;
  }
}

customElements.define('keybind-display', KeybindDisplay);