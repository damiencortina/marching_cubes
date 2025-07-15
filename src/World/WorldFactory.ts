import {
    HemisphericLight,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsShapeType,
    Vector3,
    type Scene,
} from "@babylonjs/core";
import type { Chunk } from "./Chunk";
import type { Observer } from "../Observer";
import { Utils, type AxisRange, type ChunkData } from "../Utils";
import { Config } from "../Config";
import { Character } from "../Character";

export abstract class WorldFactory implements Observer {
    scene: Scene;
    displayedChunks: Chunk[] = [];
    currentCoordinates: Vector3;
    chunksToRender: Chunk[] = [];
    chunkWorker: Worker;

    constructor(coordinates: Vector3, scene: Scene) {
        this.scene = scene;
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        // create a worker (for chunks compuations)
        const chunkWorker = new Worker(
            new URL("../worker.ts", import.meta.url),
            {
                type: "module",
            }
        );
        chunkWorker.onmessage = (event: MessageEvent<ChunkData>) => {
            const chunk = this.createChunk(
                new Vector3(...Object.values(event.data.coordinates)),
                event.data.vertices
            );
            this.displayedChunks.push(chunk);
        };
        this.chunkWorker = chunkWorker;

        // load firsts chunks
        const xRange = Utils.range(
            coordinates.x - Config.distanceView,
            coordinates.x + Config.distanceView
        );
        const zRange = Utils.range(
            coordinates.z - Config.distanceView,
            coordinates.z + Config.distanceView
        );
        xRange.forEach((x) => {
            zRange.forEach((z) => {
                chunkWorker.postMessage({ x, y: 0, z });
            });
        });

        // TODO : install a platorm for the player to start on
        const box = MeshBuilder.CreateBox(
            "box",
            { height: 40, width: 5, depth: 5 },
            scene
        );
        new PhysicsAggregate(box, PhysicsShapeType.MESH);

        this.currentCoordinates = coordinates;
    }

    abstract createChunk(coordinates: Vector3, positions: number[]): Chunk;

    #updateWorld(chunkCoordinates: Vector3) {
        // Chunk removal
        const displayRange = {
            x: {
                min: chunkCoordinates.x - Config.distanceView,
                max: chunkCoordinates.x + Config.distanceView,
            },
            y: {
                min: chunkCoordinates.y - Config.distanceView,
                max: chunkCoordinates.y + Config.distanceView,
            },
            z: {
                min: chunkCoordinates.z - Config.distanceView,
                max: chunkCoordinates.z + Config.distanceView,
            },
        };
        this.displayedChunks = this.displayedChunks.filter((chunk: Chunk) => {
            for (const [axis, range] of Object.entries(displayRange) as [
                "x" | "y" | "z",
                AxisRange
            ][]) {
                if (
                    chunk.coordinates[axis] < range.min ||
                    chunk.coordinates[axis] > range.max
                ) {
                    chunk.remove();
                    return false;
                }
            }
            return true;
        });

        // New chunk detection
        const movementVector = chunkCoordinates.subtract(
            this.currentCoordinates
        );
        const toto = new Vector3(1, 1, 1).subtract(movementVector);
        Utils.range(-Config.distanceView, Config.distanceView).forEach(
            (chunkIndex) => {
                this.chunkWorker.postMessage({
                    x:
                        chunkCoordinates.x +
                        movementVector.x *
                            Config.distanceView *
                            movementVector.x +
                        toto.x * chunkIndex,
                    y: 0,
                    z:
                        chunkCoordinates.z +
                        movementVector.z *
                            Config.distanceView *
                            movementVector.z +
                        toto.z * chunkIndex,
                });
            }
        );

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
