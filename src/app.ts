import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Engine, Scene, Vector3, HavokPlugin } from "@babylonjs/core";
import { CharacterController } from "./CharacterController";
import HavokPhysics from "@babylonjs/havok";
import { StandardMarchingCubesWorld } from "./World/World/StandardMarchingCubesWorld";

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
        const worldBuilder = new StandardMarchingCubesWorld(scene);
        const chunk = worldBuilder.createChunk(new Vector3(0, 0, 0));
        chunk.render();
        const characterController = new CharacterController(scene);
        characterController.attach(worldBuilder);

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
new App();
