// Command Pattern : bus + contexte + historique + middleware

import { GameManager } from "../app/GameManager";
import { TurnManager } from "../app/TurnManager";
import type { Warrior } from "../domain/Warrior";
import type { AttackKind } from "../domain/Attacks";
import { Tournament, simulateBattleQuick } from "./tournament/Tournament";

export interface Command { readonly type: string; execute(ctx: CommandContext): CommandResult | void; }
export type CommandResult = { ok: true } | { ok: false; error: string };
export type Middleware = (cmd: Command, ctx: CommandContext) => void;

export class CommandContext {
  constructor(
    public gm: GameManager,
    public turn?: TurnManager,
    public tour?: Tournament
  ) {}
  setTurn(turn?: TurnManager) { this.turn = turn; }
  setTournament(tour?: Tournament) { this.tour = tour; }
}

export class CommandBus {
  public history: Command[] = [];
  constructor(private ctx: CommandContext, private middlewares: Middleware[] = []) {}
  dispatch(cmd: Command): CommandResult {
    try {
      for (const m of this.middlewares) m(cmd, this.ctx);
      const res = cmd.execute(this.ctx) as CommandResult | void;
      const ok = res === undefined || (res as CommandResult).ok !== false;
      if (ok) this.history.push(cmd);
      return ok ? { ok: true } : (res as CommandResult);
    } catch (e: any) {
      return { ok: false, error: e?.message ?? String(e) };
    }
  }
}

export const logMiddleware: Middleware = (cmd) => { console.log(`[CMD] ${cmd.type}`); };

// ===== Combat (temps réel)

export class AttackCommand implements Command {
  readonly type = "AttackCommand";
  constructor(
    private kind: AttackKind,
    private attacker: Warrior,
    private defender: Warrior
  ) {}
  execute(ctx: CommandContext): CommandResult {
    try {
      ctx.gm.createAttack(this.kind).execute(this.attacker, this.defender);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Attack failed" };
    }
  }
}

export class EndTurnCommand implements Command {
  readonly type = "EndTurnCommand";
  execute(ctx: CommandContext): CommandResult {
    if (!ctx.turn) return { ok: false, error: "No active TurnManager" };
    ctx.turn.nextTurn();
    return { ok: true };
  }
}

// ===== Tournoi

export class SeedTournamentCommand implements Command {
  readonly type = "SeedTournamentCommand";
  constructor(private playerName: string, private allNames: string[]) {}
  execute(ctx: CommandContext): CommandResult {
    const t = new Tournament(this.allNames);
    t.seed8(this.playerName);
    ctx.setTournament(t);
    return { ok: true };
  }
}

export class SimulateAIMatchCommand implements Command {
  readonly type = "SimulateAIMatchCommand";
  constructor(
    private roundIndex: number,
    private matchIndex: number,
    private a: Warrior,
    private b: Warrior
  ) {}
  execute(ctx: CommandContext): CommandResult {
    if (!ctx.tour) return { ok: false, error: "Tournament not ready" };
    const winner = simulateBattleQuick(this.a, this.b);
    ctx.tour.report(this.roundIndex, this.matchIndex, winner);
    return { ok: true };
  }
}

export class PlayPlayerMatchCommand implements Command {
  readonly type = "PlayPlayerMatchCommand";
  constructor(
    private onPlay: (a: Warrior, b: Warrior, done: (winner: string) => void) => void
  ) {}
  execute(ctx: CommandContext): CommandResult {
    if (!ctx.tour) return { ok: false, error: "Tournament not ready" };
    const mine = ctx.tour.nextPlayerMatch();
    if (!mine) return { ok: false, error: "No playable match" };
    const a = ctx.gm.getWarrior(mine.m.a)!;
    const b = ctx.gm.getWarrior(mine.m.b)!;

    this.onPlay(a, b, (winner) => {
      ctx.tour!.report(mine.r, mine.i, winner);
    });
    return { ok: true };
  }
}
