import { LitElement, html, css } from 'lit';
import { eventBus } from '../../utils/event-bus.js';
import { GameState } from '../../managers/GameState.js';
import './settings-modal.js';
import './pause-modal.js';
import './character-modal.js';
import './info-modal.js';
import './bitmap-text.js';

export class RgbangUI extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
    }
    .main-menu-overlay {
      position: absolute;
      inset: 0;
      background-image: url('images/ui/Main Background.png');
      background-size: cover; background-position: center; z-index: 500;
      display: flex; justify-content: center; align-items: center;
      flex-direction: column;
    }
    .main-menu-container { display: flex; flex-direction: column; align-items: center; gap: 40px; }

    .main-menu-buttons { display: flex; flex-direction: column; gap: 20px; width: 250px; }
    .main-menu-buttons button {
      background-color: #007bff; border: 3px solid #0056b3;
      padding: 15px 25px; border-radius: 12px; cursor: pointer;
      transition: all 0.2s ease-in-out;
      box-shadow: 0 6px #004a99;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .main-menu-buttons button:hover { background-color: #0056b3; transform: translateY(-2px); box-shadow: 0 8px #004a99; }
    .main-menu-buttons button:active { transform: translateY(2px); box-shadow: 0 2px #004a99; }

    .hud-buttons {
      position: absolute;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 100;
    }

    .main-menu-icon-buttons {
      display: flex;
      gap: 20px;
    }
    .icon-button {
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      width: 64px;
      height: 64px;
      transition: all 0.2s ease-in-out;
    }
    .icon-button:hover {
      transform: scale(1.1);
    }
    .icon-button img {
      width: 100%;
      height: 100%;
    }
  `;

  static properties = {
    activeModal: { type: String, state: true },
    gameHasStarted: { type: Boolean, state: true },
    keybinds: { type: Object, state: true },
    soundSettings: { type: Object, state: true },
    gameState: { type: Object, state: true },
    assets: { type: Object, state: true },
    fontRenderer: { type: Object },
  };

  constructor() {
    super();
    this.activeModal = 'main-menu';
    this.gameHasStarted = false;
    this.keybinds = { up: 'w', down: 's', left: 'a', right: 'd', roll: 'shift' };
    this.soundSettings = { soundEnabled: true, soundVolume: 0.5 };
    this.gameState = new GameState();
    this.assets = null;
    this.fontRenderer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    eventBus.subscribe('soundSettingsChanged', (settings) => this.soundSettings = { ...settings });
    eventBus.subscribe('keybindsUpdated', (keybinds) => this.keybinds = { ...keybinds });
    eventBus.subscribe('ui_button_clicked', ({ buttonId }) => this.activeModal = buttonId);
    eventBus.subscribe('action_escape_pressed', this._handleEscapePress);
    eventBus.subscribe('gameStarted', () => {
        this.gameHasStarted = true;
        this.activeModal = null;
    });
    eventBus.subscribe('assetsLoaded', (assets) => this.assets = assets);
  }

  _handleEscapePress = () => {
    if (this.activeModal) { this._closeModal(); }
    else if (this.gameHasStarted) { this.activeModal = 'pause'; eventBus.publish('menuOpened'); }
  };

  _closeModal = () => {
    const wasOpen = this.activeModal !== null;
    this.activeModal = (this.gameHasStarted) ? null : 'main-menu';
    if (wasOpen && this.gameHasStarted) {
        eventBus.publish('allMenusClosed');
    }
  }

  _openModalFromMenu(modalName) {
      eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
      this.activeModal = modalName;
  }

  _handlePauseClick() {
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    this.activeModal = 'pause';
    eventBus.publish('menuOpened');
  }

  _handleExitToMenu = () => {
    this.gameHasStarted = false;
    this.activeModal = 'main-menu';
    eventBus.publish('exitToMenu');
  };

  _handleCharacterSelected(e) {
    const { characterId } = e.detail;
    const newGameState = this.gameState.setSelectedCharacter(characterId);
    if (newGameState !== this.gameState) {
        this.gameState = newGameState;
        eventBus.publish('gameStateUpdated', this.gameState);
        this.requestUpdate('gameState');
    }
    eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' });
    eventBus.publish('characterUpdated', characterId);
  }

  render() {
    const isLoading = !this.assets || !this.fontRenderer;
    if (!this.gameHasStarted) {
      return html`
        <div class="main-menu-overlay">
          ${isLoading
            ? html`<div>Loading...</div>`
            : this.activeModal === 'main-menu'
            ? this.renderMainMenuContent()
            : this.renderActiveModal()}
        </div>
      `;
    }

    return html`
        ${this.gameHasStarted && !this.activeModal ? this.renderHUD() : ''}
        ${this.renderActiveModal()}
    `;
  }

  renderMainMenuContent() {
    const iconButtons = [
        { id: 'character', title: 'Character' },
        { id: 'settings', title: 'Settings' },
        { id: 'info', title: 'How to Play' },
    ];
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    return html`
      <div class="main-menu-container">
        <bitmap-text .fontRenderer=${this.fontRenderer} text="RGBang" scale="9" outlineColor="black" outlineWidth="2"></bitmap-text>
        <div class="main-menu-buttons">
          <button @click=${() => { eventBus.publish('playSound', { key: 'button_click', volume: 0.8, channel: 'UI' }); eventBus.publish('requestStartGame'); }}>
              <bitmap-text .fontRenderer=${this.fontRenderer} text="Start Game" scale="2.5" outlineColor="#004a99" outlineWidth="1"></bitmap-text>
          </button>
        </div>
        <div class="main-menu-icon-buttons">
            ${iconButtons.map(btn => html`
                <button class="icon-button" title=${btn.title} @click=${() => this._openModalFromMenu(btn.id)}>
                    <img src="images/ui/buttons/${capitalize(btn.id)}.png" alt=${btn.title}>
                </button>
            `)}
        </div>
      </div>
    `;
  }

  renderHUD() {
      const iconButtons = [
        { id: 'settings', title: 'Settings' },
        { id: 'character', title: 'Character' },
        { id: 'info', title: 'How to Play' }
      ];
      const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

      return html`
          <div class="hud-buttons">
              <button class="icon-button" title="Pause" @click=${this._handlePauseClick}>
                  <img src="images/ui/buttons/Pause.png" alt="Pause">
              </button>
              ${iconButtons.map(btn => html`
                  <button class="icon-button" title=${btn.title} @click=${() => this._openModalFromMenu(btn.id)}>
                      <img src="images/ui/buttons/${capitalize(btn.id)}.png" alt=${btn.title}>
                  </button>
              `)}
          </div>
      `;
  }

  renderActiveModal() {
    switch (this.activeModal) {
      case 'settings':
        return html`<settings-menu
                      .keybinds=${this.keybinds} .soundSettings=${this.soundSettings} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></settings-menu>`;
      case 'pause':
        return html`<pause-modal
                      .fontRenderer=${this.fontRenderer}
                      @resume-game=${this._closeModal}
                      @exit-to-menu=${this._handleExitToMenu}
                    ></pause-modal>`;
      case 'character':
        return html`<character-menu
                      .gameState=${this.gameState} .assets=${this.assets} .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal} @character-selected=${this._handleCharacterSelected}
                    ></character-menu>`;
      case 'info':
        return html`<info-modal
                      .keybinds=${this.keybinds}
                      .fontRenderer=${this.fontRenderer}
                      @close-modal=${this._closeModal}
                    ></info-modal>`;
      default:
        return html``;
    }
  }
}

customElements.define('rgbang-ui', RgbangUI);