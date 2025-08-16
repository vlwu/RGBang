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
import { Volume2, X } from 'lucide-react';
import { getKeyDisplay } from '../common/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    keybindings: Keybindings;
    onKeybindingsChange: (newKeybindings: Keybindings) => void;
    volume: number;
    isMuted: boolean;
    areToastsEnabled: boolean;
    onVolumeChange: (volume: number) => void;
    onMuteChange: (isMuted: boolean) => void;
    onAreToastsEnabledChange: (enabled: boolean) => void;
}

type KeybindingAction = keyof Keybindings;

export function SettingsModal({
    isOpen,
    onClose,
    keybindings,
    onKeybindingsChange,
    volume,
    isMuted,
    areToastsEnabled,
    onVolumeChange,
    onMuteChange,
    onAreToastsEnabledChange
}: SettingsModalProps) {
    const [localKeybindings, setLocalKeybindings] = useState(keybindings);
    const [editingKey, setEditingKey] = useState<KeybindingAction | null>(null);
    const [localVolume, setLocalVolume] = useState(volume);
    const [localIsMuted, setLocalIsMuted] = useState(isMuted);
    const [localAreToastsEnabled, setLocalAreToastsEnabled] = useState(areToastsEnabled);

    useEffect(() => {
        if (isOpen) {
            setLocalKeybindings(keybindings);
            setLocalVolume(volume);
            setLocalIsMuted(isMuted);
            setLocalAreToastsEnabled(areToastsEnabled);
        }
    }, [isOpen, keybindings, volume, isMuted, areToastsEnabled]);

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
        onAreToastsEnabledChange(localAreToastsEnabled);
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

    const playHoverSound = () => soundManager.play(SoundType.ButtonHover);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md w-[90vw] bg-background text-foreground flex flex-col max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
                    <DialogTitle className="text-primary text-2xl font-headline">Settings</DialogTitle>
                    <DialogDescription>
                        Customize your controls and audio settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="space-y-8 px-6 py-4">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-muted-foreground text-sm tracking-wider">AUDIO</h4>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label className="text-right">Volume</Label>
                                <Slider
                                    value={[localVolume]}
                                    onValueChange={(value) => setLocalVolume(value[0])}
                                    max={1}
                                    step={0.05}
                                    className="col-span-2"
                                    disabled={localIsMuted}
                                />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="mute-checkbox" className="text-right">Mute</Label>
                                <div className="col-span-2 flex items-center justify-between">
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
                                    >
                                        <Volume2 className="mr-2 h-4 w-4" />
                                        Test
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="toasts-checkbox" className="text-right">Notifications</Label>
                                <div className="col-span-2 flex items-center">
                                     <Checkbox
                                        id="toasts-checkbox"
                                        checked={localAreToastsEnabled}
                                        onCheckedChange={(checked) => setLocalAreToastsEnabled(Boolean(checked))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-muted-foreground text-sm tracking-wider">CONTROLS</h4>
                            {Object.entries(keybindDisplayMap).map(([action, label]) => (
                                <div key={action} className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor={action} className="text-right">
                                        {label}
                                    </Label>
                                    <Button
                                        id={action}
                                        variant="outline"
                                        className="col-span-2 justify-center"
                                        onClick={() => { soundManager.play(SoundType.ButtonClick); setEditingKey(action as KeybindingAction); }}
                                        onMouseEnter={playHoverSound}
                                    >
                                    {editingKey === action ? 'Press a key...' : getKeyDisplay(localKeybindings[action as KeybindingAction])}
                                    </Button>
                                </div>
                            ))}
                        </div>
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-6 pt-4 border-t border-border shrink-0">
                    <Button onClick={handleCancel} onMouseEnter={playHoverSound} className="font-bold btn-liquid-glass btn-liquid-neutral">Cancel</Button>
                    <Button onClick={handleSave} onMouseEnter={playHoverSound} className="font-bold btn-liquid-glass btn-liquid-confirm">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}