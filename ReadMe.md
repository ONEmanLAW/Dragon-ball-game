# Dragon ball Warriors

Petit jeu de combat **tour par tour** (1v1 + tournoi 8 joueurs + un autre mode bientôt) en **TypeScript** sans **FrameWork**.   
Architecture orientée “domain” et **Design Patterns** : Singleton, Factory, Builder, State, Template Method, Proxy, Observer, Decorator, Command.

> Attention Projet éducatif / fan-made. Visuels/sons utilisés à des fins de démonstration.

---

## Démarrage

### Prérequis
- **Node.js ≥ 18**
- **npm** (ou pnpm/yarn)

### Installation
```bash
git clone <Repo>
npm install
```

### Lancement
```bash
# Lancement in game
npm run game
# Lancement in web browser
npm run dev
```

### Note
- Jouer en 1080p et mieux. La version responsive n'est pas encore optimisé.

### Architecture en un coup d’œil
- Domaine (combat, persos, états, attaques, effets, règles d’équilibrage)
- Infra (gestion du roster, presets, audio, bus d’événements, tournoi, tour par tour)
- UI (vues Create / Roster / Battle / Tournament + routeur d’écrans)
- Répertoires clés : app/, domain/, events/, build/, data/, ui/, styles/.

# 🧩 Architecture & Design Patterns

---


- **Création de perso** : `WarriorBuilder` (UI) + validations → enregistrement dans `GameManager` (Singleton).  
- **Combat** : `Attack` (Template Method) orchestre un pipeline commun ; variations via classes concrètes (Normal/Ki/Special).  
- **Règles méta de Spéciale** : `SpecialAttackProxy` (Proxy) filtre avant d’exécuter la vraie `SpecialAttack`.  
- **Effets temporaires** (transformations, regen, vol d’énergie) : `Effects` (Decorator) ajoutent/retirent des capacités.  
- **États** (Normal/Injured/Exhausted/Dead) : `WarriorState` (State) module dégâts/coûts et transitions.  
- **Événements** (Observer) : tout le domaine **émet**, l’UI/audio **réagit**.  
- **Historique et traçabilité** : actions métier via `Command` + middleware de log.


---

## Flux type

### A. Pipeline d’une attaque (Template Method + Observer)
1. **Pré‑checks** (ex: Proxy Spéciale) → Event `AttackPreviewFailed` si refus.  
2. **Dépense** KI (ou annulation si impossible).  
3. **Jet d’esquive** (probabilités selon stats/états/effets).  
4. **Calcul dégâts** (modulateurs `State` + `Effects`).  
5. **Application PV** ; transitions d’**état** si seuils franchis.  
6. **Événements** : `AttackExecuted`, `DamageApplied`, `StateChanged`, `KO` éventuel.  
7. **Hooks d’effets** (ex: `EnergyLeech` sur tick).

### B. Cycle d’un tour (Command + Observer)
1. UI **dispatch** `StartTurnCommand`.  
2. Joueur choisit une **Action** (attaque, item/bean, transfo, défense) → commande dédiée.  
3. Bus → Handler → Domaine ; événements vers l’UI (`TurnChanged`, `EffectTicked`).  
4. UI rend les **feedbacks** (toasts, jauges, audio).  
5. **Fin de tour** → `EndTurnCommand` (vérifie effets à durée, Z‑index spécial, etc.).

---

## Recettes d’extensibilité

### + Ajouter une **race**
1. Créer `class NewRaceWarrior extends Warrior` (invariants de base).  
2. Déclarer dans `WarriorFactory.register("newrace", NewRaceWarrior)`.  
3. Mettre à jour `KI_CHOICES_BY_RACE` + presets si besoin.  
4. (Optionnel) Effets/transformations spécifiques via Decorators.

### Ajouter une **attaque**
1. Étendre `Attack` (ou configurer via stratégie) : label, multiplicateur, conditions.  
2. Si règles méta : créer un **Proxy** dédié.  
3. Enregistrer côté `GameManager` / tables d’attaques.  
4. Tests : pipeline + événements + interactions `State/Effects`.

### Ajouter un **effet** (Decorator)
1. Implémenter `Effect` : `apply()`, `onTick()`, `cleanup()`.  
2. Déclarer badges UI + règles de cumul/priorité.  
3. Publier `EffectApplied/EffectTicked/EffectExpired`.  
4. Tests : rollback garanti même en cas de KO/quitting.

---

## Catalogue d’événements

- `BattleStarted`, `BattleEnded`  
- `TurnChanged`, `EndTurnRequested`  
- `AttackPreviewFailed`, `AttackExecuted`, `DamageApplied`, `DodgeSucceeded`  
- `HealthChanged`, `KiChanged`, `KO`  
- `StateChanged { from, to }`  
- `EffectApplied`, `EffectTicked`, `EffectExpired`  
- `TournamentSeeded`, `MatchLaunched`, `AIMoveComputed`

> **Conseil UX** : regrouper certains événements en **toasts** lisibles (durée/hiérarchie), et limiter le spam (throttle).

---

## Checklist de validation & métriques

- **Couplage** : UI ne connaît **pas** les classes concrètes (Factory/Proxy/Effects).  
- **Traçabilité** : chaque action génère un **log** (Command middleware) exploitable pour rejouer un match.  
- **Événements** : zéro fuite d’abonnement ; listeners nettoyés en fin de combat/vue.  
- **États** : transitions **exhaustives** et **déterministes** ; pas de “coups fantômes”.  
- **Effets** : rollback garanti ; règles de stacking documentées.  
- **Performances** : coût moyen d’un tour, latence UI post‐événement, taille du log.  
- **Testabilité** : mocks pour Singletons ; seeds de combats reproductibles.

---

### Annexes rapides

- **Glossaire** : *KI* (énergie), *PV* (points de vie), *Tick* (pas d’horloge/étape), *KO* (knockout).  
- **Dossier utiles** (exemple) :  
  - `src/domain/{warrior, attack, effects, state, commands}/...`  
  - `src/app/views/{create, roster, battle, tournament}/...`  
  - `src/shared/{event-bus, audio, balance}/...`

---


