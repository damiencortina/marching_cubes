import {
    Color3,
    HemisphericLight,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    StandardMaterial,
    Vector3,
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
        const light = new HemisphericLight(
            "light1",
            new Vector3(1, 1, 0),
            scene
        );
        light.specular = new Color3(1, 0.5, 1);
        light.groundColor = new Color3(0.5, 0, 1);

        // create a worker (for chunks compuations)
        const chunkWorker = new Worker(
            new URL("../worker.ts", import.meta.url),
            {
                type: "module",
            }
        );
        scene.clearColor = Config.skyColor.toColor4();
        scene.fogMode = Scene.FOGMODE_LINEAR;
        scene.fogStart = Config.chunkSize * (Config.distanceView - 1);
        scene.fogEnd = Config.chunkSize * Config.distanceView;
        scene.fogColor = Config.skyColor;

        const groundMaterial = new StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseColor = new Color3(1, 0, 0.5);
        chunkWorker.onmessage = (event: MessageEvent<ChunkData>) => {
            const chunk = this.createChunk(
                new Vector3(...Object.values(event.data.coordinates)),
                event.data.vertices,
                groundMaterial
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

        // Create a box for the character to stand on (until i figure out a way to know for sure what the groundś height will be at the starting coordinates)
        const box = MeshBuilder.CreateBox(
            "box",
            { height: 40, width: 5, depth: 5 },
            scene
        );
        const boxMaterial = new StandardMaterial("boxMaterial", scene);
        boxMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4);
        box.material = boxMaterial;
        new PhysicsAggregate(box, PhysicsShapeType.MESH);

        this.currentCoordinates = coordinates;
    }

    abstract createChunk(
        coordinates: Vector3,
        positions: number[],
        material: StandardMaterial
    ): Chunk;

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
        Utils.range(-Config.distanceView, Config.distanceView).forEach(
            (chunkIndex) => {
                this.chunkWorker.postMessage({
                    x:
                        chunkCoordinates.x +
                        movementVector.x * Config.distanceView +
                        (movementVector.x === 0 ? 1 : 0) * chunkIndex,
                    y: 0,
                    z:
                        chunkCoordinates.z +
                        movementVector.z * Config.distanceView +
                        (movementVector.z === 0 ? 1 : 0) * chunkIndex,
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
