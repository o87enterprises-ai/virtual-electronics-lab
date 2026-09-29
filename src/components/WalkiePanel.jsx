// The payoff for a correctly wired transmitter: push-to-talk with your real
// microphone. Holding the button also presses S1 on the board, so the
// circuit powers up while you talk; letting go plays your transmission back
// the way a receiver would hear it (band-limited, a little distorted, with
// squelch noise and a roger beep).

import { useEffect, useRef, useState } from 'react';
import { X, Mic, RadioTower } from 'lucide-react';
import { coilMicroHenry, resonantMHz } from '../lib/radio';

const TANK_PF = 26;
const channelMHz = (turns) => resonantMHz(TANK_PF, coilMicroHenry(turns));

function playOverTheAir(ctx, buffer) {
  const t0 = ctx.currentTime + 0.05;
  const out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(ctx.destination);

  const noiseBurst = (start, dur, level) => {
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * level;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(out);
    src.start(start);
  };

  // voice: telephone band, soft clipping, a bed of hiss
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
  const clip = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) { const x = (i / 511.5) - 1; curve[i] = Math.tanh(2.5 * x); }
  clip.curve = curve;
  const voice = ctx.createGain(); voice.gain.value = 1.6;
  src.connect(hp).connect(lp).connect(voice).connect(clip).connect(out);

  noiseBurst(t0, 0.12, 0.35);                          // squelch opening
  src.start(t0 + 0.12);
  noiseBurst(t0 + 0.12, buffer.duration, 0.03);        // hiss under the voice
  const end = t0 + 0.12 + buffer.duration;
  const beep = ctx.createOscillator(); beep.frequency.value = 1200;
  const bg = ctx.createGain(); bg.gain.value = 0.18;
  beep.connect(bg).connect(out);
  beep.start(end + 0.05); beep.stop(end + 0.2);        // roger beep
  noiseBurst(end + 0.22, 0.18, 0.3);                   // squelch tail
  return end + 0.45 - ctx.currentTime;
}

export default function WalkiePanel({ coilTurns = 5, onPtt, onClose }) {
  const [state, setState] = useState('idle');   // idle | asking | talking | receiving | denied | unsupported
  const [seconds, setSeconds] = useState(0);
  const rec = useRef(null);                      // { stream, recorder, chunks, ctx, started }
  const holding = useRef(false);
  const mhz = channelMHz(coilTurns);

  useEffect(() => () => {
    rec.current?.stream?.getTracks().forEach((t) => t.stop());
    rec.current?.ctx?.close();
  }, []);

  useEffect(() => {
    if (state !== 'talking') return undefined;
    const id = setInterval(() => setSeconds((Date.now() - rec.current.started) / 1000), 100);
    return () => clearInterval(id);
  }, [state]);

  const start = async () => {
    holding.current = true;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setState('unsupported'); return; }
    onPtt(true);
    try {
      if (!rec.current) {
        setState('asking');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        rec.current = { stream, ctx: new (window.AudioContext || window.webkitAudioContext)() };
      }
      if (!holding.current) { onPtt(false); setState('idle'); return; }   // let go while the permission prompt was up
      await rec.current.ctx.resume();
      const chunks = [];
      const recorder = new MediaRecorder(rec.current.stream);
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = async () => {
        onPtt(false);
        if (!chunks.length) { setState('idle'); return; }
        try {
          const buf = await rec.current.ctx.decodeAudioData(await new Blob(chunks).arrayBuffer());
          setState('receiving');
          const secs = playOverTheAir(rec.current.ctx, buf);
          setTimeout(() => setState((s) => (s === 'receiving' ? 'idle' : s)), secs * 1000);
        } catch {
          setState('idle');
        }
      };
      Object.assign(rec.current, { recorder, started: Date.now() });
      recorder.start();
      setSeconds(0);
      setState('talking');
    } catch {
      onPtt(false);
      setState('denied');
    }
  };

  const stop = () => {
    holding.current = false;
    const r = rec.current?.recorder;
    if (r && r.state === 'recording') r.stop();
    else onPtt(false);
  };

  const talking = state === 'talking';
  const message = {
    idle: 'Hold the button and speak. Let go to hear your transmission.',
    asking: 'Allow microphone access to transmit…',
    talking: `Transmitting on ${mhz.toFixed(1)} MHz… ${seconds.toFixed(1)} s`,
    receiving: 'Receiving… that\'s you, over the air.',
    denied: 'Microphone access was blocked. Allow it in your browser\'s site settings, then try again.',
    unsupported: 'This browser can\'t record audio. Try Chrome, Edge, Firefox or Safari.',
  }[state];

  return (
    <div style={panel} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <RadioTower size={18} color="#6aa2ff" />
        <div style={{ fontWeight: 700, flex: 1 }}>Your walkie-talkie</div>
        <button onClick={onClose} aria-label="Close walkie-talkie" style={iconBtn}><X size={18} /></button>
      </div>
      <div style={{ fontFamily: 'monospace', color: '#9ab', fontSize: '0.8rem', marginBottom: 12 }}>
        Channel {mhz.toFixed(1)} MHz · L1 {coilTurns} turns, C1 {TANK_PF} pF
      </div>
      <button
        onPointerDown={(e) => { e.preventDefault(); start(); }}
        onPointerUp={stop}
        onPointerLeave={() => holding.current && stop()}
        onKeyDown={(e) => { if (e.key === ' ' && !e.repeat) { e.preventDefault(); start(); } }}
        onKeyUp={(e) => { if (e.key === ' ') stop(); }}
        disabled={state === 'receiving' || state === 'unsupported'}
        style={{
          width: '100%', padding: '22px 0', borderRadius: 14, cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, touchAction: 'none', userSelect: 'none',
          border: `2px solid ${talking ? '#ef4444' : '#3b82f6'}`,
          background: talking ? '#4a1414' : '#11233f', color: talking ? '#ffb4b4' : '#cfe0ff',
          boxShadow: talking ? '0 0 24px rgba(239,68,68,0.45)' : 'none',
        }}
      >
        <Mic size={20} /> {talking ? 'Release to send' : 'Hold to talk'}
      </button>
      <div style={{ marginTop: 10, minHeight: 36, fontSize: '0.82rem', color: state === 'denied' ? '#ffaa77' : '#bbb' }}>{message}</div>
      <div style={{ fontSize: '0.68rem', color: '#666', lineHeight: 1.45 }}>
        Holding the button also presses S1 on your board, so you can watch the transistor switch on while you talk.
        Your voice stays on this device: it&apos;s played back the way a receiver on your channel would hear it.
      </div>
    </div>
  );
}

const panel = {
  position: 'absolute', right: 16, bottom: 70, width: 320, maxWidth: 'calc(100% - 32px)', zIndex: 40,
  background: 'rgba(16,16,18,0.98)', border: '1px solid #333', borderRadius: 14, padding: 14,
  color: '#eee', fontFamily: 'system-ui, -apple-system, sans-serif', pointerEvents: 'auto',
  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
};
const iconBtn = { background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 4, display: 'flex' };
