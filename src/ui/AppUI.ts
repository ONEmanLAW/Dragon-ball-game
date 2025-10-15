import { GameManager } from "../app/GameManager";
import type { Warrior } from "../domain/Warrior";
import type { WarriorPreset } from "../data/WarriorPreset";
import presetsJson from "../data/warriors.json";

import { CreateView } from "./views/CreateView";
import { RosterView } from "./views/RosterView";
import { BattleView } from "./views/BattleView";

type Screen = "create" | "roster" | "battle";

export class AppUI {
  private gm = GameManager.getInstance();

  private createView!: CreateView;
  private rosterView!: RosterView;
  private battleView!: BattleView;

  public boot(): void {
    // 1) presets
    this.gm.loadPresets(presetsJson as WarriorPreset[]);
    for (const p of presetsJson as WarriorPreset[]) this.gm.spawnPreset(p.id);

    // 2) instancier les vues
    this.createView = new CreateView({
      onCreated: (w: Warrior) => {
        this.gm.registerWarrior(w);
        this.rosterView.setCreatedWarrior(w);
        this.rosterView.refreshRoster();
        this.showOnly("roster");
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

    // 3) monter les vues (listeners + cache DOM)
    this.createView.mount();
    this.rosterView.mount();
    this.battleView.mount();

    // 4) écran initial
    this.showOnly("create");
    this.rosterView.refreshRoster();
  }

  private showOnly(which: Screen): void {
    (document.getElementById("create-section") as HTMLElement).hidden = which !== "create";
    (document.getElementById("roster-section") as HTMLElement).hidden = which !== "roster";
    (document.getElementById("battle-section") as HTMLElement).hidden = which !== "battle";
    if (which !== "battle") this.battleView.stop(); // nettoie subs/logique combat
  }
}
