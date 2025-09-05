import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import AutoVarExpressionFactory from '../Var/auto/AutoVarExpressionFactory';
import AutoVarExpressionInvalidationHandler from '../Var/auto/AutoVarExpressionInvalidationHandler';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';

/**
 * API pour la gestion des variables automatiques basées sur des expressions
 */
export default class AutoVarExpressionAPIController {

    public static MODULE_NAME: string = 'AutoVarExpressionAPI';

    public static getInstance(): AutoVarExpressionAPIController {
        if (!AutoVarExpressionAPIController.instance) {
            AutoVarExpressionAPIController.instance = new AutoVarExpressionAPIController();
        }
        return AutoVarExpressionAPIController.instance;
    }

    private static instance: AutoVarExpressionAPIController = null;

    private constructor() {
        // Pour l'instant, pas d'enregistrement API automatique
        // ModuleAPI.getInstance().registerApis(this);
    }

    /**
     * API pour créer une variable automatique à partir d'une expression
     */
    public async createExpressionVar(
        name: string,
        expression: string,
        varDataVoType?: string
    ): Promise<VarConfVO> {
        
        try {
            // Valider l'expression
            if (!AutoVarExpressionFactory.validateExpression(expression)) {
                throw new Error(`Invalid expression: ${expression}`);
            }

            // Créer et enregistrer la variable
            const controller = AutoVarExpressionFactory.createAndRegisterFromExpression(
                name,
                expression,
                varDataVoType || 'var_data'
            );

            // Ajouter à l'invalidation automatique
            AutoVarExpressionInvalidationHandler.addExpressionVar(controller.varConf);

            return controller.varConf;
        } catch (error) {
            console.error(`Error creating expression var ${name}:`, error);
            throw error;
        }
    }

    /**
     * API pour valider une expression
     */
    public async validateExpression(expression: string): Promise<boolean> {
        return AutoVarExpressionFactory.validateExpression(expression);
    }

    /**
     * API pour obtenir les tables impliquées dans une expression
     */
    public async getInvolvedTables(expression: string): Promise<string[]> {
        return AutoVarExpressionFactory.getInvolvedTables(expression);
    }

    /**
     * API pour créer plusieurs variables d'expression en lot
     */
    public async createExpressionVarsBatch(
        varDefinitions: Array<{
            name: string;
            expression: string;
            varDataVoType?: string;
        }>
    ): Promise<VarConfVO[]> {
        
        const results: VarConfVO[] = [];
        
        for (let definition of varDefinitions) {
            try {
                const varConf = await this.createExpressionVar(
                    definition.name,
                    definition.expression,
                    definition.varDataVoType
                );
                results.push(varConf);
            } catch (error) {
                console.error(`Error creating var ${definition.name}:`, error);
                // Continue avec les autres variables même en cas d'erreur
            }
        }
        
        return results;
    }

    /**
     * Enregistre les APIs (à implémenter selon le système API d'OSWeDev)
     */
    public registerApis() {
        // Pour l'instant, les APIs seront créées manuellement
        // En attente de clarification sur le système API d'OSWeDev
        
        // APIControllerWrapper.registerApi(
        //     this.createExpressionVar.bind(this),
        //     AutoVarExpressionAPIController.MODULE_NAME,
        //     'createExpressionVar'
        // );

        // APIControllerWrapper.registerApi(
        //     this.validateExpression.bind(this),
        //     AutoVarExpressionAPIController.MODULE_NAME,
        //     'validateExpression'
        // );

        // APIControllerWrapper.registerApi(
        //     this.getInvolvedTables.bind(this),
        //     AutoVarExpressionAPIController.MODULE_NAME,
        //     'getInvolvedTables'
        // );
    }
}