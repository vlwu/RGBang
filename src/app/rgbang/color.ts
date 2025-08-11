export enum GameColor {
    RED = 'RED',
    YELLOW = 'YELLOW',
    BLUE = 'BLUE',
    ORANGE = 'ORANGE',
    PURPLE = 'PURPLE',
    GREEN = 'GREEN',
}

export const PRIMARY_COLORS = [GameColor.RED, GameColor.YELLOW, GameColor.BLUE];

export const COLOR_DETAILS: Record<GameColor, {
    name: string,
    hex: string,
    key: string,
    components?: [GameColor, GameColor]
}> = {
    [GameColor.RED]: { name: 'Red', hex: '#ff4d4d', key: '1' },
    [GameColor.YELLOW]: { name: 'Yellow', hex: '#ffff66', key: '2' },
    [GameColor.BLUE]: { name: 'Blue', hex: '#4d94ff', key: '3' },
    [GameColor.ORANGE]: { name: 'Orange', hex: '#ffc266', key: '1+2', components: [GameColor.RED, GameColor.YELLOW] },
    [GameColor.PURPLE]: { name: 'Purple', hex: '#d966ff', key: '1+3', components: [GameColor.RED, GameColor.BLUE] },
    [GameColor.GREEN]: { name: 'Green', hex: '#66ff8c', key: '2+3', components: [GameColor.YELLOW, GameColor.BLUE] },
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
