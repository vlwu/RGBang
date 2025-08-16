"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { SettingsModal } from './rgbang/components/settings-modal';
import { InfoModal } from './rgbang/components/info-modal';
import { UpgradeModal } from './rgbang/components/upgrade-modal';
import { SandboxModal } from './rgbang/components/sandbox-modal';

import { useModalManager } from './rgbang/hooks/useModalManager';
import { usePersistentData } from './rgbang/hooks/usePersistentData';
import { useGameSession } from './rgbang/hooks/useGameSession';
import { useGameEvents } from './rgbang/hooks/useGameEvents';

import { MainMenu } from './rgbang/components/game-ui/MainMenu';
import { ContinuePrompt } from './rgbang/components/game-ui/ContinuePrompt';
import { GameOverScreen } from './rgbang/components/game-ui/GameOverScreen';
import { GameContainer } from './rgbang/components/game-ui/GameContainer';
import { soundManager, SoundType } from './rgbang/managers/sound-manager';
import { gameStateStore } from './rgbang/core/gameStateStore';
import { ALL_UPGRADES, Upgrade } from './rgbang/data/upgrades';
import { GameColor, PRIMARY_COLORS, getRandomElement } from './rgbang/data/color';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export default function Home() {
    const [canvasSize, setCanvasSize] = useState({ width: GAME_WIDTH, height: GAME_HEIGHT });
    const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);

    const {
        isSettingsOpen, setIsSettingsOpen, isInfoOpen, setIsInfoOpen, isUpgradeModalOpen,
        setIsUpgradeModalOpen, isUpgradeOverviewOpen, setIsUpgradeOverviewOpen,
        isSandboxModalOpen, setIsSandboxModalOpen, openSettingsModal, openInfoModal
    } = useModalManager();

    const {
        highScore, setHighScore, savedGame, upgradeData, upgradeDataRef, keybindings, volume,
        isMuted, areToastsEnabled, loadInitialData, handleKeybindingsChange,
        handleVolumeChange, handleMuteChange, handleAreToastsEnabledChange, handleResetData,
        updateUpgradeData, updateMaxedUpgradeData
    } = usePersistentData();

    const {
        uiState, setUiState, initialGameState, sandboxManager, gameCanvasRef,
        startNewRun, continueRun, handlePlayClick, quitToMenu, resumeGame,
    } = useGameSession({ savedGame, highScore, setHighScore, loadInitialData, upgradesRemainingToSelect: 0 });

    const {
        gameStoreState, nextWaveHint, betweenWaveCountdown, setBetweenWaveCountdown,
        upgradesRemainingToSelect, setUpgradesRemainingToSelect, totalUpgradesToSelect,
        openUpgradeSelection, handleNextWaveStart
    } = useGameEvents({ uiState, setUiState, gameCanvasRef, setHighScore, highScore, setIsUpgradeModalOpen, setUpgradeOptions, upgradeDataRef });

    const applySingleUpgrade = useCallback(async (upgrade: Upgrade) => {
        soundManager.play(SoundType.UpgradeSelect);
        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (!gameInstance) return;

        if (upgrade.id.startsWith('max-out-')) {
            const originalId = upgrade.id.replace('max-out-', '');
            const originalUpgrade = ALL_UPGRADES.find(u => u.id === originalId);
            if (originalUpgrade) {
                gameInstance.player.upgradeManager.applyMax(originalUpgrade);
                await updateMaxedUpgradeData(originalId, originalUpgrade.getMaxLevel());
            }
        } else if (upgrade.id.startsWith('fallback-')) {
            upgrade.apply(gameInstance.player, 1, gameInstance.addScore.bind(gameInstance));
        } else {
            gameInstance.player.applyUpgrade(upgrade);
            await updateUpgradeData(upgrade.id);
        }
    }, [gameCanvasRef, updateMaxedUpgradeData, updateUpgradeData]);

    const handleUpgradeSelected = useCallback(async (upgrade: Upgrade) => {
        await applySingleUpgrade(upgrade);

        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (gameInstance?.gameMode === 'freeplay') {
            setIsUpgradeModalOpen(false);
            setUiState('playing');
            setUpgradesRemainingToSelect(0);
            return;
        }

        setUpgradesRemainingToSelect(prev => {
            const newCount = prev - 1;
            if (newCount <= 0) {
                setIsUpgradeModalOpen(false);
                setBetweenWaveCountdown(15);
                setUiState('betweenWaves');
            } else {
                const isBossWaveRecentlyCompleted = (gameStoreState.currentWave % 5 === 0);
                openUpgradeSelection(isBossWaveRecentlyCompleted, newCount);
            }
            return newCount;
        });
    }, [applySingleUpgrade, gameCanvasRef, setIsUpgradeModalOpen, setUiState, setUpgradesRemainingToSelect, setBetweenWaveCountdown, gameStoreState.currentWave, openUpgradeSelection]);

    const handleChooseOneRandomly = useCallback(() => {
        if (upgradeOptions.length > 0) {
            soundManager.play(SoundType.ButtonClick);
            const randomUpgrade = upgradeOptions[Math.floor(Math.random() * upgradeOptions.length)];
            handleUpgradeSelected(randomUpgrade);
        }
    }, [upgradeOptions, handleUpgradeSelected]);

    const handleChooseAllRandomly = useCallback(async () => {
        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (!gameInstance) return;

        soundManager.play(SoundType.ButtonClick);
        setIsUpgradeModalOpen(false);

        let remaining = upgradesRemainingToSelect;
        let isFirstChoice = true;
        let isBossWaveForSelection = gameStoreState.isBossWave;

        while (remaining > 0) {
            let currentOptions;
            if (isFirstChoice) {
                currentOptions = upgradeOptions;
                isFirstChoice = false;
            } else {
                currentOptions = gameInstance.player.upgradeManager.getUpgradeOptions(
                    isBossWaveForSelection ? null : getRandomElement(PRIMARY_COLORS),
                    upgradeDataRef.current,
                    gameInstance.addScore
                );
                isBossWaveForSelection = false;
            }
            const randomUpgrade = currentOptions[Math.floor(Math.random() * currentOptions.length)];
            await applySingleUpgrade(randomUpgrade);
            remaining--;
        }

        setUpgradesRemainingToSelect(0);
        setBetweenWaveCountdown(15);
        setUiState('betweenWaves');
    }, [upgradesRemainingToSelect, upgradeOptions, gameStoreState.isBossWave, gameCanvasRef, applySingleUpgrade, setIsUpgradeModalOpen, setBetweenWaveCountdown, setUiState, setUpgradesRemainingToSelect, upgradeDataRef]);

    const handleContextMenu = (e: React.MouseEvent) => {
        if (uiState !== 'menu' && uiState !== 'continuePrompt' && uiState !== 'gameOver') {
            e.preventDefault();
        }
    };

    const updateCanvasSize = useCallback(() => {
        const windowWidth = window.innerWidth * 0.9;
        const windowHeight = window.innerHeight * 0.9;
        const aspectRatio = GAME_WIDTH / GAME_HEIGHT;

        let newWidth = windowWidth;
        let newHeight = newWidth / aspectRatio;

        if (newHeight > windowHeight) {
            newHeight = windowHeight;
            newWidth = newHeight * aspectRatio;
        }

        setCanvasSize({ width: newWidth, height: newHeight });
    }, []);

    useEffect(() => {
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [updateCanvasSize]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isSandboxModalOpen) setIsSandboxModalOpen(false);
                else if (isSettingsOpen) setIsSettingsOpen(false);
                else if (isInfoOpen) setIsInfoOpen(false);
                else if (isUpgradeModalOpen) {
                    setIsUpgradeModalOpen(false);
                    setBetweenWaveCountdown(15);
                    setUiState('betweenWaves');
                    soundManager.play(SoundType.GamePause);
                }
                else if (uiState === 'playing') setUiState('paused');
                else if (uiState === 'paused') resumeGame();
                else if (uiState === 'betweenWaves') handleNextWaveStart();
            }
            if (e.key.toLowerCase() === keybindings.viewUpgrades.toLowerCase()) {
                if (e.repeat) return;
                if (uiState === 'playing' || uiState === 'paused') {
                    setIsUpgradeOverviewOpen(prev => !prev);
                }
            }
            if (e.key === 'Tab') {
                const gameInstance = gameCanvasRef.current?.getGameInstance();
                if (gameInstance?.gameMode === 'freeplay' && (uiState === 'playing' || isSandboxModalOpen)) {
                    e.preventDefault();
                    setIsSandboxModalOpen(prev => !prev);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [uiState, isSettingsOpen, isInfoOpen, isUpgradeModalOpen, isSandboxModalOpen, handleNextWaveStart, keybindings.viewUpgrades, resumeGame, setIsSettingsOpen, setIsInfoOpen, setIsUpgradeModalOpen, setIsSandboxModalOpen, setBetweenWaveCountdown, setUiState, setIsUpgradeOverviewOpen]);

    const playHoverSound = () => soundManager.play(SoundType.ButtonHover);

    const renderUIState = () => {
        switch (uiState) {
            case 'menu':
                return <MainMenu
                    highScore={highScore}
                    onPlay={handlePlayClick}
                    onSandbox={() => startNewRun('freeplay')}
                    onSettings={openSettingsModal}
                    onInfo={openInfoModal}
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
                    onSettings={openSettingsModal}
                    onQuit={quitToMenu}
                    onChooseUpgrades={() => openUpgradeSelection(gameStoreState.isBossWave)}
                    onStartNextWave={handleNextWaveStart}
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
                onKeybindingsChange={handleKeybindingsChange}
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
                onChooseOneRandomly={handleChooseOneRandomly}
                onChooseAllRandomly={handleChooseAllRandomly}
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