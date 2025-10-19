import type { Warrior } from "../../domain/Warrior";
import { GameManager } from "../../app/GameManager";
import { TurnManager } from "../../app/TurnManager";
import { hasUsedSpecialInCurrentBattle, type AttackKind } from "../../domain/Attacks";
import {
  SPECIAL_UNLOCK_TURN,
  NORMAL_ATTACK_KI_COST,
  KI_ENERGY_ATTACK_KI_COST,
  SPECIAL_ATTACK_KI_COST,
} from "../../domain/Balance";
import { eventBus } from "../../events/EventBus";

import type { WarriorPreset } from "../../data/WarriorPreset";
import presetsJson from "../../data/warriors.json";

type El<T extends HTMLElement> = T;
type BattleContext = "duel" | "tournament";

type Callbacks = {
  onExit: () => void;
  onAbortTournament?: () => void;
};

export class BattleView {
  private gm = GameManager.getInstance();

  private hudP1Name!: El<HTMLDivElement>;
  private hudP2Name!: El<HTMLDivElement>;
  private hpP1!: El<HTMLDivElement>;
  private hpP2!: El<HTMLDivElement>;
  private kiP1!: El<HTMLDivElement>;
  private kiP2!: El<HTMLDivElement>;

  private btnNextFight!: HTMLButtonElement;
  private btnExitSmall!: HTMLButtonElement;

  private btnP1Basic!: HTMLButtonElement;
  private btnP1Ki!: HTMLButtonElement;
  private btnP1Special!: HTMLButtonElement;

  private btnP2Basic!: HTMLButtonElement;
  private btnP2Ki!: HTMLButtonElement;
  private btnP2Special!: HTMLButtonElement;

  private imgP1!: HTMLImageElement;
  private imgP2!: HTMLImageElement;

  private effP1!: HTMLDivElement;
  private effP2!: HTMLDivElement;

  private feed!: HTMLDivElement;

  private modal!: HTMLDivElement;
  private btnModalResume!: HTMLButtonElement;
  private btnModalQuit!: HTMLButtonElement;

  private p1!: Warrior;
  private p2!: Warrior;
  private turn!: TurnManager;

  private onEnded?: (winnerName: string) => void;
  private ctx: BattleContext = "duel";

  private animTimer: number | undefined;
  private fps = 6;

  private sub = { update: (e: any) => this.onEvent(e) };

  constructor(private readonly cb: Callbacks) {}

  public mount(): void {
    this.hudP1Name = document.getElementById("hud-p1-name") as HTMLDivElement;
    this.hudP2Name = document.getElementById("hud-p2-name") as HTMLDivElement;
    this.hpP1 = document.getElementById("hp-p1") as HTMLDivElement;
    this.hpP2 = document.getElementById("hp-p2") as HTMLDivElement;
    this.kiP1 = document.getElementById("ki-p1") as HTMLDivElement;
    this.kiP2 = document.getElementById("ki-p2") as HTMLDivElement;

    this.btnNextFight  = document.getElementById("btn-next-fight") as HTMLButtonElement;
    this.btnExitSmall  = document.getElementById("btn-exit") as HTMLButtonElement;

    this.btnP1Basic   = document.getElementById("p1-basic") as HTMLButtonElement;
    this.btnP1Ki      = document.getElementById("p1-ki") as HTMLButtonElement;
    this.btnP1Special = document.getElementById("p1-special") as HTMLButtonElement;

    this.btnP2Basic   = document.getElementById("p2-basic") as HTMLButtonElement;
    this.btnP2Ki      = document.getElementById("p2-ki") as HTMLButtonElement;
    this.btnP2Special = document.getElementById("p2-special") as HTMLButtonElement;

    this.imgP1 = document.getElementById("sprite-p1") as HTMLImageElement;
    this.imgP2 = document.getElementById("sprite-p2") as HTMLImageElement;

    this.effP1 = document.getElementById("eff-p1") as HTMLDivElement;
    this.effP2 = document.getElementById("eff-p2") as HTMLDivElement;

    this.feed = document.getElementById("floating-feed") as HTMLDivElement;

    this.modal = document.getElementById("battle-modal") as HTMLDivElement;
    this.btnModalResume = document.getElementById("btn-modal-resume") as HTMLButtonElement;
    this.btnModalQuit   = document.getElementById("btn-modal-quit") as HTMLButtonElement;

    this.btnNextFight.addEventListener("click", () => {
      if (!this.onEnded) return;
      const winner = !this.p1.isAlive() ? this.p2.name : this.p1.name;
      const cb = this.onEnded;
      this.onEnded = undefined;
      this.hideNextFight();
      cb(winner);
    });

    this.btnExitSmall.addEventListener("click", () => this.openModal());
    this.btnModalResume.addEventListener("click", () => this.closeModal());
    this.btnModalQuit.addEventListener("click", () => this.quitBattle());

    this.btnP1Basic.addEventListener("click", () => this.onClick("p1", "Normal"));
    this.btnP1Ki.addEventListener("click", () => this.onClick("p1", "KiEnergy"));
    this.btnP1Special.addEventListener("click", () => this.onClick("p1", "Special"));

    this.btnP2Basic.addEventListener("click", () => this.onClick("p2", "Normal"));
    this.btnP2Ki.addEventListener("click", () => this.onClick("p2", "KiEnergy"));
    this.btnP2Special.addEventListener("click", () => this.onClick("p2", "Special"));
  }

