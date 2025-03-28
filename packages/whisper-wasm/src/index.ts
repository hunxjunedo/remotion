import type {
	DownloadWhisperModelParams,
	DownloadWhisperModelResult,
	downloadWhisperModel as originalDownloadWhisperModel,
} from './download-whisper-model';
import type {
	transcribe as originalTranscribe,
	TranscribeParams,
} from './transcribe';

export const transcribe: typeof originalTranscribe = () => {
	throw new Error(
		'Loading this module from CommonJS is not supported. Load the ESM version of @remotion/whisper-wasm.',
	);
};

export const downloadWhisperModel: typeof originalDownloadWhisperModel = () => {
	throw new Error(
		'Loading this module from CommonJS is not supported. Load the ESM version of @remotion/whisper-wasm.',
	);
};

export type {
	DownloadWhisperModelParams,
	DownloadWhisperModelResult,
	TranscribeParams,
};
