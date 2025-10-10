// src/main.ts
/**
 * Console entry point (demo)
 * ---------------------------------------------------------------
 */

import { GameManager } from "./core/GameManagerSingleton";
import { WarriorFactory } from "./core/WarriorFactory";
import { AttackResult } from "./combat/Attacks";

//#region Main Orchestrator
class Main {
  public static start(): void {
    const gameManager = GameManager.getInstance();

    // 1) Create warriors (Factory)
    // -- type, name, description) -- //
    const goku = WarriorFactory.create("Saiyan",   "Goku",    "Proud Saiyan warrior");

    const piccolo = WarriorFactory.create("Namekian", "Piccolo", "Wise Namekian strategist");

    const c18 = WarriorFactory.create("Android",  "C-18",    "Powerful android");

    // 2) Register (Singleton)
    gameManager.registerWarrior(goku);
    gameManager.registerWarrior(piccolo);
    gameManager.registerWarrior(c18);

    // 3) Scenario (attacks) — compact and state-revealing
    const results = Main.runTestScenario(gameManager, { goku, piccolo, c18 });

    // 4) output
    console.log(Main.buildTestReport(results, { goku, piccolo, c18 }));
  }

  //#endregion

  

  //#region Test
  private static runTestScenario(
    gameManager: GameManager,
    chars: { goku: any; piccolo: any; c18: any }
  ): AttackResult[] {
    const basic   = gameManager.createAttack("Normal");
    const kiShot  = gameManager.createAttack("KiEnergy");

    const { goku, piccolo, c18 } = chars;
    const results: AttackResult[] = [];

    results.push(kiShot.execute(c18, goku));
    results.push(kiShot.execute(c18, goku)); 

    results.push(basic.execute(c18, goku));
    results.push(basic.execute(goku, piccolo)); 
    results.push(kiShot.execute(piccolo, c18));
    results.push(kiShot.execute(piccolo, c18)); 

    return results;
  }


  private static buildTestReport(
    results: AttackResult[],
    chars: { goku: any; piccolo: any; c18: any }
  ): string {
    const { goku, piccolo, c18 } = chars;
    const lines: string[] = [];

    lines.push("=== Actions ===");
    for (const r of results) lines.push("- " + r.toLine());

    lines.push("");
    lines.push("=== Final Status (STATE checks) ===");
    lines.push(
      `Goku    → expected: Injured when KI ≤ 10% | got: ${goku.getStateName()} (KI ${goku.getKi()}, VIT ${goku.getVitality()})`
    );
    lines.push(
      `Piccolo → expected: Exhausted   when VIT ≤ 10% | got: ${piccolo.getStateName()} (KI ${piccolo.getKi()}, VIT ${piccolo.getVitality()})`
    );
    lines.push(
      `C-18    → state: ${c18.getStateName()} (KI ${c18.getKi()}, VIT ${c18.getVitality()})`
    );

    return lines.join("\n");
  }
}

//#endregion

Main.start();
