export type CleanerFn = (value: string) => any;

export const daysToSeconds: CleanerFn = (value: string) => Number(value) * 24 * 60 * 60;
