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
