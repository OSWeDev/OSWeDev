import ContextFilterVO from "../../../shared/modules/ContextFilter/vos/ContextFilterVO";

export default class GetVarParamFromContextFiltersParam {
    public constructor(
        public var_name: string,
        public get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        public custom_filters: { [var_param_field_name: string]: ContextFilterVO },
        public active_api_type_ids: string[],
        public discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } },
        public accept_max_ranges: boolean = false,
        public resolve: (var_param: any) => void,
        /**
         * Doit ête forcé côté serveur à la réception de la requête pour éviter une injection malveillante du client,
         * et est nécessaire pour assurer le bon UID lors des requêtes en parallèle
         */
        public uid: number
    ) { }
}