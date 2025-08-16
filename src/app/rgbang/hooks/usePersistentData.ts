"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Keybindings, defaultKeybindings } from '../managers/input-handler';
import { PlayerUpgradeData, getPlayerUpgradeData, resetAllUpgradeData, savePlayerUpgradeData, levelUpUpgrade, unlockUpgrade } from '../data/upgrade-data';
import { SavedGameState, loadGameState, clearGameState, saveGameState } from '../core/save-state';
import { soundManager, SoundType } from '../managers/sound-manager';
import InputHandler from '../managers/input-handler';
import { useToast } from '@/hooks/use-toast';

export const usePersistentData = () => {
    const [highScore, setHighScore] = useState(0);
    const [savedGame, setSavedGame] = useState<SavedGameState | null>(null);
    const [upgradeData, setUpgradeData] = useState<PlayerUpgradeData>({ unlockedUpgradeIds: new Set(), upgradeProgress: new Map() });
    const [keybindings, setKeybindings] = useState<Keybindings>(defaultKeybindings);
    const [volume, setVolume] = useState(1.0);
    const [isMuted, setIsMuted] = useState(false);
    const [areToastsEnabled, setAreToastsEnabled] = useState(true);
    const { toast } = useToast();

    const upgradeDataRef = useRef(upgradeData);
    useEffect(() => {
        upgradeDataRef.current = upgradeData;
    }, [upgradeData]);

    const loadInitialData = useCallback(async () => {
        soundManager.loadSounds();
        setHighScore(parseInt(localStorage.getItem('rgBangHighScore') || '0'));

        const savedVolume = localStorage.getItem('rgBangVolume');
        const savedMute = localStorage.getItem('rgBangMuted');
        const savedToastsEnabled = localStorage.getItem('rgBangToastsEnabled');
        const currentVolume = savedVolume ? parseFloat(savedVolume) : 1.0;
        const currentMute = JSON.parse(savedMute || 'false');
        const currentToastsEnabled = savedToastsEnabled ? JSON.parse(savedToastsEnabled) : true;

        setVolume(currentVolume);
        setIsMuted(currentMute);
        setAreToastsEnabled(currentToastsEnabled);
        soundManager.setMasterVolume(currentVolume);
        soundManager.setMuted(currentMute);

        const savedRun = await loadGameState();
        setSavedGame(savedRun && savedRun.score > 0 ? savedRun : null);

        const data = await getPlayerUpgradeData();
        setUpgradeData(data);
        upgradeDataRef.current = data;

        const savedKeybindings = localStorage.getItem('rgBangKeybindings');
        const loadedBindings = savedKeybindings ? JSON.parse(savedKeybindings) : {};
        const currentKeybindings = { ...defaultKeybindings, ...loadedBindings };
        setKeybindings(currentKeybindings);
        InputHandler.getInstance().setKeybindings(currentKeybindings);
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleKeybindingsChange = (newKeybindings: Keybindings) => {
        setKeybindings(newKeybindings);
        InputHandler.getInstance().setKeybindings(newKeybindings);
        localStorage.setItem('rgBangKeybindings', JSON.stringify(newKeybindings));
    };

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        soundManager.setMasterVolume(newVolume);
        localStorage.setItem('rgBangVolume', newVolume.toString());
    };

    const handleMuteChange = (newMute: boolean) => {
        setIsMuted(newMute);
        soundManager.setMuted(newMute);
        localStorage.setItem('rgBangMuted', JSON.stringify(newMute));
    };
    
    const handleAreToastsEnabledChange = (enabled: boolean) => {
        setAreToastsEnabled(enabled);
        localStorage.setItem('rgBangToastsEnabled', JSON.stringify(enabled));
    };

    const handleResetData = async () => {
        soundManager.play(SoundType.ButtonClick);
        await resetAllUpgradeData();
        await clearGameState();
        localStorage.removeItem('rgBangHighScore');
        localStorage.removeItem('rgBangLastColor');
        setHighScore(0);
        setUpgradeData({ unlockedUpgradeIds: new Set(), upgradeProgress: new Map() });
        setSavedGame(null);
        toast({
            title: "Progress Reset",
            description: "Your high score and all upgrade progress have been cleared.",
        });
    };

    const updateUpgradeData = async (upgradeId: string) => {
        await unlockUpgrade(upgradeId);
        const finalData = await levelUpUpgrade(upgradeId);
        setUpgradeData(finalData);
        upgradeDataRef.current = finalData;
    };
    
    const updateMaxedUpgradeData = async (upgradeId: string, maxLevel: number) => {
        const data = await getPlayerUpgradeData();
        data.unlockedUpgradeIds.add(upgradeId);
        data.upgradeProgress.set(upgradeId, { level: maxLevel });
        await savePlayerUpgradeData(data);
        setUpgradeData(data);
        upgradeDataRef.current = data;
    }

    return {
        highScore,
        setHighScore,
        savedGame,
        setSavedGame,
        upgradeData,
        upgradeDataRef,
        keybindings,
        volume,
        isMuted,
        areToastsEnabled,
        loadInitialData,
        handleKeybindingsChange,
        handleVolumeChange,
        handleMuteChange,
        handleAreToastsEnabledChange,
        handleResetData,
        updateUpgradeData,
        updateMaxedUpgradeData,
    };
};