# 📚 Documentation des Modules Cruciaux OSWeDev

## 🎯 Introduction

Ce document fournit une explication complète et accessible des modules les plus importants de l'architecture OSWeDev. Ces modules constituent l'épine dorsale du système et sont essentiels à son fonctionnement. Cette documentation est conçue pour être compréhensible par les développeurs débutants tout en restant complète et technique.

OSWeDev est construit sur une architecture modulaire avec plus de 80 modules, mais une vingtaine d'entre eux sont vraiment cruciaux pour comprendre et utiliser le système.

---

## 🏗️ Modules d'Architecture Centrale

### 📦 ModulesManager
**Fichier**: `src/shared/modules/ModulesManager.ts`

Le **ModulesManager** est le cœur du système modulaire d'OSWeDev. Il s'agit d'un singleton qui gère l'ensemble du cycle de vie des modules.

#### 🔍 Fonctionnalités principales
- **Enregistrement des modules** : Chaque module s'enregistre automatiquement auprès du gestionnaire lors de son instanciation
- **Cache local** : Maintient un cache des modules par nom pour des accès rapides
- **Gestion du cycle de vie** : Coordonne l'installation, la configuration et l'activation des modules
- **Thread-safe** : Utilise des caches locaux par thread pour éviter les conflits

#### 💻 Exemple d'utilisation
```typescript
// Récupérer l'instance singleton
const modulesManager = ModulesManager.getInstance();

// Enregistrer un nouveau module
modulesManager.registerModule('SharedModule', monModule);

// Accéder à un module par son nom
const moduleDAO = modulesManager.getModuleByName('dao');
```

#### 🔗 Dépendances
- `Module` : Classe de base des modules
- `ModuleWrapper` : Encapsulation des modules
- `ModuleTable` : Définition des tables de données

---

### 🧩 Module (Classe de base)
**Fichier**: `src/shared/modules/Module.ts`

La classe **Module** est la classe abstraite de base dont héritent tous les modules du système. Elle définit l'interface commune et les comportements partagés.

#### 🔍 Fonctionnalités principales
- **Définition de l'interface commune** : Tous les modules implémentent cette interface de base
- **Auto-enregistrement** : Chaque module s'enregistre automatiquement dans le ModulesManager
- **Hooks de cycle de vie** : Fournit des points d'extension pour l'installation, la configuration, etc.
- **Gestion des tables de données** : Chaque module peut définir ses propres tables et champs

#### 💻 Exemple d'utilisation
```typescript
export default class MonModule extends Module {
    constructor() {
        super('mon_module', 'MonModule');
        this.forceActivationOnInstallation();
    }

    public async hook_module_install(): Promise<any> {
        // Logique d'installation du module
    }

    public async hook_module_configure(): Promise<boolean> {
        // Logique de configuration du module
        return true;
    }
}
```

#### 🔗 Dépendances
- `ModulesManager` : Pour l'auto-enregistrement
- `ModuleTable` : Pour définir les structures de données
- `ModuleTableField` : Pour définir les champs des tables

---

## 🗄️ Modules de Gestion des Données

### 🏪 DAO (Data Access Object)
**Fichier**: `src/shared/modules/DAO/ModuleDAO.ts`

Le module **DAO** est la couche d'accès aux données de OSWeDev. Il gère toutes les opérations CRUD (Create, Read, Update, Delete) avec la base de données PostgreSQL et fournit une API unifiée pour manipuler les données.

#### 🔍 Fonctionnalités principales
- **Opérations CRUD complètes** : Insertion, lecture, mise à jour, suppression de données
- **Gestion des transactions** : Assure l'intégrité des données lors d'opérations complexes
- **Cache des données** : Optimise les performances en cachant les données fréquemment utilisées
- **API unifiée** : Interface cohérente pour tous les types de données (VO - Value Objects)
- **Gestion des relations** : Traite les relations entre différents types de données
- **Sécurité intégrée** : Contrôle d'accès au niveau des données

#### 💻 Exemple d'utilisation
```typescript
import ModuleDAO from '../modules/DAO/ModuleDAO';
import UserVO from '../modules/AccessPolicy/vos/UserVO';

// Récupérer tous les utilisateurs
const users = await ModuleDAO.getVOs(UserVO.API_TYPE_ID);

// Créer un nouvel utilisateur
const newUser = new UserVO();
newUser.name = "Jean Dupont";
newUser.email = "jean@example.com";
await ModuleDAO.insertOrUpdateVO(newUser);

// Supprimer un utilisateur
await ModuleDAO.deleteVOs([userToDelete]);

// Requête avec filtres
const activeUsers = await ModuleDAO.getVOs(UserVO.API_TYPE_ID, {
    active: true
});
```

