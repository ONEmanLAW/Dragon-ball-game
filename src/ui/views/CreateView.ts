import type { Warrior, WarriorType } from "../../domain/Warrior";
import { WarriorBuilder } from "../../build/WarriorBuilder";
import { GameManager } from "../../app/GameManager";
import { KI_CHOICES_BY_RACE, DEFAULT_STATS_BY_RACE } from "../../domain/Balance";

const el = <T extends HTMLElement>(id: string) => {
  const n = document.getElementById(id);
  if (!n) throw new Error(`#${id} not found`);
  return n as T;
};

const IMG_BASE = "../../../";
const DEFAULT_IMAGES: Record<WarriorType, string> = {
  Saiyan:   `${IMG_BASE}goku_idle.png`,
  Namekian: `${IMG_BASE}picolo_idle.png`,
  Android:  `${IMG_BASE}android17_idle.png`,
} as const;

export class CreateView {
  private readonly gm = GameManager.getInstance();

  private inputName!: HTMLInputElement;
  private inputDesc!: HTMLInputElement;
  private selectRace!: HTMLSelectElement;
  private selectKi!: HTMLSelectElement;
  private btnCreate!: HTMLButtonElement;
  private createError!: HTMLDivElement;

  private statLevel!: HTMLElement;
  private statStr!: HTMLElement;
  private statSpd!: HTMLElement;
  private statKi!: HTMLElement;
  private statVit!: HTMLElement;

  private img!: HTMLImageElement;

  constructor(private readonly cb: { onCreated: (w: Warrior) => void }) {}

  public mount(): void {
    this.inputName   = el<HTMLInputElement>("input-name");
    this.inputDesc   = el<HTMLInputElement>("input-description");
    this.selectRace  = el<HTMLSelectElement>("select-race");
    this.selectKi    = el<HTMLSelectElement>("select-ki");
    this.btnCreate   = el<HTMLButtonElement>("btn-create");
    this.createError = el<HTMLDivElement>("create-error");

    this.statLevel = el<HTMLElement>("stat-level");
    this.statStr   = el<HTMLElement>("stat-str");
    this.statSpd   = el<HTMLElement>("stat-spd");
    this.statKi    = el<HTMLElement>("stat-ki");
    this.statVit   = el<HTMLElement>("stat-vit");

    this.img = el<HTMLImageElement>("sprite-img");

    this.selectRace.addEventListener("change", this.onRaceChange);
    this.btnCreate.addEventListener("click", this.onCreate);

    this.applyRace(this.selectedRace);
  }

  private get selectedRace(): WarriorType {
    return (this.selectRace.value as WarriorType) || "Saiyan";
  }

  private onRaceChange = () => {
    this.applyRace(this.selectedRace);
  };

  private applyRace(race: WarriorType): void {
    this.populateKiChoices(race);
    this.renderStats(race);
    this.updateImage(race);
  }

  private populateKiChoices(race: WarriorType): void {
    const opts = (KI_CHOICES_BY_RACE[race] || [])
      .map(v => `<option value="${v}">${v}</option>`)
      .join("");
    this.selectKi.innerHTML = opts;
  }

  private renderStats(race: WarriorType): void {
    const s = DEFAULT_STATS_BY_RACE[race];
    this.statLevel.textContent = "1";
    this.statStr.textContent   = String(s.strength);
    this.statSpd.textContent   = String(s.speed);
    this.statKi.textContent    = String(s.ki);
    this.statVit.textContent   = String(s.vitality);
  }

  private updateImage(race: WarriorType): void {
    const src = DEFAULT_IMAGES[race];
    if (this.img.src !== src) this.img.src = src;
    this.img.alt = `${race} preview`;
  }

  private onCreate = (): void => {
    this.createError.textContent = "";

    const name = this.inputName.value.trim();
    if (!name) {
      this.createError.textContent = "Please enter a name.";
      return;
    }
    if (this.gm.getWarrior(name)) {
      this.createError.textContent = "A warrior with this name already exists.";
      return;
    }

    const race = this.selectedRace;
    const ki   = this.selectKi.value;
    const desc = this.inputDesc.value.trim() || "Custom warrior";

    try {
      const b = new WarriorBuilder().ofRace(race).named(name).describedAs(desc);
      if (race === "Saiyan")       b.withSaiyanKi(ki as any);
      else if (race === "Namekian") b.withNamekianKi(ki as any);
      else                          b.withAndroidKi(ki as any);

      const w = b.build();
      this.cb.onCreated(w);
    } catch (e: any) {
      this.createError.textContent = e?.message ?? "Creation failed.";
    }
  };
}
