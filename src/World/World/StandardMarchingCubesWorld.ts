import { HemisphericLight, Scene, Vector3 } from "@babylonjs/core";
import type { Observer } from "../../Observer";
import type { Subject } from "../../Subject";
import { CharacterController } from "../../CharacterController";
import { StandardMarchingCubesChunk } from "../Chunk/StandardMarchingCubesChunk";
import type { WorldFactory } from "../WorldFactory";

export class StandardMarchingCubesWorld implements Observer, WorldFactory {
    chunkSize = 80;
    scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    }

    public createChunk(coordinates: Vector3) {
        return new StandardMarchingCubesChunk(
            this.chunkSize,
            coordinates,
            this.scene
        );
    }

    public update(subject: Subject): void {
        if (subject instanceof CharacterController) {
            console.log(
                "WorldBuilder has been notified by CharacterController."
            );
        }
    }
}
