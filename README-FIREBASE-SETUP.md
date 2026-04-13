# Configuration Firebase pour Android (CPLA 1ère D)

Ce guide vous explique comment configurer Firebase pour que votre application mobile fonctionne correctement (Authentification, Firestore, Storage).

## 1. Récupérer le fichier `google-services.json`
1. Allez dans la [Console Firebase](https://console.firebase.google.com/).
2. Cliquez sur l'icône **Paramètres** (roue dentée ⚙️) > **Paramètres du projet**.
3. Dans l'onglet **Général**, descendez jusqu'à la section **Vos applications**.
4. Sélectionnez votre application Android (`tg.logonova.cpla1erd`).
5. Cliquez sur le bouton **google-services.json** pour télécharger le fichier.

## 2. Placer le fichier dans le dépôt GitHub
Pour que le build automatique fonctionne, vous devez ajouter ce fichier à votre projet :
*   **Option A (Recommandée)** : Importez le fichier à la racine de votre dépôt GitHub. Le workflow le copiera automatiquement au bon endroit (`android/app/google-services.json`) pendant le build.
*   **Option B** : Si vous avez déjà le dossier `android/app/` dans votre repo, placez-le directement dedans.

## 3. Trouver l'empreinte SHA-1
L'empreinte SHA-1 est indispensable pour Google Sign-In et l'authentification par téléphone.
1. Lancez un build sur GitHub Actions.
2. Une fois le build terminé (ou pendant qu'il tourne), allez dans l'onglet **Actions**.
3. Cliquez sur le build en cours/terminé.
4. Ouvrez l'étape **Display SHA-1 fingerprint**.
5. Copiez la ligne qui ressemble à : `SHA1: AA:BB:CC:DD:EE...`

## 4. Ajouter le SHA-1 dans Firebase
1. Retournez dans les **Paramètres du projet** sur Firebase.
2. Dans la section **Vos applications** > **Application Android**.
3. Cliquez sur **Ajouter une empreinte**.
4. Collez votre code SHA-1 et enregistrez.

## 5. Mettre à jour `google-services.json`
**IMPORTANT** : Chaque fois que vous ajoutez une empreinte SHA dans Firebase, les informations du fichier `google-services.json` changent.
1. Téléchargez à nouveau le fichier `google-services.json`.
2. Remplacez l'ancien fichier sur votre dépôt GitHub.
3. Relancez un build.

## 6. Tester l'application
1. Téléchargez l'APK généré par GitHub.
2. Installez-le sur votre téléphone.
3. Testez la connexion :
   *   Si vous utilisez Google Sign-In, cela devrait maintenant fonctionner sans erreur.
   *   Si vous utilisez l'email/mot de passe, la session devrait rester active même après avoir fermé l'app.

---
*Note : Ce guide a été généré spécifiquement pour le projet CPLA 1ère D.*
