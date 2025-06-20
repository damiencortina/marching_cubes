import { HemisphericLight, Vector3, type Scene } from "@babylonjs/core";
import type { Chunk } from "./Chunk";
import type { Subject } from "../Subject";
import { CharacterController } from "../CharacterController";
import type { Observer } from "../Observer";

export abstract class WorldFactory implements Observer {
    chunkSize: number;
    scene: Scene;

    constructor(chunkSize: number, scene: Scene) {
        this.chunkSize = chunkSize;
        this.scene = scene;
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    }

    abstract createChunk(coordinates: Vector3): Chunk;

    generateworld() {
        const chunk = this.createChunk(new Vector3(0, 0, 0));
        chunk.render();
    }

    update(subject: Subject): void {
        if (subject instanceof CharacterController) {
            console.log(
                "WorldBuilder has been notified by CharacterController."
            );
        }
    }
}
