import {
    CharacterSupportedState,
    FreeCamera,
    KeyboardEventTypes,
    MeshBuilder,
    PhysicsCharacterController,
    PointerEventTypes,
    Quaternion,
    Vector3,
    type CharacterSurfaceInfo,
    type Scene,
} from "@babylonjs/core";
import { Character } from "./Character";

export class CharacterController {
    // Player/Character state
    #state = "IN_AIR";
    #inAirSpeed = 8.0;
    #onGroundSpeed = 10.0;
    #jumpHeight = 1.5;
    #wantJump = false;
    #inputDirection = new Vector3(0, 0, 0);
    #forwardLocalSpace = new Vector3(0, 0, 1);
    #characterOrientation = Quaternion.Identity();
    #characterGravity = new Vector3(0, -18, 0);
    #characterController: PhysicsCharacterController;
    #player: Character;

    constructor(player: Character, scene: Scene) {
        this.#player = player;
        // This creates and positions a free camera (non-mesh)
        const camera = new FreeCamera("camera1", new Vector3(0, 21, -5), scene);

        // Physics shape for the character
        const h = 2;
        const r = 0.5;
        const displayCapsule = MeshBuilder.CreateCapsule(
            "CharacterDisplay",
            { height: h, radius: r },
            scene
        );
        const characterPosition = new Vector3(0, 21, 0);
        this.#characterController = new PhysicsCharacterController(
            characterPosition,
            { capsuleHeight: h, capsuleRadius: r },
            scene
        );
        camera.setTarget(characterPosition);

        // Display tick update: compute new camera position/target, update the capsule for the character display
        scene.onBeforeRenderObservable.add(() => {
            displayCapsule.position.copyFrom(
                this.#characterController.getPosition()
            );

            // camera following
            const cameraDirection = camera.getDirection(new Vector3(0, 0, 1));
            cameraDirection.y = 0;
            cameraDirection.normalize();
            camera.setTarget(
                Vector3.Lerp(camera.getTarget(), displayCapsule.position, 0.1)
            );
            const dist = Vector3.Distance(
                camera.position,
                displayCapsule.position
            );
            const amount =
                (Math.min(dist - 6, 0) + Math.max(dist - 9, 0)) * 0.04;
            cameraDirection.scaleAndAddToRef(amount, camera.position);
            camera.position.y +=
                (displayCapsule.position.y + 2 - camera.position.y) * 0.04;
        });

