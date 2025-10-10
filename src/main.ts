// src/main.ts
/**
 * Point d’entrée console
 * -------------------------------------------------------------
 * Démonstration d’un flux correct :
 *   1) La Factory CRÉE les objets (Goku, Piccolo, C-18).
 *   2) Le Singleton les ENREGISTRE et les LISTE.
 *   3) Preuve du Singleton (instance unique).
 *
 * NB : POO only — tout est encapsulé en classes.
 */
import { GameManager } from "./core/GameManagerSingleton.ts";
import { WarriorFactory } from "./core/WarriorFactory";

class Main {
  public static start(): void {
    const gameManager = GameManager.getInstance();

    // La Factory crée…
    const goku = WarriorFactory.create("Saiyan", "Goku");
    const piccolo = WarriorFactory.create("Namekian", "Piccolo");
    const c18 = WarriorFactory.create("Android", "C-18");

    // le Singleton enregistre
    gameManager.registerWarrior(goku);
    gameManager.registerWarrior(piccolo);
    gameManager.registerWarrior(c18);

    // list des warriors
    gameManager.listWarriors();

    // Preuve : le Singleton n’a pas créé les objets, il ne fait que les gérer
    const gameManager2 = GameManager.getInstance();
    console.log("Singleton OK ? ", gameManager === gameManager2);
  }
}

Main.start();