  public startBattle(p1: Warrior, p2: Warrior, onEnded?: (winnerName: string) => void, context?: BattleContext): void {
    this.p1 = p1;
    this.p2 = p2;
    this.onEnded = onEnded;
    this.ctx = context ?? (onEnded ? "tournament" : "duel");

    this.restoreFull(this.p1);
    this.restoreFull(this.p2);

    this.hudP1Name.textContent = `${this.p1.name} [${this.p1.type}]`;
    this.hudP2Name.textContent = `${this.p2.name} [${this.p2.type}]`;

    this.setLabels();
    this.setFrames(this.imgP1, this.framesFor(this.p1));
    this.setFrames(this.imgP2, this.framesFor(this.p2));
    this.updateBars();

    this.turn = new TurnManager(this.p1, this.p2);
    eventBus.subscribe(this.sub);

    this.stopAnim();
    this.startAnim();

    this.refreshButtons();
    this.hideNextFight(); // reset
    this.hideBadge(this.p1.name);
    this.hideBadge(this.p2.name);
    this.clearFeed();
    this.closeModal(true);
  }

  public stop(): void {
    if (this.p1 && this.p2) {
      this.restoreFull(this.p1);
      this.restoreFull(this.p2);
      this.updateBars();
    }
    this.stopAnim();
    eventBus.unsubscribe(this.sub);
    this.clearFeed();
    this.hideNextFight();
    this.hideBadge(this.p1?.name);
    this.hideBadge(this.p2?.name);
    this.closeModal(true);
  }

  // Exit / Modal
  private openModal(): void {
    this.modal.hidden = false;
    this.disableAll();
  }
  private closeModal(silent = false): void {
    this.modal.hidden = true;
    if (!silent) this.refreshButtons();
  }
  private quitBattle(): void {
    this.stop();
    if (this.ctx === "tournament") this.cb.onAbortTournament?.();
    else this.cb.onExit();
  }

  // Clicks
  private onClick(side: "p1" | "p2", kind: AttackKind): void {
    const isP1Turn = this.turn.getActive().name === this.p1.name;
    const me  = side === "p1" ? this.p1 : this.p2;
    const opp = side === "p1" ? this.p2 : this.p1;

    if ((side === "p1" && !isP1Turn) || (side === "p2" && isP1Turn)) return;

    if (!me.isAlive()) { this.fx(`${me.name} est K.O.`); return; }
    if (!opp.isAlive()) { this.fx(`${opp.name} est K.O.`); return; }

    if (kind === "Special") {
      if (this.turn.getTurnNumber() < SPECIAL_UNLOCK_TURN) { this.fx(`Spéciale dispo tour ${SPECIAL_UNLOCK_TURN}`); return; }
      if (hasUsedSpecialInCurrentBattle(me.name))         { this.fx("Spéciale déjà utilisée"); return; }
      const cost = me.adjustKiCost(SPECIAL_ATTACK_KI_COST);
      if (!me.canSpendKi(cost)) { this.fx("Ki insuffisant"); return; }
    } else {
      const base = kind === "Normal" ? NORMAL_ATTACK_KI_COST : KI_ENERGY_ATTACK_KI_COST;
      const cost = me.adjustKiCost(base);
      if (!me.canSpendKi(cost)) { this.fx("Ki insuffisant"); return; }
    }

    try {
      const attack = this.gm.createAttack(kind);
      attack.execute(me, opp);
      if (me.isAlive() && opp.isAlive()) this.turn.nextTurn();
    } catch {
      this.fx("Action impossible");
    }
  }

