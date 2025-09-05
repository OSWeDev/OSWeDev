import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import VarConfExpressionVO from '../../../../shared/modules/Var/vos/VarConfExpressionVO';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import AutoVarExpressionParser from './AutoVarExpressionParser';
import AutoVarExpressionServerController from './AutoVarExpressionServerController';
import AutoVarExpressionDatasourceController from './AutoVarExpressionDatasourceController';
import VarsServerController from '../VarsServerController';

/**
 * Factory pour créer automatiquement des variables basées sur des expressions
 * Simplifie la création de variables en utilisant des expressions comme "sum(table.field)"
 */
export default class AutoVarExpressionFactory {

    /**
     * Crée une variable automatique basée sur une expression
     * @param name Nom de la variable
     * @param expression Expression (ex: "sum(lignefactu.ca)", "var_a + var_b")
     * @param varDataVoType Type du VO de données pour cette variable
     * @param segmentTypes Types de segmentation optionnels
     * @returns Configuration de variable créée
     */
    public static createFromExpression(
        name: string,
        expression: string,
        varDataVoType: string = 'var_data',
        segmentTypes?: { [matroid_field_id: string]: number }
    ): VarConfVO {

        // Parser l'expression
        const parsedExpression = AutoVarExpressionParser.parseExpression(expression);
        
        // Créer la configuration de base
        const varConf = new VarConfVO(name, varDataVoType, segmentTypes);
        varConf.is_auto = true;
        varConf.is_expression_auto = true;
        varConf.auto_expression = expression;

        // Configurer selon le type d'expression
        this.configureVarFromExpression(varConf, parsedExpression);

        return varConf;
    }

    /**
     * Configure une VarConfVO basée sur l'expression parsée
     */
    private static configureVarFromExpression(varConf: VarConfVO, parsedExpression: VarConfExpressionVO): void {
        
        switch (parsedExpression.expression_type) {
            case VarConfExpressionVO.EXPRESSION_TYPE_SUM:
                varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF;
                varConf.aggregator = VarConfVO.SUM_AGGREGATOR;
                this.configureFieldRef(varConf, parsedExpression);
                break;

            case VarConfExpressionVO.EXPRESSION_TYPE_COUNT:
                varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF;
                varConf.aggregator = VarConfVO.COUNT_AGGREGATOR;
                this.configureFieldRef(varConf, parsedExpression);
                break;

            case VarConfExpressionVO.EXPRESSION_TYPE_AVG:
                varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF;
                varConf.aggregator = VarConfVO.AVG_AGGREGATOR;
                this.configureFieldRef(varConf, parsedExpression);
                break;

            case VarConfExpressionVO.EXPRESSION_TYPE_MIN:
                varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF;
                varConf.aggregator = VarConfVO.MIN_AGGREGATOR;
                this.configureFieldRef(varConf, parsedExpression);
                break;

            case VarConfExpressionVO.EXPRESSION_TYPE_MAX:
                varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF;
                varConf.aggregator = VarConfVO.MAX_AGGREGATOR;
                this.configureFieldRef(varConf, parsedExpression);
                break;

            case VarConfExpressionVO.EXPRESSION_TYPE_ADD:
                varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_BINAIRE_PLUS;
                this.configureArithmeticOperation(varConf, parsedExpression);
                break;

            case VarConfExpressionVO.EXPRESSION_TYPE_SUBTRACT:
                varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_BINAIRE_MOINS;
                this.configureArithmeticOperation(varConf, parsedExpression);
                break;

            case VarConfExpressionVO.EXPRESSION_TYPE_MULTIPLY:
                varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_BINAIRE_MULT;
                this.configureArithmeticOperation(varConf, parsedExpression);
                break;

            case VarConfExpressionVO.EXPRESSION_TYPE_DIVIDE:
                varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_BINAIRE_DIV;
                this.configureArithmeticOperation(varConf, parsedExpression);
                break;

            case VarConfExpressionVO.EXPRESSION_TYPE_FIELD_REF:
                varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF;
                varConf.aggregator = VarConfVO.SUM_AGGREGATOR; // Default
                this.configureFieldRef(varConf, parsedExpression);
                break;

            case VarConfExpressionVO.EXPRESSION_TYPE_VAR_REF:
                // Variable reference - will be handled by dependency system
                this.configureVarRef(varConf, parsedExpression);
                break;

            default:
                throw new Error(`Unsupported expression type: ${parsedExpression.expression_type}`);
        }

        // Configure automatic parameter context
        if (parsedExpression.involved_tables && parsedExpression.involved_tables.length > 0) {
            varConf.auto_param_context_api_type_ids = parsedExpression.involved_tables;
            varConf.auto_param_context_discarded_field_paths = {};
            varConf.auto_param_context_use_technical_field_versioning = false;
        }
    }

    /**
     * Configure une référence de champ (table.field)
     */
    private static configureFieldRef(varConf: VarConfVO, parsedExpression: VarConfExpressionVO): void {
        varConf.auto_vofieldref_api_type_id = parsedExpression.target_table;
        varConf.auto_vofieldref_field_id = parsedExpression.target_field;
        varConf.auto_vofieldref_modifier = 1; // Default modifier
    }

    /**
     * Configure une opération arithmétique entre variables
     */
    private static configureArithmeticOperation(varConf: VarConfVO, parsedExpression: VarConfExpressionVO): void {
        // Les dépendances seront configurées plus tard quand on aura les références des variables
        // Pour l'instant, on marque que c'est une opération arithmétique
        varConf.auto_deps = [];
    }

    /**
     * Configure une référence de variable
     */
    private static configureVarRef(varConf: VarConfVO, parsedExpression: VarConfExpressionVO): void {
        // La référence de variable sera résolue plus tard
        varConf.auto_operator = VarConfVO.AUTO_OPERATEUR_UNITAIRE_VOFIELDREF;
    }

    /**
     * Enregistre automatiquement une variable d'expression dans le système
     * @param varConf Configuration de variable à enregistrer
     * @returns Controller créé pour cette variable
     */
    public static registerExpressionVar(varConf: VarConfVO): AutoVarExpressionServerController {
        
        // Créer le controller
        const controller = AutoVarExpressionServerController.getInstance(varConf);
        
        // Enregistrer dans le système de variables
        VarsServerController.registerVar(varConf, controller);

        return controller;
    }

    /**
     * Crée et enregistre une variable d'expression en une seule opération
     * @param name Nom de la variable
     * @param expression Expression
     * @param varDataVoType Type du VO de données
     * @param segmentTypes Types de segmentation
     * @returns Controller créé
     */
    public static createAndRegisterFromExpression(
        name: string,
        expression: string,
        varDataVoType: string = 'var_data',
        segmentTypes?: { [matroid_field_id: string]: number }
    ): AutoVarExpressionServerController {

        const varConf = this.createFromExpression(name, expression, varDataVoType, segmentTypes);
        return this.registerExpressionVar(varConf);
    }

    /**
     * Valide qu'une expression peut être utilisée pour créer une variable automatique
     */
    public static validateExpression(expression: string): boolean {
        return AutoVarExpressionParser.validateExpression(expression);
    }

    /**
     * Retourne les tables impliquées dans une expression (utile pour l'invalidation)
     */
    public static getInvolvedTables(expression: string): string[] {
        return AutoVarExpressionParser.getInvolvedTables(expression);
    }
}