// CampaignManager — Singleton (progression + stages)

export type CampaignStage = {
  id: number;
  title: string;
  opponents: string[]; // séquentiels si plusieurs (ex: "C18" puis "C17")
};

type Save = {
  playerName: string | null;
  unlockedUntil: number; // index max déverrouillé
  completed: boolean[];  // par stage
};

export class CampaignManager {
  private static _instance: CampaignManager;
  public static getInstance(): CampaignManager {
    if (!this._instance) this._instance = new CampaignManager();
    return this._instance;
  }

  private readonly STORAGE_KEY = "dbz_campaign_progress_v1";
  private _stages: CampaignStage[] = [
    { id: 1, title: "Android 16",      opponents: ["Android 16"] },
    { id: 2, title: "Trunks",          opponents: ["Trunks"] },
    { id: 3, title: "A18 & A17",       opponents: ["Android 18", "Android 17"] },
    { id: 4, title: "Piccolo & Gohan", opponents: ["Piccolo", "Gohan"] },
    { id: 5, title: "Goku & Vegeta",   opponents: ["Goku", "Vegeta"] },
  ];

  private state: Save = {
    playerName: null,
    unlockedUntil: 0,
    completed: [false, false, false, false, false],
  };

  private constructor() {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(this.STORAGE_KEY) : null;
      if (raw) this.state = JSON.parse(raw) as Save;
    } catch {}
  }

  public getStages(): CampaignStage[] { return this._stages; }

  public setPlayerName(name: string): void {
    this.state.playerName = name || null;
    this.save();
  }
  public getPlayerName(): string | null { return this.state.playerName; }

  public isUnlocked(index: number): boolean {
    return index <= this.state.unlockedUntil;
  }
  public isCompleted(index: number): boolean {
    return !!this.state.completed[index];
  }

  public completeStage(index: number): void {
    if (index < 0 || index >= this._stages.length) return;
    this.state.completed[index] = true;
    if (this.state.unlockedUntil < index + 1 && index + 1 < this._stages.length) {
      this.state.unlockedUntil = index + 1;
    }
    this.save();
  }

  public resetProgress(keepPlayer = true): void {
    const name = keepPlayer ? this.state.playerName : null;
    this.state = { playerName: name, unlockedUntil: 0, completed: [false, false, false, false, false] };
    this.save();
  }

  private save(): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch {}
  }
}