  private setLabels(): void {
    this.btnP1Basic.textContent   = this.p1.getAttackLabel?.("Normal")   ?? "Basic";
    this.btnP1Ki.textContent      = this.p1.getAttackLabel?.("KiEnergy") ?? "Ki";
    this.btnP1Special.textContent = this.p1.getAttackLabel?.("Special")  ?? "Special";
    this.btnP2Basic.textContent   = this.p2.getAttackLabel?.("Normal")   ?? "Basic";
    this.btnP2Ki.textContent      = this.p2.getAttackLabel?.("KiEnergy") ?? "Ki";
    this.btnP2Special.textContent = this.p2.getAttackLabel?.("Special")  ?? "Special";
  }

  private refreshButtons(): void {
    const isP1Turn = this.turn.getActive().name === this.p1.name;
    this.setEnabled(this.btnP1Basic, isP1Turn);
    this.setEnabled(this.btnP1Ki, isP1Turn);
    this.setEnabled(this.btnP1Special, isP1Turn && this.canUseSpecial(this.p1));
    this.setEnabled(this.btnP2Basic, !isP1Turn);
    this.setEnabled(this.btnP2Ki, !isP1Turn);
    this.setEnabled(this.btnP2Special, !isP1Turn && this.canUseSpecial(this.p2));
  }

  private canUseSpecial(w: Warrior): boolean {
    const turnOK = this.turn.getTurnNumber() >= SPECIAL_UNLOCK_TURN;
    const used = hasUsedSpecialInCurrentBattle(w.name);
    return turnOK && !used && w.isAlive();
  }

  private setEnabled(btn: HTMLButtonElement, en: boolean): void { btn.disabled = !en; }

  // Observer
  private onEvent(e: any): void {
    switch (e.kind) {
      case "AttackExecuted":
        this.updateBars();
        this.fx(this.fxFor(this.kindFrom(e.attackName), e.damage, e.kiSpent));
        break;

      case "StateChanged": {
        const msg = e.to === "Dead" ? `${e.warrior} est K.O.` : `${e.warrior} → ${this.stateLabel(e.to)}`;
        this.fx(msg);
        break;
      }

      case "TurnChanged":
        this.refreshButtons();
        break;

      case "EffectStarted":
        this.showBadge(e.who, `${this.effectShort(e.effect)} ${e.totalRounds}`);
        break;

      case "EffectTick":
        this.updateBars();
        this.showBadge(e.who, `${this.effectShort(e.effect)} ${e.remainingRounds}`);
        break;

      case "EffectEnded":
        this.hideBadge(e.who);
        break;

      case "BattleEnded":
        this.updateBars();
        this.fx("KO!");
        this.disableAll();
        if (this.onEnded) this.showNextFightPulse();
        break;
    }
  }

  // Next Fight visibility/pulse
  private showNextFightPulse(): void {
    this.btnNextFight.hidden = false;
    this.btnNextFight.classList.add("is-pulse");
  }
  private hideNextFight(): void {
    this.btnNextFight.hidden = true;
    this.btnNextFight.classList.remove("is-pulse");
  }

  // Labels helpers
  private effectShort(k: "SuperSaiyan" | "Regeneration" | "EnergyLeech"): string {
    if (k === "SuperSaiyan") return "SSJ";
    if (k === "Regeneration") return "REGEN";
    return "LEECH";
  }
  private stateLabel(name: string): string {
    if (name === "Normal") return "Normal";
    if (name === "Injured") return "Blessé";
    if (name === "Exhausted") return "Épuisé";
    if (name === "Dead") return "K.O.";
    return name;
  }

