// The payoff for a correctly wired FM receiver: a tuning dial that plays real
// stations. Web pages can't reach a phone's FM tuner chip, so the stations
// are the same broadcasters' live internet streams (from the free
// radio-browser.info directory), placed on the dial at their real FM
// frequency when their name gives it, with static in between.

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Power, Radio } from 'lucide-react';
import { coilMicroHenry, resonantMHz, tankPicoFarad } from '../lib/radio';

const BAND = [88, 108];
const LOCK_MHZ = 0.35;          // how close the dial must be to hear a station
const DIRECTORY = ['https://de1.api.radio-browser.info', 'https://de2.api.radio-browser.info', 'https://all.api.radio-browser.info'];


const FREQ_IN_NAME = /(?:^|[^\d.])((?:8[89]|9\d|10[0-7])[.,]\d)(?!\d)/;

async function fetchStations(signal) {
  const region = (navigator.language || '').split('-')[1];
  const query = 'hidebroken=true&order=clickcount&reverse=true&limit=80&is_https=true';
  for (const base of DIRECTORY) {
    try {
      const tries = region ? [`${query}&countrycode=${region}`, query] : [query];
      for (const q of tries) {
        const res = await fetch(`${base}/json/stations/search?${q}`, { signal });
        if (!res.ok) continue;
        const list = (await res.json()).filter((s) => s.url_resolved?.startsWith('https://') && /mp3|aac/i.test(s.codec || ''));
        if (list.length >= 6) return list;
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
    }
  }
  return [];
}

// Real dial position when the name carries one; otherwise the free slots.
function placeOnDial(list) {
  const placed = [];
  const taken = (f) => placed.some((p) => Math.abs(p.mhz - f) < 0.8);
  for (const s of list) {
    const m = s.name.match(FREQ_IN_NAME);
    const f = m ? parseFloat(m[1].replace(',', '.')) : null;
    if (f && !taken(f)) placed.push({ ...s, mhz: f, real: true });
    if (placed.length >= 12) break;
  }
  for (let f = 88.7; f < BAND[1] && placed.length < 12; f += 1.6) {
    const s = list.find((x) => !placed.includes(x) && !placed.some((p) => p.stationuuid === x.stationuuid));
    if (!s) break;
    if (!taken(f)) placed.push({ ...s, mhz: +f.toFixed(1), real: false });
  }
  return placed.sort((a, b) => a.mhz - b.mhz);
}

export default function RadioPanel({ coilTurns = 5, onClose }) {
  const uH = coilMicroHenry(coilTurns);
  const [mhz, setMhz] = useState(98.1);
  const [on, setOn] = useState(false);
  const [stations, setStations] = useState(null);   // null = loading
  const [dead, setDead] = useState(() => new Set());
  const [volume, setVolume] = useState(0.8);
  const audio = useRef(null);
  const noise = useRef(null);                        // { ctx, gain }

  useEffect(() => {
    const ac = new AbortController();
    fetchStations(ac.signal).then((l) => setStations(placeOnDial(l))).catch(() => {});
    return () => ac.abort();
  }, []);

  useEffect(() => () => {
    audio.current?.pause();
    noise.current?.ctx.close();
  }, []);

  const live = useMemo(() => (stations || []).filter((s) => !dead.has(s.stationuuid)), [stations, dead]);
  const nearest = useMemo(() => live.reduce((best, s) => (
    !best || Math.abs(s.mhz - mhz) < Math.abs(best.mhz - mhz) ? s : best), null), [live, mhz]);
  const signal = nearest ? Math.max(0, 1 - Math.abs(nearest.mhz - mhz) / LOCK_MHZ) : 0;
  const tuned = signal > 0 ? nearest : null;
  const inBand = resonantMHz(10, uH) >= BAND[0] && resonantMHz(60, uH) <= BAND[1];

  // Station audio: plain <audio>, so streams without CORS headers still play.
  useEffect(() => {
    if (!on) { audio.current?.pause(); return; }
    if (!audio.current) {
      audio.current = new Audio();
      audio.current.preload = 'none';
    }
    const a = audio.current;
    const url = tuned?.url_resolved;
    if (!url) { a.pause(); return; }
    if (a.dataset.station !== tuned.stationuuid) {
      a.dataset.station = tuned.stationuuid;
      a.src = url;
      const uuid = tuned.stationuuid;
      a.onerror = () => setDead((d) => new Set(d).add(uuid));
      a.play().catch(() => {});
    }
  }, [on, tuned]);

  useEffect(() => {
    if (audio.current) audio.current.volume = Math.min(1, signal * volume);
    if (noise.current) noise.current.gain.gain.value = (1 - signal) * 0.18 * volume * (on ? 1 : 0);
  }, [signal, volume, on]);

  const powerOn = () => {
    if (!noise.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass'; band.frequency.value = 2500; band.Q.value = 0.4;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(band).connect(gain).connect(ctx.destination);
      src.start();
      noise.current = { ctx, gain };
    }
    noise.current.ctx.resume();
    setOn((v) => !v);
  };

  const pct = (f) => `${((f - BAND[0]) / (BAND[1] - BAND[0])) * 100}%`;

  return (
    <div style={panel} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Radio size={18} color="#6aa2ff" />
        <div style={{ fontWeight: 700, flex: 1 }}>Your FM receiver</div>
        <button onClick={onClose} aria-label="Close radio" style={iconBtn}><X size={18} /></button>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '2rem', color: on ? '#7dffb0' : '#445', textShadow: on ? '0 0 12px #2f8' : 'none' }}>{mhz.toFixed(1)}</div>
        <div style={{ color: '#888' }}>MHz</div>
        <div style={{ flex: 1 }} />
        <button onClick={powerOn} style={{ ...pill, background: on ? '#14532d' : '#262626', borderColor: on ? '#22c55e' : '#3d3d3d', color: on ? '#9af5b8' : '#ddd' }}>
          <Power size={15} /> {on ? 'On' : 'Turn on'}
        </button>
      </div>

      <div style={{ position: 'relative', height: 26, margin: '4px 2px 2px' }}>
        {(stations || []).map((s) => (
          <div key={s.stationuuid} title={s.name} style={{
            position: 'absolute', left: pct(s.mhz), top: 4, width: 2, height: 14,
            background: dead.has(s.stationuuid) ? '#333' : s.real ? '#6aa2ff' : '#446', transform: 'translateX(-1px)',
          }} />
        ))}
        <div style={{ position: 'absolute', left: pct(mhz), top: 0, width: 2, height: 22, background: '#ff5555', transform: 'translateX(-1px)' }} />
      </div>
      <input
        type="range" min={BAND[0]} max={BAND[1]} step="0.1" value={mhz} aria-label="Tuning"
        onChange={(e) => setMhz(Number(e.target.value))} style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#666' }}>
        <span>88</span><span>98</span><span>108</span>
      </div>

      <div style={{ margin: '10px 0', minHeight: 40 }}>
        {!on ? <div style={{ color: '#888', fontSize: '0.85rem' }}>Turn it on, then drag the dial.</div>
          : stations === null ? <div style={{ color: '#888', fontSize: '0.85rem' }}>Finding stations…</div>
            : stations.length === 0 ? <div style={{ color: '#ffaa77', fontSize: '0.85rem' }}>Couldn&apos;t reach the station directory. Check your connection; you&apos;ll still hear the static.</div>
              : tuned ? (
                <div>
                  <div style={{ fontWeight: 600 }}>{tuned.name.trim()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>
                    {[tuned.state, tuned.country].filter(Boolean).join(', ')} · signal {Math.round(signal * 100)}%{tuned.real ? '' : ' · dial position assigned'}
                  </div>
                </div>
              ) : <div style={{ color: '#888', fontSize: '0.85rem' }}>Static… keep tuning (blue marks are stations).</div>}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#999' }}>
        Volume
        <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ flex: 1 }} />
      </label>

      <div style={{ marginTop: 10, padding: 8, background: '#0f0f0f', border: '1px solid #262626', borderRadius: 8, fontSize: '0.72rem', color: '#9ab', fontFamily: 'monospace', lineHeight: 1.5 }}>
        Tank: L1 {coilTurns} turns ≈ {uH.toFixed(2)} µH, C1 ≈ {tankPicoFarad(mhz, uH).toFixed(1)} pF
        <br />f = 1 / (2π√(LC)) = {mhz.toFixed(1)} MHz
        {!inBand && <div style={{ color: '#ffaa77' }}>With {coilTurns} turns this tank can&apos;t reach the FM band; use 5 turns.</div>}
      </div>
      <div style={{ marginTop: 8, fontSize: '0.68rem', color: '#666', lineHeight: 1.45 }}>
        Web pages can&apos;t use a phone&apos;s FM tuner chip, so you&apos;re hearing each station&apos;s live internet stream,
        placed on the dial at its real FM frequency where its name gives one. Directory: radio-browser.info.
      </div>
    </div>
  );
}

const panel = {
  position: 'absolute', right: 16, bottom: 70, width: 340, maxWidth: 'calc(100% - 32px)', zIndex: 40,
  background: 'rgba(16,16,18,0.98)', border: '1px solid #333', borderRadius: 14, padding: 14,
  color: '#eee', fontFamily: 'system-ui, -apple-system, sans-serif', pointerEvents: 'auto',
  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
};
const iconBtn = { background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 4, display: 'flex' };
const pill = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, border: '1px solid', cursor: 'pointer', fontSize: '0.8rem' };
