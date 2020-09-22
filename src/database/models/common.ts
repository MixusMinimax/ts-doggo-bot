export function validateArrayLength<T>(min: number, max: number): (a: T[]) => boolean {
    return (a: T[]) => a.length >= min && a.length <= max
}