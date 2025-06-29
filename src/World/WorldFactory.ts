import { HemisphericLight, Vector3, type Scene } from "@babylonjs/core";
import type { Chunk } from "./Chunk";
import type { Subject } from "../Subject";
import type { Observer } from "../Observer";
import { Utils } from "../Utils";
import { Config } from "../Config";
import { Character } from "../Character";

export abstract class WorldFactory implements Observer {
    scene: Scene;
    displayedChunks: Record<string, Chunk> = {};

    constructor(scene: Scene) {
        this.scene = scene;
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    }

    abstract createChunk(coordinates: Vector3): Chunk;

    generateworld(chunkCoordinates: Vector3) {
        //const neededChunks: Record<string, Chunk> = {};
        Utils.range(
            chunkCoordinates.x - Config.distanceView,
            chunkCoordinates.x + Config.distanceView
        ).forEach((x) => {
            Utils.range(
                chunkCoordinates.z - Config.distanceView,
                chunkCoordinates.z + Config.distanceView
            ).forEach((z) => {
                const coordinates = new Vector3(x, 0, z);
                const index = coordinates.toString();
                if (!this.displayedChunks[index]) {
                    const chunk = this.createChunk(coordinates);
                    this.displayedChunks[index] = chunk;
                    chunk.render();
                }
                //neededChunks[index] = this.displayedChunks[index];
            });
        });
        // const chunksToRemove = Object.values(this.displayedChunks).filter(
        //     (chunk: Chunk, index: number) => neededChunks[index] === undefined
        // );
        // chunksToRemove.forEach((chunk: Chunk) => chunk.remove());
        // this.displayedChunks = neededChunks;
    }

    update(subject: Subject): void {
        if (subject instanceof Character) {
            console.log(
                "WorldBuilder has been notified by CharacterController."
            );
            this.generateworld(subject.chunkCoordinates);
        }
    }
}
