// src/main.ts
/**
 * Console entry point (demo)
 * ------------------------------------------------------------------
 * Flow:
 *  1) Factory CREATES warriors with the elements
 *  2) Singleton REGISTERS and LISTS them
 *  3) Proof Singleton is unique
 */
import { GameManager } from "./core/GameManagerSingleton";
import { WarriorFactory } from "./core/WarriorFactory";

class Main {
  public static start(): void {
    const gameManager = GameManager.getInstance();

    // 1) Factory creates elements
    const goku = WarriorFactory.create("Saiyan", "Goku", "Proud Saiyan warrior");
    const piccolo = WarriorFactory.create("Namekian", "Piccolo", "Wise Namekian strategist");
    const c18 = WarriorFactory.create("Android", "C-18", "Powerful android", { speed: 115 });

    gameManager.registerWarrior(goku);
    gameManager.registerWarrior(piccolo);
    gameManager.registerWarrior(c18);

    gameManager.listWarriors();

    const maybePiccolo = gameManager.getWarrior("Piccolo");
    if (maybePiccolo) {
      console.log("Retrieved:", maybePiccolo.summary());
    }

    // preve du singlton
    const gameManager2 = GameManager.getInstance();
    console.log("Singleton OK? ", gameManager === gameManager2);
  }
}

Main.start();
