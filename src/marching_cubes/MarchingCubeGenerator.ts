import {
    Mesh,
    Scene,
    Vector3,
    VertexData,
    type FloatArray,
} from "@babylonjs/core";
import { LOOKUP_TABLE } from "./marching_cubes_consts/lookupTable";
import { EDGES } from "./marching_cubes_consts/edges";
import { VERTICES } from "./marching_cubes_consts/vertices";

type LevelFunction = (x: number, y: number, z: number) => number;

export class MarchingCubeGenerator {
    chunkSize: number;

    constructor(chunkSize: number) {
        this.chunkSize = chunkSize;
    }

    marchingCubes3dSingleCell(
        levelFunctionResult: number[],
        x: number,
        y: number,
        z: number
    ) {
        const faces =
            LOOKUP_TABLE[
                levelFunctionResult.reduce(
                    (acc: number, level: number, index) =>
                        acc + (level > 0 ? Math.pow(2, index) : 0),
                    0
                )
            ];
        const vertices: FloatArray = [];
        faces.forEach((edges) =>
            edges.map((edge) => {
                const [v0, v1] = EDGES[edge];
                const f0 = levelFunctionResult[v0];
                const f1 = levelFunctionResult[v1];
                const t0 = 1 - (0 - f0) / (f1 - f0);
                const t1 = 1 - t0;
                const vert_pos0 = VERTICES[v0];
                const vert_pos1 = VERTICES[v1];
                vertices.push(
                    ...[
                        x + vert_pos0[0] * t0 + vert_pos1[0] * t1,
                        y + vert_pos0[1] * t0 + vert_pos1[1] * t1,
                        z + vert_pos0[2] * t0 + vert_pos1[2] * t1,
                    ]
                );
            })
        );
        return vertices;
    }

    marchingCubes3d(
        levelFunction: LevelFunction,
        scene: Scene,
        chunkCoordinates: Vector3
    ) {
        const halfChunkSize = this.chunkSize / 2;
        const xmin = chunkCoordinates.x - halfChunkSize;
        const xmax = chunkCoordinates.x + halfChunkSize;
        const ymin = -halfChunkSize;
        const ymax = halfChunkSize;
        const zmin = chunkCoordinates.z - halfChunkSize;
        const zmax = chunkCoordinates.z + halfChunkSize;
        const positions: number[] = [];
        const xRange = MarchingCubeGenerator.range(xmin, xmax);
        const yRange = MarchingCubeGenerator.range(ymin, ymax);
        const zRange = MarchingCubeGenerator.range(zmin, zmax);
        const firstHalfCubeRange = VERTICES.slice(0, 4);
        const halfCubeRange = VERTICES.slice(-4);
        xRange.forEach((x) => {
            yRange.forEach((y) => {
                let firstHalfCubeResults = firstHalfCubeRange.map((vertex) =>
                    levelFunction(
                        x + vertex[0],
                        y + vertex[1],
                        zmin + vertex[2]
                    )
                );
                zRange.forEach((z) => {
                    const secondHalfCubeResults = halfCubeRange.map((vertex) =>
                        levelFunction(
                            x + vertex[0],
                            y + vertex[1],
                            z + vertex[2]
                        )
                    );
                    positions.push(
                        ...this.marchingCubes3dSingleCell(
                            [...firstHalfCubeResults, ...secondHalfCubeResults],
                            x,
                            y,
                            z
                        )
                    );
                    firstHalfCubeResults = secondHalfCubeResults;
                });
            });
        });
        const vertexData = new VertexData();
        vertexData.positions = positions;
        if (vertexData.positions) {
            vertexData.indices = [
                ...Array(vertexData.positions.length / 3).keys(),
            ];
        }
        const mesh = new Mesh("custom", scene);
        vertexData.applyToMesh(mesh);
        return mesh;
    }

    static range(from: number, to: number) {
        return Array.from(
            { length: to - from + 1 },
            (_, index) => from + index
        );
    }
}
