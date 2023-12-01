
export default class ContextQueryInjectionCheckHandler {

    /**
     * Le format d'un nom (colonne, table) en postgresql est une lettre, puis lettre / chiffre / _
     *  La distinction du premier caractère a peu d'impact
     *  On accepte un point pour les alias
     * @param name
     */
    public static assert_postgresql_name_format(name: string) {

        if (!/^[a-zA-Z0-9_]*\.?[a-zA-Z0-9_]+$/.test(name)) {
            throw new Error('assert_postgresql_name_format failed:' + name);
        }
    }

    public static assert_api_type_id_format(api_type_id: string) {

        if (!/^[a-zA-Z0-9_]+$/.test(api_type_id)) {
            throw new Error('assert_api_type_id_format failed:' + api_type_id);
        }
    }

    public static assert_integer(int_value: number) {

        let int_string = int_value?.toString();

        if (!/^-?[0-9]+$/.test(int_string)) {
            throw new Error('assert_integer failed:' + int_string);
        }
    }

    public static assert_numeric(int_value: number) {

        let int_string = int_value?.toString();

        if (!/^-?[0-9]+[.,]?[0-9]*$/.test(int_string)) {
            throw new Error('assert_integer failed:' + int_string);
        }
    }

    private constructor() { }
}