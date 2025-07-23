# Documentation Automatique OSWeDev

Ce système génère automatiquement une documentation claire et accessible pour les modules cruciaux du projet OSWeDev, spécialement conçue pour être compréhensible par les néophytes.

## 🎯 Objectif

Créer et maintenir une documentation :
- **Périodique et automatique** : Mise à jour régulière sans intervention manuelle
- **Focalisée sur les modules cruciaux** : Concentrée sur les 20+ modules les plus importants
- **Orientée fonctionnelle** : Explique QUOI fait chaque module et POURQUOI
- **Accessible aux débutants** : Langage clair et exemples pratiques

## 📦 Modules documentés

Le système identifie et documente automatiquement les modules cruciaux :

### 🏗️ Architecture de base
- **Module** - Structure de base de tous les modules
- **ModulesManager** - Gestionnaire central des modules
- **VO** - Objets de valeur métier
- **VOsTypesManager** - Gestion des types de données

### 🌐 API et données
- **API** - Interface REST du système
- **DAO** - Accès aux données PostgreSQL
- **Request** - Gestion des requêtes HTTP

### 🔐 Sécurité et accès
- **AccessPolicy** - Permissions et sécurité

### 🎨 Interface et contenu
- **Menu** - Système de navigation
- **Translation** - Internationalisation
- **DashboardBuilder** - Tableaux de bord
- **CMS** - Gestion de contenu

### 📁 Gestion des données
- **File** - Gestion de fichiers
- **DataImport/DataExport** - Import/Export de données

### 🔧 Services et automatisation
- **Mailer** - Envoi d'emails
- **Params** - Configuration système
- **Trigger** - Système d'événements
- **BGThread** - Tâches de fond
- **Cron** - Planification
- **Commerce** - Commerce électronique
- **Stats** - Statistiques
- **Supervision** - Monitoring

## 🚀 Utilisation

### Génération manuelle
```bash
# Génération immédiate
npm run docs:generate

# Ou directement
node docs-generator/generate-docs.js
```

### Génération automatique
```bash
# Script d'automatisation avec sauvegarde et commit
npm run docs:auto

# Configuration de l'automatisation périodique
npm run docs:setup
```

### Planification périodique

Le script `setup-automation.sh` vous guide pour configurer l'exécution automatique via cron :

```bash
# Génération quotidienne à 6h00
0 6 * * * /path/to/project/docs-generator/auto-generate.sh

# Génération hebdomadaire le dimanche à 2h00  
0 2 * * 0 /path/to/project/docs-generator/auto-generate.sh

# Génération mensuelle le 1er à 3h00
0 3 1 * * /path/to/project/docs-generator/auto-generate.sh
```

## 📄 Documentation générée

La documentation est créée dans le dossier `docs/` :

- `README.md` - Vue d'ensemble du projet et des modules
- `INDEX.md` - Index détaillé par catégorie
- `{Module}.md` - Documentation individuelle de chaque module

### Structure de documentation par module

Chaque module est documenté avec :
- **Description fonctionnelle** - Rôle et utilité
- **Fonctionnalités principales** - Ce que fait le module
- **Dépendances** - Modules requis
- **Méthodes clés** - API importante
- **Exemple d'utilisation** - Code pratique
- **Localisation** - Chemin dans le projet

## 🔄 Fonctionnalités avancées

### Sauvegarde automatique
- Sauvegarde de l'ancienne documentation avant génération
- Conservation des 5 dernières sauvegardes
- Restauration automatique en cas d'échec

### Intégration Git
- Commit automatique de la documentation générée
- Messages de commit horodatés
- Option de push automatique (configurable)

### Logging complet
- Logs détaillés dans `docs-generator/generation.log`
- Horodatage de toutes les opérations
- Traçabilité complète des générations

## ⚙️ Configuration

### Modification des modules documentés

Éditez `docs-generator/generate-docs.js` :

```javascript
// Modules dans des répertoires
this.crucialModules = [
    'API', 'DAO', 'AccessPolicy', 
    // Ajoutez d'autres modules...
];

// Modules fichiers individuels
this.specialModules = {
    'Module': path.join(this.modulesPath, 'Module.ts'),
    // Ajoutez d'autres fichiers...
};
```

### Personnalisation des descriptions

Les descriptions automatiques peuvent être personnalisées dans la méthode `extractModuleDescription()`.

## 🛠️ Maintenance

Le système est conçu pour être autonome mais peut nécessiter :

1. **Mise à jour des modules cruciaux** si l'architecture évolue
2. **Ajustement des descriptions** pour de nouveaux modules
3. **Vérification périodique** des logs de génération

## 📋 Logs et surveillance

Consultez les logs pour surveiller les générations :

```bash
# Voir les derniers logs
tail -f docs-generator/generation.log

# Vérifier l'état de la dernière génération
cat docs-generator/generation.log | grep "$(date '+%Y-%m-%d')"
```

---

*Système de documentation automatique OSWeDev - Version 1.0*