import {
	Dimensions,
	LogLevel,
	MediaParserAudioCodec,
	MediaParserVideoCodec,
	parseMedia,
	ParseMediaContainer,
	ParseMediaOnProgress,
	TracksField,
} from '@remotion/media-parser';
import {fetchReader} from '@remotion/media-parser/fetch';
import {webFileReader} from '@remotion/media-parser/web-file';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {Source} from '~/lib/convert-state';

export const useProbe = ({
	src,
	onVideoThumbnail,
	onAudioCodec,
	onVideoCodec,
	onTracks,
	logLevel,
	onProgress,
	onDuration,
}: {
	src: Source;
	logLevel: LogLevel;
	onVideoThumbnail: (videoFrame: VideoFrame) => void;
	onAudioCodec: (codec: MediaParserAudioCodec | null) => void;
	onVideoCodec: (codec: MediaParserVideoCodec | null) => void;
	onTracks: (tracks: TracksField) => void;
	onProgress: ParseMediaOnProgress;
	onDuration: (duration: number | null) => void;
}) => {
	const [audioCodec, setAudioCodec] = useState<
		MediaParserAudioCodec | null | undefined
	>(undefined);
	const [fps, setFps] = useState<number | null | undefined>(undefined);
	const [durationInSeconds, setDurationInSeconds] = useState<number | null>(
		null,
	);
	const [dimensions, setDimensions] = useState<Dimensions | null>(null);
	const [name, setName] = useState<string | null>(null);
	const [videoCodec, setVideoCodec] = useState<MediaParserVideoCodec | null>(
		null,
	);
	const [size, setSize] = useState<number | null>(null);
	const [tracks, setTracks] = useState<TracksField | null>(null);
	const [container, setContainer] = useState<ParseMediaContainer | null>(null);
	const [done, setDone] = useState(false);

	const getStart = useCallback(() => {
		const controller = new AbortController();
		let hasFps = false;
		let hasDuration = false;
		let hasDimensions = false;
		let hasVideoCodec = false;
		let hasAudioCodec = false;
		let hasSize = false;
		let hasName = false;
		let hasFrame = false;
		let hasContainer = false;
		let hasTracks = false;

		const cancelIfDone = () => {
			if (
				hasFps &&
				hasDuration &&
				hasDimensions &&
				hasVideoCodec &&
				hasAudioCodec &&
				hasSize &&
				hasName &&
				hasFrame &&
				hasContainer &&
				hasTracks
			) {
				controller.abort(new Error('Cancelled (all info)'));
			}
		};

		parseMedia({
			logLevel,
			src: src.type === 'file' ? src.file : src.url,
			fields: {
				dimensions: true,
				videoCodec: true,
				size: true,
				durationInSeconds: true,
				audioCodec: true,
				fps: true,
				name: true,
				tracks: true,
				container: true,
			},
			onParseProgress: onProgress,
			reader: src.type === 'file' ? webFileReader : fetchReader,
			signal: controller.signal,

			onVideoTrack: async (track) => {
				if (typeof VideoDecoder === 'undefined') {
					return null;
				}

				let frames = 0;

				const decoder = new VideoDecoder({
					error: (error) => {
						// eslint-disable-next-line no-console
						console.log(error);
					},
					output(frame) {
						onVideoThumbnail(frame);
						frame.close();
						hasFrame = true;
						cancelIfDone();
					},
				});

				if (!(await VideoDecoder.isConfigSupported(track)).supported) {
					return null;
				}

				// TODO: See if possible
				decoder.configure(track);
				return (sample) => {
					if (hasFrame) {
						return;
					}
					frames++;
					if (frames >= 30) {
						hasFrame = true;
						cancelIfDone();
					}

					decoder.decode(new EncodedVideoChunk(sample));
				};
			},
			onContainer(c) {
				hasContainer = true;
				setContainer(c);
				cancelIfDone();
			},
			onAudioCodec: (codec) => {
				hasAudioCodec = true;
				onAudioCodec(codec);
				setAudioCodec(codec);
				cancelIfDone();
			},
			onFps: (f) => {
				hasFps = true;
				setFps(f);
				cancelIfDone();
			},
			onDurationInSeconds: (d) => {
				hasDuration = true;
				setDurationInSeconds(d);
				cancelIfDone();
				onDuration(d);
			},
			onName: (n) => {
				hasName = true;
				setName(n);
				cancelIfDone();
			},
			onDimensions(dim) {
				hasDimensions = true;
				setDimensions(dim);
				cancelIfDone();
			},
			onVideoCodec: (codec) => {
				hasVideoCodec = true;
				onVideoCodec(codec);
				setVideoCodec(codec);
				cancelIfDone();
			},
			onTracks: (trx) => {
				hasTracks = true;

				onTracks(trx);
				setTracks(trx);
				cancelIfDone();
			},
			onSize(s) {
				hasSize = true;
				setSize(s);
				cancelIfDone();
			},
		})
			.then(() => {})
			.catch((err) => {
				if ((err as Error).stack?.includes('Cancelled')) {
					return;
				}
				if ((err as Error).stack?.toLowerCase()?.includes('aborted')) {
					return;
				}

				// eslint-disable-next-line no-console
				console.log(err);
			})
			.finally(() => {
				setDone(true);
			});

		return controller;
	}, [
		onAudioCodec,
		onVideoCodec,
		onVideoThumbnail,
		src,
		onTracks,
		logLevel,
		onProgress,
		onDuration,
	]);

	useEffect(() => {
		const start = getStart();
		return () => {
			start.abort(new Error('Cancelled (strict mode)'));
		};
	}, [getStart]);

	return useMemo(() => {
		return {
			tracks,
			audioCodec,
			fps,
			name,
			container,
			dimensions,
			videoCodec,
			size,
			durationInSeconds,
			done,
		};
	}, [
		audioCodec,
		container,
		dimensions,
		fps,
		name,
		size,
		tracks,
		videoCodec,
		durationInSeconds,
		done,
	]);
};
