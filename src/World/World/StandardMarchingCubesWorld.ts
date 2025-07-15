import { Vector3 } from "@babylonjs/core";
import { StandardMarchingCubesChunk } from "../Chunk/StandardMarchingCubesChunk";
import { WorldFactory } from "../WorldFactory";

export class StandardMarchingCubesWorld extends WorldFactory {
    createChunk(coordinates: Vector3, positions: number[]) {
        return new StandardMarchingCubesChunk(
            coordinates,
            positions,
            this.scene
        );
    }
}
