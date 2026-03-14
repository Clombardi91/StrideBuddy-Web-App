'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getBestAudioMimeType } from '../lib/uploadAudio';

export type RecorderState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'stopped'
  | 'error';

export interface RecorderResult {
  state: RecorderState;
  durationSeconds: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  mimeType: string;
  analyserNode: AnalyserNode | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

const MAX_SECONDS = 60;

export function useAudioRecorder(): RecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [durationSeconds, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setAnalyserNode(null);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setState('requesting');
    chunksRef.current = [];

    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error('This browser does not support audio recording.');
      }

      if (typeof MediaRecorder === 'undefined') {
        throw new Error('This browser does not support MediaRecorder.');
      }

      // Use simpler constraints first for best compatibility
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error('This browser does not support AudioContext.');
      }

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      setAnalyserNode(analyser);

      const mimeType = getBestAudioMimeType();
      mimeTypeRef.current = mimeType;

      const recorderOptions =
        mimeType && MediaRecorder.isTypeSupported(mimeType)
          ? { mimeType }
          : undefined;

      const mediaRecorder = recorderOptions
        ? new MediaRecorder(stream, recorderOptions)
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        setState('error');
        cleanup();
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || 'audio/webm',
        });

        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setState('stopped');
        cleanup();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);

      setState('recording');
      setDuration(0);

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setDuration(elapsed);

        if (elapsed >= MAX_SECONDS) {
          stop();
        }
      }, 1000);
    } catch (err) {
      console.error('Recorder start error:', err);
      cleanup();
      setState('error');

      if (err instanceof DOMException) {
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          setError(
            'Microphone access denied. Please allow it in your browser settings and try again.',
          );
        } else if (err.name === 'NotFoundError') {
          setError(
            'No microphone found. Please connect a microphone and try again.',
          );
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Could not access your microphone. Please try again.');
      }
    }
  }, [cleanup, stop]);

  const reset = useCallback(() => {
    stop();
    cleanup();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setState('idle');
    chunksRef.current = [];
  }, [stop, cleanup, audioUrl]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      cleanup();
    };
  }, [cleanup, audioUrl]);

  return {
    state,
    durationSeconds,
    audioBlob,
    audioUrl,
    mimeType: mimeTypeRef.current,
    analyserNode,
    error,
    start,
    stop,
    reset,
  };
}