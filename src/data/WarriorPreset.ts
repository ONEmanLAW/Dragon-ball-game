// Rôle: Data Contract : schéma des presets

import type { WarriorStats, WarriorType } from "../domain/Warrior";
import type { AttackKind } from "../domain/Attacks";

export type AttackLabelMap = Partial<Record<AttackKind, string>>;

export type WarriorPreset = {
  id: string;
  type: WarriorType;
  name: string;
  description: string;
  statsOverride?: Partial<WarriorStats>;
  attackLabels?: AttackLabelMap;
  spriteFrames?: string[];
};
