import { useEffect, useMemo, useRef, useState } from "react";

type WordToken = { type: "word"; value: string };
type LineBreakToken = { type: "linebreak" };
type Token = WordToken | LineBreakToken;

export default function ReaderApp() {
  const [text, setText] = useState(
    "Reading aloud is a skill that improves with awareness and consistency. When we slow down just enough to understand each word clearly, our confidence grows and our delivery becomes more natural. The goal is not to rush through sentences, but to guide the listener smoothly from one idea to the next."
  );

  const [wpm, setWpm] = useState<number | null>(null);

  /* ===== Tokenisation ===== */
  const tokens = useMemo<Token[]>(() => {
    return text
      .split(/\n+/)
      .flatMap((line, index, lines) => {
        const words = line
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((value) => ({ type: "word", value } as Token));

        if (index < lines.length - 1) {
          words.push({ type: "linebreak" });
        }

        return words;
      });
  }, [text]);

  /* ===== Speed Measurement ===== */
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);

  const startTiming = () => {
    setStartTime(Date.now());
    setIsMeasuring(true);
  };

  const endTiming = () => {
    if (!startTime) return;
    const elapsedMinutes = (Date.now() - startTime) / 60000;
    setWpm(Math.round(tokens.length / elapsedMinutes));
    setIsMeasuring(false);
  };

  /* ===== Teleprompter ===== */
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const getExtraPauseMs = (word: WordToken) => {
    if (/[.!?]$/.test(word.value)) return 500;
    if (/[,;:]$/.test(word.value)) return 250;
    return 0;
  };

  const startTeleprompter = () => {
    if (!wpm) return;
    setIsPlaying(true);
  };

  const pauseTeleprompter = () => {
    setIsPlaying(false);
  };

  const stopTeleprompter = () => {
    setIsPlaying(false);
    setActiveIndex(0);
  };

  useEffect(() => {
    if (!isPlaying || !wpm) return;

    let cancelled = false;

    const runWord = (index: number) => {
      if (cancelled) return;

      setActiveIndex(index);

      if (index >= tokens.length - 1) {
        setIsPlaying(false);
        return;
      }

      const baseDelay = 60000 / wpm;
      const token = tokens[index];
      const extraPause =
        token.type === "word" ? getExtraPauseMs(token) : 0;

      timeoutRef.current = window.setTimeout(() => {
        runWord(index + 1);
      }, baseDelay + extraPause);
    };

    runWord(activeIndex);

    return () => {
      cancelled = true;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPlaying, wpm, tokens, activeIndex]);

  /* ===== Time Estimation ===== */
  const estimatedSeconds = wpm
    ? Math.round(
        (tokens.length / wpm) * 60 +
          tokens.reduce(
            (sum, t) =>
              sum + (t.type === "word" ? getExtraPauseMs(t) : 0),
            0
          ) /
            1000
      )
    : null;

  const [targetSeconds, setTargetSeconds] = useState(0);

  const meetsTarget =
    estimatedSeconds !== null && targetSeconds > 0
      ? estimatedSeconds <= targetSeconds
      : null;

  /* ===== UI ===== */
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Reading Speed Trainer
          </h1>
          <p className="text-slate-600">
            Practice pacing and delivery with a live teleprompter
          </p>
        </header>

        {/* Script Input */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-lg">Script</h2>
          <textarea
            className="w-full min-h-45 resize-y rounded-lg border border-slate-200 p-4 focus:ring-2 focus:ring-blue-500 outline-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your script here…"
          />
        </section>

        {/* Speed Measurement */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-lg">1. Measure Speed</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={startTiming}
              disabled={isMeasuring}
              className="flex-1 rounded-lg bg-blue-600 py-3 text-white font-medium disabled:opacity-50"
            >
              Start Reading
            </button>

            <button
              onClick={endTiming}
              disabled={!isMeasuring}
              className="flex-1 rounded-lg bg-emerald-600 py-3 text-white font-medium disabled:opacity-50"
            >
              Finish
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min={50}
              step={10}
              value={wpm ?? ""}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-28 rounded-lg border p-2 text-center"
            />
            <span className="text-slate-600">WPM</span>
          </div>

          {wpm && (
            <p className="text-sm">
              Your speed: <strong>{wpm} WPM</strong>
            </p>
          )}
        </section>

        {/* Teleprompter */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-lg">2. Teleprompter</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              disabled={!wpm || isPlaying}
              onClick={startTeleprompter}
              className="flex-1 rounded-lg bg-purple-600 py-3 text-white font-medium disabled:opacity-50"
            >
              ▶ Start
            </button>

            <button
              disabled={!isPlaying}
              onClick={pauseTeleprompter}
              className="flex-1 rounded-lg bg-yellow-500 py-3 text-white font-medium disabled:opacity-50"
            >
              ⏸ Pause
            </button>

            <button
              onClick={stopTeleprompter}
              className="flex-1 rounded-lg bg-slate-700 py-3 text-white font-medium"
            >
              ■ Stop
            </button>
          </div>

          <div className="rounded-lg border bg-slate-100 p-4 text-lg leading-relaxed flex flex-wrap">
            {tokens.map((token, i) =>
              token.type === "linebreak" ? (
                <div key={i} className="w-full h-4" />
              ) : (
                <span
                  key={i}
                  className={`mr-2 mb-2 px-1.5 py-0.5 rounded transition-colors ${
                    i === activeIndex
                      ? "bg-yellow-300 text-black"
                      : "text-slate-700 opacity-40"
                  }`}
                >
                  {token.value}
                </span>
              )
            )}
          </div>
        </section>

        {/* Time Target */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-lg">3. Time Target</h2>

          {estimatedSeconds !== null && (
            <p>
              Estimated time: <strong>{estimatedSeconds}s</strong>
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="number"
              placeholder="Target (sec)"
              className="w-32 rounded-lg border p-2"
              onChange={(e) => setTargetSeconds(Number(e.target.value))}
            />

            {meetsTarget !== null && (
              <span
                className={`font-medium ${
                  meetsTarget ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {meetsTarget ? "✔ Within target" : "✖ Too long"}
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