#### 🔗 Dépendances
- `VOsTypesManager` : Gestion des types de données
- `ModuleAccessPolicy` : Contrôle d'accès
- `API` : Exposition des APIs REST

---

### 📊 VO (Value Objects) et VOsTypesManager
**Fichier**: `src/shared/modules/VO/manager/VOsTypesManager.ts`

Les **Value Objects** sont la représentation des données dans OSWeDev, et le **VOsTypesManager** gère leurs types, relations et comportements.

#### 🔍 Fonctionnalités principales
- **Gestion des types de données** : Définit comment chaque type de VO est traité
- **Relations entre données** : Gère les relations one-to-many, many-to-one, etc.
- **Cache des métadonnées** : Optimise l'accès aux informations de structure
- **Validation des données** : Assure la cohérence des types et formats
- **Références croisées** : Trouve tous les champs qui référencent un type donné

#### 💻 Exemple d'utilisation
```typescript
import VOsTypesManager from '../modules/VO/manager/VOsTypesManager';
import UserVO from '../modules/AccessPolicy/vos/UserVO';

// Récupérer la table associée à un type
const userTable = VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID];

// Obtenir tous les champs qui référencent les utilisateurs
const userReferences = VOsTypesManager.get_type_references(UserVO.API_TYPE_ID);

// Vérifier si un type existe
const hasType = VOsTypesManager.moduleTables_by_voType.hasOwnProperty('user');
```

#### 🔗 Dépendances
- `ModuleTable` : Définition des structures de tables
- `ModuleTableField` : Définition des champs
- `IDistantVOBase` : Interface de base des VOs

---

## 🌐 Modules d'API et Communication

### 🔌 API
**Fichier**: `src/shared/modules/API/ModuleAPI.ts`

Le module **API** gère l'exposition des fonctionnalités via des APIs REST et WebSocket. Il facilite la communication entre le client et le serveur.

#### 🔍 Fonctionnalités principales
- **APIs REST automatiques** : Génération automatique d'APIs pour les opérations CRUD
- **WebSocket en temps réel** : Communication bidirectionnelle pour les mises à jour instantanées
- **Sérialisation/Désérialisation** : Conversion automatique entre objets JavaScript et JSON
- **Routage intelligent** : Distribution des requêtes vers les bons contrôleurs
- **Gestion des erreurs** : Traitement uniforme des erreurs côté serveur et client

#### 💻 Exemple d'utilisation
```typescript
import APIControllerWrapper from '../modules/API/APIControllerWrapper';

// Définir une API GET
const getUserAPI = APIControllerWrapper.sah('getUser');

// Utiliser l'API côté client
const user = await getUserAPI(userId);

// Définir une API POST
const updateUserAPI = APIControllerWrapper.sah('updateUser');
await updateUserAPI(userData);
```

#### 🔗 Dépendances
- `DAO` : Pour les opérations de données
- `AccessPolicy` : Pour la sécurisation des APIs
- `Module` : Classe de base

---

## 🔐 Modules de Sécurité

### 🛡️ AccessPolicy
**Fichier**: `src/shared/modules/AccessPolicy/ModuleAccessPolicy.ts`

Le module **AccessPolicy** gère l'authentification, l'autorisation et la sécurité de l'application. Il contrôle qui peut accéder à quoi et dans quelles conditions.

#### 🔍 Fonctionnalités principales
- **Authentification des utilisateurs** : Login, logout, gestion des sessions
- **Système de rôles et permissions** : Attribution de droits granulaires
- **Politiques d'accès dynamiques** : Règles d'accès configurables et contextuelles
- **Gestion des sessions** : Suivi des connexions utilisateur
- **Audit et logging** : Traçabilité des actions utilisateur
- **Récupération de mot de passe** : Processus sécurisé de réinitialisation

#### 💻 Exemple d'utilisation
```typescript
import ModuleAccessPolicy from '../modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyTools from '../tools/AccessPolicyTools';

// Vérifier les droits d'un utilisateur
const hasAccess = await AccessPolicyTools.checkAccessPolicy(
    'POLICY_DAO_ACCESS', 
    user_id
);

// Connexion utilisateur
const loginResult = await ModuleAccessPolicy.getInstance().login(
    email, 
    password
);

// Créer une nouvelle politique d'accès
const policy = new AccessPolicyVO();
policy.translatable_name = 'Accès aux données';
policy.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
```

