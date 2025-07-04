// TODO : find a cleaner way to fix that error
// @ts-expect-error fastnoise-lite is not written in typescript
import FastNoiseLite from "fastnoise-lite";
import {
    Mesh,
    PhysicsAggregate,
    PhysicsShapeType,
    Vector3,
    type Scene,
} from "@babylonjs/core";
import { MarchingCubeGenerator } from "../../marching_cubes/MarchingCubeGenerator";
import type { Chunk } from "../Chunk";
import { Config } from "../../Config";

export class StandardMarchingCubesChunk implements Chunk {
    scene: Scene;
    coordinates: Vector3;
    mesh: Mesh | undefined;

    constructor(coordinates: Vector3, scene: Scene) {
        this.scene = scene;
        this.coordinates = coordinates;
    }

    render(): Mesh {
        const noise = new FastNoiseLite();
        noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2);
        const marchingCubeGenerator = new MarchingCubeGenerator(
            Config.chunkSize
        );
        const mesh = marchingCubeGenerator.marchingCubes3d(
            (x: number, y: number, z: number) => noise.GetNoise(x, z) * 10 - y,
            this.scene,
            this.coordinates
        );
        new PhysicsAggregate(mesh, PhysicsShapeType.MESH);
        this.mesh = mesh;
        return mesh;
    }

    remove(): void {
        this.mesh?.dispose();
    }
}
