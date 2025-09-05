import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataInvalidatorVO from '../../../../shared/modules/Var/vos/VarDataInvalidatorVO';
import VarsController from '../../../../shared/modules/Var/VarsController';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import VarsServerController from '../VarsServerController';
import AutoVarExpressionParser from './AutoVarExpressionParser';

/**
 * Gestionnaire d'invalidation intelligent pour les variables d'expression
 * Analyse automatiquement les dépendances d'invalidation basées sur les expressions
 */
export default class AutoVarExpressionInvalidationHandler {

    /**
     * Map des variables d'expression par table impliquée
     * Permet de retrouver rapidement quelles variables sont impactées par la modification d'une table
     */
    private static expressionVarsByTable: { [tableName: string]: VarConfVO[] } = {};

    /**
     * Initialise le gestionnaire d'invalidation
     */
    public static init(): void {
        this.buildTableToVarsMap();
    }

    /**
     * Construit la map des variables par table impliquée
     */
    private static buildTableToVarsMap(): void {
        this.expressionVarsByTable = {};

        // Parcourir toutes les variables de configuration
        const allVarConfs = VarsController.var_conf_by_id;
        
        for (let varConfId in allVarConfs) {
            const varConf = allVarConfs[varConfId];
            
            if (varConf.is_expression_auto && varConf.auto_expression) {
                try {
                    const involvedTables = AutoVarExpressionParser.getInvolvedTables(varConf.auto_expression);
                    
                    for (let tableName of involvedTables) {
                        if (!this.expressionVarsByTable[tableName]) {
                            this.expressionVarsByTable[tableName] = [];
                        }
                        this.expressionVarsByTable[tableName].push(varConf);
                    }
                } catch (error) {
                    console.error(`Error analyzing expression for var ${varConf.name}:`, error);
                }
            }
        }
    }

    /**
     * Obtient les invalidateurs pour une création/suppression de VO
     */
    public static getInvalidatorsForCUD(vo: IDistantVOBase): VarDataInvalidatorVO[] {
        const tableName = vo._type;
        const affectedVars = this.expressionVarsByTable[tableName];
        
        if (!affectedVars || affectedVars.length === 0) {
            return [];
        }

        const invalidators: VarDataInvalidatorVO[] = [];

        for (let varConf of affectedVars) {
            try {
                const invalidator = this.createInvalidatorForVar(varConf, vo);
                if (invalidator) {
                    invalidators.push(invalidator);
                }
            } catch (error) {
                console.error(`Error creating invalidator for var ${varConf.name}:`, error);
            }
        }

        return invalidators;
    }

