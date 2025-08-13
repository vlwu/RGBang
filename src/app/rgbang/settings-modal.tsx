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
import { Keybindings } from "./input-handler";
import { soundManager, SoundType } from './sound-manager';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    keybindings: Keybindings;
    onKeybindingsChange: (newKeybindings: Keybindings) => void;
}

type KeybindingAction = keyof Keybindings;

export function SettingsModal({ isOpen, onClose, keybindings, onKeybindingsChange }: SettingsModalProps) {
    const [localKeybindings, setLocalKeybindings] = useState(keybindings);
    const [editingKey, setEditingKey] = useState<KeybindingAction | null>(null);

    useEffect(() => {
        setLocalKeybindings(keybindings);
    }, [keybindings]);

    useEffect(() => {
        if (!isOpen) {
            setEditingKey(null);
        }
    }, [isOpen]);

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
        onClose();
    };

    const handleCancel = () => {
        soundManager.play(SoundType.ButtonClick);
        setLocalKeybindings(keybindings);
        onClose();
    };

    const keybindDisplayMap: Record<KeybindingAction, string> = {
        up: "Move Up",
        down: "Move Down",
        left: "Move Left",
        right: "Move Right",
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-background text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-primary">Settings</DialogTitle>
                    <DialogDescription>
                        Customize your controls. Click a button and press any key or mouse button to rebind.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                <DialogFooter>
                    <Button variant="secondary" onClick={handleCancel} onMouseEnter={playHoverSound}>Cancel</Button>
                    <Button onClick={handleSave} onMouseEnter={playHoverSound}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}