import { P2PParserEngine } from "@andrextor_ia11012/p2p-log-parser";
import { computed, nextTick, ref, watch } from "vue";
import { useLogStore } from "../../store/logStore";
import type { AnalyzerType } from "../types";

const MAX_STORE_LIMIT = 20000;
const BATCH_SIZE = 5000;
const MIN_LINE_LENGTH = 5;

/**
 * Contador de líneas ultra-rápido.
 * Evita hacer .split('\n') en textos de 20MB para no congelar el navegador.
 */
function fastLineCount(text: string): number {
	if (!text) return 0;
	let count = 0;
	let pos = 0;
	while (true) {
		const nextPos = text.indexOf("\n", pos);
		const line = nextPos !== -1 ? text.slice(pos, nextPos) : text.slice(pos);
		if (line.trim().length > MIN_LINE_LENGTH) count++;
		if (nextPos === -1) break;
		pos = nextPos + 1;
	}
	return count;
}

export function useLogUploader(targetType: AnalyzerType) {
	const store = useLogStore();
	const engine = new P2PParserEngine();
	const supportedFormats = engine.getSupportedFormats();

	// --- STATE ---
	const raw = ref("");
	const leftovers = ref<string[]>([]);
	const isDragging = ref(false);
	const isOpeningDialog = ref(false);
	const isReadingFile = ref(false);
	const currentInputCount = ref(0);
	const detectedFormat = ref<string | null>(null);
	const detectedFormatName = ref<string | null>(null);

	// --- COMPUTED ---
	const availableFormats = computed(() => {
		return supportedFormats[targetType as keyof typeof supportedFormats] || [];
	});

	const totalAccumulatedLines = computed(() => {
		const currentAppCount = store.counts[targetType] || 0;
		return currentAppCount + currentInputCount.value + leftovers.value.length;
	});

	const isOverLimit = computed(
		() => totalAccumulatedLines.value > MAX_STORE_LIMIT,
	);
	const needsSplitting = computed(() => currentInputCount.value > BATCH_SIZE);

	// --- LOGIC ---
	function detectFormat(text: string) {
		if (!text.trim()) {
			detectedFormat.value = null;
			detectedFormatName.value = null;
			return;
		}

		const lines = text
			.split("\n", 20)
			.filter((l) => l.trim().length > MIN_LINE_LENGTH);
		if (lines.length === 0) {
			detectedFormat.value = null;
			detectedFormatName.value = null;
			return;
		}

		// Ampliamos un poco la muestra para asegurar que capturamos líneas útiles además del header
		const sample = lines.slice(0, 10).join("\n");
		const result = engine.parse(sample, targetType);

		// Identificadores fuertes
		const isGrafanaCsv = sample.includes("grafana_internal");
		const isAwsCsv =
			sample.includes(',"{') && /^\d{4}-\d{2}-\d{2}/.test(sample);
		const isJson =
			sample.trim().startsWith("{") || sample.trim().startsWith("[");

		// Si el motor logra parsear ALGO, o si tiene la huella indudable de Grafana/AWS, BRILLA.
		if (result.events.length > 0 || isGrafanaCsv || isAwsCsv) {
			detectedFormat.value = "Formato compatible detectado";

			if (targetType === "checkout") {
				if (isGrafanaCsv) {
					detectedFormatName.value = "Grafana CSV Parser";
				} else if (isAwsCsv) {
					detectedFormatName.value = "AWS CSV Parser";
				} else if (
					isJson &&
					sample.includes("session_id") &&
					sample.includes('"message"')
				) {
					detectedFormatName.value = "Insights Parser";
				} else if (isJson && sample.includes("level_name")) {
					detectedFormatName.value = "Local Parser";
				} else {
					detectedFormatName.value = "Generic Parser";
				}
			} else if (targetType === "rest") {
				if (isGrafanaCsv) {
					detectedFormatName.value = "Grafana REST Parser";
				} else if (isJson && sample.includes("@timestamp")) {
					detectedFormatName.value = "Rest New Relic Parser";
				} else {
					detectedFormatName.value = "Generic REST Parser";
				}
			}
		} else {
			detectedFormat.value = null;
			detectedFormatName.value = null;
		}
	}

	function processIncomingText(text: string) {
		const trimmed = text.trim();
		if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			try {
				const parsed = JSON.parse(trimmed);
				if (Array.isArray(parsed)) {
					const formattedText = parsed
						.map((obj) => JSON.stringify(obj))
						.join("\n");
					raw.value = formattedText;
					detectFormat(formattedText);
					return;
				}
			} catch (e) {
				console.warn("JSON inválido.");
			}
		}
		raw.value = text;
		detectFormat(text);
	}

	function openFilePicker(fileInput: HTMLInputElement | null) {
		if (isReadingFile.value || store.isProcessing) return;
		isOpeningDialog.value = true;
		fileInput?.click();
		setTimeout(() => {
			isOpeningDialog.value = false;
		}, 1200);
	}

	async function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			isReadingFile.value = true;
			try {
				const text = await file.text();
				processIncomingText(text);
				leftovers.value = [];
			} finally {
				target.value = "";
				isReadingFile.value = false;
			}
		}
	}

	function onPaste(e: ClipboardEvent) {
		const content = e.clipboardData?.getData("text") ?? "";
		processIncomingText(content);
		leftovers.value = [];
	}

	async function handleFileDrop(e: DragEvent) {
		isDragging.value = false;
		const file = e.dataTransfer?.files[0];
		if (file) {
			isReadingFile.value = true;
			try {
				const text = await file.text();
				processIncomingText(text);
				leftovers.value = [];
			} finally {
				isReadingFile.value = false;
			}
		}
	}

	function clearEditor() {
		raw.value = "";
		leftovers.value = [];
		currentInputCount.value = 0;
		detectedFormat.value = null;
		detectedFormatName.value = null;
	}

	async function triggerProcess(onComplete?: () => void) {
		if (!raw.value || isOverLimit.value || store.isProcessing) return;
		const allLines = raw.value
			.split("\n")
			.filter((l) => l.trim().length > MIN_LINE_LENGTH);

		if (allLines.length > BATCH_SIZE) {
			const firstBatch = allLines.slice(0, BATCH_SIZE).join("\n");
			leftovers.value = allLines.slice(BATCH_SIZE);
			await store.processLogs(firstBatch, targetType);
			raw.value = "";
		} else {
			await store.processLogs(raw.value, targetType);
			raw.value = "";
			leftovers.value = [];
		}
		await nextTick();
		onComplete?.();
	}

	async function processRemaining(onComplete?: () => void) {
		if (leftovers.value.length === 0 || store.isProcessing) return;
		const nextBatch = leftovers.value.slice(0, BATCH_SIZE).join("\n");
		leftovers.value = leftovers.value.slice(BATCH_SIZE);
		await store.processLogs(nextBatch, targetType);
		if (leftovers.value.length === 0) onComplete?.();
	}

	// --- WATCHERS ---
	watch(raw, (newVal) => {
		if (!newVal.trim()) {
			currentInputCount.value = 0;
			return;
		}
		currentInputCount.value = fastLineCount(newVal);
	});

	return {
		raw,
		leftovers,
		isDragging,
		isOpeningDialog,
		isReadingFile,
		detectedFormat,
		detectedFormatName,
		currentInputCount,
		availableFormats,
		totalAccumulatedLines,
		isOverLimit,
		needsSplitting,
		MAX_STORE_LIMIT,
		openFilePicker,
		handleFileSelect,
		onPaste,
		handleFileDrop,
		clearEditor,
		triggerProcess,
		processRemaining,
	};
}
