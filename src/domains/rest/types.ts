// La forma de `RestDetails` la define la librería de parseo; redeclararla aquí
// dejaba fuera los campos que fue ganando (`channel`, `transport`, `simulator`).
export type {
	RestDetails,
	RestException as ExceptionInfo,
} from "@andrextor_ia11012/p2p-log-parser";
