import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import VOsTypesHandler from '../../../../../../shared/modules/VO/handler/VOsTypesHandler';
import VueComponentBase from '../../../VueComponentBase';
import VoFieldWidgetRefComponent from '../../vo_field_widget_ref/VoFieldWidgetRefComponent';
import './MultipleVoFieldRefHolderComponent.scss';

@Component({
    template: require('./MultipleVoFieldRefHolderComponent.pug'),
    components: {
        Vofieldwidgetrefcomponent: VoFieldWidgetRefComponent
    }
})
export default class MultipleVoFieldRefHolderComponent extends VueComponentBase {

    @Prop({ default: null })
    private vo_field_ref: VOFieldRefVO;

    @Prop({ default: null })
    private vo_field_ref_multiple: VOFieldRefVO[];

    @Prop()
    private page_widget_id: number;

    private remove_field_ref(vo_field_ref: VOFieldRefVO) {
        this.$emit('remove_field_ref', vo_field_ref);
    }

    private allowDrop(event) {
        event.preventDefault();

        if ((!event) || (!event.dataTransfer)) {
            return false;
        }

        const api_type_id: string = event.dataTransfer.getData("api_type_id");
        const field_id: string = event.dataTransfer.getData("field_id");

        if ((!api_type_id) || (!field_id)) {
            return false;
        }

        if (this.vo_field_ref_multiple) {
            if (this.vo_field_ref_multiple.find((e) => (e.api_type_id == api_type_id) && (e.field_id == field_id))) {
                return false;
            }
        }

        if (this.vo_field_ref && (this.vo_field_ref.api_type_id == api_type_id) && (this.vo_field_ref.field_id == field_id)) {
            return false;
        }

        return this.is_same_type_vo_field_ref(api_type_id, field_id);
    }

    private drop(event) {
        event.preventDefault();

        if (!this.allowDrop(event)) {
            return;
        }

        const api_type_id: string = event.dataTransfer.getData("api_type_id");
        const field_id: string = event.dataTransfer.getData("field_id");

        this.$emit('add_field_ref', api_type_id, field_id);
    }

    private is_same_type_vo_field_ref(api_type_id: string, field_id: string): boolean {

        if ((!api_type_id) || (!field_id) || (!this.vo_field_ref)) {
            return false;
        }

        const vo_field_ref_field = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);
        const new_field = ModuleTableController.module_tables_by_vo_type[api_type_id].get_field_by_id(field_id);

        if (this.is_type_boolean(vo_field_ref_field)) {
            return this.is_type_boolean(new_field);
        }

        if (this.is_type_enum(vo_field_ref_field)) {
            return this.is_type_enum(new_field);
        }

        if (this.is_type_date(vo_field_ref_field)) {
            return this.is_type_date(new_field);
        }

        if (this.is_type_string(vo_field_ref_field)) {
            return this.is_type_string(new_field);
        }

        if (this.is_type_number(vo_field_ref_field, this.vo_field_ref.field_id)) {
            return this.is_type_number(new_field, field_id);
        }

        return false;
    }

    private is_type_boolean(field: ModuleTableFieldVO): boolean {
        return VOsTypesHandler.is_type_boolean(field);
    }

    private is_type_enum(field: ModuleTableFieldVO): boolean {
        return VOsTypesHandler.is_type_enum(field);
    }

    private is_type_date(field: ModuleTableFieldVO): boolean {
        return VOsTypesHandler.is_type_date(field);
    }

    private is_type_string(field: ModuleTableFieldVO): boolean {
        return VOsTypesHandler.is_type_string(field);
    }

    private is_type_number(field: ModuleTableFieldVO, field_id: string): boolean {
        if (!field) {

            /**
             * Cas spécifique du field_id == 'id' qu'on voudrait pouvoir filtrer comme un number
             */
            return field_id == 'id';
        }

        return VOsTypesHandler.is_type_number(field);
    }
}