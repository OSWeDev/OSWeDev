
import IDistantVOBase from '../../IDistantVOBase';
import DefaultTranslationVO from '../../Translation/vos/DefaultTranslationVO';

/**
 * Permet dans le cadre d'une conf de crud par exemple de fournir un template d'alias d'url, qui seront générés via un trigger postcreate/postupdate vs le vo ciblé
 * Donc en gros sur une conf d'alias, on pourra en fonction d'un api_type_id et pour une langue donnée, générer un alias d'url sur la base d'un template :
 *  - avec une url de remplacement du create
 *  - une url de remplacement du update avec un :id obligatoire pour récupérer l'id du vo à éditer ou un :[field_name] si le field_name est unique
 *  - une url de remplacement du read avec un :id obligatoire pour récupérer l'id du vo à lire ou un :[field_name] si le field_name est unique
 */
export default class URLAliasCRUDConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "url_alias_crud_conf";

    public id: number;
    public _type: string = URLAliasCRUDConfVO.API_TYPE_ID;

    public moduletable_ref_id: number;
    public lang_id: number;

    public url_alias_create: string;
    public url_alias_template_read: string;
    public url_alias_template_update: string;
}