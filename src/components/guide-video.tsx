"use client";

import { useEffect, useRef, useState } from "react";
import { VIDEO_SCENES, guideAsset } from "@/lib/guide";

export function GuideVideo() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const timer = useRef<number | null>(null);
  const scene = VIDEO_SCENES[index];

  useEffect(() => {
    return () => stopVoice();
  }, []);

  useEffect(() => {
    if (!playing) {
      stopVoice();
      clearTimer();
      return;
    }
    let alive = true;
    let done = false;
    const finish = () => {
      if (!alive || done) return;
      done = true;
      setIndex((current) => {
        if (current >= VIDEO_SCENES.length - 1) {
          setPlaying(false);
          setEnded(true);
          stopVoice();
          return current;
        }
        return current + 1;
      });
    };
    speak(scene.voice, muted, finish);
    timer.current = window.setTimeout(finish, muted ? 6500 : 12000);
    return () => {
      alive = false;
      clearTimer();
    };

    function clearTimer() {
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    }
  }, [playing, index, muted, scene.voice]);

  function start() {
    setEnded(false);
    setIndex(0);
    setPlaying(true);
  }

  function toggle() {
    if (ended) {
      start();
      return;
    }
    setPlaying((v) => !v);
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="page-kicker">Resumo em vídeo</p>
          <h2 className="font-semibold mt-1">Prefere assistir? Um minuto.</h2>
        </div>
        <span className="text-xs text-muted">A voz sai do aparelho. Pode mutar.</span>
      </div>
      <div className="guide-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={guideAsset(scene.image)} alt="" className="guide-video-frame" />
        <div className="guide-video-shade" />
        <div className="guide-video-copy">
          <div className="text-[11px] uppercase tracking-[0.16em] text-gold">
            {index + 1} / {VIDEO_SCENES.length}
          </div>
          <div className="text-white text-xl font-semibold mt-1">{scene.title}</div>
          <p className="text-[#d5dee6] text-sm mt-1 max-w-lg">{scene.voice}</p>
        </div>
        {!playing ? (
          <button className="guide-video-play" type="button" onClick={ended ? start : () => setPlaying(true)}>
            {ended ? "Ver de novo" : "Play"}
          </button>
        ) : null}
      </div>
      <div className="px-4 py-3 flex items-center gap-3">
        <button className="btn btn-primary" type="button" onClick={toggle}>
          {ended ? "Replay" : playing ? "Pausar" : "Assistir"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setMuted((v) => !v)}>
          {muted ? "Sem voz" : "Com voz"}
        </button>
        <div className="flex-1 progress">
          <span style={{ width: `${((index + 1) / VIDEO_SCENES.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function stopVoice() {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}

function speak(text: string, muted: boolean, onEnd: () => void) {
  stopVoice();
  if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
  const run = () => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 0.96;
    const voices = window.speechSynthesis.getVoices();
    const pt = voices.find((v) => v.lang.toLowerCase().startsWith("pt"));
    if (pt) utter.voice = pt;
    utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
  };
  if (window.speechSynthesis.getVoices().length) run();
  else window.speechSynthesis.addEventListener("voiceschanged", run, { once: true });
}
