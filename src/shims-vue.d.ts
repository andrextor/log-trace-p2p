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
