"use client";

import { useState } from 'react';
import { soundManager, SoundType } from '../managers/sound-manager';

export const useModalManager = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isUpgradeOverviewOpen, setIsUpgradeOverviewOpen] = useState(false);
    const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);

    const openSettingsModal = () => {
        soundManager.play(SoundType.ButtonClick);
        setIsSettingsOpen(true);
    };

    const openInfoModal = () => {
        soundManager.play(SoundType.ButtonClick);
        setIsInfoOpen(true);
    };

    return {
        isSettingsOpen,
        setIsSettingsOpen,
        isInfoOpen,
        setIsInfoOpen,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isUpgradeOverviewOpen,
        setIsUpgradeOverviewOpen,
        isSandboxModalOpen,
        setIsSandboxModalOpen,
        openSettingsModal,
        openInfoModal,
    };
};