  // HUD
  private updateBars(): void {
    const p1Hp = Math.max(0, Math.min(1, this.p1.getVitality() / this.p1.stats.vitality));
    const p2Hp = Math.max(0, Math.min(1, this.p2.getVitality() / this.p2.stats.vitality));
    const p1Ki = Math.max(0, Math.min(1, this.p1.getKi() / this.p1.stats.ki));
    const p2Ki = Math.max(0, Math.min(1, this.p2.getKi() / this.p2.stats.ki));
    this.hpP1.style.width = `${Math.floor(p1Hp * 100)}%`;
    this.hpP2.style.width = `${Math.floor(p2Hp * 100)}%`;
    this.kiP1.style.width = `${Math.floor(p1Ki * 100)}%`;
    this.kiP2.style.width = `${Math.floor(p2Ki * 100)}%`;
  }
  private restoreFull(w: Warrior): void {
    w.heal(w.stats.vitality * 2);
    w.gainKi(w.stats.ki * 2);
  }

  // Sprites
  private setFrames(img: HTMLImageElement, frames: string[]): void {
    (img as any)._frames = frames;
    (img as any)._index = 0;
    img.src = frames[0] ?? "";
  }
  private startAnim(): void {
    if (this.animTimer) return;
    const delay = Math.max(30, Math.floor(1000 / this.fps));
    this.animTimer = window.setInterval(() => {
      for (const img of [this.imgP1, this.imgP2]) {
        const frames: string[] = (img as any)._frames || [];
        if (!frames.length) continue;
        let index: number = (img as any)._index ?? 0;
        index = (index + 1) % frames.length;
        (img as any)._index = index;
        img.src = frames[index];
      }
    }, delay) as unknown as number;
  }
  private stopAnim(): void {
    if (this.animTimer) { clearInterval(this.animTimer); this.animTimer = undefined; }
  }
  private framesFor(w: Warrior): string[] {
    const presets = presetsJson as WarriorPreset[];
    const preset = presets.find(p => p.name === w.name && Array.isArray(p.spriteFrames) && p.spriteFrames.length > 0);
    const raw = preset?.spriteFrames ?? this.gm.getSpriteFramesForRace(w.type) ?? [];
    return raw.map(p => new URL(p, import.meta.url).toString());
  }

  // Effect badges
  private showBadge(who: string, text: string): void {
    const el = who === this.p1.name ? this.effP1 : who === this.p2.name ? this.effP2 : undefined;
    if (!el) return; el.textContent = text; el.hidden = false;
  }
  private hideBadge(who?: string): void {
    if (!who) return;
    const el = who === this.p1.name ? this.effP1 : who === this.p2.name ? this.effP2 : undefined;
    if (!el) return; el.hidden = true;
  }

  // FX
  private fx(text: string): void {
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = text;
    this.feed.appendChild(item);
    window.setTimeout(() => item.remove(), 1800);
  }
  private clearFeed(): void { this.feed.innerHTML = ""; }

  private disableAll(): void {
    this.btnP1Basic.disabled = true; this.btnP1Ki.disabled = true; this.btnP1Special.disabled = true;
    this.btnP2Basic.disabled = true; this.btnP2Ki.disabled = true; this.btnP2Special.disabled = true;
  }
  private kindFrom(name: string): AttackKind {
    const n = (name || "").toLowerCase();
    if (n.includes("kame") || n.includes("laser") || n.includes("makank") || n.includes("ki")) return "KiEnergy";
    if (n.includes("super") || n.includes("regen") || n.includes("leech")) return "Special";
    return "Normal";
  }
  private fxFor(kind: AttackKind, dmg: number, kiSpent: number): string {
    const d = dmg > 0 ? ` (-${dmg})` : "";
    const k = kiSpent > 0 ? ` [Ki -${kiSpent}]` : "";
    if (kind === "KiEnergy") return `ZAP!${d}${k}`;
    if (kind === "Special")  return `SHING!${d}${k}`;
    return `BAM!${d}${k}`;
  }
}
