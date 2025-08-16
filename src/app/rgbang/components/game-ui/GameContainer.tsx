"use client";

import React, { useRef, useEffect, useCallback, useImperativeHandle } from 'react';
import { Game } from '../../core/game';
import InputHandler from '../../managers/input-handler';
import { gameEngine } from '../../core/engine';
import { soundManager } from '../../managers/sound-manager';
import { SavedGameState } from '../../core/save-state';
import { UpgradesOverviewModal } from '../upgrades-overview-modal';
import { PauseMenu } from './PauseMenu';
import { BetweenWavesUI } from './BetweenWavesUI';
import { GameCanvasHandle } from '../../hooks/useGameSession';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const GameCanvas = React.forwardRef<GameCanvasHandle, {
    width: number;
    height: number;
    initialGameState: SavedGameState,
    isGamePausedExternally: boolean;
    currentWaveCountdown: number;
    currentWaveToDisplay: number;
    isGameBetweenWaves: boolean;
}> (({ width, height, initialGameState, isGamePausedExternally, currentWaveCountdown, currentWaveToDisplay, isGameBetweenWaves }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const inputHandler = InputHandler.getInstance();

    const isGamePausedRef = useRef(isGamePausedExternally);
    const drawParamsRef = useRef({ currentWaveToDisplay, currentWaveCountdown, isGameBetweenWaves });

    useEffect(() => {
        isGamePausedRef.current = isGamePausedExternally;
    }, [isGamePausedExternally]);

    useEffect(() => {
        drawParamsRef.current = { currentWaveToDisplay, currentWaveCountdown, isGameBetweenWaves };
    });

    const gameLoop = useCallback(() => {
        if (!gameEngine.isRunning || !canvasRef.current) {
            animationFrameIdRef.current = null;
            return;
        }

        gameEngine.update(inputHandler, isGamePausedRef.current);
        const { currentWaveToDisplay, currentWaveCountdown, isGameBetweenWaves } = drawParamsRef.current;
        gameEngine.draw(currentWaveToDisplay, currentWaveCountdown, isGameBetweenWaves, inputHandler);
        inputHandler.resetEvents();
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    }, [inputHandler]);

    useImperativeHandle(ref, () => ({
        getGameInstance: () => gameEngine,
    }));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        inputHandler.setCanvas(canvas);

        gameEngine.initialize(canvas, initialGameState, soundManager);
        gameEngine.start();

        if (animationFrameIdRef.current === null) {
             animationFrameIdRef.current = requestAnimationFrame(gameLoop);
        }

        return () => {
            if (animationFrameIdRef.current !== null) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            if (gameEngine) gameEngine.stop();
            inputHandler.destroy();
        };
    }, [initialGameState, inputHandler, gameLoop]);

    return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} className="rounded-lg shadow-2xl shadow-black" />;
});
GameCanvas.displayName = 'GameCanvas';

type GameContainerProps = {
    uiState: 'playing' | 'paused' | 'upgrading' | 'betweenWaves';
    canvasSize: { width: number; height: number; };
    initialGameState: SavedGameState;
    gameStoreState: any;
    isUpgradeOverviewOpen: boolean;
    setIsUpgradeOverviewOpen: (isOpen: boolean) => void;
    isSandboxModalOpen: boolean;
    betweenWaveCountdown: number;
    nextWaveHint: string;
    upgradesRemainingToSelect: number;
    totalUpgradesToSelect: number;
    gameCanvasRef: React.RefObject<GameCanvasHandle>;
    onResume: () => void;
    onSettings: () => void;
    onQuit: () => void;
    onChooseUpgrades: () => void;
    onStartNextWave: () => void;
    playHoverSound: () => void;
}

export function GameContainer({
    uiState, canvasSize, initialGameState, gameStoreState,
    isUpgradeOverviewOpen, setIsUpgradeOverviewOpen, isSandboxModalOpen,
    betweenWaveCountdown, nextWaveHint, upgradesRemainingToSelect, totalUpgradesToSelect,
    gameCanvasRef, onResume, onSettings, onQuit, onChooseUpgrades, onStartNextWave, playHoverSound
}: GameContainerProps) {
    return (
        <div className="relative border-liquid-glass">
            <GameCanvas
                ref={gameCanvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                initialGameState={initialGameState}
                isGamePausedExternally={uiState === 'paused' || uiState === 'upgrading' || isUpgradeOverviewOpen || uiState === 'betweenWaves' || isSandboxModalOpen}
                currentWaveCountdown={betweenWaveCountdown}
                currentWaveToDisplay={gameStoreState.currentWave}
                isGameBetweenWaves={uiState === 'betweenWaves'}
            />
            {isUpgradeOverviewOpen && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in border-2 border-primary/20 p-8">
                    <UpgradesOverviewModal
                        isOpen={isUpgradeOverviewOpen}
                        upgradeManager={gameCanvasRef.current?.getGameInstance()?.player.upgradeManager}
                        onClose={() => setIsUpgradeOverviewOpen(false)}
                    />
                </div>
            )}
            {uiState === 'paused' && (
                <PauseMenu onResume={onResume} onSettings={onSettings} onQuit={onQuit} playHoverSound={playHoverSound} />
            )}
            {uiState === 'betweenWaves' && (
                <BetweenWavesUI
                    currentWave={gameStoreState.currentWave}
                    countdown={betweenWaveCountdown}
                    nextWaveHint={nextWaveHint}
                    upgradesRemainingToSelect={upgradesRemainingToSelect}
                    totalUpgradesToSelect={totalUpgradesToSelect}
                    onChooseUpgrades={onChooseUpgrades}
                    onStartNextWave={onStartNextWave}
                    playHoverSound={playHoverSound}
                />
            )}
        </div>
    );
}