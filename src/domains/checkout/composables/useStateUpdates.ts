import type { CheckoutDetails, LogEvent } from "../../../shared/types";

export interface StateUpdateRow {
	event: LogEvent;
	/** Lo que esa línea cambia; vacío cuando solo es un paso intermedio. */
	detail: string;
	warning: boolean;
}

export interface StateUpdateSummary {
	/** Estados de la sesión en orden, sin repetidos consecutivos. */
	session: string[];
	/** Estados de la transacción en orden, sin repetidos consecutivos. */
	transaction: string[];
	/** Último estado de la transacción; manda sobre el color de la tarjeta. */
	transactionState: string | null;
	transactionId: string | null;
	placetopayId: string | null;
	gateway: string | null;
	/** Saldo pendiente de la sesión antes y después de aplicar la transacción. */
	remaining: { before: number; after: number } | null;
	hasWarning: boolean;
	rows: StateUpdateRow[];
}

const str = (v: unknown) =>
	v === undefined || v === null || v === "" ? null : String(v);
const num = (v: unknown) => (typeof v === "number" ? v : null);

function payloadOf(event: LogEvent): Record<string, unknown> {
	const d = event.details as CheckoutDetails;
	return (d.payload ?? {}) as Record<string, unknown>;
}

function stepOf(event: LogEvent): string {
	return (event.details as CheckoutDetails).step ?? "";
}

function pushState(chain: string[], state: string | null) {
	if (state && chain[chain.length - 1] !== state) chain.push(state);
}

/** El estado «desde» solo abre la cadena; después ya lo dice el eslabón anterior. */
function seedState(chain: string[], state: string | null) {
	if (chain.length === 0) pushState(chain, state);
}

/**
 * Cada línea del cierre dice una cosa; el resto del payload es la respuesta
 * del gateway repetida. Las claves salen del código de `redirection`:
 * `UpdateSessionStateAction`, `UpdateTransactionStateAction` y
 * `DefineSessionStateAction`.
 */
function detailOf(event: LogEvent, p: Record<string, unknown>): string {
	const step = stepOf(event);
	const title = (event.details as CheckoutDetails).rawTitle ?? "";

	if (title.startsWith("Calling updateSessionStateAction")) {
		return `session ${str(p.session_state)} → ${str(p.new_status)}`;
	}
	if (step === "UpdateSessionStateAction start") {
		const forced = p.forced === true ? " · forced" : "";
		return `session ${str(p.actual_session_state)} → ${str(p.state_to_update)}${forced}`;
	}
	if (step === "Updating" && p.new_state !== undefined) {
		return `session → ${str(p.new_state)}`;
	}
	if (step === "Start Updating") {
		return `tx ${str(p.state)}`;
	}
	if (step === "Transaction resolved") {
		const p2p = str(p.updated_placetopay_id);
		return p2p ? `tx ${str(p.state)} · P2P ${p2p}` : `tx ${str(p.state)}`;
	}
	if (step === "Executed event") {
		return `session ${str(p.session_state)} · remaining ${str(p.session_remaining)} · tx ${str(p.transaction_state)}`;
	}
	if (step === "transaction is approved") {
		return `remaining ${str(p.session_remaining_evaluate)} · partial ${p.session_allow_partial ? "yes" : "no"}`;
	}
	return "";
}

export function summarizeStateUpdates(events: LogEvent[]): StateUpdateSummary {
	const session: string[] = [];
	const transaction: string[] = [];
	let transactionId: string | null = null;
	let placetopayId: string | null = null;
	let gateway: string | null = null;
	let before: number | null = null;
	let after: number | null = null;
	const rows: StateUpdateRow[] = [];

	for (const event of events) {
		const p = payloadOf(event);
		const step = stepOf(event);

		transactionId ??= str(event.correlation.transactionId);
		placetopayId ??=
			str(event.correlation.placetopayId) ?? str(p.updated_placetopay_id);
		gateway ??= str(p.gateway);

		if (p.new_status !== undefined) {
			// «Calling updateSessionStateAction…»: la decisión de DefineSessionState.
			seedState(session, str(p.session_state));
			pushState(session, str(p.new_status));
		} else if (step === "UpdateSessionStateAction start") {
			seedState(session, str(p.actual_session_state));
			pushState(session, str(p.state_to_update));
		} else if (step === "Updating") {
			pushState(session, str(p.new_state));
		} else if (step === "Executed event") {
			seedState(session, str(p.session_state));
			pushState(transaction, str(p.transaction_state));
			before ??= num(p.session_remaining);
		} else if (step === "transaction is approved") {
			after = num(p.session_remaining_evaluate);
		} else if (step === "Start Updating" || step === "Transaction resolved") {
			pushState(transaction, str(p.state));
		}

		rows.push({
			event,
			detail: detailOf(event, p),
			warning: event.level === "WARNING",
		});
	}

	return {
		session,
		transaction,
		transactionState: transaction[transaction.length - 1] ?? null,
		transactionId,
		placetopayId,
		gateway,
		remaining: before !== null && after !== null ? { before, after } : null,
		hasWarning: rows.some((r) => r.warning),
		rows,
	};
}
