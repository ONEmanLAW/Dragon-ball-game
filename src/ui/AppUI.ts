import { GameManager } from "../app/GameManager";
import type { Warrior } from "../domain/Warrior";
import type { WarriorPreset } from "../data/WarriorPreset";
import presetsJson from "../data/warriors.json";

import { MainMenuView } from "./views/MainMenuView";
import { CreateView } from "./views/CreateView";
import { ModeMenuView } from "./views/ModeMenuView";
import { RosterView } from "./views/RosterView";
import { BattleView } from "./views/BattleView";

type Screen = "menu" | "create" | "mode" | "roster" | "battle";

export class AppUI {
  private gm = GameManager.getInstance();

  private menuView!: MainMenuView;
  private createView!: CreateView;
  private modeMenuView!: ModeMenuView;
  private rosterView!: RosterView;
  private battleView!: BattleView;

  public boot(): void {
    this.gm.loadPresets(presetsJson as WarriorPreset[]);
    for (const p of presetsJson as WarriorPreset[]) this.gm.spawnPreset(p.id);

    this.menuView = new MainMenuView({
      onPlay: () => this.showOnly("create"),
    });

    this.createView = new CreateView({
      onCreated: (w: Warrior) => {
        this.gm.registerWarrior(w);
        this.rosterView.setCreatedWarrior(w);
        this.rosterView.refreshRoster();
        this.showOnly("mode");
      },
    });

    this.modeMenuView = new ModeMenuView({
      onOneVsOne: () => {
        this.rosterView.refreshRoster();
        this.showOnly("roster");
      },
      onSecondOption: () => {
        alert("Mode 2 arrive bientôt 👀");
      },
      onThirdOption: () => {
        alert("Mode 3 arrive bientôt 👀");
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
    this.rosterView.mount();
    this.battleView.mount();

    this.showOnly("menu");
    this.rosterView.refreshRoster();
  }

  private showOnly(which: Screen): void {
    (document.getElementById("menu-section")  as HTMLElement).hidden  = which !== "menu";
    (document.getElementById("create-section")as HTMLElement).hidden  = which !== "create";
    (document.getElementById("mode-section")  as HTMLElement).hidden  = which !== "mode";
    (document.getElementById("roster-section")as HTMLElement).hidden  = which !== "roster";
    (document.getElementById("battle-section")as HTMLElement).hidden  = which !== "battle";
    if (which !== "battle") this.battleView.stop();
  }
}
