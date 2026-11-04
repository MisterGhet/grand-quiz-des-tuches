# Grand Quiz des Tuches — version en ligne

## Fonctionnement
- `/admin` : interface organisateur avec code secret.
- `/screen` : écran public à partager sur Discord.
- `/play` : lien à envoyer aux participants. Ils saisissent un pseudo et le code de partie puis répondent uniquement avec A, B, C ou D.
- Réponses enregistrées et verrouillées côté serveur, avec 30 secondes déclenchées manuellement par l'organisateur.
- 20 questions, dont 7 thèmes aux positions 3, 6, 9, 12, 15, 18, 20.

## Lancer sur son ordinateur
Installer Node.js (version 18 ou supérieure), ouvrir un terminal dans ce dossier puis :

```bash
ADMIN_PIN=un-code-secret ROOM_CODE=TUCHES node server.js
```

Sous Windows PowerShell :

```powershell
$env:ADMIN_PIN="un-code-secret"
$env:ROOM_CODE="TUCHES"
node server.js
```

Ouvrir http://localhost:3000/admin. Ce lien local ne fonctionne **pas** pour les personnes à distance.

## Mettre en ligne
Déployer ce dossier comme **service Web Node.js** sur un hébergeur (par exemple Render). Commande de démarrage : `node server.js`. Définir deux variables d'environnement : `ADMIN_PIN` (code secret long) et `ROOM_CODE` (code à donner aux joueurs). Le service doit être accessible en HTTPS. Une fois le déploiement effectué, les liens `/play`, `/screen` et `/admin` seront publics.

## Limites importantes
- Les questions, joueurs et réponses sont gardés **en mémoire vive** : un redémarrage du service efface la session. Exporter les questions en JSON pour les conserver.
- Un pseudo seul n'empêche pas quelqu'un de se connecter à la place d'un autre. Distribuer le code de partie uniquement aux invités et demander à chacun de se connecter une seule fois.
- Le serveur empêche les changements de réponse après validation et refuse les réponses hors délai. Il ne peut pas empêcher les recherches sur Internet ou la communication entre joueurs.
- Pour un usage public important, ajouter authentification forte, stockage persistant, limitation des requêtes et surveillance.

## Version avec scores et sauvegarde permanente

- 1 point par bonne réponse, attribué une seule fois quand l'organisateur révèle la réponse **après avoir démarré le chronomètre**.
- Classement visible sur `/admin` et `/screen`. Le bouton « Remettre les scores à zéro » lance un nouveau classement.
- Les questions sont enregistrées dans `questions.json` sur GitHub et rechargées au démarrage du serveur.
- Les scores et connexions des joueurs ne sont **pas** persistants lors d'un redémarrage du serveur.

### Configurer la sauvegarde automatique (obligatoire)

1. Sur GitHub : Settings (du compte) → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Sélectionner le dépôt `MisterGhet/grand-quiz-des-tuches` seulement et accorder **Contents: Read and write**. Choisir une durée d'expiration adaptée et noter de renouveler le jeton avant son expiration.
3. Sur Render → service → Environment, ajouter `GITHUB_TOKEN` avec le jeton créé (ne jamais l'ajouter dans GitHub ni le partager).
4. Ajouter `GITHUB_REPO` avec la valeur `MisterGhet/grand-quiz-des-tuches` (facultatif si le dépôt reste identique).
5. Conserver `ADMIN_PIN` et `ROOM_CODE` existants. Redéployer.
6. Sur `/admin`, vérifier « Sauvegarde : GitHub connecté », saisir les questions, puis cliquer sur « Sauvegarder les 20 questions sur GitHub ».

**Attention** : une modification du dépôt via la sauvegarde peut déclencher un nouveau déploiement automatique sur Render et donc déconnecter les joueurs. Préparer et sauvegarder les questions **avant** la soirée, pas pendant la partie. L'interface organisateur ne sauvegarde pas automatiquement les modifications en cours d'édition : cliquer sur le bouton de sauvegarde après chaque modification des questions. La sauvegarde GitHub peut déclencher un déploiement automatique ; il vaut mieux terminer les modifications avant le début de la partie.

## Manche 2 — 14 thèmes, 7 joueurs

- Organisateur : `/admin/manche2` (même `ADMIN_PIN` que la manche 1).
- Écran public à partager sur Discord : `/screen/manche2`.
- Manche 1 inchangée : `/admin`, `/screen`, `/play`.
- Saisir les sept noms et les quinze questions/réponses de chacun des quatorze thèmes depuis l'organisateur.
- Choisir un joueur et un thème, activer éventuellement sa Streak, puis démarrer le chronomètre de 90 secondes.
- 1 point par bonne réponse, 2 points si Streak ; une seule Streak par joueur, consommée au démarrage.
- Le chrono devient rouge à 15 secondes et les réponses/corrections restent accessibles après 0.
- À la fin, cliquer sur « Terminer le passage » puis « Valider le passage » pour griser le thème.
- Un historique permet de corriger après coup le nombre de bonnes réponses d'un passage validé.

### Sauvegarde
La manche 2 est sauvegardée dans `manche2.json` localement et, **si `GITHUB_TOKEN` et `GITHUB_REPO` sont configurés**, dans le fichier `manche2.json` du dépôt GitHub. **Sur Render, le disque local peut être effacé lors des redéploiements : pour une conservation durable, configurez impérativement `GITHUB_TOKEN` avec droits d'écriture sur le dépôt et `GITHUB_REPO`.** Le statut apparaît dans l'organisateur. Les données ne doivent pas être considérées comme sauvegardées durablement si GitHub n'est pas connecté. Ne jamais publier le jeton dans le dépôt.

### Important
Les écrans publics n'exposent ni les questions ni les réponses. Le système de synchronisation fonctionne par interrogation périodique du serveur (environ une seconde). La manche 2 est indépendante de la manche 1.

## Manche 3 — Grande finale

- Organisateur : `/admin/manche3` (même code `ADMIN_PIN` que les autres manches)
- Affichage Discord : `/screen/manche3`
- Préparation : renseigner les 7 joueurs, leurs thèmes et 10 questions/réponses par joueur.
- Finale : sélectionner les 4 finalistes (rouge, jaune, vert, violet), attribuer 3+3+2 questions aux 3 éliminés, puis générer 48 cases aléatoires.
- Les couleurs sont masquées manuellement ; une question jouée devient grise. La réponse est révélée par l'organisateur.
- Barème : 3 points sur son propre thème, 2 points sur un autre thème ou une case blanche, 0 en cas d'erreur.
- Une annulation de la dernière validation est possible ; la réinitialisation de la grille conserve les banques de questions.
- La sauvegarde durable utilise `manche3.json` sur la branche GitHub `quiz-data`, et exige `GITHUB_TOKEN` avec permission d'écriture. Ne pas modifier manuellement cette branche pendant une partie.
