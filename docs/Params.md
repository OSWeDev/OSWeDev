# Module Params

## 📖 Description

Gestion centralisée des paramètres de configuration du système.

## ⚙️ Fonctionnalités principales

- Fonctionnalités spécialisées du module



## 🛠️ Méthodes principales

### getInstance
Récupère des données depuis la base ou le cache

### getParamValue
Récupère des données depuis la base ou le cache

### registerApis
Méthode de traitement métier

### initialize
Configuration et initialisation

### setParamValueAsBoolean (async)
Méthode de traitement métier

### setParamValueAsNumber (async)
Méthode de traitement métier



## 💻 Exemple d'utilisation

```typescript
// Exemple d'utilisation du module Params
const paramsInstance = ModuleParams.getInstance();
await paramsInstance.initialize();
```

## 📍 Localisation

**Chemin :** `/src/shared/modules/Params`

---

*Dernière mise à jour : 23/07/2025 10:01:02*
