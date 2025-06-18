/** @type {import('vite').UserConfig} */
export default {
    server: {
        host: "127.0.0.1",
    },
    optimizeDeps: {
        exclude: ["@babylonjs/havok"],
    },
};
