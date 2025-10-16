import { GameManager } from "../app/GameManager";
import type { Warrior } from "../domain/Warrior";
import type { WarriorPreset } from "../data/WarriorPreset";
import presetsJson from "../data/warriors.json";

import { MainMenuView } from "./views/MainMenuView";
import { CreateView } from "./views/CreateView";
import { ModeMenuView } from "./views/ModeMenuView";
import { RosterView } from "./views/RosterView";
import { BattleView } from "./views/BattleView";
import { TournamentView } from "./views/TournamentView";

import { AudioManager } from "../app/AudioManager";

type Screen = "menu" | "create" | "mode" | "tournament" | "roster" | "battle";

export class AppUI {
  private gm = GameManager.getInstance();

  private menuView!: MainMenuView;
  private createView!: CreateView;
  private modeMenuView!: ModeMenuView;
  private tournamentView!: TournamentView;
  private rosterView!: RosterView;
  private battleView!: BattleView;

  private audioUnlocked = false;
  private audio = AudioManager.getInstance();

  public boot(): void {
    this.gm.loadPresets(presetsJson as WarriorPreset[]);
    for (const p of presetsJson as WarriorPreset[]) this.gm.spawnPreset(p.id);

    this.menuView = new MainMenuView({
      onPlay: () => {
        this.audioUnlocked = true;
        this.audio.playMenu();
        this.showOnly("create");
      },
    });

    this.createView = new CreateView({
      onCreated: (w: Warrior) => {
        this.gm.registerWarrior(w);
        this.rosterView.setCreatedWarrior?.(w);
        this.rosterView.refreshRoster();
        this.showOnly("mode");
      },
    });

    this.tournamentView = new TournamentView({
      onPlayMatch: (p1, p2, onEnded) => {
        this.showOnly("battle");
        this.battleView.startBattle(p1, p2, (winnerName) => {
          this.showOnly("tournament");
          onEnded(winnerName);
        });
      },
    });

    this.modeMenuView = new ModeMenuView({
      onOneVsOne: () => {
        this.rosterView.refreshRoster();
        this.showOnly("roster");
      },
      onSecondOption: () => {
        this.tournamentView.refreshRoster();
        this.showOnly("tournament");
      },
      onThirdOption: () => {
        alert("Mode 3 bientôt");
      },
    });

    this.rosterView = new RosterView({
      onStartBattle: (p1, p2) => {
        this.showOnly("battle");
        this.battleView.startBattle(p1, p2);
      },
    });

    this.battleView = new BattleView({
      onExit: () => {
        this.showOnly("roster");
        this.rosterView.refreshRoster();
      },
    });

    this.menuView.mount();
    this.createView.mount();
    this.modeMenuView.mount();
    this.tournamentView.mount();
    this.rosterView.mount();
    this.battleView.mount();

    this.showOnly("menu");
    this.rosterView.refreshRoster();

    this.audio.preload();
    this.audio.attachGlobalClickSfx();
  }

  private showOnly(which: Screen): void {
    (document.getElementById("menu-section")        as HTMLElement).hidden = which !== "menu";
    (document.getElementById("create-section")      as HTMLElement).hidden = which !== "create";
    (document.getElementById("mode-section")        as HTMLElement).hidden = which !== "mode";
    (document.getElementById("tournament-section")  as HTMLElement).hidden = which !== "tournament";
    (document.getElementById("roster-section")      as HTMLElement).hidden = which !== "roster";
    (document.getElementById("battle-section")      as HTMLElement).hidden = which !== "battle";

    if (which !== "battle") this.battleView.stop();

    if (which === "create") this.createView.onShow();
    else this.createView.onHide();

    if (this.audioUnlocked) {
      if (which === "battle") this.audio.playBattle();
      else this.audio.playMenu();
    }
  }
}
