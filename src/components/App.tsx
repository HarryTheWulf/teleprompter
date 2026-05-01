import { useEffect, useMemo, useRef, useState } from "react";

type WordToken = { type: "word"; value: string };
type LineBreakToken = { type: "linebreak" };
type Token =
  | WordToken
  | LineBreakToken;

export default function ReaderApp() {
  const [text, setText] = useState("Reading aloud is a skill that improves with awareness and consistency. When we slow down just enough to understand each word clearly, our confidence grows and our delivery becomes more natural. The goal is not to rush through sentences, but to guide the listener smoothly from one idea to the next.");
  const [wpm, setWpm] = useState<number | null>(null);

  const tokens = useMemo<Array<Token>>(() => {
    return text
      .split(/\n+/)
      .flatMap((line, lineIndex, lines) => {
        const words = line
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => ({ type: "word", value: w } as Token));

        // Add a line break token between paragraphs
        if (lineIndex < lines.length - 1) {
          words.push({ type: "linebreak" });
        }

        return words;
      });
  }, [text]);

  // ===== Speed training =====
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);

  const startTiming = () => {
    setStartTime(Date.now());
    setEndTime(null);
    setIsMeasuring(true);
  };

  const endTiming = () => {
    if (!startTime) return;
    const end = Date.now();
    setEndTime(end);
    setIsMeasuring(false);

    const elapsedMinutes = (end - startTime) / 60000;
    const calculatedWpm = Math.round(tokens.length / elapsedMinutes);
    setWpm(calculatedWpm);
  };

  // ===== Teleprompter =====
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const startTeleprompter = () => {
    if (!wpm) return;
    setActiveIndex(0);
    setIsPlaying(true);
  };

  const stopTeleprompter = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getExtraPauseMs = (word: WordToken) => {
    if (/[.!?]$/.test(word.value)) return 500;
    if (/[,;:]$/.test(word.value)) return 250;
    return 0;
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

      const baseMs = 60000 / wpm;
      const currentToken = tokens[index];
      const extraPause = currentToken.type === 'word'
        ? getExtraPauseMs(currentToken)
        : 0;
      const delay = baseMs + extraPause;

      intervalRef.current = window.setTimeout(() => {
        runWord(index + 1);
      }, delay);
    };

    runWord(0);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, wpm, tokens]);


  // ===== Time estimation =====
  const estimatedSeconds = wpm
    ? Math.round(
      (
        // Base word timing
        (tokens.length / wpm) * 60 +
        // Extra punctuation pauses
        tokens.reduce(
          (sum, word) => sum + (word.type === 'word' ? getExtraPauseMs(word) : 0),
          0
        ) / 1000
      )
    )
  : null;

  const [targetSeconds, setTargetSeconds] = useState(0);

  const meetsTarget =
    estimatedSeconds !== null && targetSeconds > 0
      ? estimatedSeconds <= targetSeconds
      : null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Reading Speed Trainer</h1>

      {/* Text Input */}
      <textarea
        className="w-full h-40 p-4 border rounded-md"
        placeholder="Paste or type your script here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* Speed Trainer */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">1. Measure Reading Speed</h2>
        <div className="flex gap-2">
          <button
            onClick={startTiming}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={isMeasuring}
          >
            Start
          </button>
          <button
            onClick={endTiming}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            disabled={!isMeasuring}
          >
            End
          </button>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">WPM</h3>
          <input
            type="number"
            min={50}
            max={600}
            step={10}
            value={wpm ?? 0}
            onChange={(e) => setWpm(Number(e.target.value))}
            className="border p-2 rounded w-40"
          />

          {!wpm && (
            <p className="text-sm text-gray-600">
              Used when no measured WPM is available
            </p>
          )}
        </div>
        {wpm && (
          <p className="text-sm">
            Your reading speed: <strong>{wpm} WPM</strong>
          </p>
        )}
      </div>

      {/* Teleprompter */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">2. Teleprompter</h2>
        <div className="flex gap-2">
          <button
            disabled={!wpm}
            onClick={startTeleprompter}
            className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
          >
            Start
          </button>

          <button
            disabled={!isPlaying}
            onClick={stopTeleprompter}
            className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
          >
            Stop
          </button>
        </div>

        <div className="p-4 border rounded text-lg leading-loose flex flex-wrap">
          {tokens.map((token, i) => {
            if (token.type === "linebreak") {
              return (
                <div key={i} className="w-full h-4" />
              );
            }

            return (
              <span
                key={i}
                className={`
                  inline-flex items-center
                  px-1 py-0.5
                  mr-2 mb-2
                  rounded
                  bg-transparent
                  transition-colors
                  ${i === activeIndex ? "bg-yellow-300" : ""}
                `}
              >
                {token.value}
              </span>
            );
          })}
        </div>
        ``
      </div>

      {/* Time Estimation */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">3. Time Estimation</h2>

        {estimatedSeconds && (
          <p>
            Estimated reading time:{" "}
            <strong>{estimatedSeconds}s</strong>
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Target seconds"
            className="border p-2 rounded w-40"
            onChange={(e) => setTargetSeconds(Number(e.target.value))}
          />
          {meetsTarget !== null && (
            <span
              className={`font-bold ${
                meetsTarget ? "text-green-600" : "text-red-600"
              }`}
            >
              {meetsTarget ? "✔ Within target" : "✖ Too long"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
