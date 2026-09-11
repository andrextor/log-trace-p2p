import { readFileSync } from "node:fs";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Las versiones salen de los package.json en el build: la de la app y la del
// parser instalado, que es la que explica qué sabe leer este despliegue. El
// del parser se lee por ruta porque su `exports` no lo expone.
const version = (path) =>
	JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")).version;
const APP_VERSION = version("./package.json");
const PARSER_VERSION = version(
	"./node_modules/@andrextor_ia11012/p2p-log-parser/package.json",
);

export default defineConfig({
	integrations: [vue({ appEntrypoint: "/src/app" })],

	vite: {
		plugins: [tailwindcss()],
		define: {
			__APP_VERSION__: JSON.stringify(APP_VERSION),
			__PARSER_VERSION__: JSON.stringify(PARSER_VERSION),
		},
	},
});
