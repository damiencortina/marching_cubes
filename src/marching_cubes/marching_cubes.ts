import { Mesh, Scene, VertexData, type FloatArray } from "@babylonjs/core";
import { LOOKUP_TABLE } from "./lookup_table";

// Default bounds to evaluate over
const XMIN = -40;
const XMAX = 40;
const YMIN = -40;
const YMAX = 40;
const ZMIN = -40;
const ZMAX = 40;

// Vertices need to be evaluated counterclockwise, otherwise the mesh might be rendered inside out
const VERTICES = [
    [0, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [1, 0, 0],
    [0, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
    [1, 0, 1],
];

const EDGES = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
];

type LevelFunction = (x: number, y: number, z: number) => number;

export function marching_cubes_3d_single_cell(
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

export function marching_cubes_3d(
    levelFunction: LevelFunction,
    scene: Scene,
    xmin = XMIN,
    xmax = XMAX,
    ymin = YMIN,
    ymax = YMAX,
    zmin = ZMIN,
    zmax = ZMAX
) {
    const positions: number[] = [];
    const xRange = range(xmin, xmax);
    const yRange = range(ymin, ymax);
    const zRange = range(zmin, zmax);
    const firstHalfCubeRange = VERTICES.slice(0, 4);
    const halfCubeRange = VERTICES.slice(-4);
    xRange.forEach((x) => {
        yRange.forEach((y) => {
            let firstHalfCubeResults = firstHalfCubeRange.map((vertex) =>
                levelFunction(x + vertex[0], y + vertex[1], zmin + vertex[2])
            );
            zRange.forEach((z) => {
                const secondHalfCubeResults = halfCubeRange.map((vertex) =>
                    levelFunction(x + vertex[0], y + vertex[1], z + vertex[2])
                );
                positions.push(
                    ...marching_cubes_3d_single_cell(
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
        vertexData.indices = [...Array(vertexData.positions.length / 3).keys()];
    }
    const mesh = new Mesh("custom", scene);
    vertexData.applyToMesh(mesh);
    return mesh;
}

function range(from: number, to: number) {
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}