#### 🔗 Dépendances
- `DAO` : Pour la persistance des données utilisateur
- `Translation` : Pour l'internationalisation
- `API` : Pour exposer les APIs d'authentification

---

## 🌍 Modules de Support

### 🗣️ Translation
**Fichier**: `src/shared/modules/Translation/ModuleTranslation.ts`

Le module **Translation** gère l'internationalisation (i18n) de l'application, permettant le support de multiple langues.

#### 🔍 Fonctionnalités principales
- **Gestion multi-langues** : Support de toutes les langues configurées
- **Traductions dynamiques** : Changement de langue à la volée
- **Cache des traductions** : Performance optimisée pour l'affichage
- **Interface de traduction** : Outils pour les traducteurs
- **Traductions contextuelles** : Adaptation selon le contexte d'utilisation
- **Pluralization** : Gestion des formes plurielles

#### 💻 Exemple d'utilisation
```typescript
import ModuleTranslation from '../modules/Translation/ModuleTranslation';

// Obtenir une traduction
const translation = await ModuleTranslation.getInstance().t('user.welcome');

// Obtenir toutes les traductions d'une langue
const frenchTranslations = await ModuleTranslation.getInstance()
    .getALL_FLAT_LOCALE_TRANSLATIONS('fr-fr');

// Définir une nouvelle traduction
const translatableText = new TranslatableTextVO();
translatableText.code_text = 'my.new.label';
// Les traductions sont ajoutées via l'interface d'administration
```

#### 🔗 Dépendances
- `DAO` : Pour la persistance des traductions
- `API` : Pour exposer les APIs de traduction
- `AccessPolicy` : Pour contrôler l'accès à l'interface de traduction

---

### ⏰ Cron
**Fichier**: `src/shared/modules/Cron/ModuleCron.ts`

Le module **Cron** gère l'exécution de tâches planifiées et récurrentes au sein de l'application.

#### 🔍 Fonctionnalités principales
- **Planification de tâches** : Exécution de code à intervalles réguliers
- **Gestion des erreurs** : Récupération et retry automatique en cas d'échec
- **Monitoring des tâches** : Suivi de l'état et des performances
- **Tâches manuelles** : Possibilité de déclencher manuellement des tâches
- **Configuration flexible** : Paramétrage des intervalles et conditions
- **Parallélisation** : Exécution simultanée de tâches indépendantes

#### 💻 Exemple d'utilisation
```typescript
import ModuleCron from '../modules/Cron/ModuleCron';
import CronWorkerPlanification from '../modules/Cron/vos/CronWorkerPlanification';

// Définir une nouvelle tâche récurrente
const taskPlan = new CronWorkerPlanification();
taskPlan.name = 'daily_cleanup';
taskPlan.planification_uid = 'cleanup_task';
taskPlan.type_recurrence = CronWorkerPlanification.TYPE_RECURRENCE_QUOTIDIENNE;

// La tâche sera exécutée automatiquement selon la planification
```

#### 🔗 Dépendances
- `DAO` : Pour la persistance des planifications
- `BGThread` : Pour l'exécution en arrière-plan
- `Params` : Pour la configuration

---

## 🔧 Modules Utilitaires

### ⚙️ Params
**Fichier**: `src/shared/modules/Params/ModuleParams.ts`

Le module **Params** gère la configuration de l'application via des paramètres dynamiques stockés en base de données.

#### 🔍 Fonctionnalités principales
- **Configuration dynamique** : Modification des paramètres sans redémarrage
- **Types de paramètres variés** : String, Number, Boolean, Object, etc.
- **Validation des valeurs** : Contrôle de cohérence des paramètres
- **Cache des paramètres** : Performance optimisée pour l'accès fréquent
- **Interface d'administration** : Modification via l'interface web
- **Historique des changements** : Traçabilité des modifications

#### 💻 Exemple d'utilisation
```typescript
import ModuleParams from '../modules/Params/ModuleParams';

// Récupérer un paramètre
const maxUsers = await ModuleParams.getInstance().getParamValueAsInt('MAX_USERS', 100);

// Définir un paramètre
await ModuleParams.getInstance().setParamValue('COMPANY_NAME', 'Mon Entreprise');

// Écouter les changements de paramètres
ModuleParams.getInstance().registerOnParamChange('THEME_COLOR', (newValue) => {
    // Réagir au changement
    updateTheme(newValue);
});
```

