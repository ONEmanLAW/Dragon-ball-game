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
import { NormalAttack, KiEnergyAttack, AttackResult } from "./combat/Attacks";
import { Warrior } from "./models/Warrior";

class Main {
  public static start(): void {
    const gameManager = GameManager.getInstance();

    // Création
    const goku = WarriorFactory.create("Saiyan", "Goku", "Proud Saiyan warrior");
    const piccolo = WarriorFactory.create("Namekian", "Piccolo", "Wise Namekian strategist");
    const c18 = WarriorFactory.create("Android", "C-18", "Powerful android", { speed: 115 });

    // Singleton registers
    gameManager.registerWarrior(goku);
    gameManager.registerWarrior(piccolo);
    gameManager.registerWarrior(c18);

    // recap
    gameManager.listWarriors();

    // recap de 1 warrior
    const maybePiccolo = gameManager.getWarrior("Piccolo");
    if (maybePiccolo) {
      console.log("Retrieved:", maybePiccolo.summary());
    }

    // preuve du singleton
    const gameManager2 = GameManager.getInstance();
    console.log("Singleton OK? ", gameManager === gameManager2);




    // attacks
    const basicShot = gameManager.createAttack("Normal");
    const kiShot = gameManager.createAttack("KiEnergy");

    const results: AttackResult[] = [];
    results.push(kiShot.execute(goku, c18)); 
    results.push(basicShot.execute(piccolo, goku));   
    results.push(basicShot.execute(c18, piccolo));
    results.push(kiShot.execute(goku, c18));
    results.push(kiShot.execute(piccolo, c18));   


    // report
    const reportLines: string[] = [];
    reportLines.push("=== Turn 1 ===");
    for (const r of results) reportLines.push("- " + r.toLine());
    reportLines.push("");
    reportLines.push("=== Final Status ===");
    reportLines.push(`${goku.name}    | KI ${goku.getKi()} | VIT ${goku.getVitality()}`);
    reportLines.push(`${piccolo.name} | KI ${piccolo.getKi()} | VIT ${piccolo.getVitality()}`);
    reportLines.push(`${c18.name}     | KI ${c18.getKi()} | VIT ${c18.getVitality()}`);

    // Single output
    console.log(reportLines.join("\n"));
  }
}

Main.start();
