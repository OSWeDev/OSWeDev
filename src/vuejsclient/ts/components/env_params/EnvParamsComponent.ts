import Component from 'vue-class-component';
import ModuleEnvParam from '../../../../shared/modules/EnvParam/ModuleEnvParam';
import EnvParamsVO from '../../../../shared/modules/EnvParam/vos/EnvParamsVO';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './EnvParamsComponent.scss';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../shared/modules/ModuleTableFieldVO';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import SimpleDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import { field_names } from '../../../../shared/tools/ObjectHandler';

@Component({
    template: require('./EnvParamsComponent.pug'),
    components: {
        Crudcomponentfield: () => import('../crud/component/field/CRUDComponentField'),
    }
})
export default class EnvParamsComponent extends VueComponentBase {

    private env_params: EnvParamsVO = null;

    private throttle_get_env_params = ThrottleHelper.declare_throttle_without_args(this.get_env_params.bind(this), 10);
    public async mounted() {
        this.throttle_get_env_params();
    }

    get module_table() {
        return ModuleTableController.module_tables_by_vo_type[EnvParamsVO.API_TYPE_ID];
    }

    get env_params_fields(): ModuleTableFieldVO[] {
        return this.module_table.get_fields();
    }

    get editable_fields(): { [field_id: string]: SimpleDatatableFieldVO<any, any> } {

        if (!this.env_params_fields || !this.env_params_fields.length) {
            return {};
        }

        const res: { [field_id: string]: SimpleDatatableFieldVO<any, any> } = {};
        for (const i in this.env_params_fields) {
            res[this.env_params_fields[i].field_id] = SimpleDatatableFieldVO.createNew(this.env_params_fields[i].field_id).setModuleTable(this.module_table);
        }
        return res;
    }

    private async get_env_params() {
        this.env_params = await ModuleEnvParam.getInstance().get_env_params();
    }

    private async on_edit_field(vo: EnvParamsVO, field: SimpleDatatableFieldVO<any, any>, data: any): Promise<void> {

        const self = this;
        this.$snotify.async(this.label('EnvParamsComponent.on_edit_field.start'), () => new Promise(async (resolve, reject) => {

            try {

                switch (field.field_type) {
                    case ModuleTableFieldVO.FIELD_TYPE_boolean:
                        await ModuleEnvParam.getInstance().set_env_param_boolean(field.module_table_field_id, data);
                        break;
                    case ModuleTableFieldVO.FIELD_TYPE_int:
                    case ModuleTableFieldVO.FIELD_TYPE_float:
                        await ModuleEnvParam.getInstance().set_env_param_number(field.module_table_field_id, data);
                        break;
                    case ModuleTableFieldVO.FIELD_TYPE_string:
                        await ModuleEnvParam.getInstance().set_env_param_string(field.module_table_field_id, data);
                        break;
                    default:
                        return;
                }
                self.throttle_get_env_params();

            } catch (error) {

                reject({
                    title: self.label('EnvParamsComponent.on_edit_field.error'),
                    body: '',
                    config: {
                        timeout: 1000,
                    }
                });
                return false;
            }

            resolve({
                title: self.label('EnvParamsComponent.on_edit_field.ok'),
                body: '',
                config: {
                    timeout: 1000,
                }
            });

            return true;
        }));
    }
}