export interface Objective {
    name: string;
    isPublic: boolean;
    points: number;
    type: string;
    description: string;
    multiplier?: string;
    complete?: boolean;
    user?: string;
}
