import {
    Mesh,
    PhysicsAggregate,
    PhysicsShapeType,
    Vector3,
    VertexData,
    type Scene,
} from "@babylonjs/core";
import type { Chunk } from "../Chunk";

export class StandardMarchingCubesChunk implements Chunk {
    coordinates: Vector3;
    mesh: Mesh | undefined;

    constructor(coordinates: Vector3, positions: number[], scene: Scene) {
        this.coordinates = coordinates;
        const vertexData = new VertexData();
        vertexData.positions = positions;
        if (vertexData.positions) {
            vertexData.indices = [
                ...Array(vertexData.positions.length / 3).keys(),
            ];
        }
        const mesh = new Mesh("custom", scene);
        vertexData.applyToMesh(mesh);
        new PhysicsAggregate(mesh, PhysicsShapeType.MESH);
        this.mesh = mesh;
    }

    remove() {
        this.mesh?.dispose();
    }
}
