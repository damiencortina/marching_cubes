import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    HavokPlugin,
    ArcRotateCamera,
} from "@babylonjs/core";
import { MarchingCubeGenerator } from "./marching_cubes/MarchingCubeGenerator";
import { PerlinGenerator } from "./marching_cubes/PerlinGenerator";
import { Player } from "./Player";
import HavokPhysics from "@babylonjs/havok";

class App {
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

        const perlinGenerator = new PerlinGenerator();
        function noiseLevel(x: number, y: number, z: number): number {
            return perlinGenerator.get(x / 20, z / 20) * 10 - y;
        }
        const marchingCubeGenerator = new MarchingCubeGenerator(80);
        marchingCubeGenerator.marchingCubes3d(noiseLevel, scene);

        const camera: ArcRotateCamera = new ArcRotateCamera(
            "Camera",
            Math.PI,
            -Math.PI / 16,
            20,
            Vector3.Zero(),
            scene
        );
        camera.attachControl(canvas, true);

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
        this.initPhysics(scene, engine);
    }

    async initPhysics(scene: Scene, engine: Engine) {
        const havokInstance = await HavokPhysics();
        const hk = new HavokPlugin(true, havokInstance);
        scene.enablePhysics(new Vector3(0, -9.8, 0), hk);
        new Player(scene);
        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
new App();
