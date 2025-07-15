import { type FloatArray } from "@babylonjs/core";
import { LOOKUP_TABLE } from "./marching_cubes_consts/lookupTable";
import { EDGES } from "./marching_cubes_consts/edges";
import { VERTICES } from "./marching_cubes_consts/vertices";
import { Utils, type ChunkCoordinates } from "../Utils";

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
        // Each of the cube's vertices index that returns a positive result with the level function is squared and added
        // The result is a representation of the faces that needs to be drawn inside the cube
        const faces =
            LOOKUP_TABLE[
                levelFunctionResult.reduce(
                    (
                        lookupTableCaseIndex: number,
                        level: number,
                        verticeIndex
                    ) =>
                        lookupTableCaseIndex +
                        (level > 0 ? Math.pow(2, verticeIndex) : 0),
                    0
                )
            ];

        const vertices: FloatArray = [];
        faces.forEach((edges) =>
            edges.map((edge) => {
                const [vertex0, vertex1] = EDGES[edge];
                const levelFunctionResultForVertex0 =
                    levelFunctionResult[vertex0];
                const levelFunctionResultForVertex1 =
                    levelFunctionResult[vertex1];
                // Linear interpolation used to decide where exactly along the edge the surface should be drawn
                const t0 =
                    1 +
                    levelFunctionResultForVertex0 /
                        (levelFunctionResultForVertex1 -
                            levelFunctionResultForVertex0);
                const t1 = 1 - t0;
                const vertex0Coordinates = VERTICES[vertex0];
                const vertex1Coordinates = VERTICES[vertex1];
                vertices.push(
                    x + vertex0Coordinates[0] * t0 + vertex1Coordinates[0] * t1,
                    y + vertex0Coordinates[1] * t0 + vertex1Coordinates[1] * t1,
                    z + vertex0Coordinates[2] * t0 + vertex1Coordinates[2] * t1
                );
            })
        );
        return vertices;
    }

    marchingCubes3d(
        levelFunction: LevelFunction,
        chunkCoordinates: ChunkCoordinates
    ): number[] {
        const halfChunkSize = this.chunkSize / 2;
        const xmin = chunkCoordinates.x * this.chunkSize - halfChunkSize;
        const xmax = chunkCoordinates.x * this.chunkSize + halfChunkSize;
        const ymin = -halfChunkSize;
        const ymax = halfChunkSize;
        const zmin = chunkCoordinates.z * this.chunkSize - halfChunkSize;
        const zmax = chunkCoordinates.z * this.chunkSize + halfChunkSize;
        const positions: number[] = [];
        const xRange = Utils.range(xmin, xmax);
        const yRange = Utils.range(ymin, ymax);
        const zRange = Utils.range(zmin, zmax);
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
        return positions;
    }
}
