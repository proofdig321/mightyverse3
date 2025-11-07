/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import DeckPlayer from '../DeckPlayer';

jest.useFakeTimers();

// Mock hls.js
jest.mock('hls.js', () => {
  return {
    isSupported: () => false,
    default: function() {
      return { attachMedia: jest.fn(), loadSource: jest.fn() };
    }
  };
});

describe('DeckPlayer (scheduling)', () => {
  it('schedules overlays and calls onImpression', () => {
    const timeline = [
      { id: 't1', startMs: 0, durationMs: 1000, cardCid: 'Qm1' },
      { id: 't2', startMs: 500, durationMs: 1000, cardCid: 'Qm2' }
    ];

    const impressions: any[] = [];
    const { container } = render(<DeckPlayer playbackUrl="https://example.com/stream.m3u8" timeline={timeline} onImpression={(i) => impressions.push(i)} />);

    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).toBeTruthy();

    // Simulate play
    act(() => {
      video.currentTime = 0;
      video.dispatchEvent(new Event('play'));
    });

    // Fast-forward timers to trigger overlays
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(impressions.length).toBeGreaterThanOrEqual(1);
  });
});
