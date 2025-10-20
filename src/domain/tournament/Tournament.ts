// Rôle: Modèle de bracket + utilitaires (shuffle/simulation) — pas de GoF majeur.

import type { Warrior } from "../../domain/Warrior";

export type Match = { a: string; b: string; winner?: string; done?: boolean };

export class Tournament {
  //#region Fields
  public rounds: Match[][] = [[], [], []]; // [0]=Quarts (4), [1]=Demis (2), [2]=Finale (1)
  private playerName!: string;
  private static readonly TBD = "TBD";
  //#endregion

  //#region Ctor
  constructor(private allNames: string[]) {}
  //#endregion

  //#region Public API
  seed8(playerName: string): void {
    this.playerName = playerName;

    const names = [...this.allNames];
    const playerIndex = names.indexOf(playerName);
    if (playerIndex >= 0) names.splice(playerIndex, 1);

    shuffle(names);
    const pool = [playerName, ...names.slice(0, 7)];

    this.rounds[0] = [
      { a: pool[0], b: pool[1] },
      { a: pool[2], b: pool[3] },
      { a: pool[4], b: pool[5] },
      { a: pool[6], b: pool[7] },
    ];
    this.rounds[1] = [{ a: Tournament.TBD, b: Tournament.TBD }, { a: Tournament.TBD, b: Tournament.TBD }];
    this.rounds[2] = [{ a: Tournament.TBD, b: Tournament.TBD }];
  }

  isFinished(): boolean {
    const finalMatch = this.rounds[2][0];
    return !!finalMatch.done && !!finalMatch.winner;
  }

  getWinner(): string | undefined {
    return this.isFinished() ? this.rounds[2][0].winner : undefined;
  }

  nextPlayerMatch(): { r: number; i: number; m: Match } | undefined {
    for (let roundIndex = 0; roundIndex < this.rounds.length; roundIndex++) {
      for (let matchIndex = 0; matchIndex < this.rounds[roundIndex].length; matchIndex++) {
        const match = this.rounds[roundIndex][matchIndex];
        const involvesPlayer = match.a === this.playerName || match.b === this.playerName;
        const ready = match.a !== Tournament.TBD && match.b !== Tournament.TBD;
        if (!match.done && involvesPlayer && ready) return { r: roundIndex, i: matchIndex, m: match };
      }
    }
    return undefined;
  }

  pendingNonPlayer(): Array<{ r: number; i: number; m: Match }> {
    const out: Array<{ r: number; i: number; m: Match }> = [];
    for (let roundIndex = 0; roundIndex < this.rounds.length; roundIndex++) {
      for (let matchIndex = 0; matchIndex < this.rounds[roundIndex].length; matchIndex++) {
        const match = this.rounds[roundIndex][matchIndex];
        const involvesPlayer = match.a === this.playerName || match.b === this.playerName;
        const ready = match.a !== Tournament.TBD && match.b !== Tournament.TBD;
        if (!match.done && !involvesPlayer && ready) out.push({ r: roundIndex, i: matchIndex, m: match });
      }
    }
    return out;
  }

  report(roundIndex: number, matchIndex: number, winner: string): void {
    const match = this.rounds[roundIndex][matchIndex];
    match.winner = winner;
    match.done = true;

    if (roundIndex >= this.rounds.length - 1) return;

    const nextRound = this.rounds[roundIndex + 1];
    const targetIndex = Math.floor(matchIndex / 2);
    if (matchIndex % 2 === 0) nextRound[targetIndex].a = winner;
    else nextRound[targetIndex].b = winner;
  }
  //#endregion
}

//#region AI
// IA simple pour matches non-joueur (pas “temps réel”)
export function simulateBattleQuick(a: Warrior, b: Warrior): string {
  const ratingA = a.stats.strength + a.stats.speed;
  const ratingB = b.stats.strength + b.stats.speed;
  if (ratingA === ratingB) return Math.random() < 0.5 ? a.name : b.name;
  return ratingA > ratingB ? a.name : b.name;
}
//#endregion

//#region Utils
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
//#endregion
