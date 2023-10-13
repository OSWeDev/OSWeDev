
/**
 * ConditionStatement
 */
export enum ConditionStatement {
    EQUALS = '==',
    STRICT_EQUALS = '===',
    NOT_EQUALS = '!=',
    GREATER_THAN = '>',
    GREATER_THAN_OR_EQUALS = '>=',
    LOWER_THAN = '<',
    LOWER_THAN_OR_EQUALS = '<=',
    IN = 'in',
    NOT_IN = 'not_in',
    LIKE = 'like',
    NOT_LIKE = 'not_like',
    IS_NULL = 'is_null',
    IS_NOT_NULL = 'is_not_null',
    BETWEEN = 'between',
    NOT_BETWEEN = 'not_between',
    CONTAINS = 'contains',
    NOT_CONTAINS = 'not_contains',
    STARTS_WITH = 'starts_with',
    NOT_STARTS_WITH = 'not_starts_with',
    ENDS_WITH = 'ends_with',
    NOT_ENDS_WITH = 'not_ends_with',
    IS_EMPTY = 'is_empty',
    IS_NOT_EMPTY = 'is_not_empty',
    IS_TRUE = 'is_true',
    IS_FALSE = 'is_false',
}

/**
 * ConditionHandler
 *  - Handle conditions for dynamic statements
 */
export default class ConditionHandler {

    /**
     * dynamic_statement
     *  - Handle dynamic statement
     *
     * TODO: to be continued there are more conditions to handle
     *
     * @param {unknown} a // value to compare from
     * @param {ConditionStatement} condition
     * @param {unknown} b // value to compare to
     * @returns {boolean}
     */
    public static dynamic_statement(a: unknown, condition: ConditionStatement, b?: unknown): boolean {
        let result: boolean = null;
        let type: string = null;

        if ((a == null) && (b == null)) {
            return (condition == ConditionStatement.STRICT_EQUALS) ||
                (condition == ConditionStatement.EQUALS) ||
                (condition == ConditionStatement.IS_NULL) ||
                (condition == ConditionStatement.IS_EMPTY);
        }

        if ((a == null) && (condition == ConditionStatement.IS_NOT_NULL)) {
            return false;
        }
        if ((a == null) && (condition == ConditionStatement.IS_NULL)) {
            return true;
        }
        if ((a == null) && (condition == ConditionStatement.IS_NOT_EMPTY)) {
            return false;
        }
        if ((a == null) && (condition == ConditionStatement.IS_EMPTY)) {
            return true;
        }

        if (
            typeof a === 'number' &&
            (
                (typeof b === 'number') ||
                (
                    Array.isArray(b) &&
                    b.every((x) => typeof x == 'number')
                )
            )
        ) {
            // may also be an array of numbers
            type = 'number';
        } else if (typeof a === 'string' && typeof b === 'string' || (Array.isArray(b) && b.every((x) => typeof x == 'string'))) {
            // may also be an array of strings
            type = 'string';
        } else if (typeof a === 'boolean' && typeof b === 'boolean') {
            type = 'boolean';
        } else if (typeof a === 'object' && typeof b === 'object') {
            type = 'object';
        } else {
            return false;
        }

        switch (type) {
            case 'string':
                result = ConditionHandler.dynamic_statement_string(
                    a as string,
                    condition,
                    b as string
                );
                break;

            case 'number':
                result = ConditionHandler.dynamic_statement_number(
                    a as number,
                    condition,
                    b as number
                );
                break;

            case 'boolean':
                result = a === b;
                break;

            case 'object':
                result = ConditionHandler.dynamic_statement_object(
                    a as object,
                    condition,
                    b as object
                );
                break;
        }

        return result;
    }

