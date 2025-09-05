import AutoVarExpressionFactory from '../src/server/modules/Var/auto/AutoVarExpressionFactory';
import AutoVarExpressionInvalidationHandler from '../src/server/modules/Var/auto/AutoVarExpressionInvalidationHandler';

/**
 * Exemple d'utilisation du système de variables automatiques par expressions
 * 
 * Ce système permet de créer des variables de calcul en utilisant des expressions simples
 * au lieu de définir manuellement des datasources, controllers et dépendances.
 */

// Initialiser le gestionnaire d'invalidation
AutoVarExpressionInvalidationHandler.init();

// Exemple 1: Chiffre d'affaires total
const caTotal = AutoVarExpressionFactory.createAndRegisterFromExpression(
    'ca_total_factures',
    'sum(factures.montant_ht)',
    'var_data'
);

console.log('Variable CA Total créée:', caTotal.varConf.name);
console.log('Expression:', caTotal.varConf.auto_expression);
console.log('Tables impliquées:', AutoVarExpressionFactory.getInvolvedTables('sum(factures.montant_ht)'));

// Exemple 2: Nombre de commandes
const nbCommandes = AutoVarExpressionFactory.createAndRegisterFromExpression(
    'nb_commandes_total',
    'count(commandes.id)',
    'var_data'
);

console.log('Variable Nb Commandes créée:', nbCommandes.varConf.name);

// Exemple 3: Prix moyen des produits
const prixMoyen = AutoVarExpressionFactory.createAndRegisterFromExpression(
    'prix_moyen_produits',
    'avg(produits.prix_unitaire)',
    'var_data'
);

console.log('Variable Prix Moyen créée:', prixMoyen.varConf.name);

// Exemple 4: Stock minimum
const stockMin = AutoVarExpressionFactory.createAndRegisterFromExpression(
    'stock_minimum_global',
    'min(produits.stock_actuel)',
    'var_data'
);

console.log('Variable Stock Min créée:', stockMin.varConf.name);

// Exemple 5: Validation d'expressions
const expressions = [
    'sum(ventes.montant)',
    'count(clients.id)',
    'avg(commandes.total)',
    'min(stocks.quantite)',
    'max(prix.valeur)',
    'table.field',
    'variable_existante',
    'expression_invalide'
];

console.log('\nValidation des expressions:');
expressions.forEach(expr => {
    const isValid = AutoVarExpressionFactory.validateExpression(expr);
    console.log(`${expr}: ${isValid ? 'VALIDE' : 'INVALIDE'}`);
    
    if (isValid) {
        const tables = AutoVarExpressionFactory.getInvolvedTables(expr);
        console.log(`  Tables impliquées: [${tables.join(', ')}]`);
    }
});

// Exemple 6: Création en lot
const varDefinitions = [
    {
        name: 'ca_mensuel',
        expression: 'sum(factures_mensuelles.montant)'
    },
    {
        name: 'nb_clients_actifs',
        expression: 'count(clients_actifs.id)'
    },
    {
        name: 'commande_moyenne',
        expression: 'avg(commandes.montant_total)'
    }
];

// Note: Cette méthode sera disponible quand l'API sera complètement implémentée
// const variablesCreees = await AutoVarExpressionAPIController.getInstance().createExpressionVarsBatch(varDefinitions);

console.log('\nAvantages du système:');
console.log('✓ Plus besoin de créer manuellement datasources et controllers');
console.log('✓ Invalidation automatique basée sur l\'analyse des expressions');
console.log('✓ Expressions simples et lisibles');
console.log('✓ Intégration transparente avec le système de cache existant');
console.log('✓ Traçabilité complète des calculs pour debugging');

export {
    AutoVarExpressionFactory,
    AutoVarExpressionInvalidationHandler
};