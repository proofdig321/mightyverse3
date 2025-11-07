import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export type TimelineItem = {
  id: string;
  startMs: number;
  durationMs: number;
  cardCid: string;
  layer?: number;
  z?: number;
};

export type DeckPlayerProps = {
  playbackUrl: string;
  timeline?: TimelineItem[];
  wsUrl?: string;
  onImpression?: (item: TimelineItem) => void;
};

export default function DeckPlayer({ playbackUrl, timeline = [], wsUrl, onImpression }: DeckPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const [items, setItems] = React.useState<TimelineItem[]>(timeline || []);

  // Merge external timeline prop into items when it changes
  useEffect(() => {
    setItems((cur) => {
      // naive merge: keep existing plus new ones from prop that aren't present
      const ids = new Set(cur.map((i) => i.id));
      const merged = [...cur];
      timeline.forEach((t) => {
        if (!ids.has(t.id)) merged.push(t);
      });
      return merged;
    });
  }, [timeline]);

  // WebSocket listener for live placement events
  useEffect(() => {
    if (!wsUrl) return;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.addEventListener('message', (ev) => {
        try {
          const m = JSON.parse(ev.data as string);
          if (m && m.type === 'placement.scheduled' && m.payload && m.payload.placement) {
            const pl = m.payload.placement;
            const item: TimelineItem = {
              id: pl.id,
              startMs: (pl.startTime || 0) * 1000,
              durationMs: (pl.duration || 0) * 1000,
              cardCid: pl.assetCid,
              layer: pl.layer,
              z: pl.z
            };
            setItems((s) => {
              if (s.find((it) => it.id === item.id)) return s;
              return [...s, item];
            });
          }
        } catch (err) {
          // ignore
        }
      });
    } catch (err) {
      // ignore connection errors
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
    } else {
      video.src = playbackUrl;
    }

    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [playbackUrl]);

  useEffect(() => {
    const video = videoRef.current;
  if (!video || items.length === 0) return;

    function schedule() {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];

      const nowMs = (video?.currentTime || 0) * 1000;

      items.forEach((item) => {
        const relativeStart = item.startMs - nowMs;
        if (relativeStart + item.durationMs < 0) return;
        const startTimer = window.setTimeout(() => {
          renderCard(item);
          if (onImpression) onImpression(item);
          const endTimer = window.setTimeout(() => clearCard(item), item.durationMs);
          timersRef.current.push(endTimer as unknown as number);
        }, Math.max(0, relativeStart));
        timersRef.current.push(startTimer as unknown as number);
      });
    }

    const onPlay = () => schedule();
    video.addEventListener('play', onPlay);
    video.addEventListener('seeked', schedule);

    schedule();
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('seeked', schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, onImpression]);

  function renderCard(item: TimelineItem) {
    const container = overlayRef.current;
    if (!container) return;
    const el = document.createElement('div');
    el.setAttribute('data-card-id', item.id);
    el.style.position = 'absolute';
    el.style.left = '10%';
    el.style.top = `${10 + (item.layer || 0) * 6}%`;
    el.style.width = '200px';
    el.style.height = '120px';
    el.style.background = 'rgba(255,255,255,0.95)';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';
    el.style.zIndex = String(item.z || 10);
    el.innerText = `Card: ${item.cardCid}`;
    container.appendChild(el);
  }

  function clearCard(item: TimelineItem) {
    const container = overlayRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-card-id="${item.id}"]`);
    if (el) el.remove();
  }

  return (
    <div className="deck-player" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video ref={videoRef} controls playsInline style={{ width: '100%', height: '100%' }} />
      <div ref={overlayRef} className="deck-overlay" style={{ pointerEvents: 'none', position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
    </div>
  );
}
