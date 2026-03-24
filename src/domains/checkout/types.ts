import type { BaseDetails } from "../../shared/types";

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

export interface SessionFunnelSteps {
	created: number;
	entry: number;
	show: number;
	information: number;
	interest: number;
	generateOtp: number;
	threeDS: number;
	process: number;
}

export type SessionType = "PAYMENT" | "COLLECT" | "UNKNOWN";

export interface SessionFunnelRow {
	sessionId: string;
	sessionType: SessionType;
	steps: SessionFunnelSteps;
	_rawTimestamps: {
		created: number | null;
		entry: number | null;
		show: number | null;
	};
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
