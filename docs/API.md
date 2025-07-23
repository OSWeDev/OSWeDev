# Module API

## 📖 Description

Module de gestion des API REST. Fournit l'infrastructure pour exposer les fonctionnalités via HTTP.

## ⚙️ Fonctionnalités principales

- Définition des endpoints REST
- Gestion de l'authentification et autorisation
- Sérialisation/désérialisation JSON
- Gestion des erreurs et codes de retour HTTP



## 🛠️ Méthodes principales

### getInstance
Récupère des données depuis la base ou le cache

### initialize
Configuration et initialisation



## 💻 Exemple d'utilisation

```typescript
// Définition d'une API
APIControllerWrapper.registerServerApiHandler({
    name: 'get_user_data',
    handler: async (req: APIServerParams) => {
        return await UserController.getUserData(req.params.user_id);
    }
});
```

## 📍 Localisation

**Chemin :** `/src/shared/modules/API`

---

*Dernière mise à jour : 23/07/2025 09:58:31*
