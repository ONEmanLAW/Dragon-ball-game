import type { Warrior } from "../../domain/Warrior";

export type Match = { a: string; b: string; winner?: string; done?: boolean };

export class Tournament {
  public rounds: Match[][] = [[], [], []]; // [0]=Quarts (4), [1]=Demis (2), [2]=Finale (1)
  private player!: string;

  constructor(private allNames: string[]) {}

  seed8(playerName: string): void {
    this.player = playerName;
    const names = [...this.allNames];
    const idx = names.indexOf(playerName);
    if (idx >= 0) names.splice(idx, 1);
    shuffle(names);
    const pool = [playerName, ...names.slice(0, 7)];

    this.rounds[0] = [
      { a: pool[0], b: pool[1] },
      { a: pool[2], b: pool[3] },
      { a: pool[4], b: pool[5] },
      { a: pool[6], b: pool[7] },
    ];
    this.rounds[1] = [{ a: "TBD", b: "TBD" }, { a: "TBD", b: "TBD" }];
    this.rounds[2] = [{ a: "TBD", b: "TBD" }];
  }

  isFinished(): boolean {
    const f = this.rounds[2][0];
    return !!f.done && !!f.winner;
  }

  getWinner(): string | undefined {
    return this.isFinished() ? this.rounds[2][0].winner : undefined;
  }

  nextPlayerMatch(): { r: number; i: number; m: Match } | undefined {
    for (let r = 0; r < this.rounds.length; r++) {
      for (let i = 0; i < this.rounds[r].length; i++) {
        const m = this.rounds[r][i];
        const isPlayer = m.a === this.player || m.b === this.player;
        if (!m.done && isPlayer && m.a !== "TBD" && m.b !== "TBD") return { r, i, m };
      }
    }
    return undefined;
  }

  pendingNonPlayer(): Array<{ r: number; i: number; m: Match }> {
    const out: Array<{ r: number; i: number; m: Match }> = [];
    for (let r = 0; r < this.rounds.length; r++) {
      for (let i = 0; i < this.rounds[r].length; i++) {
        const m = this.rounds[r][i];
        const isPlayer = m.a === this.player || m.b === this.player;
        if (!m.done && !isPlayer && m.a !== "TBD" && m.b !== "TBD") out.push({ r, i, m });
      }
    }
    return out;
  }

  report(r: number, i: number, winner: string): void {
    const m = this.rounds[r][i];
    m.winner = winner;
    m.done = true;

    if (r >= this.rounds.length - 1) return;
    const next = this.rounds[r + 1];
    const target = Math.floor(i / 2);
    if (i % 2 === 0) next[target].a = winner;
    else next[target].b = winner;
  }
}

// IA simple pour matches non-joueur (pas “temps réel”)
export function simulateBattleQuick(a: Warrior, b: Warrior): string {
  const ra = a.stats.strength + a.stats.speed;
  const rb = b.stats.strength + b.stats.speed;
  if (ra === rb) return Math.random() < 0.5 ? a.name : b.name;
  return ra > rb ? a.name : b.name;
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
