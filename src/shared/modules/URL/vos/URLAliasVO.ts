
import IDistantVOBase from '../../IDistantVOBase';

/**
 * Un alias d'URL doit par défaut rester toujours valide
 * TODO FIXME !?! A voir quand utile : Donc si on modifie une URL, on devrait avoir une redirection 301 vers la nouvelle URL qui se crée automatiquement :
 *  trigger post-update du urlAlias => par contre on garde la possibilité de delete pour continuer de gérer finement au cas par cas ensuite
 *  Attention ce comportement peut aussi entraîner la création de très nombreux alias, et c'est pas forcément utile dans toutes les solutions (typiquement un extranet, osef le ref et plus ou moins osef les urls mortes, on les stocke pas a priori)
 * Ces alias de redirection sont indiqués secondaires : ça signifie qu'on a un lien vers un autre alias et donc on fait réellement la redirection,
 *  même si le fonctionnement des alias à la base est qu'on redirige plutôt vers l'alias pour le référencement, et pas vers l'URL initiale.
 *
 * Avoir dans le temps si on veut gérer la modification manuelle en surcharge d'un alias d'URL généré par une conf ou si on s'arrange juste pour avoir des confs propres/complètes
 */
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