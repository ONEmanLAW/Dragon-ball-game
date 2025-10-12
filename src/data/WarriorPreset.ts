import type { WarriorStats, WarriorType } from "../models/Warrior";

export type WarriorPreset = {
  id: string;
  type: WarriorType;
  name: string;
  description: string;
  statsOverride?: Partial<WarriorStats>;
  attackLabels?: Record<string, string>;
};
