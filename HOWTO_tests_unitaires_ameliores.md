# Guide pour l'amélioration des tests unitaires avec Playwright

## Problèmes identifiés

1. **Imports lourds**: Les tests unitaires importent beaucoup de modules, ce qui entraîne le chargement de nombreuses dépendances
2. **Logs verbeux**: Les tests produisent beaucoup de logs de debug qui rendent la sortie difficile à lire
3. **Avertissements de dépréciation**: moment.js produit beaucoup d'avertissements qui polluent la sortie
4. **Dépendances circulaires**: Le système de modules peut causer des problèmes de chargement

## Solutions mises en place

### 1. Utilitaires de test (`tests/unit/tools/TestUtils.ts`)

Ce fichier fournit des fonctions pour :
- Supprimer les logs verbeux (`checkAccessTo:`, timestamps, etc.)
- Supprimer les avertissements de dépréciation de moment.js
- Configurer un environnement de test minimal

### 2. Factory de mocks (`tests/unit/tools/MockFactory.ts`)

Fournit des mocks légers pour les modules lourds :
- `MockServerAPIController`
- `MockAccessPolicyServerController`
- `MockConsoleHandler`
- etc.

### 3. Configuration de test améliorée (`playwright-unit.config.ts`)

Configuration Playwright spécialement optimisée pour les tests unitaires :
- Timeouts appropriés
- Rapports plus propres
- Setup global

## Comment utiliser

### Pour un nouveau test

```typescript
import { test, expect } from '@playwright/test';

// Setup propre
import { setupCleanTestEnvironment, suppressConsoleHandler } from '../tools/TestUtils';
setupCleanTestEnvironment();

// Vos imports normaux
import MonModule from '../../../src/path/to/module';

// Si vous utilisez l'API Controller
import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

// Suppression des logs après les imports
suppressConsoleHandler();

test.describe('Mon Module', () => {
    test('ma fonction', () => {
        // Votre test ici
    });
});
```

### Pour améliorer un test existant

1. **Automatiquement** : Utilisez le script d'amélioration
   ```bash
   node scripts/improve-tests.js
   ```

2. **Manuellement** : Ajoutez au début du fichier :
   ```typescript
   // Setup clean test environment
   import { setupCleanTestEnvironment, suppressConsoleHandler } from '../tools/TestUtils';
   setupCleanTestEnvironment();
   ```

   Et après vos imports APIController :
   ```typescript
   // Apply ConsoleHandler suppression after imports
   suppressConsoleHandler();
   ```

### Pour les tests avec beaucoup de dépendances

Utilisez les mocks disponibles dans `MockFactory.ts` :

```typescript
import { createMinimalTestEnvironment } from '../tools/MockFactory';

const mocks = createMinimalTestEnvironment();
// Utilisez mocks.mockServerAPI, mocks.mockDAO, etc.
```

## Bonnes pratiques

### 1. Tests isolés
- Testez des fonctions spécifiques plutôt que des modules entiers
- Utilisez des mocks pour les dépendances lourdes
- Évitez de charger toute l'application

### 2. Configuration propre
- Utilisez `setupCleanTestEnvironment()` dans tous les tests
- Supprimez les logs verbeux avec `suppressConsoleHandler()`
- Configurez l'environnement de test approprié

### 3. Structure des tests
```typescript
test.describe('Module Name', () => {
    test.beforeAll(() => {
        // Setup unique
    });
    
    test.beforeEach(() => {
        // Setup pour chaque test
    });
    
    test('specific function test', () => {
        // Test spécifique et isolé
    });
});
```

### 4. Tests fonctionnels vs unitaires

- **Tests unitaires** : Testent des fonctions isolées, pas d'accès DB
- **Tests fonctionnels** : Testent l'application complète avec Playwright + serveur lancé

Pour les tests fonctionnels, voir `HOWTO_tests_fonctionnels_et_montee_en_charge.md`

## Configuration des scripts npm

Ajoutez dans `package.json` :

```json
{
  "scripts": {
    "test:unit": "playwright test --config=playwright-unit.config.ts",
    "test:unit:clean": "node scripts/improve-tests.js && npm run test:unit",
    "test:functional": "playwright test --config=playwright.config.ts"
  }
}
```

## Dépannage

### Test qui ne passe pas après amélioration
1. Vérifiez que tous les imports sont corrects
2. Assurez-vous que `suppressConsoleHandler()` est appelé après les imports
3. Vérifiez que le chemin vers `TestUtils` est correct

### Trop de logs encore visibles
1. Vérifiez que `setupCleanTestEnvironment()` est appelé en premier
2. Ajoutez des filtres spécifiques dans `TestUtils.ts`
3. Vérifiez que `suppressConsoleHandler()` est appelé après l'import de `ConsoleHandler`

### Erreurs de modules manquants
1. Utilisez les mocks de `MockFactory.ts`
2. Vérifiez les chemins d'imports
3. Considérez créer des tests plus isolés

## Exemple complet

Voir les fichiers améliorés :
- `tests/unit/FormatDatesNombres/TestFormatDatesNombres.unit.ts`
- `tests/unit/AccessPolicy/TestAccessPolicyServer.unit.ts`
- `tests/unit/DataImport/TestImportTypeXLSXHandler.unit.ts`