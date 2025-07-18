import { Color3, Vector3 } from "@babylonjs/core";

export abstract class Config {
    static chunkSize = 20;
    static distanceView = 5;
    static startingCoordinates = new Vector3(0, 0, 0);
    static skyColor = new Color3(0, 1, 1);
}
