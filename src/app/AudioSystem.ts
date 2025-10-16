// src/app/AudioSystem.ts
import { eventBus } from "../events/EventBus";
import type { GameEvent } from "../events/GameEvents";
import { AudioManager } from "./AudioManager";

export class AudioSystem {
  private static instance: AudioSystem;
  static getInstance(): AudioSystem {
    if (!AudioSystem.instance) AudioSystem.instance = new AudioSystem();
    return AudioSystem.instance;
  }

  private audio = AudioManager.getInstance();
  private mounted = false;

  mount(): void {
    if (this.mounted) return;
    this.mounted = true;

    this.audio.attachGlobalClickSfx();

    eventBus.subscribe({ update: (e: GameEvent) => this.onEvent(e) });
  }

  enterMenu(): void {
    this.audio.playMenu();
  }

  enterBattle(): void {
    this.audio.playBattle();
  }

  private onEvent(e: GameEvent): void {
    if (e.kind === "BattleStarted") {
      this.audio.playBattle();
    } else if (e.kind === "BattleEnded") {
      this.audio.playMenu();
    }
  }
}