#### 🔗 Dépendences
- `DAO` : Pour la persistance des paramètres
- `AccessPolicy` : Pour contrôler l'accès aux paramètres
- `Translation` : Pour l'internationalisation des libellés

---

### 🧵 BGThread (Background Thread)
**Fichier**: `src/shared/modules/BGThread/ModuleBGThread.ts`

Le module **BGThread** gère l'exécution de tâches en arrière-plan sans bloquer l'interface utilisateur.

#### 🔍 Fonctionnalités principales
- **Exécution asynchrone** : Traitement long sans impact sur l'UX
- **Pool de workers** : Gestion optimisée des ressources serveur
- **Suivi des tâches** : Monitoring de l'avancement et du statut
- **Gestion des priorités** : Ordonnancement intelligent des tâches
- **Récupération d'erreurs** : Retry automatique et gestion des échecs
- **Notification de fin** : Alertes lors de la complétion des tâches

#### 💻 Exemple d'utilisation
```typescript
import ModuleBGThread from '../modules/BGThread/ModuleBGThread';

// Lancer une tâche en arrière-plan
const task = await ModuleBGThread.getInstance().exec_worker(
    'data_export_worker',
    {
        export_type: 'users',
        format: 'csv'
    }
);

// Suivre l'avancement
const status = await ModuleBGThread.getInstance().getWorkerState(task.id);
```

#### 🔗 Dépendances
- `DAO` : Pour la persistance des tâches
- `Cron` : Pour la planification de tâches récurrentes
- `Params` : Pour la configuration des workers

---

## 📈 Modules Métier

### 📊 Stats
**Fichier**: `src/shared/modules/Stats/ModuleStats.ts`

Le module **Stats** collecte, analyse et présente des statistiques d'utilisation de l'application.

#### 🔍 Fonctionnalités principales
- **Collecte automatique** : Enregistrement des métriques d'usage
- **Analyses personnalisées** : Création de rapports sur mesure
- **Dashboards interactifs** : Visualisation graphique des données
- **Alertes basées sur seuils** : Notifications automatiques
- **Export des données** : Extraction pour analyse externe
- **Performance monitoring** : Suivi des temps de réponse

#### 💻 Exemple d'utilisation
```typescript
import ModuleStats from '../modules/Stats/ModuleStats';

// Enregistrer une métrique
await ModuleStats.getInstance().register_stat(
    'user_login',
    user_id,
    new Date()
);

// Récupérer des statistiques
const loginStats = await ModuleStats.getInstance().getStats(
    'user_login',
    startDate,
    endDate
);
```

#### 🔗 Dépendances
- `DAO` : Pour la persistance des statistiques
- `DashboardBuilder` : Pour l'affichage des graphiques
- `Cron` : Pour les collectes automatiques

---

### 📧 Mailer
**Fichier**: `src/shared/modules/Mailer/ModuleMailer.ts`

Le module **Mailer** gère l'envoi d'emails transactionnels et marketing.

#### 🔍 Fonctionnalités principales
- **Templates d'emails** : Modèles réutilisables et personnalisables
- **Envoi en masse** : Traitement de volumes importants
- **Tracking des ouvertures** : Suivi de l'engagement des destinataires
- **Queue d'envoi** : File d'attente pour optimiser les performances
- **Gestion des erreurs** : Retry automatique et blacklist
- **Intégration SMTP** : Support de tous les fournisseurs d'email

#### 💻 Exemple d'utilisation
```typescript
import ModuleMailer from '../modules/Mailer/ModuleMailer';

// Envoyer un email simple
await ModuleMailer.getInstance().sendMail({
    to: 'user@example.com',
    subject: 'Bienvenue !',
    template: 'welcome_template',
    vars: {
        user_name: 'Jean'
    }
});

// Envoi en masse
await ModuleMailer.getInstance().sendBulkMail(
    'newsletter_template',
    usersList,
    templateVars
);
```

#### 🔗 Dépendances
- `DAO` : Pour la persistance des templates et logs
- `BGThread` : Pour l'envoi asynchrone
- `Translation` : Pour l'internationalisation des emails

---

## 🎨 Modules Interface Utilisateur

### 🏗️ DashboardBuilder
**Fichier**: `src/shared/modules/DashboardBuilder/ModuleDashboardBuilder.ts`

Le module **DashboardBuilder** permet la création d'interfaces de tableau de bord personnalisables avec des widgets interactifs.

