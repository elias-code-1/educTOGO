# Guide de Déploiement Mobile (Capacitor + GitHub Actions)

Ce guide explique comment configurer votre dépôt pour générer automatiquement des applications Android (APK/AAB) et iOS (.ipa) directement depuis GitHub, sans avoir besoin d'un ordinateur local.

## 1. Génération du Keystore Android (Signature)

Puisque vous travaillez sur Android, vous pouvez utiliser l'application **Termux** (disponible sur F-Droid) pour générer votre clé de signature.

1. Installez OpenJDK dans Termux : `pkg install openjdk-17`
2. Générez la clé :
   ```bash
   keytool -genkey -v -keystore release-key.keystore -alias cpla_alias -keyalg RSA -keysize 2048 -validity 10000
   ```
3. Suivez les instructions (nom, mot de passe, etc.). **Notez bien le mot de passe et l'alias.**
4. Convertissez le fichier en BASE64 pour GitHub :
   ```bash
   base64 release-key.keystore > keystore_base64.txt
   ```
5. Copiez le contenu de `keystore_base64.txt`.

## 2. Configuration des Secrets GitHub

Allez dans votre dépôt GitHub : **Settings > Secrets and variables > Actions > New repository secret**.

Ajoutez les 11 secrets suivants :

| Nom du Secret | Description |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Clé API Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine d'authentification Firebase |
| `VITE_FIREBASE_PROJECT_ID` | ID du projet Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de stockage Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID d'envoi de messagerie Firebase |
| `VITE_FIREBASE_APP_ID` | ID de l'application Firebase |
| `GEMINI_API_KEY` | Votre clé API Gemini |
| `KEYSTORE_BASE64` | Le contenu du fichier `keystore_base64.txt` |
| `KEYSTORE_PASSWORD` | Le mot de passe du Keystore |
| `KEY_ALIAS` | L'alias de la clé (ex: `cpla_alias`) |
| `KEY_PASSWORD` | Le mot de passe de la clé (souvent le même que le keystore) |

## 3. Déclencher le Build

- **Android** : Le build se lance automatiquement à chaque `push` sur la branche `main`. Vous pouvez aussi le lancer manuellement dans l'onglet **Actions**.
- **iOS** : Le build doit être lancé **manuellement** depuis l'onglet **Actions** (car il consomme beaucoup de minutes GitHub Actions gratuites).

## 4. Télécharger les fichiers

Une fois le workflow terminé (icône verte) :
1. Cliquez sur le build réussi dans l'onglet **Actions**.
2. Descendez jusqu'à la section **Artifacts**.
3. Téléchargez `app-debug.apk` pour tester sur votre téléphone ou `app-release.aab` pour le Google Play Store.

## 5. Publication sur les Stores

- **Google Play** : Créez un compte développeur (25$ à vie) et envoyez le fichier `.aab`.
- **Apple App Store** : Nécessite un compte Apple Developer (99$/an) et un Mac (ou une VM via GitHub Actions) pour la signature finale. Le build actuel est un build de test non signé.

---
*Note : Ce pipeline a été configuré pour fonctionner sans que les dossiers `android/` ou `ios/` ne soient présents dans votre code source. Ils sont générés dynamiquement par GitHub Actions.*
