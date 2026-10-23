"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/cn";

type Props = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Mikrofonzugriff wurde verweigert. Bitte in den Browser-Einstellungen erlauben.",
  "no-speech": "Es wurde keine Sprache erkannt. Bitte erneut versuchen.",
  "audio-capture": "Kein Mikrofon gefunden.",
  network: "Netzwerkfehler bei der Spracherkennung.",
};

/**
 * Real (not decorative) German dictation via the browser's native
 * SpeechRecognition API. No third-party transcription key is configured in
 * Stage 1, so unsupported browsers simply hide the mic button — the textarea
 * fallback is always present and always the one submitted.
 */
export function MicInput({ name, value, onChange, rows = 6, placeholder }: Props) {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseTextRef = useRef("");

  // Intentional: browser feature detection must run after mount (SSR has no
  // `window`/SpeechRecognition); doing this via useState's lazy initializer
  // instead would mismatch the server-rendered HTML.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function startRecording() {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;

    setError(null);
    baseTextRef.current = value ? `${value} ` : "";
    const recognition = new Ctor();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      if (finalText) baseTextRef.current += `${finalText} `;
      onChange((baseTextRef.current + interimText).trim());
    };

    recognition.onerror = (event) => {
      setError(ERROR_MESSAGES[event.error] ?? "Spracherkennung fehlgeschlagen. Bitte erneut versuchen.");
      setRecording(false);
    };

    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-2">
      <Textarea
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <Alert tone="danger">{error}</Alert>}
      {supported ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={recording ? "danger" : "secondary"}
            size="sm"
            onClick={() => {
              if (recording) {
                stopRecording();
              } else if (!showConsent) {
                setShowConsent(true);
              } else {
                startRecording();
              }
            }}
          >
            {recording ? "■ Aufnahme stoppen" : "🎤 Diktieren"}
          </Button>
          {recording && <span className="text-xs text-muted">Aufnahme läuft, auf Deutsch sprechen …</span>}
        </div>
      ) : (
        <p className="text-xs text-muted">
          Spracherkennung wird in diesem Browser nicht unterstützt. Bitte Tastatureingabe
          verwenden.
        </p>
      )}
      {showConsent && !recording && supported && (
        <Alert tone="accent" className={cn("text-xs")}>
          Bei der Nutzung des Mikrofons wird die Audioaufnahme über die Spracherkennung Ihres
          Browsers verarbeitet (z. B. an Google-Server bei Chrome). Es werden keine Audiodaten in
          dieser Anwendung gespeichert.{" "}
          <button
            type="button"
            className="font-medium text-accent underline"
            onClick={() => startRecording()}
          >
            Verstanden, jetzt aufnehmen
          </button>
        </Alert>
      )}
    </div>
  );
}
