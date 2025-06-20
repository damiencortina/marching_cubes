import type { Mesh, Scene, Vector3 } from "@babylonjs/core";

export interface Chunk {
    scene: Scene;
    coordinates: Vector3;

    render(): Mesh;
}
