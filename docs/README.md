# OSWeDev - Aperçu du projet

## 📋 Description

OSWeDev est une solution OpenSource basée sur NodeJS, VueJS et TypeScript, conçue pour créer des applications web robustes et modulaires.

## 🏗️ Architecture

- **Backend**: NodeJS avec TypeScript et Express
- **Frontend**: VueJS avec TypeScript
- **Base de données**: PostgreSQL
- **Tests**: PlayWright pour les tests end-to-end
- **Build**: EsBuild pour la compilation

## ⭐ Fonctionnalités clés

- Architecture modulaire avec 80+ modules
- Générateur de code automatique
- Système de permissions et d'accès
- API REST complète
- Interface d'administration
- Gestion des données (import/export)
- Système de notifications et emails
- Tableaux de bord personnalisables
- Internationalisation complète

## 📚 Modules cruciaux

Cette documentation couvre les **24 modules les plus importants** du système OSWeDev :

- [Module](Module.md) - Classe de base pour tous les modules du système. Définit l'interface commune et la gestion du cycle de vie des modules.
- [ModulesManager](ModulesManager.md) - Gestionnaire central de tous les modules. Coordonne l'enregistrement, l'activation et la communication entre modules.
- [VOsTypesManager](VOsTypesManager.md) - Gestionnaire des types d'objets de valeur. Centralise la définition et la gestion des types de données.
- [VOsTypesHandler](VOsTypesHandler.md) - Module système pour la gestion de fonctionnalités spécifiques.
- [API](API.md) - Module de gestion des API REST. Fournit l'infrastructure pour exposer les fonctionnalités via HTTP.
- [DAO](DAO.md) - Data Access Object - Couche d'accès aux données. Gère toutes les opérations CRUD avec la base de données PostgreSQL.
- [AccessPolicy](AccessPolicy.md) - Système de gestion des permissions et de sécurité. Contrôle l'accès aux ressources et fonctionnalités.
- [VO](VO.md) - Value Objects - Objets de valeur représentant les entités métier du système.
- [Translation](Translation.md) - Système d'internationalisation. Gère les traductions et la localisation de l'interface utilisateur.
- [Menu](Menu.md) - Gestion du système de navigation et des menus de l'application.
- [Request](Request.md) - Gestion des requêtes HTTP et de la communication client-serveur.
- [File](File.md) - Système de gestion des fichiers. Upload, stockage et manipulation des documents.
- [Mailer](Mailer.md) - Système d'envoi d'emails et de notifications par courrier électronique.
- [DashboardBuilder](DashboardBuilder.md) - Constructeur de tableaux de bord personnalisables et interactifs.
- [DataImport](DataImport.md) - Système d'importation de données depuis diverses sources (CSV, Excel, etc.).
- [DataExport](DataExport.md) - Système d'exportation de données vers différents formats.
- [Params](Params.md) - Gestion centralisée des paramètres de configuration du système.
- [Trigger](Trigger.md) - Système de déclencheurs et d'événements pour l'automatisation.
- [BGThread](BGThread.md) - Gestion des tâches de fond et du traitement asynchrone.
- [Cron](Cron.md) - Planificateur de tâches périodiques et automatisées.
- [CMS](CMS.md) - Module système pour la gestion de fonctionnalités spécifiques.
- [Commerce](Commerce.md) - Module système pour la gestion de fonctionnalités spécifiques.
- [Stats](Stats.md) - Module système pour la gestion de fonctionnalités spécifiques.
- [Supervision](Supervision.md) - Module système pour la gestion de fonctionnalités spécifiques.

## 🚀 Démarrage rapide

Pour commencer avec OSWeDev :

1. **Installation des dépendances**
   ```bash
   npm install
   ```

2. **Construction du projet**
   ```bash
   npm run build
   ```

3. **Lancement des tests**
   ```bash
   npm test
   ```

## 📖 Documentation détaillée

Consultez l'[INDEX.md](INDEX.md) pour une vue d'ensemble complète de tous les modules documentés.

---

*Cette documentation est générée automatiquement. Dernière mise à jour : 23/07/2025 10:03:16*
