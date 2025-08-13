export enum SoundType {
    PlayerShoot = 'playerShoot',
    PlayerDash = 'playerDash',
    PlayerDamage = 'playerDamage',
    EnemyHit = 'enemyHit',
    EnemyDestroy = 'enemyDestroy',
    EnemySplit = 'enemySplit',
    BossAttack = 'bossAttack',
    BossDamage = 'bossDamage',
    BossDestroy = 'bossDestroy',
    FragmentCollect = 'fragmentCollect',
    UpgradeSelect = 'upgradeSelect',
    UpgradeHover = 'upgradeHover',
    ButtonClick = 'buttonClick',
    ButtonHover = 'buttonHover',
    GamePause = 'gamePause',
    GameResume = 'gameResume',
}

const soundPaths: Record<SoundType, string> = {
    [SoundType.PlayerShoot]: '/sounds/player-shoot.mp3',
    [SoundType.PlayerDash]: '/sounds/player-dash.mp3',
    [SoundType.PlayerDamage]: '/sounds/player-damage.mp3',
    [SoundType.EnemyHit]: '/sounds/enemy-hit.mp3',
    [SoundType.EnemyDestroy]: '/sounds/enemy-destroy.mp3',
    [SoundType.EnemySplit]: '/sounds/enemy-split.mp3',
    [SoundType.BossAttack]: '/sounds/boss-attack.mp3',
    [SoundType.BossDamage]: '/sounds/boss-damage.mp3',
    [SoundType.BossDestroy]: '/sounds/boss-destroy.mp3',
    [SoundType.FragmentCollect]: '/sounds/fragment-collect.mp3',
    [SoundType.UpgradeSelect]: '/sounds/upgrade-select.mp3',
    [SoundType.UpgradeHover]: '/sounds/upgrade-hover.mp3',
    [SoundType.ButtonClick]: '/sounds/button-click.mp3',
    [SoundType.ButtonHover]: '/sounds/button-hover.mp3',
    [SoundType.GamePause]: '/sounds/game-pause.mp3',
    [SoundType.GameResume]: '/sounds/game-resume.mp3',
};

export class SoundManager {
    private audioContext: AudioContext | null = null;
    private audioBuffers: Map<SoundType, AudioBuffer> = new Map();
    private isMuted = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    async loadSounds() {
        if (!this.audioContext) return;

        const soundPromises = Object.entries(soundPaths).map(async ([key, path]) => {
            try {
                // In a real scenario, you would fetch and decode the audio data.
            } catch (error) {
                console.error(`Failed to load sound: ${key} from ${path}`, error);
            }
        });

        await Promise.all(soundPromises);
    }

    play(sound: SoundType, volume = 1.0) {
        if (this.isMuted || !this.audioContext) return;
        
        // This is a placeholder for actual sound playing.
        console.log(`Playing sound: ${sound} at volume ${volume}`);
    }

    setMuted(muted: boolean) {
        this.isMuted = muted;
    }
}

export const soundManager = new SoundManager();