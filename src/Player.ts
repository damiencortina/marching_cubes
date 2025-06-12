import {
    KeyboardEventTypes,
    MeshBuilder,
    PhysicsCharacterController,
    Quaternion,
    Vector3,
    type CharacterSurfaceInfo,
    type Scene,
} from "@babylonjs/core";

export class Player {
    characterController: PhysicsCharacterController;
    characterGravity = new Vector3(0, -18, 0);
    characterOrientation = Quaternion.Identity();
    inputDirection = new Vector3(0, 0, 0);
    onGroundSpeed = 10.0;
    forwardLocalSpace = new Vector3(0, 0, 1);

    constructor(scene: Scene) {
        // create a platform for the player to start on

        // create the player's model
        const h = 1.8;
        const r = 0.6;
        MeshBuilder.CreateCapsule(
            "CharacterDisplay",
            { height: h, radius: r },
            scene
        );
        const characterPosition = new Vector3(3, 0.3, -8);
        this.characterController = new PhysicsCharacterController(
            characterPosition,
            { capsuleHeight: h, capsuleRadius: r },
            scene
        );

        scene.onAfterPhysicsObservable.add(() => {
            if (scene.deltaTime == undefined) return;
            const dt = scene.deltaTime / 1000.0;
            if (dt == 0) return;

            const down = new Vector3(0, -1, 0);
            const support = this.characterController.checkSupport(dt, down);

            const desiredLinearVelocity = this.getDesiredVelocity(
                dt,
                support,
                this.characterOrientation,
                this.characterController.getVelocity()
            );
            this.characterController.setVelocity(desiredLinearVelocity);

            this.characterController.integrate(
                dt,
                support,
                this.characterGravity
            );
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
                        this.inputDirection.z = 1;
                    } else if (
                        kbInfo.event.key == "s" ||
                        kbInfo.event.key == "ArrowDown"
                    ) {
                        this.inputDirection.z = -1;
                    } else if (
                        kbInfo.event.key == "a" ||
                        kbInfo.event.key == "ArrowLeft"
                    ) {
                        this.inputDirection.x = -1;
                    } else if (
                        kbInfo.event.key == "d" ||
                        kbInfo.event.key == "ArrowRight"
                    ) {
                        this.inputDirection.x = 1;
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    if (
                        kbInfo.event.key == "w" ||
                        kbInfo.event.key == "s" ||
                        kbInfo.event.key == "ArrowUp" ||
                        kbInfo.event.key == "ArrowDown"
                    ) {
                        this.inputDirection.z = 0;
                    }
                    if (
                        kbInfo.event.key == "a" ||
                        kbInfo.event.key == "d" ||
                        kbInfo.event.key == "ArrowLeft" ||
                        kbInfo.event.key == "ArrowRight"
                    ) {
                        this.inputDirection.x = 0;
                    }
                    break;
            }
        });
    }

    // From aiming direction and state, compute a desired velocity
    // That velocity depends on current state (in air, on ground, jumping, ...) and surface properties
    getDesiredVelocity(
        deltaTime: number,
        supportInfo: CharacterSurfaceInfo,
        characterOrientation: Quaternion,
        currentVelocity: Vector3
    ) {
        const upWorld = this.characterGravity.normalizeToNew();
        upWorld.scaleInPlace(-1.0);
        const forwardWorld =
            this.forwardLocalSpace.applyRotationQuaternion(
                characterOrientation
            );
        // Move character relative to the surface we're standing on
        // Correct input velocity to apply instantly any changes in the velocity of the standing surface and this way
        // avoid artifacts caused by filtering of the output velocity when standing on moving objects.
        const desiredVelocity = this.inputDirection
            .scale(this.onGroundSpeed)
            .applyRotationQuaternion(characterOrientation);

        let outputVelocity = this.characterController.calculateMovement(
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
            outputVelocity.subtractInPlace(supportInfo.averageSurfaceVelocity);
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
        return Vector3.Zero();
    }
}
