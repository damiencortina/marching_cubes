import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    HavokPlugin,
    PhysicsShapeType,
    PhysicsAggregate,
    Mesh,
} from "@babylonjs/core";
import { MarchingCubeGenerator } from "./marching_cubes/MarchingCubeGenerator";
import { CharacterController } from "./CharacterController";
import HavokPhysics from "@babylonjs/havok";
// TODO : find a cleaner way to fix that error
// @ts-expect-error fastnoise-lite is not written in typescript
import FastNoiseLite from "fastnoise-lite";

class App {
    chunkSize = 80;

    constructor() {
        // create the canvas html element and attach it to the webpage
        const canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);

        const noise = new FastNoiseLite();
        noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2);
        function noiseLevel(x: number, y: number, z: number): number {
            return noise.GetNoise(x, z) * 10 - y;
        }
        const marchingCubeGenerator = new MarchingCubeGenerator(this.chunkSize);
        const mesh = marchingCubeGenerator.marchingCubes3d(
            noiseLevel,
            scene,
            new Vector3()
        );

        new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        // Initialize Havok plugin
        this.initPhysics(scene, engine, mesh);
    }

    async initPhysics(scene: Scene, engine: Engine, mesh: Mesh) {
        const havokInstance = await HavokPhysics();
        const hk = new HavokPlugin(true, havokInstance);
        scene.enablePhysics(new Vector3(0, -9.8, 0), hk);
        new CharacterController(scene);
        new PhysicsAggregate(mesh, PhysicsShapeType.MESH);

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
new App();
