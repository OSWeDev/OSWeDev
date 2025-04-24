export default class VueAppBaseDatasHolder {
    public static instance;

    /**
     * Module un peu spécifique qui peut avoir un impact sur les perfs donc on gère son accès le plus vite possible
     */
    public static has_access_to_onpage_translation: boolean = false;
    public static has_access_to_feedback: boolean = false;
    public static has_access_to_survey: boolean = false;
}