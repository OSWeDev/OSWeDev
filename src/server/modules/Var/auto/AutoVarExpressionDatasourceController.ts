import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import DataSourceControllerMatroidIndexedBase from '../datasource/DataSourceControllerMatroidIndexedBase';
import VarsServerController from '../VarsServerController';
import AutoVarExpressionParser from './AutoVarExpressionParser';

/**
 * Datasource controller pour les variables d'expression automatiques
 * Gère l'accès aux données basé sur l'analyse de l'expression
 */
export default class AutoVarExpressionDatasourceController extends DataSourceControllerMatroidIndexedBase {

    public static getInstance(varconf: VarConfVO): AutoVarExpressionDatasourceController {
        if (!AutoVarExpressionDatasourceController.instances[varconf.id]) {
            
            if (!varconf.auto_expression) {
                throw new Error(`No expression defined for var ${varconf.name}`);
            }

            // Parser l'expression pour déterminer les API types impliqués
            const involvedTables = AutoVarExpressionParser.getInvolvedTables(varconf.auto_expression);
            
            AutoVarExpressionDatasourceController.instances[varconf.id] = new AutoVarExpressionDatasourceController(
                AutoVarExpressionDatasourceController.getInstanceName(varconf),
                involvedTables
            );
        }
        return AutoVarExpressionDatasourceController.instances[varconf.id];
    }

    public static getInstanceName(varconf: VarConfVO): string {
        return 'AutoVarExpressionDatasourceController_' + varconf.id;
    }

    protected static instances: { [varconf_id: number]: AutoVarExpressionDatasourceController } = {};

    public async get_data(param: VarDataBaseVO): Promise<number> {
        const varconf: VarConfVO = VarsServerController.getVarConfById(param.var_id);
        
        if (!varconf.auto_expression) {
            throw new Error(`No expression defined for var ${varconf.name}`);
        }

        try {
            const parsedExpression = AutoVarExpressionParser.parseExpression(varconf.auto_expression);
            return await this.getData(varconf, parsedExpression);
        } catch (error) {
            console.error(`Error getting data for expression var ${varconf.name}:`, error);
            return null;
        }
    }

    /**
     * Obtient les données selon le type d'expression
     */
    private async getData(varconf: VarConfVO, parsedExpression: any): Promise<number> {
        
        switch (parsedExpression.expression_type) {
            case 0: // SUM
                return await this.getAggregatedData(
                    parsedExpression.target_table,
                    parsedExpression.target_field,
                    VarConfVO.SUM_AGGREGATOR
                );

            case 1: // COUNT
                return await this.getAggregatedData(
                    parsedExpression.target_table,
                    parsedExpression.target_field,
                    VarConfVO.COUNT_AGGREGATOR
                );

            case 2: // AVG
                return await this.getAggregatedData(
                    parsedExpression.target_table,
                    parsedExpression.target_field,
                    VarConfVO.AVG_AGGREGATOR
                );

            case 3: // MIN
                return await this.getAggregatedData(
                    parsedExpression.target_table,
                    parsedExpression.target_field,
                    VarConfVO.MIN_AGGREGATOR
                );

            case 4: // MAX
                return await this.getAggregatedData(
                    parsedExpression.target_table,
                    parsedExpression.target_field,
                    VarConfVO.MAX_AGGREGATOR
                );

            case 20: // FIELD_REF
                return await this.getAggregatedData(
                    parsedExpression.target_table,
                    parsedExpression.target_field,
                    varconf.aggregator || VarConfVO.SUM_AGGREGATOR
                );

            default:
                throw new Error(`Unsupported expression type for datasource: ${parsedExpression.expression_type}`);
        }
    }

    /**
     * Exécute une requête d'agrégation sur une table et un champ
     */
    private async getAggregatedData(
        tableName: string,
        fieldName: string,
        aggregator: number
    ): Promise<number> {
        
        try {
            // Construire la requête d'agrégation
            const query_res = await query(tableName)
                .field(fieldName, 'ds_result', tableName, aggregator)
                .select_one();

            if ((!query_res) || (query_res.ds_result == null)) {
                return null;
            }

            return query_res.ds_result;
        } catch (error) {
            console.error(`Error executing aggregation query on ${tableName}.${fieldName}:`, error);
            return null;
        }
    }

    /**
     * Construit les filtres de contexte pour la requête
     * Cette méthode peut être étendue pour supporter des filtres plus complexes
     */
    private buildContextFilters(param: VarDataBaseVO): any {
        // Pour l'instant, pas de filtres spécifiques
        // Dans une implémentation complète, on analyserait les champs de paramètres
        // pour construire des filtres appropriés
        return {};
    }
}