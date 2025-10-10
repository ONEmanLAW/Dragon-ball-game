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
import { AttackResult } from "./combat/Attacks";


class Main {
  public static start(): void {
    const gameManager = GameManager.getInstance();

    // Création
    const goku = WarriorFactory.create("Saiyan", "Goku", "Proud Saiyan warrior");
    const piccolo = WarriorFactory.create("Namekian", "Piccolo", "Wise Namekian strategist");
    const c18 = WarriorFactory.create("Android", "C-18", "Powerful android");

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

    // Fatigu + Douleur
    results.push(basicShot.execute(c18, piccolo));
    results.push(basicShot.execute(c18, piccolo));  
    results.push(basicShot.execute(c18, piccolo));  
    results.push(basicShot.execute(goku, piccolo));

    results.push(basicShot.execute(c18, goku)); 
    results.push(basicShot.execute(c18, goku));      
    results.push(basicShot.execute(c18, goku)); 
    


    // console.log of my elements
    const reportLines: string[] = [];
    reportLines.push("=== Actions (with attacker state) ===");
    for (const r of results) reportLines.push("- " + r.toLine());

    reportLines.push("");
    reportLines.push("=== Final Status ===");
    reportLines.push(`Goku    → expected: Exhausted when KI ≤ 10% | got: ${goku.getStateName()} (KI ${goku.getKi()})`);
    reportLines.push(`Piccolo → expected: Injured   when VIT ≤ 10% | got: ${piccolo.getStateName()} (VIT ${piccolo.getVitality()})`);


    console.log(reportLines.join("\n"));
  }
}

Main.start();
