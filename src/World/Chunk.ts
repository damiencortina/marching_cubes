import type { Mesh, Vector3 } from "@babylonjs/core";

export interface Chunk {
    coordinates: Vector3;
    mesh: Mesh | undefined;

    remove(): void;
}
