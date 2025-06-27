import { Vector3 } from "@babylonjs/core";
import type { Observer } from "./Observer";
import type { Subject } from "./Subject";
import { Config } from "./Config";

export class Character implements Subject {
    chunkCoordinates = new Vector3(0, 0, 0);

    public moveTo(coordinates: Vector3) {
        const chunkCoordinates = new Vector3(
            Math.floor(coordinates.x / Config.chunkSize),
            0,
            Math.floor(coordinates.z / Config.chunkSize)
        );
        console.log(chunkCoordinates);
        if (
            chunkCoordinates.x !== this.chunkCoordinates.x ||
            chunkCoordinates.z !== this.chunkCoordinates.z
        ) {
            this.chunkCoordinates = chunkCoordinates;
            this.notify();
        }
    }

    /**
     * @type {Observer[]} List of subscribers. In real life, the list of
     * subscribers can be stored more comprehensively (categorized by event
     * type, etc.).
     */
    private observers: Observer[] = [];
    /**
     * The subscription management methods.
     */
    public attach(observer: Observer): void {
        const isExist = this.observers.includes(observer);
        if (isExist) {
            return console.log("Subject: Observer has been attached already.");
        }

        console.log("Subject: Attached an observer.");
        this.observers.push(observer);
    }

    public detach(observer: Observer): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex === -1) {
            return console.log("Subject: Nonexistent observer.");
        }

        this.observers.splice(observerIndex, 1);
        console.log("Subject: Detached an observer.");
    }

    /**
     * Trigger an update in each subscriber.
     */
    public notify(): void {
        console.log("Subject: Notifying observers...");
        for (const observer of this.observers) {
            observer.update(this);
        }
    }
}
