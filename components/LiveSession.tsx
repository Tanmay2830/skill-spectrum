
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Activity, RefreshCcw, AlertCircle, Headphones, SignalHigh, Globe } from 'lucide-react';

interface LiveSessionProps {
  onClose: () => void;
}

// Standardized manual encoding/decoding as per @google/genai examples
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const NeuralField: React.FC<{ volume: number, active: boolean }> = ({ volume, active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 250 + (active ? volume * 2 : 0);
      
      ctx.beginPath();
      ctx.strokeStyle = active ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;

      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        const noise = Math.sin(time + i * 0.1) * (active ? volume : 5);
        const r = baseRadius + noise;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner flowing particles
      if (active) {
        for (let j = 0; j < 5; j++) {
           const rInner = (baseRadius * 0.8) - (j * 20);
           ctx.beginPath();
           ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 / (j + 1)})`;
           for (let i = 0; i < 40; i++) {
             const angle = (i / 40) * Math.PI * 2 + (time * (j % 2 === 0 ? 1 : -1));
             const x = centerX + Math.cos(angle) * rInner;
             const y = centerY + Math.sin(angle) * rInner;
             if (i === 0) ctx.moveTo(x, y);
             else ctx.lineTo(x, y);
           }
           ctx.closePath();
           ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [active, volume]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-40" />;
};

const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'error' | 'closed'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [volume, setVolume] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    setStatus('connecting');
    setErrorMessage('');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Critical: Biometric sensor access denied or unsupported.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputContextRef.current = inputCtx;
      
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('active');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length) * 100);

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
               nextStartTime = Math.max(nextStartTime, outputCtx.currentTime);
               const audioBuffer = await decodeAudioData(
                 decode(base64EncodedAudioString),
                 outputCtx,
                 24000,
                 1,
               );
               const source = outputCtx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode);
               source.addEventListener('ended', () => {
                 sources.delete(source);
               });

               source.start(nextStartTime);
               nextStartTime = nextStartTime + audioBuffer.duration;
               sources.add(source);
            }
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
               for (const source of sources.values()) {
                 try { source.stop(); } catch(e) {}
                 sources.delete(source);
               }
               nextStartTime = 0;
            }
          },
          onclose: () => setStatus('closed'),
          onerror: (e) => {
            console.error('Session Error:', e);
            setStatus('error');
            setErrorMessage('Uplink synchronization protocol failed. Connection lost.');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Zephyr'}},
          },
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error('Initialization Error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'NEURAL LINK INITIALIZATION FAILED. CHECK HARDWARE.');
    }
  };

  useEffect(() => {
    startSession();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    inputContextRef.current?.close();
    audioContextRef.current?.close();
  };

  const handleRetry = () => {
    cleanup();
    startSession();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#050507] relative overflow-hidden p-10 animate-in fade-in duration-500">
      
      <NeuralField volume={volume} active={status === 'active'} />

      <div className="text-center space-y-12 max-w-lg w-full z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Globe className={`w-4 h-4 ${status === 'active' ? 'text-blue-500 animate-spin-slow' : 'text-slate-700'}`} />
            <h2 className="text-sm font-black text-white tracking-[0.4em] uppercase">Neural Comms V5</h2>
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-slate-800'}`} />
          </div>
          <p className="text-[10px] font-mono text-slate-500 tracking-widest">PERSONALIZED SYNC ACTIVE</p>
        </div>
        
        <div className="relative flex justify-center py-10">
          <div className={`w-48 h-48 rounded-full border flex items-center justify-center transition-all duration-700 relative
            ${status === 'active' ? 'border-blue-500/50 shadow-[0_0_80px_rgba(59,130,246,0.15)]' : 
              status === 'error' ? 'border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]' : 'border-slate-800'}`}>
             
             {status === 'error' ? (
               <AlertCircle className="w-16 h-16 text-red-500 animate-pulse" />
             ) : (
               <div className="relative">
                 <Headphones className={`w-16 h-16 transition-colors duration-500 ${status === 'active' ? 'text-blue-400' : 'text-slate-800'}`} />
                 {status === 'active' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />}
               </div>
             )}

             {/* Inner UI Pulse */}
             {status === 'active' && (
               <>
                 <div className="absolute inset-[-15px] rounded-full border border-blue-400/20 opacity-30" 
                      style={{transform: `scale(${1 + volume/25})`, transition: 'transform 0.05s ease-out'}} />
               </>
             )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`font-mono text-[9px] tracking-[0.2em] uppercase transition-colors p-5 rounded-2xl border border-white/5 bg-white/5 inline-block mx-auto ${status === 'error' ? 'text-red-400 border-red-500/20 bg-red-900/10' : 'text-slate-500'}`}>
            {status === 'connecting' && "Requesting handshake with neural intelligence core..."}
            {status === 'active' && "Handshake Verified. Adaptive Sync Active."}
            {status === 'error' && errorMessage}
            {status === 'closed' && "Biometric session terminated."}
          </div>

          <div className="flex justify-center gap-4">
            {status === 'error' ? (
              <button 
                onClick={handleRetry} 
                className="px-8 py-3 bg-white text-black hover:bg-slate-200 rounded-xl font-black text-[10px] flex items-center gap-3 transition-all active:scale-95 uppercase tracking-widest shadow-lg"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Re-sync Protocol
              </button>
            ) : null}
            
            <button 
              onClick={onClose} 
              className={`px-8 py-4 rounded-xl font-black text-[10px] flex items-center gap-3 transition-all active:scale-95 uppercase tracking-widest
                ${status === 'error' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-red-600/90 text-white hover:bg-red-500 shadow-xl shadow-red-900/20'}`}
            >
              <PhoneOff className="w-3.5 h-3.5" /> {status === 'error' ? 'De-authorize Terminal' : 'Terminate Link'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LiveSession;
