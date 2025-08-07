# Intégration MFA - Documentation Client

## Composants créés

### 1. UserMFAComponent
**Fichier :** `src/vuejsclient/ts/components/AccessPolicy/user/mfa/UserMFAComponent.ts`

**Fonctionnalités :**
- Configuration des méthodes MFA (Email, SMS, Authenticator)
- Affichage du statut MFA actuel
- Génération et affichage de QR codes pour TOTP
- Activation/désactivation de MFA
- Interface utilisateur complète pour la gestion MFA

**Méthodes principales :**
- `loadMFAStatus()` : Charge le statut MFA actuel
- `configureMFA()` : Configure une nouvelle méthode MFA
- `activateMFA()` : Active MFA avec code de vérification
- `disableMFA()` : Désactive MFA
- `generateQRCode()` : Génère QR code pour TOTP

### 2. QRCodeComponent
**Fichier :** `src/vuejsclient/ts/components/AccessPolicy/user/mfa/qrcode/QRCodeComponent.ts`

**Fonctionnalités :**
- Affichage de QR codes via API externe
- Fallback avec données textuelles
- Configuration de taille personnalisable

### 3. MFALoginVerificationComponent
**Fichier :** `src/vuejsclient/ts/components/AccessPolicy/user/mfa/MFALoginVerificationComponent.ts`

**Fonctionnalités :**
- Vérification MFA après connexion
- Interface simplifiée pour saisie de code
- Redirection automatique après vérification

## Intégrations

### Dans UserComponent
Le composant MFA a été intégré dans la page de profil utilisateur :
```typescript
// UserComponent.ts
import UserMFAComponent from './mfa/UserMFAComponent';

components: {
    'user-mfa': UserMFAComponent,
}
```

### Dans AccessPolicyVueModule
Enregistrement du composant pour utilisation globale :
```typescript
Vue.component('Usermfacomponent', async () => (await import('./user/mfa/UserMFAComponent')));
```

## Styles et mise en forme

### UserMFAComponent.scss
- Design responsive pour configuration MFA
- États visuels pour chargement et erreurs
- Mise en forme des boutons et formulaires
- Styles pour QR codes et sections d'activation

### QRCodeComponent.scss
- Mise en forme du composant QR code
- Fallback textuel stylisé
- Responsive design

## Configuration des traductions

Les libellés utilisés dans l'interface :

### Statuts et titres
- `mfa.titre` : "Authentification Multi-Facteurs"
- `mfa.statut.active` : "MFA activée"
- `mfa.statut.inactive` : "MFA non activée"

### Méthodes MFA
- `mfa.methode.email` : "Email"
- `mfa.methode.sms` : "SMS"
- `mfa.methode.authenticator` : "Application d'authentification"

### Actions
- `mfa.bouton.activer` : "Activer MFA"
- `mfa.bouton.desactiver` : "Désactiver MFA"
- `mfa.bouton.configurer` : "Configurer"
- `mfa.bouton.verifier` : "Vérifier"

### Messages
- `mfa.configuration.succes` : "MFA configurée avec succès"
- `mfa.activation.succes` : "MFA activée avec succès"
- `mfa.erreur.chargement` : "Erreur lors du chargement"

## Utilisation

### Page de profil utilisateur
1. Accéder à `/user`
2. Section MFA affichée sous les informations de compte
3. Possibilité de configurer, activer ou désactiver MFA

### Configuration MFA
1. Cliquer sur "Activer MFA"
2. Choisir la méthode (Email, SMS, Authenticator)
3. Pour SMS : saisir numéro de téléphone
4. Pour Authenticator : scanner QR code
5. Saisir code de vérification
6. Confirmer activation

### Vérification à la connexion
Le composant `MFALoginVerificationComponent` peut être intégré dans le flux de connexion pour demander une vérification MFA après l'authentification par mot de passe.

## Architecture technique

### Dépendances
- Vue.js avec TypeScript
- vue-property-decorator pour les props
- OSWeDev framework pour APIs

### APIs utilisées
- `mfaConfigure()` : Configuration MFA
- `mfaActivate()` : Activation MFA
- `mfaIsEnabled()` : Vérification statut
- `mfaGetConfig()` : Récupération configuration
- `mfaGenerateCode()` : Génération codes
- `mfaVerifyCode()` : Vérification codes

### Sécurité
- Codes de vérification expirés après 5 minutes
- Maximum 3 tentatives par session
- Validation côté serveur de tous les codes
- Chiffrement des secrets TOTP

## Next Steps possibles

1. **Intégration au processus de connexion**
   - Modifier `AccessPolicyLoginComponent` pour gérer MFA
   - Ajouter étape MFA après authentification par mot de passe

2. **Codes de sauvegarde**
   - Interface pour générer/utiliser codes de sauvegarde
   - Gestion des codes utilisés

3. **Historique et logs**
   - Affichage historique utilisation MFA
   - Logs de sécurité

4. **Méthodes supplémentaires**
   - Support WebAuthn/FIDO2
   - Intégration avec d'autres applications TOTP

5. **Administration**
   - Interface admin pour gérer MFA des utilisateurs
   - Politiques MFA obligatoires par rôle
