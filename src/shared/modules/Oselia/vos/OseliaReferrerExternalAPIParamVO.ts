// import IDistantVOBase from '../../IDistantVOBase';
// import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

// /**
//  * Un paramètre de l'url externe par exemple l'id d'une page ou d'un assistant qu'on cible sur une api rest
//  */
// export default class OseliaReferrerExternalAPIParamVO implements IDistantVOBase, IVersionedVO {
//     public static API_TYPE_ID: string = "oselia_referrer_external_api_param";

//     public id: number;
//     public _type: string = OseliaReferrerExternalAPIParamVO.API_TYPE_ID;

//     // Le même qu'on retrouve dans l'URL de l'API externe entre < et >
//     public name: string;
//     // Pour l'assistant qui doit définir le param à utiliser
//     public description: string;

//     public external_api_id: number;

//     public actif: boolean;

//     public parent_id: number;
//     public trashed: boolean;
//     public version_num: number;
//     public version_author_id: number;
//     public version_timestamp: number;
//     public version_edit_author_id: number;
//     public version_edit_timestamp: number;
// }