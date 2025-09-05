# Variables Automatiques par Expressions - OSWeDev

## Vue d'ensemble

Le système de variables automatiques par expressions permet de créer des variables de calcul en utilisant des expressions simples au lieu de définir manuellement des datasources, controllers et dépendances.

## Fonctionnalités

### 1. Expressions d'agrégation
Créez des variables avec des fonctions d'agrégation sur les tables :

```typescript
// Chiffre d'affaires total
const caTotal = AutoVarExpressionFactory.createFromExpression(
    'ca_total',
    'sum(lignefactu.ca)'
);

// Nombre de commandes
const nbCommandes = AutoVarExpressionFactory.createFromExpression(
    'nb_commandes', 
    'count(commandes.id)'
);

// Prix moyen
const prixMoyen = AutoVarExpressionFactory.createFromExpression(
    'prix_moyen',
    'avg(produits.prix)'
);
```

### 2. Références de champs simples
Référencez directement un champ d'une table :

```typescript
const prixProduit = AutoVarExpressionFactory.createFromExpression(
    'prix_produit',
    'produits.prix'
);
```

### 3. Opérations arithmétiques (futures)
Combinez des variables avec des opérations arithmétiques :

```typescript
// Marge = CA - Coûts
const marge = AutoVarExpressionFactory.createFromExpression(
    'marge',
    'ca_total - couts_total'
);

// Ratio = A / B
const ratio = AutoVarExpressionFactory.createFromExpression(
    'ratio_conversion',
    'commandes_validees / commandes_total'
);
```

## API

### Créer une variable d'expression

```typescript
import AutoVarExpressionFactory from '../server/modules/Var/auto/AutoVarExpressionFactory';

// Création simple
const varConf = AutoVarExpressionFactory.createFromExpression(
    'nom_variable',
    'sum(table.champ)'
);

// Création et enregistrement automatique
const controller = AutoVarExpressionFactory.createAndRegisterFromExpression(
    'nom_variable',
    'sum(table.champ)',
    'mon_var_data_type' // optionnel
);
```

### Validation d'expression

```typescript
const isValid = AutoVarExpressionFactory.validateExpression('sum(table.champ)');
if (!isValid) {
    console.log('Expression invalide');
}
```

### Obtenir les tables impliquées

```typescript
const tables = AutoVarExpressionFactory.getInvolvedTables('sum(orders.amount)');
// Retourne: ['orders']
```

## Expressions supportées

### Fonctions d'agrégation
- `sum(table.field)` - Somme
- `count(table.field)` - Nombre
- `avg(table.field)` - Moyenne
- `min(table.field)` - Minimum
- `max(table.field)` - Maximum

### Références simples
- `table.field` - Référence directe à un champ
- `variable_name` - Référence à une autre variable

### Opérations arithmétiques (en développement)
- `var_a + var_b` - Addition
- `var_a - var_b` - Soustraction
- `var_a * var_b` - Multiplication
- `var_a / var_b` - Division

## Invalidation automatique

Le système analyse automatiquement les expressions pour déterminer :
- Quelles tables sont impliquées dans le calcul
- Quels champs impactent le résultat
- Quand invalider le cache en cas de modification

Lorsqu'un VO d'une table impliquée est modifié, les variables concernées sont automatiquement invalidées.

## Exemples d'usage métier

### Chiffre d'affaires par période
```typescript
// CA total sur les factures
const caTotal = AutoVarExpressionFactory.createFromExpression(
    'ca_total_factures',
    'sum(factures.montant_ht)'
);

// Nombre de clients actifs
const clientsActifs = AutoVarExpressionFactory.createFromExpression(
    'clients_actifs',
    'count(commandes.client_id)'
);
```

### Métriques de performance
```typescript
// Panier moyen
const panierMoyen = AutoVarExpressionFactory.createFromExpression(
    'panier_moyen',
    'avg(commandes.montant_total)'
);

// Stock minimum
const stockMin = AutoVarExpressionFactory.createFromExpression(
    'stock_minimum',
    'min(produits.stock_actuel)'
);
```

## Avantages

1. **Simplicité** : Plus besoin de créer manuellement datasources et controllers
2. **Flexibilité** : Changez l'expression sans recompiler le code
3. **Invalidation automatique** : Le système déduit automatiquement les dépendances
4. **Traçabilité** : L'arbre de calcul reste disponible pour debugging
5. **Performance** : Utilise le système de cache existant

## Limitations actuelles

- Les opérations arithmétiques entre variables ne sont pas encore implémentées
- Les filtres complexes doivent encore être définis manuellement
- L'analyse des expressions est basique (sera étendue)

## Évolutions futures

1. **Parser d'expressions avancé** : Support de parenthèses, fonctions complexes
2. **Filtres automatiques** : Déduction des filtres depuis l'expression
3. **Optimisations** : Analyse des requêtes pour optimiser les performances
4. **Interface graphique** : Constructeur visuel d'expressions