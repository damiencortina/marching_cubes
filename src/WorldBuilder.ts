// TODO : find a cleaner way to fix that error
// @ts-expect-error fastnoise-lite is not written in typescript
import FastNoiseLite from "fastnoise-lite";
import { MarchingCubeGenerator } from "./marching_cubes/MarchingCubeGenerator";
import {
    HemisphericLight,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    Vector3,
} from "@babylonjs/core";
import type { Observer } from "./Observer";
import type { Subject } from "./Subject";
import { CharacterController } from "./CharacterController";

export class WorldBuilder implements Observer {
    chunkSize = 80;

    constructor(scene: Scene) {
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        const noise = new FastNoiseLite();
        noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2);
        function noiseLevel(x: number, y: number, z: number): number {
            return noise.GetNoise(x, z) * 10 - y;
        }
        const marchingCubeGenerator = new MarchingCubeGenerator(this.chunkSize);
        const mesh = marchingCubeGenerator.marchingCubes3d(
            noiseLevel,
            scene,
            new Vector3()
        );
        new PhysicsAggregate(mesh, PhysicsShapeType.MESH);
    }

    public update(subject: Subject): void {
        if (subject instanceof CharacterController) {
            console.log(
                "WorldBuilder has been notified by CharacterController."
            );
        }
    }
}
