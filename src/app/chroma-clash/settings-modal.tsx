"use client"

import { useState, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Keybindings } from "./input-handler";

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

    const handleKeyDown = (e: KeyboardEvent) => {
        if (editingKey) {
            e.preventDefault();
            let newKey = e.key.toLowerCase();
            if (newKey === ' ') newKey = 'space'; // Handle spacebar display

            setLocalKeybindings(prev => ({
                ...prev,
                [editingKey]: newKey,
            }));
            setEditingKey(null);
        }
    };
    
    useEffect(() => {
        if (editingKey) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [editingKey]);

    const handleSave = () => {
        onKeybindingsChange(localKeybindings);
        onClose();
    };

    const handleCancel = () => {
        setLocalKeybindings(keybindings); // Revert changes
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
        combine: "Combine Colors"
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-background text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-primary">Settings</DialogTitle>
                    <DialogDescription>
                        Customize your controls. Click on a button and press any key to rebind.
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
                                onClick={() => setEditingKey(action as KeybindingAction)}
                            >
                               {editingKey === action ? 'Press a key...' : localKeybindings[action as KeybindingAction].toUpperCase()}
                            </Button>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
