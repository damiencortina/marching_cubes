import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
} from "@babylonjs/core";
import { MarchingCubeGenerator } from "./marching_cubes/MarchingCubeGenerator";
import { PerlinGenerator } from "./marching_cubes/PerlinGenerator";

class App {
    constructor() {
        // create the canvas html element and attach it to the webpage
        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);

        // Generate a sphere with the marching cubes algorhythm
        const SPHERE_RADIUS = 39.5; // Carefull, by default only coordinates from -3 to 3 are evaluated thus a bigger sphere radius might end up in a partially rendered sphere
        // function sphere_level(x: number, y: number, z: number): number {
        //     return (
        //         SPHERE_RADIUS -
        //         Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2))
        //     );
        // }
        const perlinGenerator = new PerlinGenerator();
        function noiseLevel(x: number, y: number, z: number): number {
            return perlinGenerator.get(x / 20, z / 20) * 10 - y;
        }
        const marchingCubeGenerator = new MarchingCubeGenerator(80);
        marchingCubeGenerator.marchingCubes3d(noiseLevel, scene);

        const camera: ArcRotateCamera = new ArcRotateCamera(
            "Camera",
            Math.PI / 2,
            Math.PI / 2,
            SPHERE_RADIUS * 5,
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

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
new App();
