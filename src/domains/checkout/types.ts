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

export interface SessionFunnelRow {
	sessionId: string;
	sessionType: SessionType;
	finalState: string;
	steps: SessionFunnelSteps;
	/** Ya formateadas para pintar; `null` cuando el parser no pudo medirlas. */
	durations: {
		timeToEntry: string | null;
		timeToShow: string | null;
	};
}

export interface FunnelStats {
	total: number;
	payments: number;
	collects: number;
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