#### 🔍 Fonctionnalités principales
- **Création de dashboards** : Interface drag-and-drop pour composer des tableaux de bord
- **Widgets personnalisables** : Graphiques, tableaux, métriques, etc.
- **Sauvegarde des layouts** : Persistence des configurations utilisateur
- **Partage de dashboards** : Collaboration entre utilisateurs
- **Export des données** : Génération de rapports PDF/Excel
- **Actualisation temps réel** : Mise à jour automatique des données

#### 💻 Exemple d'utilisation
```typescript
import ModuleDashboardBuilder from '../modules/DashboardBuilder/ModuleDashboardBuilder';

// Créer un nouveau dashboard
const dashboard = new DashboardVO();
dashboard.name = 'Tableau de bord commercial';
dashboard.user_id = currentUser.id;

// Ajouter un widget graphique
const chartWidget = new DashboardWidgetVO();
chartWidget.widget_type = 'chart';
chartWidget.chart_type = 'line';
chartWidget.data_source = 'sales_data';
```

#### 🔗 Dépendances
- `DAO` : Pour la persistance des dashboards
- `Stats` : Pour les sources de données
- `AccessPolicy` : Pour le contrôle d'accès

---

### 🍽️ Menu
**Fichier**: `src/shared/modules/Menu/ModuleMenu.ts`

Le module **Menu** gère la structure de navigation de l'application et les menus contextuels.

#### 🔍 Fonctionnalités principales
- **Navigation hiérarchique** : Menus et sous-menus organisés
- **Droits d'accès intégrés** : Affichage conditionnel selon les permissions
- **Personnalisation par rôle** : Menus différents selon le profil utilisateur
- **Menus contextuels** : Actions spécifiques selon le contexte
- **Breadcrumb automatique** : Fil d'Ariane généré automatiquement
- **Navigation mobile** : Interface adaptée aux écrans tactiles

#### 💻 Exemple d'utilisation
```typescript
import ModuleMenu from '../modules/Menu/ModuleMenu';

// Définir un nouveau menu
const menuItem = new MenuElementVO();
menuItem.name = 'Gestion Utilisateurs';
menuItem.target = '/admin/users';
menuItem.weight = 10;
menuItem.access_policy = 'POLICY_USER_ADMIN_ACCESS';

// Récupérer le menu pour un utilisateur
const userMenu = await ModuleMenu.getInstance().getMenuForUser(user_id);
```

#### 🔗 Dépendances
- `AccessPolicy` : Pour le contrôle d'accès aux menus
- `Translation` : Pour l'internationalisation des libellés
- `DAO` : Pour la persistance de la structure

---

## 📁 Modules de Gestion de Contenu

### 📄 File
**Fichier**: `src/shared/modules/File/ModuleFile.ts`

Le module **File** gère le stockage, l'organisation et la sécurisation des fichiers uploadés par les utilisateurs.

#### 🔍 Fonctionnalités principales
- **Upload sécurisé** : Validation des types et tailles de fichiers
- **Stockage optimisé** : Organisation hiérarchique et compression automatique
- **Contrôle d'accès** : Permissions granulaires sur les fichiers
- **Versionning** : Historique des modifications de fichiers
- **Optimisation d'images** : Redimensionnement et compression automatiques
- **Intégration cloud** : Support des services de stockage externes

#### 💻 Exemple d'utilisation
```typescript
import ModuleFile from '../modules/File/ModuleFile';

// Upload d'un fichier
const fileVO = await ModuleFile.getInstance().uploadFile(
    fileData,
    'documents/contracts/',
    allowedMimeTypes
);

// Récupérer un fichier
const file = await ModuleFile.getInstance().getFileById(fileId);

// Générer une URL temporaire sécurisée
const secureUrl = await ModuleFile.getInstance().getSecureFileUrl(
    fileId,
    3600 // Expire dans 1 heure
);
```

#### 🔗 Dépendances
- `DAO` : Pour la persistance des métadonnées
- `AccessPolicy` : Pour le contrôle d'accès
- `Params` : Pour la configuration du stockage

---

### 📰 CMS
**Fichier**: `src/shared/modules/CMS/ModuleCMS.ts`

Le module **CMS** (Content Management System) permet la gestion de contenu web dynamique et la création de pages.

#### 🔍 Fonctionnalités principales
- **Éditeur WYSIWYG** : Interface intuitive de création de contenu
- **Gestion des pages** : Création, modification, publication de pages web
- **Templates personnalisables** : Mise en forme cohérente du contenu
- **SEO intégré** : Optimisation automatique pour les moteurs de recherche
- **Workflow de publication** : Processus de validation et publication
- **Versionning de contenu** : Historique et restauration des versions

