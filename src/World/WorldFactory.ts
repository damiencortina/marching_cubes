import {
    Color3,
    HemisphericLight,
    StandardMaterial,
    Vector3,
    type Scene,
} from "@babylonjs/core";
import type { Chunk } from "./Chunk";
import type { Subject } from "../Subject";
import { CharacterController } from "../CharacterController";
import type { Observer } from "../Observer";
import { Utils } from "../Utils";

export abstract class WorldFactory implements Observer {
    chunkSize: number;
    distanceView: number;
    scene: Scene;
    displayedChunks: Record<string, Chunk> = {};

    constructor(chunkSize: number, distanceView: number, scene: Scene) {
        this.chunkSize = chunkSize;
        this.distanceView = distanceView;
        this.scene = scene;
        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    }

    abstract createChunk(coordinates: Vector3): Chunk;

    generateworld() {
        const origin = new Vector3(0, 0, 0);
        const chunk = this.createChunk(origin);
        this.displayedChunks[origin.toString()] = chunk;
        chunk.render();
        this.generateNearbyChunks(chunk);
    }

    generateNearbyChunks(chunk: Chunk) {
        Utils.range(
            chunk.coordinates.x - this.distanceView,
            chunk.coordinates.x + this.distanceView
        ).forEach((x) => {
            Utils.range(
                chunk.coordinates.z - this.distanceView,
                chunk.coordinates.z + this.distanceView
            ).forEach((z) => {
                const coordinates = new Vector3(x, 0, z);
                const index = coordinates.toString();
                if (!this.displayedChunks[index]) {
                    const chunk = this.createChunk(coordinates);
                    this.displayedChunks[index] = chunk;
                    const chunkMesh = chunk.render();
                    // TODO : remove debug material
                    const blueMat = new StandardMaterial("blueMat", this.scene);
                    blueMat.emissiveColor = new Color3(0, 0, 1);
                    chunkMesh.material = blueMat;
                }
            });
        });
    }

    update(subject: Subject): void {
        if (subject instanceof CharacterController) {
            console.log(
                "WorldBuilder has been notified by CharacterController."
            );
        }
    }
}
