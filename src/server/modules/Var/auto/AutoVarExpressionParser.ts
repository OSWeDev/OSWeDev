import VarConfExpressionVO from '../../../../shared/modules/Var/vos/VarConfExpressionVO';

/**
 * Parser for automatic variable expressions
 * Allows parsing expressions like:
 * - "sum(table.field)" => aggregation function
 * - "var_a + var_b" => variable arithmetic
 * - "table.field" => simple field reference
 */
export default class AutoVarExpressionParser {

    /**
     * Parse une expression et retourne un VarConfExpressionVO
     */
    public static parseExpression(expressionText: string): VarConfExpressionVO {
        const trimmed = expressionText.trim();
        
        // Vérifier les fonctions d'agrégation
        const aggregationMatch = this.parseAggregationFunction(trimmed);
        if (aggregationMatch) {
            return aggregationMatch;
        }

        // Vérifier les opérations arithmétiques
        const arithmeticMatch = this.parseArithmeticOperation(trimmed);
        if (arithmeticMatch) {
            return arithmeticMatch;
        }

        // Vérifier les références simples
        const simpleMatch = this.parseSimpleReference(trimmed);
        if (simpleMatch) {
            return simpleMatch;
        }

        throw new Error(`Cannot parse expression: ${expressionText}`);
    }

    /**
     * Parse les fonctions d'agrégation comme sum(table.field)
     */
    private static parseAggregationFunction(expression: string): VarConfExpressionVO {
        const aggregationPattern = /^(sum|count|avg|min|max)\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)$/i;
        const match = expression.match(aggregationPattern);
        
        if (!match) {
            return null;
        }

        const [, functionName, tableName, fieldName] = match;
        
        const config = new VarConfExpressionVO();
        config.expression_text = expression;
        config.target_table = tableName;
        config.target_field = fieldName;
        config.involved_tables = [tableName];
        config.auto_filter_fields = this.extractFilterFields(tableName);

        // Map function name to expression type
        switch (functionName.toLowerCase()) {
            case 'sum':
                config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_SUM;
                break;
            case 'count':
                config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_COUNT;
                break;
            case 'avg':
                config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_AVG;
                break;
            case 'min':
                config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_MIN;
                break;
            case 'max':
                config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_MAX;
                break;
            default:
                throw new Error(`Unknown aggregation function: ${functionName}`);
        }

        return config;
    }

    /**
     * Parse les opérations arithmétiques comme var_a + var_b
     */
    private static parseArithmeticOperation(expression: string): VarConfExpressionVO {
        // Pattern pour détecter les opérations arithmétiques
        const arithmeticPattern = /^(.+?)\s*([\+\-\*\/])\s*(.+)$/;
        const match = expression.match(arithmeticPattern);
        
        if (!match) {
            return null;
        }

        const [, leftExpr, operator, rightExpr] = match;
        
        const config = new VarConfExpressionVO();
        config.expression_text = expression;

        // Map operator to expression type
        switch (operator) {
            case '+':
                config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_ADD;
                break;
            case '-':
                config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_SUBTRACT;
                break;
            case '*':
                config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_MULTIPLY;
                break;
            case '/':
                config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_DIVIDE;
                break;
            default:
                throw new Error(`Unknown arithmetic operator: ${operator}`);
        }

        // Pour l'instant, on stocke les expressions gauche et droite comme du texte
        // Dans une implémentation complète, on créerait des sous-expressions
        config.involved_tables = this.extractTablesFromExpression(leftExpr).concat(
            this.extractTablesFromExpression(rightExpr)
        );

        return config;
    }

    /**
     * Parse les références simples comme table.field ou var_name
     */
    private static parseSimpleReference(expression: string): VarConfExpressionVO {
        // Pattern pour table.field
        const fieldPattern = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)$/;
        const fieldMatch = expression.match(fieldPattern);
        
        if (fieldMatch) {
            const [, tableName, fieldName] = fieldMatch;
            
            const config = new VarConfExpressionVO();
            config.expression_text = expression;
            config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_FIELD_REF;
            config.target_table = tableName;
            config.target_field = fieldName;
            config.involved_tables = [tableName];
            config.auto_filter_fields = this.extractFilterFields(tableName);
            
            return config;
        }

        // Pattern pour variable reference
        const varPattern = /^([a-zA-Z_][a-zA-Z0-9_]*)$/;
        const varMatch = expression.match(varPattern);
        
        if (varMatch) {
            const [, varName] = varMatch;
            
            const config = new VarConfExpressionVO();
            config.expression_text = expression;
            config.expression_type = VarConfExpressionVO.EXPRESSION_TYPE_VAR_REF;
            config.target_var_name = varName;
            config.involved_tables = []; // Les tables seront déterminées par la variable référencée
            
            return config;
        }

        return null;
    }

    /**
     * Extrait les champs de filtrage possibles pour une table donnée
     * Cette méthode peut être étendue pour analyser le schéma de la base de données
     */
    private static extractFilterFields(tableName: string): string[] {
        // Pour l'instant, on retourne des champs génériques
        // Dans une implémentation complète, on analyserait le schéma de la table
        return ['id', 'created_at', 'updated_at'];
    }

    /**
     * Extrait les tables impliquées dans une expression
     */
    private static extractTablesFromExpression(expression: string): string[] {
        const tables: string[] = [];
        const fieldPattern = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        
        while ((match = fieldPattern.exec(expression)) !== null) {
            const tableName = match[1];
            if (tables.indexOf(tableName) === -1) {
                tables.push(tableName);
            }
        }
        
        return tables;
    }

    /**
     * Valide qu'une expression est syntaxiquement correcte
     */
    public static validateExpression(expressionText: string): boolean {
        try {
            this.parseExpression(expressionText);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Retourne la liste des tables impliquées dans une expression
     */
    public static getInvolvedTables(expressionText: string): string[] {
        try {
            const parsed = this.parseExpression(expressionText);
            return parsed.involved_tables || [];
        } catch (error) {
            return [];
        }
    }
}