import Component from 'vue-class-component';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './EditablePageSwitchRepeaterComponent.scss';
import { ModuleEditablePageSwitchAction, ModuleEditablePageSwitchGetter } from './EditablePageSwitchStore';

@Component({
    template: require('./EditablePageSwitchRepeaterComponent.pug'),
    components: {}
})
export default class EditablePageSwitchRepeaterComponent extends VueComponentBase {

    @ModuleEditablePageSwitchGetter
    private is_waiting_for_save: boolean;
    @ModuleEditablePageSwitchGetter
    private is_editing_page: boolean;
    @ModuleEditablePageSwitchGetter
    private is_saving: boolean;

    @ModuleEditablePageSwitchAction
    private set_is_editing_page: (is_editing_page: boolean) => void;

    private async switch_edition() {

        if (this.is_waiting_for_save) {
            return;
        }

        this.set_is_editing_page(!this.is_editing_page);
    }
}