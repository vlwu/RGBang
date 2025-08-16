"use client";

import { useState, useEffect, useCallback, useSyncExternalStore, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { soundManager, SoundType } from '../managers/sound-manager';
import { WAVE_CONFIGS, FALLBACK_WAVE_CONFIG } from '../data/wave-data';
import { gameStateStore } from '../core/gameStateStore';
import { Game } from '../core/game';
import { Upgrade } from '../data/upgrades';
import { PlayerUpgradeData } from '../data/upgrade-data';
import { GameColor, PRIMARY_COLORS, getRandomElement, COLOR_DETAILS } from '../data/color';
import { clearGameState, saveGameState } from '../core/save-state';

const BETWEEN_WAVES_DURATION = 15;

interface UseGameEventsProps {
    uiState: string;
    setUiState: (state: 'menu' | 'playing' | 'paused' | 'gameOver' | 'upgrading' | 'betweenWaves' | 'continuePrompt') => void;
    gameCanvasRef: React.RefObject<{ getGameInstance: () => Game | null }>;
    setHighScore: (score: number) => void;
    highScore: number;
    setIsUpgradeModalOpen: (isOpen: boolean) => void;
    setUpgradeOptions: (options: Upgrade[]) => void;
    upgradeDataRef: React.RefObject<PlayerUpgradeData>;
}

export const useGameEvents = ({
    uiState,
    setUiState,
    gameCanvasRef,
    setHighScore,
    highScore,
    setIsUpgradeModalOpen,
    setUpgradeOptions,
    upgradeDataRef
}: UseGameEventsProps) => {
    const gameStoreState = useSyncExternalStore(gameStateStore.subscribe, gameStateStore.getSnapshot, gameStateStore.getServerSnapshot);
    const { toast } = useToast();
    const [nextWaveHint, setNextWaveHint] = useState("");
    const [betweenWaveCountdown, setBetweenWaveCountdown] = useState(0);
    const [upgradesRemainingToSelect, setUpgradesRemainingToSelect] = useState(0);
    const [totalUpgradesToSelect, setTotalUpgradesToSelect] = useState(0);

    const openUpgradeSelection = useCallback((isBossWave: boolean, upgradesCount?: number) => {
        const count = upgradesCount ?? upgradesRemainingToSelect;
        const gameInstance = gameCanvasRef.current?.getGameInstance();
    
        if (count > 0 && gameInstance && upgradeDataRef.current) {
            const nextFragmentColorForOptions = isBossWave ? null : getRandomElement(PRIMARY_COLORS);
    
            const options = gameInstance.player.upgradeManager.getUpgradeOptions(
                nextFragmentColorForOptions,
                upgradeDataRef.current,
                gameInstance.addScore
            );
            setUpgradeOptions(options);
            setIsUpgradeModalOpen(true);
        } else {
            toast({
                title: "No Upgrades Available",
                description: "You have no fragments to convert into upgrades at this time. Proceeding to next wave.",
            });
            setIsUpgradeModalOpen(false);
            setBetweenWaveCountdown(BETWEEN_WAVES_DURATION);
            setUiState('betweenWaves');
            soundManager.play(SoundType.GameResume);
        }
    }, [upgradesRemainingToSelect, gameCanvasRef, upgradeDataRef, setUpgradeOptions, setIsUpgradeModalOpen, toast, setUiState]);
    
    const handleNextWaveStart = useCallback(() => {
        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (gameInstance) {
            if (upgradesRemainingToSelect > 0) {
                gameInstance.addBankedUpgrades(upgradesRemainingToSelect);
                toast({
                    title: "Upgrades Banked",
                    description: `You've saved ${upgradesRemainingToSelect} upgrade choice${upgradesRemainingToSelect > 1 ? 's' : ''} for later.`,
                    duration: 3000,
                });
                setUpgradesRemainingToSelect(0);
            }
    
            const nextWaveNum = gameStoreState.currentWave + 1;
            gameInstance.startWave(nextWaveNum);
            setUiState('playing');
            soundManager.play(SoundType.GameResume);
        }
    }, [upgradesRemainingToSelect, toast, gameStoreState.currentWave, gameCanvasRef, setUiState]);

    useEffect(() => {
        let countdownInterval: NodeJS.Timeout | null = null;
        if (uiState === 'betweenWaves' && betweenWaveCountdown > 0) {
            countdownInterval = setInterval(() => {
                setBetweenWaveCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval!);
                        countdownInterval = null;
                        handleNextWaveStart();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    
        return () => {
            if (countdownInterval) clearInterval(countdownInterval);
        };
    }, [uiState, betweenWaveCountdown, handleNextWaveStart]);

    useEffect(() => {
        if (gameStoreState.isGameOver) {
            const finalScore = gameStoreState.score;
            setUiState('gameOver');
            if (finalScore > highScore) {
                localStorage.setItem('rgBangHighScore', finalScore.toString());
                setHighScore(finalScore);
            }
            clearGameState();
        } else if (gameStoreState.isBetweenWaves && uiState !== 'betweenWaves' && uiState !== 'upgrading') {
            const { waveCompletedFragments, isBossWave } = gameStoreState;
            const gameInstance = gameCanvasRef.current?.getGameInstance();
            if (!gameInstance) return;

            const waveConfigForNextHint = WAVE_CONFIGS.find(w => w.waveNumber === gameStoreState.currentWave + 1) || FALLBACK_WAVE_CONFIG;
            setNextWaveHint(waveConfigForNextHint.nextWaveHint);

            const totalUpgradesToOffer = waveCompletedFragments + gameStoreState.bankedUpgrades;
            gameInstance.setBankedUpgrades(0);

            if (totalUpgradesToOffer > 0) {
                setUpgradesRemainingToSelect(totalUpgradesToOffer);
                setTotalUpgradesToSelect(totalUpgradesToOffer);
                setUiState('upgrading');
                soundManager.play(SoundType.GamePause);

                toast({
                    title: "Wave Cleared!",
                    description: `You've earned ${totalUpgradesToOffer} upgrade choice${totalUpgradesToOffer > 1 ? 's' : ''}! Choose wisely.`,
                    duration: 3000,
                });

                setTimeout(() => openUpgradeSelection(isBossWave, totalUpgradesToOffer), 100);
            } else {
                setUpgradesRemainingToSelect(0);
                setTotalUpgradesToSelect(0);
                setBetweenWaveCountdown(BETWEEN_WAVES_DURATION);
                setUiState('betweenWaves');
                soundManager.play(SoundType.GamePause);
            }
        }
    }, [gameStoreState.isGameOver, gameStoreState.isBetweenWaves, gameStoreState.bankedUpgrades, openUpgradeSelection, toast, uiState, gameStoreState.currentWave, setUiState, highScore, setHighScore, gameCanvasRef]);

    useEffect(() => {
        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (uiState === 'betweenWaves' && gameInstance) {
            if (gameInstance.gameMode === 'normal') {
                const stateToSave = gameInstance.getCurrentState();
                if (stateToSave.score > 0) {
                    saveGameState(stateToSave);
                }
            }
        }
    }, [uiState, gameCanvasRef]);
    
    const lastFragmentCount = useRef(0);
    useEffect(() => {
        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (gameStoreState.fragmentCollectCount > lastFragmentCount.current && gameInstance?.gameMode === 'normal') {
            const color = gameStoreState.lastFragmentCollected;
            const colorHex = color === 'special'
                ? '#FFFFFF'
                : color
                ? COLOR_DETAILS[color].hex
                : '#A9A9A9';

            toast({
                title: "Fragment Collected!",
                description: `You picked up a ${color === 'special' ? 'special' : (color ? COLOR_DETAILS[color].name : '')} fragment.`,
                duration: 1500,
                className: "toast-glow",
                style: { '--toast-glow-color': colorHex } as React.CSSProperties,
                stackId: 'fragment-collected',
            });
            lastFragmentCount.current = gameStoreState.fragmentCollectCount;
        }
    }, [gameStoreState.fragmentCollectCount, gameStoreState.lastFragmentCollected, toast, gameCanvasRef]);

    return {
        gameStoreState,
        nextWaveHint,
        betweenWaveCountdown,
        setBetweenWaveCountdown,
        upgradesRemainingToSelect,
        setUpgradesRemainingToSelect,
        totalUpgradesToSelect,
        openUpgradeSelection,
        handleNextWaveStart,
    };
};