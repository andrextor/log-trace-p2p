// Los tipos del dominio los define la librería de parseo: redeclararlos aquí
// hacía que consumidor y librería se separaran sin que nada avisara (la forma
// local de `RestParseMetadata` no coincidía con la que la librería emitía).
export {
	AppTypes as APP_TYPES,
	AppNames as ANALYZER_NAMES,
} from "@andrextor_ia11012/p2p-log-parser";

export type {
	AppType as AnalyzerType,
	LogLevel,
	LogCategory,
	BaseDetails,
	LogEvent,
	NormalizedLogData,
	Correlation,
	Outcome,
	RestDetails,
	CheckoutDetails,
	DomainMetadata,
	ParseMetadata,
	ParseStats,
	CheckoutParseMetadata,
	CheckoutSessionMetadata,
	CheckoutFunnelSteps,
	RestParseMetadata,
	MicrositesParseMetadata,
	RestErrorSummary,
	RestExchangeSummary,
	StrategyMetadata as SupportedFormat,
} from "@andrextor_ia11012/p2p-log-parser";
