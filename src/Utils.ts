export abstract class Utils {
    static range(from: number, to: number) {
        return Array.from(
            { length: to - from + 1 },
            (_, index) => from + index
        );
    }
}
