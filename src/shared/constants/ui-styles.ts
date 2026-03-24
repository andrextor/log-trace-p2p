import type { CategoryStyle, LogCategory } from "../types";

export const CATEGORY_STYLES: Record<LogCategory, CategoryStyle> = {
	USER_ACTION: {
		label: "user action",
		classes:
			"bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20",
	},
	BROWSER_LOAD: {
		label: "browser load",
		classes:
			"bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
	},
	HTTP_REQ_IN: {
		label: "incoming request",
		classes:
			"bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
	},
	HTTP_REQ_OUT: {
		label: "outgoing request",
		classes:
			"bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
	},
	HTTP_RES: {
		label: "http response",
		classes:
			"bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
	},
	DB_OP: {
		label: "backend / db",
		classes:
			"bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20",
	},
	NOTIFICATION: {
		label: "merchant notification",
		classes:
			"bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
	},
	BACKEND_LOG: {
		label: "backend trace",
		classes:
			"bg-slate-100 text-slate-600 border-slate-200 dark:bg-green-500/5 dark:text-green-400/80 dark:border-green-500/10",
	},
	APPLICATION_LOG: {
		label: "application log",
		classes:
			"bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
	},
	RETURN_NOTIFICATION: {
		label: "return notification",
		classes:
			"bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
	},
	ERROR: {
		label: "ERROR / FAIL",
		classes:
			"bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-500/50",
	},
	PAYMENT: {
		label: "payment",
		classes:
			"bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
	},
	GENERIC: {
		label: "general",
		classes:
			"bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20",
	},
};
