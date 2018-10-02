import IDistantVOBase from '../../IDistantVOBase';

export default class PageAliasVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "page_alias";

    public id: number;
    public _type: string = PageAliasVO.API_TYPE_ID;

    public alias_route: string;
    public page_id: number;
}