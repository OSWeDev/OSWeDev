import Component from 'vue-class-component';
import ModuleEnvParam from '../../../../shared/modules/EnvParam/ModuleEnvParam';
import EnvParamsVO from '../../../../shared/modules/EnvParam/vos/EnvParamsVO';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './EnvParamsComponent.scss';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import SimpleDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';

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

    get env_params_fields(): Array<ModuleTableField<any>> {
        return VOsTypesManager.moduleTables_by_voType[EnvParamsVO.API_TYPE_ID].get_fields();
    }

    private async get_env_params() {
        this.env_params = await ModuleEnvParam.getInstance().get_env_params();
    }

    private async on_edit_field(vo: EnvParamsVO, field: SimpleDatatableFieldVO<any, any>, data: any): Promise<void> {

        let self = this;
        this.$snotify.async(this.label('EnvParamsComponent.on_edit_field.start'), () => new Promise(async (resolve, reject) => {

            try {

                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_boolean:
                        await ModuleEnvParam.getInstance().set_env_param_boolean(field.module_table_field_id, data);
                        break;
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_float:
                        await ModuleEnvParam.getInstance().set_env_param_number(field.module_table_field_id, data);
                        break;
                    case ModuleTableField.FIELD_TYPE_string:
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