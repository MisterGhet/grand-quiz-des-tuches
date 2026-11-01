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
