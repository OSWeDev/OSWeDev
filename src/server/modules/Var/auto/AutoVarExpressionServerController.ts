import VarDAGNode from '../../../../server/modules/Var/vos/VarDAGNode';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import DataSourceControllerBase from '../datasource/DataSourceControllerBase';
import VarServerControllerBase from '../VarServerControllerBase';
import AutoVarExpressionParser from './AutoVarExpressionParser';
import AutoVarExpressionDatasourceController from './AutoVarExpressionDatasourceController';

/**
 * Contrôleur de variables automatiques basées sur des expressions
 * Étend AutoVarServerController pour supporter les expressions complexes
 */
export default class AutoVarExpressionServerController extends VarServerControllerBase<VarDataBaseVO> {

    public static getInstance(varconf: VarConfVO): AutoVarExpressionServerController {
        if (!AutoVarExpressionServerController.instances[varconf.id]) {
            AutoVarExpressionServerController.instances[varconf.id] = new AutoVarExpressionServerController(varconf);
        }
        return AutoVarExpressionServerController.instances[varconf.id];
    }

    protected static instances: { [varconf_id: number]: AutoVarExpressionServerController } = {};

    private constructor(varconf: VarConfVO) {
        super(varconf, null, null, null, null);
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        if (!this.varConf.auto_expression) {
            return null;
        }

        // Parse l'expression pour déterminer les datasources nécessaires
        try {
            const parsedExpression = AutoVarExpressionParser.parseExpression(this.varConf.auto_expression);
            
            // Si l'expression implique des tables, créer un datasource
            if (parsedExpression.involved_tables && parsedExpression.involved_tables.length > 0) {
                return [AutoVarExpressionDatasourceController.getInstance(this.varConf)];
            }
        } catch (error) {
            console.error(`Error parsing expression for var ${this.varConf.name}:`, error);
        }

        return null;
    }

    public getDataSourcesPredepsDependencies(): DataSourceControllerBase[] {
        return null;
    }

    public getVarControllerDependencies(): { [dep_name: string]: VarServerControllerBase<any> } {
        if (!this.varConf.auto_expression) {
            return {};
        }

        // Pour les expressions complexes avec références de variables, on devra analyser les dépendances
        // Pour l'instant, on utilise le système existant des auto_deps
        return super.getVarControllerDependencies ? super.getVarControllerDependencies() : {};
    }

    public getParamDependencies(varDAGNode: VarDAGNode): { [dep_id: string]: VarDataBaseVO } {
        if (!this.varConf.auto_expression) {
            return {};
        }

        // Pour les expressions simples, pas de dépendances de paramètres spéciales
        // Pour les expressions complexes, on devra calculer les paramètres selon l'expression
        return {};
    }

    public async get_invalid_params_intersectors_from_dep<T extends VarDataBaseVO>(
        dep_id: string, 
        intersectors: T[]
    ): Promise<VarDataBaseVO[]> {
        
        if (!this.varConf.auto_expression) {
            return [];
        }

        // L'invalidation sera basée sur les tables impliquées dans l'expression
        try {
            const involvedTables = AutoVarExpressionParser.getInvolvedTables(this.varConf.auto_expression);
            
            // Créer des paramètres d'invalidation basés sur les tables impliquées
            let res: VarDataBaseVO[] = VarDataBaseVO.cloneArrayFrom<VarDataBaseVO, VarDataBaseVO>(
                intersectors as any as VarDataBaseVO[], this.varConf.name);

            return res;
        } catch (error) {
            console.error(`Error getting invalid params for expression var ${this.varConf.name}:`, error);
            return [];
        }
    }

    protected getValue(varDAGNode: VarDAGNode): number {
        if (!this.varConf.auto_expression) {
            throw new Error(`No expression defined for var ${this.varConf.name}`);
        }

        try {
            const parsedExpression = AutoVarExpressionParser.parseExpression(this.varConf.auto_expression);
            return this.calculateValueFromExpression(varDAGNode, parsedExpression);
        } catch (error) {
            console.error(`Error calculating value for expression var ${this.varConf.name}:`, error);
            return null;
        }
    }

    /**
     * Calcule la valeur selon le type d'expression
     */
    private calculateValueFromExpression(varDAGNode: VarDAGNode, parsedExpression: any): number {
        
        switch (parsedExpression.expression_type) {
            case 0: // SUM
            case 1: // COUNT  
            case 2: // AVG
            case 3: // MIN
            case 4: // MAX
                // Pour les fonctions d'agrégation, utiliser le datasource
                return this.getValueFromDatasource(varDAGNode, parsedExpression);

            case 20: // FIELD_REF
                // Référence simple de champ
                return this.getValueFromDatasource(varDAGNode, parsedExpression);

            case 21: // VAR_REF
                // Référence de variable - déléguer au système de dépendances
                return this.getValueFromVarReference(varDAGNode, parsedExpression);

            case 10: // ADD
            case 11: // SUBTRACT
            case 12: // MULTIPLY  
            case 13: // DIVIDE
                // Opérations arithmétiques entre variables
                return this.getValueFromArithmeticOperation(varDAGNode, parsedExpression);

            default:
                throw new Error(`Unsupported expression type: ${parsedExpression.expression_type}`);
        }
    }

    /**
     * Obtient la valeur depuis un datasource pour les fonctions d'agrégation
     */
    private getValueFromDatasource(varDAGNode: VarDAGNode, parsedExpression: any): number {
        // Utiliser le datasource pour obtenir la valeur
        const datasource = varDAGNode.datasources[AutoVarExpressionDatasourceController.getInstanceName(this.varConf)];
        if (datasource) {
            return datasource;
        }
        return null;
    }

    /**
     * Obtient la valeur depuis une référence de variable
     */
    private getValueFromVarReference(varDAGNode: VarDAGNode, parsedExpression: any): number {
        // Pour l'instant, retourner 0 - sera implémenté avec le système de dépendances
        return 0;
    }

    /**
     * Calcule la valeur d'une opération arithmétique
     */
    private getValueFromArithmeticOperation(varDAGNode: VarDAGNode, parsedExpression: any): number {
        // Pour l'instant, retourner 0 - sera implémenté avec l'analyse des sous-expressions
        return 0;
    }
}