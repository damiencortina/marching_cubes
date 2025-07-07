import { HemisphericLight, Vector3, type Scene } from "@babylonjs/core";
import type { Chunk } from "./Chunk";
import type { Observer } from "../Observer";
import { Utils } from "../Utils";
import { Config } from "../Config";
import { Character } from "../Character";

export abstract class WorldFactory implements Observer {
    scene: Scene;
    displayedChunks: Chunk[][] = [];
    currentCoordinates: Vector3;
    chunksToRender: Chunk[] = [];

    constructor(coordinates: Vector3, scene: Scene) {
        this.scene = scene;
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        const xRange = Utils.range(
            coordinates.x - Config.distanceView,
            coordinates.x + Config.distanceView
        );
        xRange.forEach((x) => {
            const chunkLine: Chunk[] = [];
            Utils.range(
                coordinates.z - Config.distanceView,
                coordinates.z + Config.distanceView
            ).forEach((z) => {
                const coordinates = new Vector3(x, 0, z);
                const chunk = this.createChunk(coordinates);
                chunk.render();
                chunkLine.push(chunk);
            });
            this.displayedChunks.push(chunkLine);
        });
        this.currentCoordinates = coordinates;
    }

    abstract createChunk(coordinates: Vector3): Chunk;

    #updateWorld(chunkCoordinates: Vector3) {
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

    update(character: Character): void {
        if (character instanceof Character) {
            console.log(
                "WorldBuilder has been notified by CharacterController."
            );
            this.#updateWorld(character.chunkCoordinates);
        }
    }
}