    private static dynamic_statement_string(a: unknown, condition: ConditionStatement, c?: unknown): boolean {
        const expected_conditions: ConditionStatement[] = [
            ConditionStatement.EQUALS,
            ConditionStatement.NOT_EQUALS,
            ConditionStatement.IN,
            ConditionStatement.NOT_IN,
            ConditionStatement.LIKE,
            ConditionStatement.NOT_LIKE,
            ConditionStatement.IS_NULL,
            ConditionStatement.IS_NOT_NULL,
            ConditionStatement.CONTAINS,
            ConditionStatement.NOT_CONTAINS,
            ConditionStatement.STARTS_WITH,
            ConditionStatement.NOT_STARTS_WITH,
            ConditionStatement.ENDS_WITH,
            ConditionStatement.NOT_ENDS_WITH,
            ConditionStatement.IS_EMPTY,
            ConditionStatement.IS_NOT_EMPTY,
        ];

        throw new Error(
            'Not implemented yet!'
        );

        if (!expected_conditions.includes(condition as ConditionStatement)) {
            throw new Error(
                `ConditionHandler.dynamic_statement_string: unexpected condition '${condition}' given!`
            );
        }

        return false;
    }

    /**
     * dynamic_statement_number
     * - Handle dynamic statement for numbers
     *
     * @param {number} a
     * @param {string} condition
     * @param {number | number[]} c
     * @returns {boolean}
     */
    private static dynamic_statement_number(a: number, condition: ConditionStatement, c?: number | number[]): boolean {
        const expected_conditions: ConditionStatement[] = [
            ConditionStatement.EQUALS,
            ConditionStatement.STRICT_EQUALS,
            ConditionStatement.NOT_EQUALS,
            ConditionStatement.GREATER_THAN,
            ConditionStatement.GREATER_THAN_OR_EQUALS,
            ConditionStatement.LOWER_THAN,
            ConditionStatement.LOWER_THAN_OR_EQUALS,
            ConditionStatement.IN,
            ConditionStatement.NOT_IN,
            ConditionStatement.BETWEEN,
            ConditionStatement.NOT_BETWEEN,
            ConditionStatement.IS_NULL,
            ConditionStatement.IS_NOT_NULL,
            ConditionStatement.IS_EMPTY,
            ConditionStatement.IS_NOT_EMPTY,
        ];

        if (!expected_conditions.includes(condition as ConditionStatement)) {
            throw new Error(
                `ConditionHandler.dynamic_statement_string: unexpected condition '${condition}' given!`
            );
        }

        switch (condition) {
            case ConditionStatement.EQUALS:
                return a == c;

            case ConditionStatement.STRICT_EQUALS:
                return a === c;

            case ConditionStatement.NOT_EQUALS:
                return a != c;

            case ConditionStatement.GREATER_THAN:
                return (typeof c == 'number') && a > c;

            case ConditionStatement.GREATER_THAN_OR_EQUALS:
                return (typeof c == 'number') && a >= c;

            case ConditionStatement.LOWER_THAN:
                return (typeof c == 'number') && a < c;

            case ConditionStatement.LOWER_THAN_OR_EQUALS:
                return (typeof c == 'number') && a <= c;

            case ConditionStatement.IN:
                return (c as number[]).includes(a as number);

            case ConditionStatement.NOT_IN:
                return !(c as number[]).includes(a as number);

            case ConditionStatement.BETWEEN:
                return (Array.isArray(c)) && (a >= (c as number[])[0] && a <= (c as number[])[1]);

            case ConditionStatement.NOT_BETWEEN:
                return (Array.isArray(c)) && (a < (c as number[])[0] || a > (c as number[])[1]);

            case ConditionStatement.IS_NULL:
                return a == null;

            case ConditionStatement.IS_NOT_NULL:
                return a != null;

            case ConditionStatement.IS_EMPTY:
                return a == null || a == 0;

            case ConditionStatement.IS_NOT_EMPTY:
                return a != null && a != 0;

            default:
                throw new Error(
                    `ConditionHandler.dynamic_statement_string: unexpected condition '${condition}' given!`
                );
        }
    }

    private static dynamic_statement_object(a: unknown, condition: ConditionStatement, c?: unknown): boolean {
        const expected_conditions: ConditionStatement[] = [
            ConditionStatement.EQUALS,
            ConditionStatement.NOT_EQUALS,
            ConditionStatement.IS_NULL,
            ConditionStatement.IS_NOT_NULL,
            ConditionStatement.IS_EMPTY,
            ConditionStatement.IS_NOT_EMPTY,
        ];

        throw new Error(
            'Not implemented yet!'
        );

        if (!expected_conditions.includes(condition as ConditionStatement)) {
            throw new Error(
                `ConditionHandler.dynamic_statement_string: unexpected condition '${condition}' given!`
            );
        }


        return false;
    }
}