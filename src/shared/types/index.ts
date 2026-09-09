// Lista explícita no: se quedaba corta cada vez que la librería ganaba un tipo
// (`Outcome`, `CheckoutFunnelSteps`…) y el fallo salía lejos del sitio.
export * from "./base";

export type {
	ViewMode,
	TimeGroup,
	StoreStats,
	ActiveFilterInfo,
	FilterTheme,
	FiltersCacheEntry,
	CategoryStyle,
	HighlightTheme,
	LevelFilter,
} from "./store";
