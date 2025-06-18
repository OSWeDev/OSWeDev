
import IDistantVOBase from '../../IDistantVOBase';

export default class URLAliasVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "url_alias";

    public id: number;
    public _type: string = URLAliasVO.API_TYPE_ID;

    public initial_url: string;
    public alias_url: string;

    /**
     * Si c'est une conf qui génère cet alias, on la stocke
     */
    public url_alias_conf_id: number;

    /**
     * Dans le cas d'une conf, on a un id (ou null pour un alias de create)
     */
    public vo_id: number;
}