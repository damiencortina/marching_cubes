import { HemisphericLight, Vector3, type Scene } from "@babylonjs/core";
import type { Chunk } from "./Chunk";
import type { Subject } from "../Subject";
import type { Observer } from "../Observer";
import { Utils } from "../Utils";
import { Config } from "../Config";
import { Character } from "../Character";

type ChunkDictionnary = Record<string, Chunk>;
export abstract class WorldFactory implements Observer {
    scene: Scene;
    displayedChunks: ChunkDictionnary = {};

    constructor(scene: Scene) {
        this.scene = scene;
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    }

    abstract createChunk(coordinates: Vector3): Chunk;

    generateworld(chunkCoordinates: Vector3) {
        const newChunks: ChunkDictionnary = {};
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
                    chunk.render();
                    newChunks[index] = chunk;
                } else {
                    newChunks[index] = this.displayedChunks[index];
                }
            });
        });
        Object.values(this.displayedChunks).forEach((chunk: Chunk) => {
            if (!newChunks[chunk.coordinates.toString()]) {
                chunk.remove();
            }
        });

        this.displayedChunks = newChunks;
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
