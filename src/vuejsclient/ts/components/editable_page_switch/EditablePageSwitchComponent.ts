import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './EditablePageSwitchComponent.scss';
import { ModuleEditablePageSwitchAction, ModuleEditablePageSwitchGetter } from './EditablePageSwitchStore';

@Component({
    template: require('./EditablePageSwitchComponent.pug'),
    components: {}
})
export default class EditablePageSwitchComponent extends VueComponentBase {

    @ModuleEditablePageSwitchGetter
    private is_waiting_for_save: boolean;
    @ModuleEditablePageSwitchGetter
    private saving_handlers: Array<() => Promise<boolean>>;
    // @ModuleEditablePageSwitchGetter
    // private show_floating_save_button: boolean;
    @ModuleEditablePageSwitchGetter
    private is_editing_page: boolean;
    @ModuleEditablePageSwitchGetter
    private is_saving: boolean;

    @ModuleEditablePageSwitchAction
    private set_is_waiting_for_save: (is_waiting_for_save: boolean) => void;
    @ModuleEditablePageSwitchAction
    private set_saving_handlers: (saving_handlers: Array<() => Promise<boolean>>) => void;
    // @ModuleEditablePageSwitchAction
    // private set_show_floating_save_button: (show_floating_save_button: boolean) => void;
    @ModuleEditablePageSwitchAction
    private set_is_editing_page: (is_editing_page: boolean) => void;
    @ModuleEditablePageSwitchAction
    private set_is_saving: (is_saving: boolean) => void;
    @ModuleEditablePageSwitchAction
    private add_saving_handlers: (saving_handlers: Array<() => Promise<boolean>>) => void;

    @Prop({
        default: true
    })
    private show_fixed_save_button: boolean;

    @Prop({
        default: true
    })
    private show_switch: boolean;

    @Prop({
        default: true
    })
    private highlight_inputs: boolean;

    @Prop({
        default: false
    })
    private default_is_editing: boolean;

    private async mounted() {
        if (!!this.default_is_editing) {
            this.set_is_editing_page(true);
        } else {
            this.set_is_editing_page(false);
        }
    }

    private async call_save_handlers(): Promise<boolean> {

        if (this.is_saving) {
            return false;
        }

        this.set_is_saving(true);
        for (let i in this.saving_handlers) {
            let saving_handler = this.saving_handlers[i];

            if (!await saving_handler()) {
                ConsoleHandler.getInstance().error('Echec de sauvegarde de la page');
                this.snotify.error(this.label('EditablePageSwitchComponent.try_leave.error'));

                this.set_is_saving(false);
                return false;
            }
        }

        this.set_is_waiting_for_save(false);

        this.set_is_saving(false);
        return true;
    }

    private async switch_edition() {

        if (this.is_waiting_for_save) {
            if (!await this.try_leave()) {
                return;
            }
        }

        this.set_is_editing_page(!this.is_editing_page);
    }

    private async try_leave(): Promise<boolean> {
        let self = this;

        return new Promise<boolean>((accept, reject) => {

            self.snotify.confirm(self.label('EditablePageSwitchComponent.try_leave.body'), self.label('EditablePageSwitchComponent.try_leave.title'), {
                timeout: 10000,
                showProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                buttons: [
                    {
                        text: self.t('YES'),
                        action: async (toast) => {
                            self.$snotify.remove(toast.id);

                            if (!await self.call_save_handlers()) {
                                self.set_is_editing_page(true);
                                self.set_is_waiting_for_save(true);
                                accept(false);
                                return;
                            }

                            self.set_is_editing_page(false);
                            self.set_is_waiting_for_save(false);
                            self.snotify.success(self.label('EditablePageSwitchComponent.try_leave.saved'));
                            accept(true);
                        },
                        bold: false
                    },
                    {
                        text: self.t('NO'),
                        action: (toast) => {
                            self.$snotify.remove(toast.id);
                            self.set_is_editing_page(false);
                            self.set_is_waiting_for_save(false);
                            self.snotify.warning(self.label('EditablePageSwitchComponent.try_leave.lost'));
                            accept(true);
                        }
                    },
                    {
                        text: self.t('CANCEL'),
                        action: (toast) => {
                            self.$snotify.remove(toast.id);
                            self.set_is_editing_page(true);
                            self.set_is_waiting_for_save(true);
                            self.snotify.info(self.label('EditablePageSwitchComponent.try_leave.canceled'));
                            accept(false);
                        }
                    }
                ]
            });
        });
    }

    private async beforeRouteLeave(to, from, next) {
        if (this.is_waiting_for_save) {
            if (!await this.try_leave()) {
                next(false);
                return;
            }
        }
        next();
    }
}