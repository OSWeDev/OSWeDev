import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';

export default class DAOUpdateVOHolder<T extends IDistantVOBase> {

    public constructor(public pre_update_vo: T, public post_update_vo: T) { }
}