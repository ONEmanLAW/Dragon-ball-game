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

## Détail par pattern

### 1) Singleton
**Où ?** `GameManager`, `EventBus`, `AudioManager`, `AudioSystem`  
**Intention.** Un *point de vérité unique* pour des ressources globales (roster, attaques, bus d’événements, mixage audio).  
**Mise en œuvre.** Constructeur privé + accès via `getInstance()` ; dépendance injectée par référence (pas de new sauvage).  
**Impact.** Cohérence et orchestration simple côté UI.  
**Risques/anti‑smells.** *God object*, état caché, tests difficiles.  
**Questions critiques.**
- Quelles API doivent rester **pures/immutables** vs mutables ?
- Peut‑on **simuler**/réinitialiser l’état pour les tests ?  
**Tests à prévoir.** Reset/boot, isolement entre tests, abonnement/désabonnement événementiel.

---

### 2) Factory
**Où ?** `WarriorFactory`  
**Intention.** **Centraliser** la création selon la **race** (Saiyan, Namekian, Android) et masquer les classes concrètes.  
**Mise en œuvre.** Map `race → constructeur concret` ; enregistrement d’une nouvelle race sans toucher à l’UI.  
**Impact.** Ajouter une race = déclarer la classe + l’enregistrer.  
**Risques.** Switch déguisé si la map devient tentaculaire ; duplication de construction vs Builder.  
**Questions.**
- Qui choisit la race : **UI** (sélection) ou **IA** (seed) ?
- Quels **invariants** par race (KI, PV, attaques par défaut) ?  
**Tests.** Création de chaque race, erreurs sur race inconnue, compatibilité avec Builder.

---

### 3) Builder
**Où ?** `WarriorBuilder` (CreateView)  
**Intention.** Construire un perso custom **de façon sûre** depuis l’UI (fluent + validations).  
**Mise en œuvre.** Étapes guidées : race → nom → description → choix KI (cohérent race) → build.  
**Impact.** Entrées propres côté UI ; objet prêt à être persisté via `GameManager`.  
**Risques.** Logique métier dupliquée si on recode des validations ailleurs.  
**Questions.**
- Que faire si l’UI saute une étape ? (stratégie de **validation différée**)
- L’export JSON du perso est‑il **stable** (versionné) ?  
**Tests.** Cas limites (nom vide, KI invalide), sérialisation/désérialisation.

---

### 4) State
**Où ?** `WarriorState` : `Normal`, `Injured`, `Exhausted`, `Dead`  
**Intention.** Éviter les `if/switch` massifs ; déléguer comportements dépendants de l’état.  
**Mise en œuvre.** `Warrior` interroge l’état courant pour `adjustOutgoingDamage`, `adjustKiCost`; recalcule l’état après altération PV/KI ; **émet** `StateChanged`.  
**Impact.** Comportements localisés, testables ; transitions traçables.  
**Risques.** Transitions implicites difficiles à suivre.  
**Questions.**
- Qui **décide** de la transition : le `Warrior` ou l’**Effect** actif ?
- Peut‑on **prévisualiser** un changement d’état (UI) ?  
**Tests.** Matrice de transitions, idempotence (pas de boucles), événements bien émis.

---

### 5) Template Method
**Où ?** `Attack` base + `NormalAttack`, `KiEnergyAttack`, `SpecialAttack`  
**Intention.** Un pipeline **cohérent** pour toutes les attaques, avec points de variation.  
**Mise en œuvre.** `execute()` : dépense KI → esquive → dégâts → événements → KO. Sous‑classes fournissent label, multiplicateur, logique spéciale.  
**Impact.** Alignement des effets, lisibilité des logs.  
**Risques.** Sous‑classes trop bavardes (cassent le pipeline).  
**Questions.**
- Où s’arrête le pipeline commun (jusqu’au **KO** ?)  
- Quelle **granularité** d’événements (avant/après chaque étape) ?  
**Tests.** Oracles de pipeline (ordre), cas d’esquive, coûts KI, KO.

---

### 6) Proxy
**Où ?** `SpecialAttackProxy`  
**Intention.** **Gater** (filtrer) l’accès aux Spéciales (KI mini, PV bas, etc.) sans polluer `Attack.execute()`.  
**Mise en œuvre.** Le proxy valide les préconditions et **délègue** à la vraie `SpecialAttack`. Il est enregistré côté `GameManager` comme implémentation par défaut de la Spéciale.  
**Impact.** Règles méta centralisées, explicites.  
**Risques.** Double validation si d’autres couches testent aussi les conditions.  
**Questions.**
- Que **publier** si gating échoue ? (événement UX pour feedback)
- Certaines règles dépendent‑elles d’un **mode** (tournoi vs campagne) ?  
**Tests.** Préconditions satisfaites/échouées, messages d’erreur/événements.

---

### 7) Observer
**Où ?** `EventBus` + `GameEvents` (publishers: `Attack`, `TurnManager`, `Effects`, `Warrior`; subscribers: `BattleView`, `AudioSystem`, …)  
**Intention.** **Découpler** moteur ↔ présentations/ambiances.  
**Mise en œuvre.** Le domaine **émet** : attaque, esquive, changement d’état/tour, (dé)but combat, effet (start/tick/end). UI/audio **s’abonnent**.  
**Impact.** UI réactive sans couplage direct ; audio/FX synchronisés.  
**Risques.** Fuites d’abonnements, cascades d’événements.  
**Questions.**
- Quelle **politique** d’abonnement/désabonnement ?
- Comment **throttler**/regrouper les événements pour l’UI ?  
**Tests.** Comptage de listeners, absence de memory leaks, ordre minimal garanti.

---

### 8) Decorator
**Où ?** `Effects` : `SuperSaiyanEffect`, `RegenerationEffect`, `EnergyLeechEffect`  
**Intention.** Ajouter **temporairement** des capacités sans modifier `Warrior`.  
**Mise en œuvre.** Application → badge UI → écoute actions/ticks → rollback propre (stats/badges) → événements.  
**Impact.** Transformations/bonus dynamiques et sûrs.  
**Risques.** Empilements d’effets non maîtrisés (ordre, cumul).  
**Questions.**
- Politique de **stacking** (cumulable ? exclusif ? priorités) ?
- Quid des **effets négatifs** (debuffs) et de leur UX ?  
**Tests.** Cumul/priorités, fin anticipée, rollback even if KO/forfeit.

---

### 9) Command
**Où ?** `domain/commands` (bus, contexte, middleware, historique)  
**Intention.** **Encapsuler** les actions métier (attaque, fin de tour, seed tournoi, IA, lancement match) et **tracer** l’exécution.  
**Mise en œuvre.** UI **dispatch** → `CommandBus` → handlers avec `CommandContext` (accès `GameManager`, `TurnManager`, `Tournament`). Middleware de log/historique.  
**Impact.** Pilotage clair du tournoi et des combats ; rejouabilité possible.  
**Risques.** Sur‑ingénierie si les commandes restent triviales.  
**Questions.**
- Doit‑on pouvoir **rejouer** un match à partir d’un log ?
- **Idempotence** de certaines commandes (réémission réseau) ?  
**Tests.** Log complet d’un combat, erreurs handler, invariants (ex: un tour = une fin).

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


