import type { Scene, Vector3 } from "@babylonjs/core";
import type { Chunk } from "./Chunk";

export interface WorldFactory {
    chunkSize: number;
    scene: Scene;

    createChunk(coordinates: Vector3): Chunk;
}
