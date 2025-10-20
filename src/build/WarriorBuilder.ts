import { WarriorFactory } from "../app/WarriorFactory";
import type { Warrior, WarriorStats, WarriorType } from "../domain/Warrior";
import { NORMAL_ATTACK_NAME, SPECIAL_LABEL_BY_RACE } from "../domain/Balance";

//#region KI choices
export type SaiyanKiChoice = "Kamehameha" | "Final Flash";
export type NamekianKiChoice = "Makankōsappō";
export type AndroidKiChoice = "Laser Shot";
//#endregion

//#region Default labels
const DEFAULT_NORMAL_LABEL = NORMAL_ATTACK_NAME;
const DEFAULT_KI_LABEL_BY_RACE: Record<WarriorType, string> = {
  Saiyan: "Kamehameha",
  Namekian: "Makankōsappō",
  Android: "Laser Shot",
};
const DEFAULT_SPECIAL_LABEL_BY_RACE = SPECIAL_LABEL_BY_RACE as Record<WarriorType, string>;
//#endregion

export class WarriorBuilder {
  //#region State
  private _race?: WarriorType;
  private _name?: string;
  private _description = "Custom warrior";
  private _statsOverride?: Partial<WarriorStats>;
  private _level = 1;
  private _kiLabel?: string;
  //#endregion

  //#region Fluent API
  public ofRace(race: WarriorType): this {
    this._race = race;
    return this;
  }

  public named(name: string): this {
    this._name = name.trim();
    return this;
  }

  public describedAs(description: string): this {
    const d = description.trim();
    if (d) this._description = d;
    return this;
  }

  public withStats(stats: Partial<WarriorStats>): this {
    this._statsOverride = { ...(this._statsOverride ?? {}), ...stats };
    return this;
  }

  public withSaiyanKi(choice: SaiyanKiChoice): this {
    this.assertRace("Saiyan");
    this._kiLabel = choice;
    return this;
  }

  public withNamekianKi(choice: NamekianKiChoice = "Makankōsappō"): this {
    this.assertRace("Namekian");
    this._kiLabel = choice;
    return this;
  }

  public withAndroidKi(choice: AndroidKiChoice = "Laser Shot"): this {
    this.assertRace("Android");
    this._kiLabel = choice;
    return this;
  }
  //#endregion

  //#region Build
  public build(): Warrior {
    if (!this._race) throw new Error("Race requise (ofRace).");
    if (!this._name) throw new Error("Nom requis (named).");

    const warrior = WarriorFactory.create(
      this._race,
      this._name,
      this._description,
      this._statsOverride
    );

    const kiLabel = this._kiLabel ?? DEFAULT_KI_LABEL_BY_RACE[this._race];
    const specialLabel = DEFAULT_SPECIAL_LABEL_BY_RACE[this._race];

    warrior.setAttackLabels({
      Normal: DEFAULT_NORMAL_LABEL,
      KiEnergy: kiLabel,
      Special: specialLabel,
    });

    warrior.setLevel(this._level);
    return warrior;
  }
  //#endregion

  //#region Helpers
  private assertRace(expected: WarriorType): void {
    if (this._race && this._race !== expected) {
      throw new Error(`Technique KI réservée à ${expected}.`);
    }
  }
  //#endregion
}
