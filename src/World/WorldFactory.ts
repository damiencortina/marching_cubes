import { HemisphericLight, Vector3, type Scene } from "@babylonjs/core";
import type { Chunk } from "./Chunk";
import type { Subject } from "../Subject";
import type { Observer } from "../Observer";
import { Utils } from "../Utils";
import { Config } from "../Config";
import { Character } from "../Character";

export abstract class WorldFactory implements Observer {
    scene: Scene;
    displayedChunks: Chunk[][] = [];
    currentCoordinates: Vector3 | undefined;
    chunksToRender: Chunk[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        //this.displayedChunks = Array(Config.distanceView * 2 + 1);
    }

    abstract createChunk(coordinates: Vector3): Chunk;

    generateworld(chunkCoordinates: Vector3) {
        if (!this.currentCoordinates) {
            const xRange = Utils.range(
                chunkCoordinates.x - Config.distanceView,
                chunkCoordinates.x + Config.distanceView
            );
            //const worldSize = xRange.length;
            xRange.forEach((x) => {
                // const chunkLine: Chunk[] = Array(worldSize);
                const chunkLine: Chunk[] = [];
                Utils.range(
                    chunkCoordinates.z - Config.distanceView,
                    chunkCoordinates.z + Config.distanceView
                ).forEach((z) => {
                    const coordinates = new Vector3(x, 0, z);
                    const chunk = this.createChunk(coordinates);
                    chunk.render();
                    chunkLine.push(chunk);
                });
                this.displayedChunks.push(chunkLine);
            });
            this.currentCoordinates = chunkCoordinates;
            return;
        }
        const movementVector = chunkCoordinates.subtract(
            this.currentCoordinates
        );
        if (movementVector.x) {
            const chunkLine: Chunk[] = [];
            Utils.range(
                chunkCoordinates.z - Config.distanceView,
                chunkCoordinates.z + Config.distanceView
            ).forEach((zCoordinate) => {
                const chunk = this.createChunk(
                    new Vector3(
                        chunkCoordinates.x +
                            movementVector.x * Config.distanceView,
                        0,
                        zCoordinate
                    )
                );
                this.chunksToRender.push(chunk);
                chunkLine.push(chunk);
            });
            this.displayedChunks
                .splice((movementVector.x - 1) / 2, 1)[0]
                .map((chunk: Chunk) => chunk.remove());
            this.displayedChunks.splice(
                ((-movementVector.x - 1) / -2) * (Config.distanceView * 2 + 1),
                0,
                chunkLine
            );
        }

        if (movementVector.z) {
            this.displayedChunks = this.displayedChunks.map((chunkLine) => {
                const chunk = this.createChunk(
                    new Vector3(
                        chunkLine[0].coordinates.x,
                        0,
                        chunkCoordinates.z +
                            movementVector.z * Config.distanceView
                    )
                );
                this.chunksToRender.push(chunk);
                const newChunkLine = chunkLine;
                newChunkLine
                    .splice((movementVector.z - 1) / 2, 1)
                    .map((chunk: Chunk) => chunk.remove());
                newChunkLine.splice(
                    ((-movementVector.z - 1) / -2) *
                        (Config.distanceView * 2 + 1),
                    0,
                    chunk
                );
                return newChunkLine;
            });
        }
        this.currentCoordinates = chunkCoordinates;
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
