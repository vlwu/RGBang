
export enum GameColor {
    RED = 'RED',
    YELLOW = 'YELLOW',
    BLUE = 'BLUE',
    ORANGE = 'ORANGE',
    PURPLE = 'PURPLE',
    GREEN = 'GREEN',
}

export type Shape = 'circle' | 'triangle' | 'square' | 'mixed';

export const PRIMARY_COLORS = [GameColor.RED, GameColor.YELLOW, GameColor.BLUE];
export const SECONDARY_COLORS = [GameColor.ORANGE, GameColor.GREEN, GameColor.PURPLE];
export const ALL_COLORS = [...PRIMARY_COLORS, ...SECONDARY_COLORS];

export const COLOR_DETAILS: Record<GameColor, {
    name: string,
    hex: string,
    key: string,
    shape: Shape,
    components?: [GameColor, GameColor]
}> = {
    [GameColor.RED]: { name: 'Red', hex: '#ff4d4d', key: '1', shape: 'circle' },
    [GameColor.YELLOW]: { name: 'Yellow', hex: '#ffff66', key: '2', shape: 'triangle' },
    [GameColor.BLUE]: { name: 'Blue', hex: '#4d94ff', key: '3', shape: 'square' },
    [GameColor.ORANGE]: { name: 'Orange', hex: '#ffc266', key: 'Q', shape: 'mixed', components: [GameColor.RED, GameColor.YELLOW] },
    [GameColor.PURPLE]: { name: 'Purple', hex: '#d966ff', key: 'Q', shape: 'mixed', components: [GameColor.RED, GameColor.BLUE] },
    [GameColor.GREEN]: { name: 'Green', hex: '#66ff8c', key: 'Q', shape: 'mixed', components: [GameColor.YELLOW, GameColor.BLUE] },
};

export function mixColors(color1: GameColor, color2: GameColor): GameColor | null {
    const components = [color1, color2].sort();
    if (components[0] === GameColor.RED && components[1] === GameColor.YELLOW) return GameColor.ORANGE;
    if (components[0] === GameColor.RED && components[1] === GameColor.BLUE) return GameColor.PURPLE;
    if (components[0] === GameColor.BLUE && components[1] === GameColor.YELLOW) return GameColor.GREEN;
    return null;
}

export function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function isSecondaryColor(color: GameColor): boolean {
    return SECONDARY_COLORS.includes(color);
}
