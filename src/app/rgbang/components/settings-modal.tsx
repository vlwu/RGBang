"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Keybindings } from "../managers/input-handler";
import { soundManager, SoundType } from '../managers/sound-manager';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Volume2 } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    keybindings: Keybindings;
    onKeybindingsChange: (newKeybindings: Keybindings) => void;
    volume: number;
    isMuted: boolean;
    onVolumeChange: (volume: number) => void;
    onMuteChange: (isMuted: boolean) => void;
}

type KeybindingAction = keyof Keybindings;

export function SettingsModal({
    isOpen,
    onClose,
    keybindings,
    onKeybindingsChange,
    volume,
    isMuted,
    onVolumeChange,
    onMuteChange
}: SettingsModalProps) {
    const [localKeybindings, setLocalKeybindings] = useState(keybindings);
    const [editingKey, setEditingKey] = useState<KeybindingAction | null>(null);
    const [localVolume, setLocalVolume] = useState(volume);
    const [localIsMuted, setLocalIsMuted] = useState(isMuted);

    useEffect(() => {
        if (isOpen) {
            setLocalKeybindings(keybindings);
            setLocalVolume(volume);
            setLocalIsMuted(isMuted);
        }
    }, [isOpen, keybindings, volume, isMuted]);

    useEffect(() => {
        if (!isOpen) {
            setEditingKey(null);
        }
    }, [isOpen]);

    useEffect(() => {

        soundManager.setMasterVolume(localVolume);
        soundManager.setMuted(localIsMuted);
    }, [localVolume, localIsMuted]);

    const handleSetBinding = useCallback((newKey: string) => {
        if (editingKey) {
            soundManager.play(SoundType.ButtonClick);
            setLocalKeybindings(prev => ({
                ...prev,
                [editingKey]: newKey,
            }));
            setEditingKey(null);
        }
    }, [editingKey]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        e.preventDefault();
        handleSetBinding(e.key.toLowerCase());
    }, [handleSetBinding]);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        e.preventDefault();
        handleSetBinding(`mouse${e.button}`);
    }, [handleSetBinding]);

    useEffect(() => {
        if (editingKey) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('mousedown', handleMouseDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleMouseDown);
        }
    }, [editingKey, handleKeyDown, handleMouseDown]);

    const handleSave = () => {
        soundManager.play(SoundType.ButtonClick);
        onKeybindingsChange(localKeybindings);
        onVolumeChange(localVolume);
        onMuteChange(localIsMuted);
        onClose();
    };

    const handleTestSound = () => {
        soundManager.play(SoundType.EnemyHit);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {

            soundManager.setMasterVolume(volume);
            soundManager.setMuted(isMuted);
            onClose();
        }
    };

    const handleCancel = () => {
        soundManager.play(SoundType.ButtonClick);
        handleOpenChange(false);
    }

    const keybindDisplayMap: Record<KeybindingAction, string> = {
        up: "Move Up",
        down: "Move Down",
        left: "Move Left",
        right: "Move Right",
        shoot: "Shoot",
        primary1: "Select Red",
        primary2: "Select Yellow",
        primary3: "Select Blue",
        comboRadial: "Combo Wheel",
        dash: "Dash",
        viewUpgrades: "View Upgrades",
    };

    const getKeyDisplay = (key: string) => {
        if (!key) return '';
        if (key === ' ') return 'SPACE';
        if (key === 'tab') return 'TAB';
        if (key === 'mouse0') return 'LMB';
        if (key === 'mouse1') return 'MMB';
        if (key === 'mouse2') return 'RMB';

        if (key.startsWith('mouse')) return `MOUSE ${parseInt(key.slice(5)) + 1}`;
        return key.toUpperCase();
    }

    const playHoverSound = () => soundManager.play(SoundType.ButtonHover);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-background text-foreground flex flex-col max-h-[90vh] overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-primary">Settings</DialogTitle>
                    <DialogDescription>
                        Customize your controls and audio settings.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-6 py-4 pr-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-muted-foreground text-sm">Sound</h4>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Volume</Label>
                                <Slider
                                    value={[localVolume]}
                                    onValueChange={(value) => setLocalVolume(value[0])}
                                    max={1}
                                    step={0.05}
                                    className="col-span-3"
                                    disabled={localIsMuted}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="mute-checkbox" className="text-right">Mute</Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    <Checkbox
                                        id="mute-checkbox"
                                        checked={localIsMuted}
                                        onCheckedChange={(checked) => setLocalIsMuted(Boolean(checked))}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleTestSound}
                                        disabled={localIsMuted}
                                        onMouseEnter={playHoverSound}
                                        className="ml-auto"
                                    >
                                        <Volume2 className="mr-2 h-4 w-4" />
                                        Test
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-muted-foreground text-sm">Controls</h4>
                            {Object.entries(keybindDisplayMap).map(([action, label]) => (
                                <div key={action} className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={action} className="text-right">
                                        {label}
                                    </Label>
                                    <Button
                                        variant="outline"
                                        className="col-span-3"
                                        onClick={() => { soundManager.play(SoundType.ButtonClick); setEditingKey(action as KeybindingAction); }}
                                        onMouseEnter={playHoverSound}
                                    >
                                    {editingKey === action ? 'Press a key...' : getKeyDisplay(localKeybindings[action as KeybindingAction])}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex-shrink-0 pt-4 border-t border-border">
                    <Button onClick={handleCancel} onMouseEnter={playHoverSound} className="font-bold btn-liquid-glass btn-liquid-neutral">Cancel</Button>
                    <Button onClick={handleSave} onMouseEnter={playHoverSound} className="font-bold btn-liquid-glass btn-liquid-confirm">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}