    /**
     * Obtient les invalidateurs pour une mise à jour de VO
     */
    public static getInvalidatorsForUpdate<T extends IDistantVOBase>(
        updateHolder: DAOUpdateVOHolder<T>
    ): VarDataInvalidatorVO[] {
        
        if (!updateHolder.post_update_vo) {
            return [];
        }

        const tableName = updateHolder.post_update_vo._type;
        const affectedVars = this.expressionVarsByTable[tableName];
        
        if (!affectedVars || affectedVars.length === 0) {
            return [];
        }

        const invalidators: VarDataInvalidatorVO[] = [];

        for (let varConf of affectedVars) {
            try {
                // Vérifier si la mise à jour affecte des champs importants pour cette variable
                if (this.isUpdateRelevantForVar(varConf, updateHolder)) {
                    const invalidator = this.createInvalidatorForVar(varConf, updateHolder.post_update_vo);
                    if (invalidator) {
                        invalidators.push(invalidator);
                    }
                    
                    // Si on a aussi un pre_update_vo, créer un invalidateur pour l'ancien état
                    if (updateHolder.pre_update_vo) {
                        const preInvalidator = this.createInvalidatorForVar(varConf, updateHolder.pre_update_vo);
                        if (preInvalidator) {
                            invalidators.push(preInvalidator);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error creating update invalidator for var ${varConf.name}:`, error);
            }
        }

        return invalidators;
    }

    /**
     * Vérifie si une mise à jour est pertinente pour une variable d'expression
     */
    private static isUpdateRelevantForVar<T extends IDistantVOBase>(
        varConf: VarConfVO,
        updateHolder: DAOUpdateVOHolder<T>
    ): boolean {
        
        if (!varConf.auto_expression) {
            return false;
        }

        try {
            const parsedExpression = AutoVarExpressionParser.parseExpression(varConf.auto_expression);
            
            // Si l'expression référence un champ spécifique, vérifier si ce champ a changé
            if (parsedExpression.target_field) {
                const fieldHasChanged = updateHolder.pre_update_vo &&
                    updateHolder.post_update_vo &&
                    updateHolder.pre_update_vo[parsedExpression.target_field] !== 
                    updateHolder.post_update_vo[parsedExpression.target_field];
                
                if (fieldHasChanged) {
                    return true;
                }
            }

            // Pour les autres types d'expressions, considérer toute modification comme pertinente
            // Dans une implémentation plus avancée, on pourrait analyser plus finement
            return true;
            
        } catch (error) {
            console.error(`Error checking update relevance for var ${varConf.name}:`, error);
            return true; // En cas d'erreur, invalider par sécurité
        }
    }

    /**
     * Crée un invalidateur pour une variable donnée et un VO modifié
     */
    private static createInvalidatorForVar(varConf: VarConfVO, vo: IDistantVOBase): VarDataInvalidatorVO {
        // Créer un paramètre de variable basé sur le VO
        const varParam = VarDataBaseVO.createNew(varConf.name, true);
        
        // Dans une implémentation complète, on analyserait l'expression pour déterminer
        // quels champs du VO doivent être utilisés pour construire les paramètres de la variable
        // Pour l'instant, on utilise une approche simplifiée
        
        const invalidator = VarDataInvalidatorVO.create_new(
            varParam,
            VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT,
            true,
            false,
            false
        );
        
        return invalidator;
    }

    /**
     * Rafraîchit la map des tables vers variables (à appeler lors de l'ajout de nouvelles variables)
     */
    public static refreshTableToVarsMap(): void {
        this.buildTableToVarsMap();
    }

    /**
     * Ajoute une variable d'expression à la map d'invalidation
     */
    public static addExpressionVar(varConf: VarConfVO): void {
        if (!varConf.is_expression_auto || !varConf.auto_expression) {
            return;
        }

        try {
            const involvedTables = AutoVarExpressionParser.getInvolvedTables(varConf.auto_expression);
            
            for (let tableName of involvedTables) {
                if (!this.expressionVarsByTable[tableName]) {
                    this.expressionVarsByTable[tableName] = [];
                }
                
                // Éviter les doublons
                const exists = this.expressionVarsByTable[tableName].some(v => v.id === varConf.id);
                if (!exists) {
                    this.expressionVarsByTable[tableName].push(varConf);
                }
            }
        } catch (error) {
            console.error(`Error adding expression var ${varConf.name} to invalidation map:`, error);
        }
    }

    /**
     * Supprime une variable d'expression de la map d'invalidation
     */
    public static removeExpressionVar(varConf: VarConfVO): void {
        if (!varConf.is_expression_auto || !varConf.auto_expression) {
            return;
        }

        try {
            const involvedTables = AutoVarExpressionParser.getInvolvedTables(varConf.auto_expression);
            
            for (let tableName of involvedTables) {
                if (this.expressionVarsByTable[tableName]) {
                    this.expressionVarsByTable[tableName] = this.expressionVarsByTable[tableName]
                        .filter(v => v.id !== varConf.id);
                }
            }
        } catch (error) {
            console.error(`Error removing expression var ${varConf.name} from invalidation map:`, error);
        }
    }
}