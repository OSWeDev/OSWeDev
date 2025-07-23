# Module ModulesManager

## 📖 Description

Gestionnaire central de tous les modules. Coordonne l'enregistrement, l'activation et la communication entre modules.

## ⚙️ Fonctionnalités principales

- Enregistrement et découverte automatique des modules
- Gestion des dépendances entre modules
- Activation/désactivation dynamique des modules
- Cache des instances de modules

## 🔗 Dépendances

Ce module dépend des modules suivants :
- PreloadedModuleServerController


## 🛠️ Méthodes principales

### getInstance
Récupère des données depuis la base ou le cache

### registerModule
Méthode de traitement métier

### getModuleByNameAndRole
Récupère des données depuis la base ou le cache

### getModuleWrapperByName
Récupère des données depuis la base ou le cache

### getModuleWrappersByName
Récupère des données depuis la base ou le cache



## 💻 Exemple d'utilisation

```typescript
// Exemple d'utilisation du module ModulesManager
const modulesmanagerInstance = ModuleModulesManager.getInstance();
await modulesmanagerInstance.initialize();
```

## 📍 Localisation

**Chemin :** `/src/shared/modules/ModulesManager.ts`

---

*Dernière mise à jour : 23/07/2025 10:01:02*
