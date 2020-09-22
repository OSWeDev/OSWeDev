
export default class MainAggregateOperatorsHandlers {

    public static getInstance() {
        if (!MainAggregateOperatorsHandlers.instance) {
            MainAggregateOperatorsHandlers.instance = new MainAggregateOperatorsHandlers();
        }

        return MainAggregateOperatorsHandlers.instance;
    }

    private static instance: MainAggregateOperatorsHandlers = null;

    private constructor() { }

    /**
     * Fonction d'aggrégation qui applique l'opérateur symétrique +
     * @param values les valeurs à aggréger
     * @returns la somme des valeurs
     */
    public aggregateValues_SUM(values: number[]): number {

        let res: number;

        if (!values) {
            return undefined;
        }

        values.forEach((value: number) => {
            if ((res === null) || (typeof res === 'undefined')) {
                res = value;
                return;
            }

            if ((value === null) || (typeof value === 'undefined')) {
                return;
            }

            res += value;
        });

        return res;
    }

    /**
     * Fonction d'aggrégation qui applique l'opérateur symétrique *
     * @param values les valeurs à aggréger
     * @returns le produit des valeurs
     */
    public aggregateValues_TIMES(values: number[]): number {

        let res: number;

        if (!values) {
            return undefined;
        }

        values.forEach((value: number) => {
            if ((res === null) || (typeof res === 'undefined')) {
                res = value;
                return;
            }

            if ((value === null) || (typeof value === 'undefined')) {
                return;
            }

            res *= value;
        });

        return res;
    }

    /**
     * Fonction d'aggrégation qui applique l'opérateur symétrique MAX
     * @param values les valeurs à aggréger
     * @returns le MAX des valeurs
     */
    public aggregateValues_MAX(values: number[]): number {

        let res: number;

        if (!values) {
            return undefined;
        }

        values.forEach((value: number) => {
            if ((res === null) || (typeof res === 'undefined')) {
                res = value;
                return;
            }

            if ((value === null) || (typeof value === 'undefined')) {
                return;
            }

            res = Math.max(res, value);
        });

        return res;
    }

    /**
     * Fonction d'aggrégation qui applique l'opérateur symétrique MIN
     * @param values les valeurs à aggréger
     * @returns le MIN des valeurs
     */
    public aggregateValues_MIN(values: number[]): number {

        let res: number;

        if (!values) {
            return undefined;
        }

        values.forEach((value: number) => {
            if ((res === null) || (typeof res === 'undefined')) {
                res = value;
                return;
            }

            if ((value === null) || (typeof value === 'undefined')) {
                return;
            }

            res = Math.min(res, value);
        });

        return res;
    }

    /**
     * Fonction d'aggrégation qui applique l'opérateur symétrique booléen ET
     * @param values les valeurs à aggréger
     */
    public aggregateValues_AND(values: number[]): number {

        let res: boolean;

        if (!values) {
            return undefined;
        }

        values.forEach((value: number) => {
            if ((res === null) || (typeof res === 'undefined')) {
                res = (typeof value === 'undefined') ? undefined : ((value === null) ? null : ((!!value) ? true : false));
                return;
            }

            if ((value === null) || (typeof value === 'undefined')) {
                return;
            }

            res = (!!res) && (!!value);
        });

        return (typeof res === 'undefined') ? undefined : ((res === null) ? null : ((!!res) ? 1 : 0));
    }

    /**
     * Fonction d'aggrégation qui applique l'opérateur symétrique OU
     * @param values les valeurs à aggréger
     */
    public aggregateValues_OR(values: number[]): number {

        let res: boolean;

        if (!values) {
            return undefined;
        }

        values.forEach((value: number) => {
            if ((res === null) || (typeof res === 'undefined')) {
                res = (typeof value === 'undefined') ? undefined : ((value === null) ? null : ((!!value) ? true : false));
                return;
            }

            if ((value === null) || (typeof value === 'undefined')) {
                return;
            }

            res = (!!res) || (!!value);
        });

        return (typeof res === 'undefined') ? undefined : ((res === null) ? null : ((!!res) ? 1 : 0));
    }

    /**
     * Fonction d'aggrégation qui applique l'opérateur symétrique XOR
     * @param values les valeurs à aggréger
     */
    public aggregateValues_XOR(values: number[]): number {

        let res: boolean;

        if (!values) {
            return undefined;
        }

        values.forEach((value: number) => {
            if ((res === null) || (typeof res === 'undefined')) {
                res = (typeof value === 'undefined') ? undefined : ((value === null) ? null : ((!!value) ? true : false));
                return;
            }

            if ((value === null) || (typeof value === 'undefined')) {
                return;
            }

            res = ((!!res) !== (!!value));
        });

        return (typeof res === 'undefined') ? undefined : ((res === null) ? null : ((!!res) ? 1 : 0));
    }
}