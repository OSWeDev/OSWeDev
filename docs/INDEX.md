# Index de la documentation OSWeDev

## 📚 Modules documentés

1. **[Module](Module.md)**
   Classe de base pour tous les modules du système. Définit l'interface commune et la gestion du cycle de vie des modules.
   
   🔧 Fonctionnalités : Définition de la structure de base des modules, Gestion du cycle de vie (installation, configuration, activation)...
   
   

2. **[ModulesManager](ModulesManager.md)**
   Gestionnaire central de tous les modules. Coordonne l'enregistrement, l'activation et la communication entre modules.
   
   🔧 Fonctionnalités : Enregistrement et découverte automatique des modules, Gestion des dépendances entre modules...
   
   🔗 Dépend de : PreloadedModuleServerController

3. **[VOsTypesManager](VOsTypesManager.md)**
   Gestionnaire des types d'objets de valeur. Centralise la définition et la gestion des types de données.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

4. **[VOsTypesHandler](VOsTypesHandler.md)**
   Module système pour la gestion de fonctionnalités spécifiques.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

5. **[API](API.md)**
   Module de gestion des API REST. Fournit l'infrastructure pour exposer les fonctionnalités via HTTP.
   
   🔧 Fonctionnalités : Définition des endpoints REST, Gestion de l'authentification et autorisation...
   
   

6. **[DAO](DAO.md)**
   Data Access Object - Couche d'accès aux données. Gère toutes les opérations CRUD avec la base de données PostgreSQL.
   
   🔧 Fonctionnalités : Opérations CRUD (Create, Read, Update, Delete), Gestion des requêtes SQL complexes...
   
   🔗 Dépend de : IDistantVOBase

7. **[AccessPolicy](AccessPolicy.md)**
   Système de gestion des permissions et de sécurité. Contrôle l'accès aux ressources et fonctionnalités.
   
   🔧 Fonctionnalités : Définition des rôles et permissions, Contrôle d'accès basé sur les rôles (RBAC)...
   
   

8. **[VO](VO.md)**
   Value Objects - Objets de valeur représentant les entités métier du système.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

9. **[Translation](Translation.md)**
   Système d'internationalisation. Gère les traductions et la localisation de l'interface utilisateur.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

10. **[Menu](Menu.md)**
   Gestion du système de navigation et des menus de l'application.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

11. **[Request](Request.md)**
   Gestion des requêtes HTTP et de la communication client-serveur.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

12. **[File](File.md)**
   Système de gestion des fichiers. Upload, stockage et manipulation des documents.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

13. **[Mailer](Mailer.md)**
   Système d'envoi d'emails et de notifications par courrier électronique.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

14. **[DashboardBuilder](DashboardBuilder.md)**
   Constructeur de tableaux de bord personnalisables et interactifs.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

15. **[DataImport](DataImport.md)**
   Système d'importation de données depuis diverses sources (CSV, Excel, etc.).
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

16. **[DataExport](DataExport.md)**
   Système d'exportation de données vers différents formats.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

17. **[Params](Params.md)**
   Gestion centralisée des paramètres de configuration du système.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

18. **[Trigger](Trigger.md)**
   Système de déclencheurs et d'événements pour l'automatisation.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

19. **[BGThread](BGThread.md)**
   Gestion des tâches de fond et du traitement asynchrone.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

20. **[Cron](Cron.md)**
   Planificateur de tâches périodiques et automatisées.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

21. **[CMS](CMS.md)**
   Module système pour la gestion de fonctionnalités spécifiques.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

22. **[Commerce](Commerce.md)**
   Module système pour la gestion de fonctionnalités spécifiques.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

23. **[Stats](Stats.md)**
   Module système pour la gestion de fonctionnalités spécifiques.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   

24. **[Supervision](Supervision.md)**
   Module système pour la gestion de fonctionnalités spécifiques.
   
   🔧 Fonctionnalités : Fonctionnalités spécialisées du module
   
   


## 🎯 Modules par catégorie

### 🏗️ Architecture de base
- [Module](Module.md) - Structure de base
- [ModulesManager](ModulesManager.md) - Gestionnaire de modules
- [VO](VO.md) - Objets de valeur
- [VOsTypesManager](VOsTypesManager.md) - Gestion des types

### 🌐 API et données
- [API](API.md) - Interface REST
- [DAO](DAO.md) - Accès aux données
- [Request](Request.md) - Gestion des requêtes

### 🔐 Sécurité
- [AccessPolicy](AccessPolicy.md) - Permissions et sécurité

### 🎨 Interface utilisateur
- [Menu](Menu.md) - Navigation
- [Translation](Translation.md) - Internationalisation
- [DashboardBuilder](DashboardBuilder.md) - Tableaux de bord

### 📁 Gestion des données
- [File](File.md) - Gestion de fichiers
- [DataImport](DataImport.md) - Import de données
- [DataExport](DataExport.md) - Export de données

### 🔧 Services
- [Mailer](Mailer.md) - Envoi d'emails
- [Params](Params.md) - Configuration
- [Trigger](Trigger.md) - Événements
- [BGThread](BGThread.md) - Tâches de fond
- [Cron](Cron.md) - Planification

---

*Documentation générée automatiquement le 23/07/2025 10:01:02*
