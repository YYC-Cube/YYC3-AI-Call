type Direction = 'up' | 'down' | 'left' | 'right' | 'none';
interface FadeInStyleOptions {
    delay?: number;
    direction?: Direction;
    duration?: number;
    distance?: number;
}
declare function getFadeInStyle(visible: boolean, options?: FadeInStyleOptions): Record<string, string | number>;

export { type Direction as D, type FadeInStyleOptions as F, getFadeInStyle as g };
