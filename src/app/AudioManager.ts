export class AudioManager {
  private static instance: AudioManager;
  static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  private bgm?: HTMLAudioElement;
  private sfx = new Map<string, HTMLAudioElement>();
  private globalBound = false;
  private lastTick = 0;

  private readonly URLS = {
    bgm:   new URL("../assets/audios/music.mp3",      import.meta.url).toString(),
    click: new URL("../assets/audios/clickSound.wav", import.meta.url).toString(),
  };

  preload(): void {
    if (!this.sfx.has("click")) {
      const a = new Audio(this.URLS.click);
      a.preload = "auto";
      a.volume = 0.6;
      this.sfx.set("click", a);
    }
  }

  playMainTheme(): void {
    this.stopBgm();
    this.bgm = new Audio(this.URLS.bgm);
    this.bgm.loop = true;
    this.bgm.preload = "auto";
    this.bgm.volume = 0.05;
    this.bgm.play().catch(() => {});
  }

  stopBgm(): void {
    if (!this.bgm) return;
    try { this.bgm.pause(); } catch {}
    this.bgm.currentTime = 0;
    this.bgm = undefined;
  }

  playSfx(name: "click"): void {
    const base = this.sfx.get(name);
    if (!base) return;
    const node = base.cloneNode(true) as HTMLAudioElement;
    node.volume = base.volume;
    node.play().catch(() => {});
  }

  attachGlobalClickSfx(): void {
    if (this.globalBound) return;
    this.globalBound = true;
    this.preload();

    const handler = (ev: PointerEvent | MouseEvent) => {
      const now = performance.now();
      if (now - this.lastTick < 80) return;
      const t = ev.target as HTMLElement | null;
      if (t && t.closest("[data-click-sfx='off']")) return;
      if ("pointerType" in ev && (ev as PointerEvent).pointerType && (ev as PointerEvent).pointerType !== "mouse") return;
      this.lastTick = now;
      this.playSfx("click");
    };

    document.addEventListener("pointerdown", handler, { capture: true });
  }
}
