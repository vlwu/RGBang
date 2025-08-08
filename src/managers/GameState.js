import { characterConfig } from '../entities/level-definitions.js';
import { eventBus } from '../utils/event-bus.js';
import { StorageManager } from './StorageManager.js';
import { WEAPON_CONFIG } from '../entities/weapon-definitions.js';

export class GameState {
  constructor(initialState = null) {
      if (initialState) {
          this.currentSection = initialState.currentSection;
          this.currentLevelIndex = initialState.currentLevelIndex;
          this.showingLevelComplete = initialState.showingLevelComplete;
          this.levelProgress = initialState.levelProgress;
          this.selectedCharacter = initialState.selectedCharacter;
          this.levelStats = initialState.levelStats;
          this.tutorialShown = initialState.tutorialShown;
          this.upgrades = initialState.upgrades;
      } else {
          this.showingLevelComplete = false;
          const savedState = StorageManager.loadProgress();
          this.levelProgress = savedState.levelProgress;
          this.selectedCharacter = savedState.selectedCharacter;
          this.levelStats = savedState.levelStats;
          this.tutorialShown = savedState.tutorialShown;
          this.upgrades = savedState.upgrades;
          this.currentSection = 0;
          this.currentLevelIndex = 0;
      }
  }

  _clone() {
      const clonedState = JSON.parse(JSON.stringify(this));
      return new GameState(clonedState);
  }

  setSelectedCharacter(characterId) {

    const raceId = characterId.split('_')[1];


    if (characterConfig[raceId] && this.selectedCharacter !== characterId) {
      const newState = this._clone();
      newState.selectedCharacter = characterId;
      StorageManager.saveProgress({
        levelProgress: newState.levelProgress,
        selectedCharacter: newState.selectedCharacter,
        levelStats: newState.levelStats,
        tutorialShown: newState.tutorialShown,
        upgrades: newState.upgrades,
      });
      return newState;
    }
    return this;
  }

  isCharacterUnlocked(characterId) {
    const config = characterConfig[characterId];
    if (!config) return false;

    return true;
  }

  unlockWeapon(weaponId) {
    if (WEAPON_CONFIG[weaponId] && !this.upgrades.unlocked_weapons.includes(weaponId)) {
        const newState = this._clone();
        newState.upgrades.unlocked_weapons.push(weaponId);
        newState.upgrades.weapon_levels[weaponId] = 1;

        StorageManager.saveProgress({
            levelProgress: newState.levelProgress,
            selectedCharacter: newState.selectedCharacter,
            levelStats: newState.levelStats,
            tutorialShown: newState.tutorialShown,
            upgrades: newState.upgrades,
        });
        return newState;
    }
    return this;
  }

  canForgeWeapon(weaponId) {
      const recipe = WEAPON_CONFIG[weaponId]?.combination;
      if (!recipe) return false;
      return recipe.every(ingredient => this.upgrades.unlocked_weapons.includes(ingredient));
  }
}