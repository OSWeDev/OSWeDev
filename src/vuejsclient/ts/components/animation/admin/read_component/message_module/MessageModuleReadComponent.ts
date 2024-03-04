
import { Component, Prop, Watch } from 'vue-property-decorator';
import AnimationMessageModuleVO from '../../../../../../../shared/modules/Animation/fields/message_module/vos/AnimationMessageModuleVO';
import DatatableField from '../../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../../../../shared/modules/IDistantVOBase';
import ITableFieldTypeReadComponent from '../../../../../../../shared/modules/TableFieldTypes/interfaces/ITableFieldTypeReadComponent';
import DatatableComponentField from '../../../../datatable/component/fields/DatatableComponentField';
import VueComponentBase from '../../../../VueComponentBase';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';

@Component({
    template: require('./MessageModuleReadComponent.pug'),
    components: {
        Datatablecomponentfield: DatatableComponentField
    }
})
export default class MessageModuleReadComponent extends VueComponentBase implements ITableFieldTypeReadComponent {

    @Prop()
    public row: IDistantVOBase;

    @Prop()
    public value: any;

    private field_values: AnimationMessageModuleVO[] = [];

    @Watch('value', { immediate: true })
    @Watch('row', { immediate: true })
    private reload_field_values(): void {
        this.field_values = ObjectHandler.try_get_json(this.value);
    }

    private async created() { }

    get fields(): Array<DatatableField<any, any>> {
        return AnimationMessageModuleVO.fields();
    }
}