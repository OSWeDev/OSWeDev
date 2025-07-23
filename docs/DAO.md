# Module DAO

## 📖 Description

Data Access Object - Couche d'accès aux données. Gère toutes les opérations CRUD avec la base de données PostgreSQL.

## ⚙️ Fonctionnalités principales

- Opérations CRUD (Create, Read, Update, Delete)
- Gestion des requêtes SQL complexes
- Cache des données et optimisations
- Transactions et intégrité des données
- Migration et évolution du schéma de base

## 🔗 Dépendances

Ce module dépend des modules suivants :
- IDistantVOBase


## 🛠️ Méthodes principales

### getInstance
Récupère des données depuis la base ou le cache

### for
Méthode de traitement métier

### registerApis
Méthode de traitement métier

### for
Méthode de traitement métier

### for
Méthode de traitement métier

### for
Méthode de traitement métier

### for
Méthode de traitement métier

### initialize
Configuration et initialisation

### get_compute_function_uid
Récupère des données depuis la base ou le cache

### late_configuration (async)
Méthode de traitement métier



## 💻 Exemple d'utilisation

```typescript
// Exemple d'utilisation du DAO
import ModuleDAO from '../modules/DAO/ModuleDAO';

// Récupérer des données
const users = await ModuleDAO.getVOs(UserVO.API_TYPE_ID);

// Créer un nouvel utilisateur
const newUser = new UserVO();
newUser.name = "John Doe";
await ModuleDAO.insertOrUpdateVO(newUser);
```

## 📍 Localisation

**Chemin :** `/src/shared/modules/DAO`

---

*Dernière mise à jour : 23/07/2025 09:58:31*
