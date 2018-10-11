import VueComponentBase from '../../VueComponentBase';
import Component from 'vue-class-component';
import { ModuleDAOGetter, ModuleDAOAction } from '../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';


@Component({
    template: require('./ProgramsOverviewComponent.pug'),
    components: {
    }
})
export default class ProgramsOverviewComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
}