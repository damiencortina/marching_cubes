import { Vector3 } from "@babylonjs/core";

export abstract class Config {
    static chunkSize = 20;
    static distanceView = 2;
    static startingCoordinates = new Vector3(0, 0, 0);
}
