import { characterConfig, levelSections } from '../entities/level-definitions.js';
import { eventBus } from '../utils/event-bus.js';
import { StorageManager } from './StorageManager.js';

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
      } else {
          this.showingLevelComplete = false;
          const savedState = StorageManager.loadProgress();
          this.levelProgress = savedState.levelProgress;
          this.selectedCharacter = savedState.selectedCharacter;
          this.levelStats = savedState.levelStats;
          this.tutorialShown = savedState.tutorialShown;
          this.currentSection = 0;
          this.currentLevelIndex = 0;
      }
  }

  _clone() {
      const clonedState = JSON.parse(JSON.stringify(this));
      return new GameState(clonedState);
  }

  setSelectedCharacter(characterId) {
    // Correctly extract the raceId (e.g., 'human') from the full characterId (e.g., 'm_human')
    const raceId = characterId.split('_')[1];
    
    // Use the extracted raceId to validate against characterConfig.
    if (characterConfig[raceId] && this.selectedCharacter !== characterId) {
      const newState = this._clone();
      newState.selectedCharacter = characterId;
      StorageManager.saveProgress({
        levelProgress: newState.levelProgress,
        selectedCharacter: newState.selectedCharacter,
        levelStats: newState.levelStats,
        tutorialShown: newState.tutorialShown
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
}