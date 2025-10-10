// src/models/Warrior.ts
/**
 * Modèle de domaine (POO compacte dans un seul fichier)
 * ------------------------------------------------------------------
 * Pattern : (Aucun — contrat + implémentations concrètes)
 * Rôle :
 *   - Définir le contrat commun d’un guerrier (interface Warrior).
 *   - Fournir une classe de base réutilisable (BaseWarrior).
 *   - Déclarer les classes concrètes (SaiyanWarrior, NamekianWarrior, AndroidWarrior)
 *     DANS CE FICHIER pour éviter la dispersion en petits fichiers.
 *
 * À NE PAS FAIRE ICI :
 *   - Créer les instances (c’est la Factory qui s’en occupe).
 *   - Gérer les états/combat (ce sera State/Observer/Decorator plus tard).
 */

export type WarriorType = "Saiyan" | "Namekian" | "Android";

// Contrat d'un warroior
export interface Warrior {
  readonly name: string;
  readonly type: WarriorType;
  hp: number;
  ki: number;
  summary(): string;
}


export class BaseWarrior implements Warrior {
  public readonly name: string;
  public readonly type: WarriorType;
  public hp: number;
  public ki: number;

  constructor(name: string, type: WarriorType, hp: number = 100, ki: number = 100) {
    this.name = name;
    this.type = type;
    this.hp = hp;
    this.ki = ki;
  }

  public summary(): string {
    return `[${this.type}] ${this.name} | HP: ${this.hp} | KI: ${this.ki}`;
  }
}





export class SaiyanWarrior extends BaseWarrior {
  constructor(name: string) {
    super(name, "Saiyan", 110, 120);
  }
}

export class NamekianWarrior extends BaseWarrior {
  constructor(name: string) {
    super(name, "Namekian", 120, 90);
  }
}

export class AndroidWarrior extends BaseWarrior {
  constructor(name: string) {
    super(name, "Android", 100, 9999); // infini le ki
  }
}
