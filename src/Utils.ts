export type ChunkCoordinates = {
    x: number;
    y: number;
    z: number;
};

export type ChunkData = {
    coordinates: ChunkCoordinates;
    vertices: number[];
};

export type AxisRange = {
    min: number;
    max: number;
};

export type DisplayRange = {
    x: AxisRange;
    y: AxisRange;
    z: AxisRange;
};

export abstract class Utils {
    static range(from: number, to: number) {
        return Array.from(
            { length: to - from + 1 },
            (_, index) => from + index
        );
    }
}
