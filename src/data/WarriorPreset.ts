// WarriorPreset — typage des presets JSON (Goku, Vegeta, ...)

import type { WarriorStats, WarriorType } from "../domain/Warrior";
import type { AttackKind } from "../domain/Attacks";

//#region UI labels
export type AttackLabelMap = Partial<Record<AttackKind, string>>;
//#endregion

export type WarriorPreset = {
  id: string;
  type: WarriorType;
  name: string;
  description: string;
  // Surcharge partielle des stats par défaut de la race
  statsOverride?: Partial<WarriorStats>;
  // Labels d’affichage (Normal / KiEnergy / Special)
  attackLabels?: AttackLabelMap;
};
