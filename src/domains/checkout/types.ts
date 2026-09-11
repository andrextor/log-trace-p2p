import type {
	BaseDetails,
	CheckoutFunnelSteps,
	CheckoutSessionMetadata,
} from "../../shared/types";

export interface CheckoutDetails extends BaseDetails {
	url?: string;
	duration?: string;
	sessionId?: string | number;
	transactionId?: string | number;
	subType?: string | null;
	awsRequestId?: string | null;
	aws_request_id?: string | null;
	provider?: string | null;
}

export interface MicrositiosDetails extends BaseDetails {
	siteId: string | number;
	formName?: string;
	sessionId?: string | number;
}

// Los hitos y el tipo de sesión los deriva `CheckoutMetadataExtractor`.
// Redeclararlos aquí era mantener el embudo en paralelo al parser.
export type SessionFunnelSteps = CheckoutFunnelSteps;
export type SessionType = CheckoutSessionMetadata["sessionType"];

export type SessionOutcome = CheckoutSessionMetadata["outcome"];

export interface SessionFunnelRow {
	sessionId: string;
	sessionType: SessionType;
	finalState: string;
	outcome: SessionOutcome;
	/** Hito más lejano alcanzado; dice en qué paso se abandonó. */
	lastStep: CheckoutSessionMetadata["lastStep"];
	steps: SessionFunnelSteps;
	/** Ya formateadas para pintar; `null` cuando el parser no pudo medirlas. */
	durations: {
		timeToEntry: string | null;
		timeToShow: string | null;
		timeToProcess: string | null;
		total: string | null;
	};
	/** En ms, para ordenar sin volver a parsear el texto. */
	totalMs: number;
}

export interface FunnelStats {
	total: number;
	payments: number;
	collects: number;
	/** Sesiones que llegaron a `/process`, acabaran como acabaran. */
	processed: number;
	approved: number;
	/** Aprobadas sobre el total. Antes era «procesadas», y un rechazo contaba. */
	conversionRate: string;
}

export interface FunnelStep {
	key: string;
	label: string;
	full: string;
	count: number;
	percentage: string;
}

export interface StepConfig {
	readonly key: string;
	readonly label: string;
	readonly full: string;
}
