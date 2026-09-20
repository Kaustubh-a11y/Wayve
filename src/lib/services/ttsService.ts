/**
 * Wayve TTS Service — Voice Navigation Guidance
 * Primary: Sarvam AI (bulbul:v3) via /api/v1/tts
 * Fallback: Browser Web Speech API (speechSynthesis)
 */

export type VoiceCast = "american" | "sarvam";

let activeVoiceCast: VoiceCast = "american"; // Default to American Copilot
let isMuted = false;
let isPlaying = false;
const audioQueue: string[] = [];
let currentAudio: HTMLAudioElement | null = null;

export function getVoiceCast(): VoiceCast {
  return activeVoiceCast;
}

export function setVoiceCast(cast: VoiceCast): void {
  activeVoiceCast = cast;
}

/**
 * Speak a navigation instruction.
 * Default ("american"): Uses authentic US English turn-by-turn voice (Google US, Microsoft David/Mark/Zira).
 * Alternative ("sarvam"): Uses Sarvam AI bulbul:v3 neural voice.
 */
export async function speakNavInstruction(text: string): Promise<void> {
  if (isMuted || !text || text.trim().length === 0) return;

  // Avoid queueing duplicates
  if (audioQueue.includes(text)) return;

  // If something is playing, queue it
  if (isPlaying) {
    audioQueue.push(text);
    return;
  }

  isPlaying = true;

  try {
    if (activeVoiceCast === "sarvam") {
      // Sarvam AI Neural Voice
      const res = await fetch("/api/v1/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "en-IN", speaker: "rohan" }),
      });

      const data = await res.json();
      if (data.audio && !data.fallback) {
        await playBase64Audio(data.audio);
      } else {
        speakWithAmericanTTS(text);
      }
    } else {
      // American Navigation Copilot (Crisp en-US)
      speakWithAmericanTTS(text);
    }
  } catch {
    speakWithAmericanTTS(text);
  }

  isPlaying = false;

  // Process next in queue
  if (audioQueue.length > 0) {
    const next = audioQueue.shift()!;
    speakNavInstruction(next);
  }
}

function playBase64Audio(base64: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(`data:audio/wav;base64,${base64}`);
      currentAudio = audio;
      audio.volume = 0.9;
      audio.onended = () => {
        currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        currentAudio = null;
        resolve();
      };
      audio.play().catch(() => {
        currentAudio = null;
        resolve();
      });
    } catch {
      resolve();
    }
  });
}

function speakWithAmericanTTS(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.02; // Crisp American GPS cadence
  utterance.pitch = 1.0;
  utterance.volume = 0.95;
  utterance.lang = "en-US";

  // Prioritize premium American English voices
  const voices = window.speechSynthesis.getVoices();
  const americanVoice =
    voices.find((v) => v.lang === "en-US" && (v.name.includes("David") || v.name.includes("Mark") || v.name.includes("US") || v.name.includes("Google") || v.name.includes("Natural"))) ||
    voices.find((v) => v.lang === "en-US" && v.name.includes("Zira")) ||
    voices.find((v) => v.lang === "en-US" || v.lang.startsWith("en-US")) ||
    voices.find((v) => v.lang.startsWith("en"));

  if (americanVoice) {
    utterance.voice = americanVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Toggle mute state. Returns new mute state.
 */
export function toggleTTSMute(): boolean {
  isMuted = !isMuted;

  // Stop any currently playing audio
  if (isMuted) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    audioQueue.length = 0;
    isPlaying = false;
  }

  return isMuted;
}

/**
 * Get current mute state
 */
export function isTTSMuted(): boolean {
  return isMuted;
}

/**
 * Stop all audio immediately
 */
export function stopTTS(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  audioQueue.length = 0;
  isPlaying = false;
}
