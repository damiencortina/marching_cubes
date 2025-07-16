// TODO : find a cleaner way to fix that error
// @ts-expect-error fastnoise-lite is not written in typescript
import FastNoiseLite from "fastnoise-lite";
import { Config } from "./Config";
import { MarchingCubeGenerator } from "./marching_cubes/MarchingCubeGenerator";
import type { ChunkCoordinates } from "./Utils";

const noise = new FastNoiseLite();
noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2);
const marchingCubeGenerator = new MarchingCubeGenerator(Config.chunkSize);

onmessage = (event: MessageEvent<ChunkCoordinates>) => {
    const chunkData = {
        coordinates: event.data,
        vertices: marchingCubeGenerator.marchingCubes3d(
            (x: number, y: number, z: number) => noise.GetNoise(x, z) * 10 - y,
            event.data
        ),
    };
    postMessage(chunkData);
};