#### 💻 Exemple d'utilisation
```typescript
import ModuleCMS from '../modules/CMS/ModuleCMS';

// Créer une nouvelle page
const page = new PageVO();
page.title = 'À propos de nous';
page.content = '<h1>Notre histoire</h1><p>Contenu de la page...</p>';
page.slug = 'about-us';
page.status = 'published';

await ModuleCMS.getInstance().savePage(page);

// Récupérer une page par son slug
const aboutPage = await ModuleCMS.getInstance().getPageBySlug('about-us');
```

#### 🔗 Dépendances
- `DAO` : Pour la persistance du contenu
- `File` : Pour la gestion des médias
- `AccessPolicy` : Pour les droits de publication

---

## 📦 Modules d'Import/Export

### 📥 DataImport
**Fichier**: `src/shared/modules/DataImport/ModuleDataImport.ts`

Le module **DataImport** facilite l'importation en masse de données depuis diverses sources externes.

#### 🔍 Fonctionnalités principales
- **Support multi-formats** : CSV, Excel, JSON, XML, bases de données
- **Validation des données** : Contrôle de cohérence avant importation
- **Mapping de colonnes** : Correspondance flexible entre source et destination
- **Import progressif** : Traitement par chunks pour les gros volumes
- **Gestion des erreurs** : Rapport détaillé des problèmes rencontrés
- **Historique des imports** : Traçabilité et possibilité de rollback

#### 💻 Exemple d'utilisation
```typescript
import ModuleDataImport from '../modules/DataImport/ModuleDataImport';

// Configurer un import CSV
const importConfig = new DataImportFormatVO();
importConfig.name = 'Import Utilisateurs';
importConfig.api_type_id = UserVO.API_TYPE_ID;
importConfig.file_format = 'csv';
importConfig.column_mapping = {
    'Nom': 'lastname',
    'Prénom': 'firstname',
    'Email': 'email'
};

// Lancer l'import
const importResult = await ModuleDataImport.getInstance().startImport(
    importConfig,
    fileData
);
```

#### 🔗 Dépendances
- `DAO` : Pour l'insertion des données
- `File` : Pour le traitement des fichiers
- `BGThread` : Pour le traitement asynchrone

---

### 📤 DataExport
**Fichier**: `src/shared/modules/DataExport/ModuleDataExport.ts`

Le module **DataExport** permet l'exportation de données vers différents formats pour analyse ou sauvegarde.

#### 🔍 Fonctionnalités principales
- **Exports multiples formats** : CSV, Excel, PDF, JSON
- **Filtrage avancé** : Sélection précise des données à exporter
- **Templates d'export** : Formats prédéfinis réutilisables
- **Planification automatique** : Exports récurrents programmés
- **Compression automatique** : Optimisation de la taille des fichiers
- **Notification de fin** : Alerte lors de la disponibilité du fichier

#### 💻 Exemple d'utilisation
```typescript
import ModuleDataExport from '../modules/DataExport/ModuleDataExport';

// Configurer un export
const exportConfig = new DataExportFormatVO();
exportConfig.name = 'Export Clients Actifs';
exportConfig.api_type_id = ClientVO.API_TYPE_ID;
exportConfig.export_format = 'xlsx';
exportConfig.filter_conditions = { active: true };

// Lancer l'export
const exportResult = await ModuleDataExport.getInstance().startExport(
    exportConfig
);
```

#### 🔗 Dépendances
- `DAO` : Pour la récupération des données
- `File` : Pour la génération des fichiers
- `BGThread` : Pour le traitement asynchrone

---

## 🎯 Conclusion

Cette documentation couvre les 20+ modules les plus cruciaux de l'architecture OSWeDev. Chaque module a été conçu pour être :

- **Modulaire** : Indépendant et réutilisable
- **Évolutif** : Capable de supporter la croissance
- **Maintenable** : Code clair et bien structuré
- **Sécurisé** : Contrôles d'accès intégrés
- **Performance** : Optimisé pour la vitesse et l'efficacité

### 🚀 Pour aller plus loin

- **Architecture générale** : Comprendre comment ces modules interagissent
- **APIs REST** : Documentation détaillée des endpoints disponibles
- **Configuration** : Guide de paramétrage pour chaque environnement
- **Extensions** : Comment créer ses propres modules personnalisés

Cette architecture modulaire permet une grande flexibilité dans le développement et la maintenance de applications complexes, tout en gardant une base de code claire et organisée.