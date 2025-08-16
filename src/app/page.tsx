"use client";

import React from 'react';
import { SettingsModal } from './rgbang/components/settings-modal';
import { InfoModal } from './rgbang/components/info-modal';
import { UpgradeModal } from './rgbang/components/upgrade-modal';
import { SandboxModal } from './rgbang/components/sandbox-modal';

import { useGameManager } from './rgbang/hooks/useGameManager';
import { MainMenu } from './rgbang/components/game-ui/MainMenu';
import { ContinuePrompt } from './rgbang/components/game-ui/ContinuePrompt';
import { GameOverScreen } from './rgbang/components/game-ui/GameOverScreen';
import { GameContainer } from './rgbang/components/game-ui/GameContainer';
import { soundManager, SoundType } from './rgbang/managers/sound-manager';
import { gameStateStore } from './rgbang/core/gameStateStore';

export default function Home() {
    const {
        uiState, setUiState, highScore, savedGame, upgradeData, nextWaveHint, betweenWaveCountdown,
        upgradesRemainingToSelect, totalUpgradesToSelect, isSettingsOpen, setIsSettingsOpen,
        isInfoOpen, setIsInfoOpen, isUpgradeModalOpen, isUpgradeOverviewOpen, setIsUpgradeOverviewOpen,
        isSandboxModalOpen, setIsSandboxModalOpen, upgradeOptions, sandboxManager, keybindings,
        setKeybindings, gameCanvasRef, canvasSize, initialGameState, volume, isMuted, areToastsEnabled,
        gameStoreState, loadInitialData, handleUpgradeSelected, startNewRun, handlePlayClick, continueRun,
        quitToMenu, resumeGame, handleResetData, playHoverSound, handleVolumeChange, handleMuteChange,
        handleAreToastsEnabledChange, openUpgradeSelection
    } = useGameManager();

    const handleContextMenu = (e: React.MouseEvent) => {
        if (uiState !== 'menu' && uiState !== 'continuePrompt' && uiState !== 'gameOver') {
            e.preventDefault();
        }
    };

    const renderUIState = () => {
        switch (uiState) {
            case 'menu':
                return <MainMenu
                    highScore={highScore}
                    onPlay={handlePlayClick}
                    onSandbox={() => startNewRun('freeplay')}
                    onSettings={() => { soundManager.play(SoundType.ButtonClick); setIsSettingsOpen(true); }}
                    onInfo={() => { soundManager.play(SoundType.ButtonClick); setIsInfoOpen(true); }}
                    onReset={handleResetData}
                    playHoverSound={playHoverSound}
                />;
            case 'continuePrompt':
                return savedGame && <ContinuePrompt
                    savedGame={savedGame}
                    onContinue={continueRun}
                    onStartFresh={() => { soundManager.play(SoundType.ButtonClick); startNewRun('normal'); }}
                    onBackToMenu={() => { soundManager.play(SoundType.ButtonClick); setUiState('menu'); }}
                    playHoverSound={playHoverSound}
                />;
            case 'playing':
            case 'paused':
            case 'upgrading':
            case 'betweenWaves':
                return <GameContainer
                    uiState={uiState}
                    canvasSize={canvasSize}
                    initialGameState={initialGameState}
                    gameStoreState={gameStoreState}
                    isUpgradeOverviewOpen={isUpgradeOverviewOpen}
                    setIsUpgradeOverviewOpen={setIsUpgradeOverviewOpen}
                    isSandboxModalOpen={isSandboxModalOpen}
                    betweenWaveCountdown={betweenWaveCountdown}
                    nextWaveHint={nextWaveHint}
                    upgradesRemainingToSelect={upgradesRemainingToSelect}
                    totalUpgradesToSelect={totalUpgradesToSelect}
                    gameCanvasRef={gameCanvasRef}
                    onResume={resumeGame}
                    onSettings={() => { soundManager.play(SoundType.ButtonClick); setIsSettingsOpen(true); }}
                    onQuit={quitToMenu}
                    onChooseUpgrades={() => openUpgradeSelection(gameStoreState.isBossWave)}
                    onStartNextWave={handlePlayClick}
                    playHoverSound={playHoverSound}
                />;
            case 'gameOver':
                return <GameOverScreen
                    finalScore={gameStoreState.score}
                    highScore={highScore}
                    onBackToMenu={() => { soundManager.play(SoundType.ButtonClick); gameStateStore.resetState(); loadInitialData(); }}
                    playHoverSound={playHoverSound}
                />;
            default:
                return null;
        }
    };

    return (
        <main
            className="flex flex-col items-center justify-center min-h-screen text-foreground p-4 relative bg-soft-gradient bg-200% animate-background-pan"
            onContextMenu={handleContextMenu}
        >
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                keybindings={keybindings}
                onKeybindingsChange={setKeybindings}
                volume={volume}
                isMuted={isMuted}
                areToastsEnabled={areToastsEnabled}
                onVolumeChange={handleVolumeChange}
                onMuteChange={handleMuteChange}
                onAreToastsEnabledChange={handleAreToastsEnabledChange}
            />
            <InfoModal
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                keybindings={keybindings}
            />
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                options={upgradeOptions}
                onSelect={handleUpgradeSelected}
                upgradeData={upgradeData}
                runUpgrades={gameStoreState.runUpgrades}
                upgradesRemainingToSelect={upgradesRemainingToSelect}
                totalUpgradesToSelect={totalUpgradesToSelect}
            />
            {sandboxManager && (
                <SandboxModal
                    isOpen={isSandboxModalOpen}
                    onClose={() => setIsSandboxModalOpen(false)}
                    gameManager={sandboxManager}
                    runUpgrades={gameStoreState.runUpgrades}
                />
            )}

            {renderUIState()}
        </main>
    );
}