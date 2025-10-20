// Memento Pattern pour sauvegarder/restaurer un combat
import type { Warrior } from "../domain/Warrior";

type Ctx = "duel" | "tournament" | "campaign";

type Snapshot = {
  name: string;
  vit: number;
  ki: number;
};

type BattleSave = {
  ctx: Ctx;
  p1: Snapshot;
  p2: Snapshot;
  activeName?: string;
};

class BattleMemento {
  //#region State
  private save?: BattleSave;
  //#endregion

  //#region API
  public saveFrom(p1: Warrior, p2: Warrior, ctx: Ctx, activeName?: string): void {
    this.save = {
      ctx,
      p1: { name: p1.name, vit: p1.getVitality(), ki: p1.getKi() },
      p2: { name: p2.name, vit: p2.getVitality(), ki: p2.getKi() },
      activeName,
    };
  }

  public has(): boolean { return !!this.save; }

  public applyTo(p1: Warrior, p2: Warrior): boolean {
    if (!this.save) return false;
    if (p1.name !== this.save.p1.name || p2.name !== this.save.p2.name) return false;

    // On ne fait que remonter vers la sauvegarde (heal/gainKi),
    const needHeal1 = Math.max(0, this.save.p1.vit - p1.getVitality());
    const needHeal2 = Math.max(0, this.save.p2.vit - p2.getVitality());
    if (needHeal1) p1.heal(needHeal1);
    if (needHeal2) p2.heal(needHeal2);

    const needKi1 = Math.max(0, this.save.p1.ki - p1.getKi());
    const needKi2 = Math.max(0, this.save.p2.ki - p2.getKi());
    if (needKi1) p1.gainKi(needKi1);
    if (needKi2) p2.gainKi(needKi2);

    return true;
  }

  public clear(): void { this.save = undefined; }
  //#endregion
}

export const battleMemento = new BattleMemento();