        // After physics update, compute and set new velocity, update the character controller state
        scene.onAfterPhysicsObservable.add(() => {
            if (scene.deltaTime == undefined) return;
            const dt = scene.deltaTime / 1000.0;
            if (dt == 0) return;

            const down = new Vector3(0, -1, 0);
            const support = this.#characterController.checkSupport(dt, down);

            Quaternion.FromEulerAnglesToRef(
                0,
                camera.rotation.y,
                0,
                this.#characterOrientation
            );
            const desiredLinearVelocity = this.#getDesiredVelocity(
                dt,
                support,
                this.#characterOrientation,
                this.#characterController.getVelocity()
            );
            this.#characterController.setVelocity(desiredLinearVelocity);

            this.#characterController.integrate(
                dt,
                support,
                this.#characterGravity
            );
            // Not sure this is the best place to do this, but doing it in scene.onKeyboardObservable stops working a few seconds after the button is pressed
            this.#player.moveTo(this.#characterController.getPosition());
        });

        // Rotate camera
        // Add a slide vector to rotate arount the character
        let isMouseDown = false;
        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    isMouseDown = true;
                    break;

                case PointerEventTypes.POINTERUP:
                    isMouseDown = false;
                    break;

                case PointerEventTypes.POINTERMOVE:
                    if (isMouseDown) {
                        const tgt = camera.getTarget().clone();
                        camera.position.addInPlace(
                            camera
                                .getDirection(Vector3.Right())
                                .scale(pointerInfo.event.movementX * -0.02)
                        );
                        camera.setTarget(tgt);
                    }
                    break;
            }
        });
        // Input to direction
        // from keys down/up, update the Vector3 inputDirection to match the intended direction. Jump with space
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    if (
                        kbInfo.event.key == "w" ||
                        kbInfo.event.key == "ArrowUp"
                    ) {
                        this.#inputDirection.z = 1;
                    } else if (
                        kbInfo.event.key == "s" ||
                        kbInfo.event.key == "ArrowDown"
                    ) {
                        this.#inputDirection.z = -1;
                    } else if (
                        kbInfo.event.key == "a" ||
                        kbInfo.event.key == "ArrowLeft"
                    ) {
                        this.#inputDirection.x = -1;
                    } else if (
                        kbInfo.event.key == "d" ||
                        kbInfo.event.key == "ArrowRight"
                    ) {
                        this.#inputDirection.x = 1;
                    } else if (kbInfo.event.key == " ") {
                        this.#wantJump = true;
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    if (
                        kbInfo.event.key == "w" ||
                        kbInfo.event.key == "s" ||
                        kbInfo.event.key == "ArrowUp" ||
                        kbInfo.event.key == "ArrowDown"
                    ) {
                        this.#inputDirection.z = 0;
                    }
                    if (
                        kbInfo.event.key == "a" ||
                        kbInfo.event.key == "d" ||
                        kbInfo.event.key == "ArrowLeft" ||
                        kbInfo.event.key == "ArrowRight"
                    ) {
                        this.#inputDirection.x = 0;
                    } else if (kbInfo.event.key == " ") {
                        this.#wantJump = false;
                    }
                    break;
            }
        });
    }

    // State handling
    // depending on character state and support, set the new state
    #getNextState(supportInfo: CharacterSurfaceInfo) {
        if (this.#state == "ON_GROUND") {
            if (
                supportInfo.supportedState != CharacterSupportedState.SUPPORTED
            ) {
                return "IN_AIR";
            }

            if (this.#wantJump) {
                return "START_JUMP";
            }
            return "ON_GROUND";
        } else if (this.#state == "START_JUMP") {
            return "IN_AIR";
        } else {
            if (
                supportInfo.supportedState == CharacterSupportedState.SUPPORTED
            ) {
                return "ON_GROUND";
            }
            return "IN_AIR";
        }
    }

    // From aiming direction and state, compute a desired velocity
    // That velocity depends on current state (in air, on ground, jumping, ...) and surface properties
    #getDesiredVelocity(
        deltaTime: number,
        supportInfo: CharacterSurfaceInfo,
        characterOrientation: Quaternion,
        currentVelocity: Vector3
    ) {
        const nextState = this.#getNextState(supportInfo);
        if (nextState != this.#state) {
            this.#state = nextState;
        }

        const upWorld = this.#characterGravity.normalizeToNew();
        upWorld.scaleInPlace(-1.0);
        const forwardWorld =
            this.#forwardLocalSpace.applyRotationQuaternion(
                characterOrientation
            );
        if (this.#state == "IN_AIR") {
            const desiredVelocity = this.#inputDirection
                .scale(this.#inAirSpeed)
                .applyRotationQuaternion(characterOrientation);
            const outputVelocity = this.#characterController.calculateMovement(
                deltaTime,
                forwardWorld,
                upWorld,
                currentVelocity,
                Vector3.ZeroReadOnly,
                desiredVelocity,
                upWorld
            );
            // Restore to original vertical component
            outputVelocity.addInPlace(
                upWorld.scale(-outputVelocity.dot(upWorld))
            );
            outputVelocity.addInPlace(
                upWorld.scale(currentVelocity.dot(upWorld))
            );
            // Add gravity
            outputVelocity.addInPlace(this.#characterGravity.scale(deltaTime));
            return outputVelocity;
        } else if (this.#state == "ON_GROUND") {
            // Move character relative to the surface we're standing on
            // Correct input velocity to apply instantly any changes in the velocity of the standing surface and this way
            // avoid artifacts caused by filtering of the output velocity when standing on moving objects.
            const desiredVelocity = this.#inputDirection
                .scale(this.#onGroundSpeed)
                .applyRotationQuaternion(characterOrientation);

            let outputVelocity = this.#characterController.calculateMovement(
                deltaTime,
                forwardWorld,
                supportInfo.averageSurfaceNormal,
                currentVelocity,
                supportInfo.averageSurfaceVelocity,
                desiredVelocity,
                upWorld
            );
            // Horizontal projection
            {
                outputVelocity.subtractInPlace(
                    supportInfo.averageSurfaceVelocity
                );
                const inv1k = 1e-3;
                if (outputVelocity.dot(upWorld) > inv1k) {
                    const velLen = outputVelocity.length();
                    outputVelocity.normalizeFromLength(velLen);

                    // Get the desired length in the horizontal direction
                    const horizLen =
                        velLen / supportInfo.averageSurfaceNormal.dot(upWorld);

                    // Re project the velocity onto the horizontal plane
                    const c =
                        supportInfo.averageSurfaceNormal.cross(outputVelocity);
                    outputVelocity = c.cross(upWorld);
                    outputVelocity.scaleInPlace(horizLen);
                }
                outputVelocity.addInPlace(supportInfo.averageSurfaceVelocity);
                return outputVelocity;
            }
        } else if (this.#state == "START_JUMP") {
            const u = Math.sqrt(
                2 * this.#characterGravity.length() * this.#jumpHeight
            );
            const curRelVel = currentVelocity.dot(upWorld);
            return currentVelocity.add(upWorld.scale(u - curRelVel));
        }
        return Vector3.Zero();
    }
}
