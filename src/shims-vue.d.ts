/**
 * `astro check` resuelve los SFC por su cuenta, pero `tsc --noEmit` —que CI
 * corre despues— no sabe nada de `.vue`, asi que un test que importe un
 * componente rompe el typecheck. El shim solo cubre esa via.
 */
declare module "*.vue" {
	import type { DefineComponent } from "vue";
	const component: DefineComponent<
		Record<string, unknown>,
		Record<string, unknown>,
		unknown
	>;
	export default component;
}

/** Fixtures de texto para los tests, via `?raw` de Vite. */
declare module "*.csv?raw" {
	const content: string;
	export default content;
}

/** Inyectadas por Vite en `astro.config.mjs` desde los package.json. */
declare const __APP_VERSION__: string;
declare const __PARSER_VERSION__: string;
