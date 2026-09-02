/**
 * 블록의 ‘소리 내기’가 내는 소리입니다.
 *
 * 소리 파일을 담지 않고 그 자리에서 만들어 냅니다. 파일이 없으니 인터넷이 막힌
 * 학교에서도 나고, 앱 크기도 늘지 않습니다.
 */

type Note = { hz: number; at: number; ms: number; kind?: OscillatorType };

const SOUNDS: Record<string, Note[]> = {
  // 딩동: 높은음 뒤에 낮은음. 초인종처럼 들립니다.
  딩동: [
    { hz: 988, at: 0, ms: 220 },
    { hz: 784, at: 200, ms: 320 },
  ],
  // 짝짝: 짧게 두 번. 잘했을 때입니다.
  짝짝: [
    { hz: 1319, at: 0, ms: 110 },
    { hz: 1568, at: 130, ms: 160 },
  ],
  // 삑: 낮고 짧게. 틀렸을 때입니다.
  삑: [{ hz: 220, at: 0, ms: 260, kind: "square" }],
  // 북: 아주 낮게 한 번. 시작 신호로 씁니다.
  북: [{ hz: 110, at: 0, ms: 200, kind: "triangle" }],
};

type WindowWithAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
  __webappAudio?: AudioContext;
};

/** 소리 장치는 하나만 만들어 다시 씁니다. 누를 때마다 만들면 곧 막힙니다. */
function audioContext() {
  if (typeof window === "undefined") return null;
  const holder = window as WindowWithAudio;
  const Ctor = window.AudioContext ?? holder.webkitAudioContext;
  if (!Ctor) return null;
  if (!holder.__webappAudio) holder.__webappAudio = new Ctor();
  return holder.__webappAudio;
}

/**
 * 소리를 냅니다. 소리를 낼 수 없는 기기나 아직 화면을 누르지 않아 소리가 막힌
 * 상태에서는 조용히 넘어갑니다. 소리 때문에 웹앱이 멈추면 안 됩니다.
 */
export function playSound(name: string) {
  const notes = SOUNDS[name];
  if (!notes) return;

  try {
    const audio = audioContext();
    if (!audio) return;
    // 아이폰은 화면을 누르기 전까지 소리를 재워 둡니다. 눌렀을 때 깨웁니다.
    if (audio.state === "suspended") void audio.resume();

    for (const note of notes) {
      const start = audio.currentTime + note.at / 1000;
      const end = start + note.ms / 1000;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = note.kind ?? "sine";
      osc.frequency.setValueAtTime(note.hz, start);
      // 뚝 끊기면 ‘딱’ 소리가 섞입니다. 소리를 서서히 줄입니다.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  } catch {
    // 소리가 안 나도 웹앱은 그대로 씁니다.
  }
}
