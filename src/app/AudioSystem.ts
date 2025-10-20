import { eventBus } from "../events/EventBus";
import type { GameEvent } from "../events/GameEvents";
import { AudioManager } from "./AudioManager";

export class AudioSystem {
  //#region Singleton
  private static instance: AudioSystem;
  static getInstance(): AudioSystem {
    if (!AudioSystem.instance) AudioSystem.instance = new AudioSystem();
    return AudioSystem.instance;
  }
  //#endregion

  //#region Fields
  private audioManager = AudioManager.getInstance();
  private isMounted = false;
  //#endregion

  //#region Public API
  mount(): void {
    if (this.isMounted) return;
    this.isMounted = true;

    this.audioManager.attachGlobalClickSfx();
    eventBus.subscribe({ update: (e: GameEvent) => this.onEvent(e) });
  }

  enterMenu(): void {
    this.audioManager.playMenu();
  }

  enterBattle(): void {
    this.audioManager.playBattle();
  }
  //#endregion

  //#region Internals
  private onEvent(e: GameEvent): void {
    if (e.kind === "BattleStarted") this.audioManager.playBattle();
    else if (e.kind === "BattleEnded") this.audioManager.playMenu();
  }
  //#endregion
}
