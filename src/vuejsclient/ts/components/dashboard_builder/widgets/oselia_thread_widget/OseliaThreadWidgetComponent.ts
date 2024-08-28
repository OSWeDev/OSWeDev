import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ModuleGPT from '../../../../../../shared/modules/GPT/ModuleGPT';
import GPTAssistantAPIAssistantVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadMessageVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../VueAppController';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import DatatableComponentField from '../../../datatable/component/fields/DatatableComponentField';
import MailIDEventsComponent from '../../../mail_id_events/MailIDEventsComponent';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import OseliaThreadMessageComponent from './OseliaThreadMessage/OseliaThreadMessageComponent';
import './OseliaThreadWidgetComponent.scss';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import ModuleFile from '../../../../../../shared/modules/File/ModuleFile';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';

@Component({
    template: require('./OseliaThreadWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Datatablecomponentfield: DatatableComponentField,
        Tablepaginationcomponent: TablePaginationComponent,
        Mailideventscomponent: MailIDEventsComponent,
        Oseliathreadmessagecomponent: OseliaThreadMessageComponent
    }
})
export default class OseliaThreadWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    public thread_messages: GPTAssistantAPIThreadMessageVO[] = [];
    public thread: GPTAssistantAPIThreadVO = null;

    private has_access_to_thread: boolean = false;
    private is_loading_thread: boolean = true;

    private too_many_assistants: boolean = false;
    private can_run_assistant: boolean = false;
    private assistant_is_busy: boolean = false;

    private current_thread_id: number = null;

    private assistant: GPTAssistantAPIAssistantVO = null;

    private new_message_text: string = null;
    private is_dragging: boolean = false;
    private thread_images: FileVO[] = [];

    private enable_image_upload_menu: boolean = false;
    private enable_link_image_menu: boolean = false;
    private link_image_url: string = null;
    private throttle_load_thread = ThrottleHelper.declare_throttle_without_args(this.load_thread.bind(this), 10);
    private throttle_register_thread = ThrottleHelper.declare_throttle_without_args(this.register_thread.bind(this), 10);

    get role_assistant_avatar_url() {
        return '/vuejsclient/public/img/avatars/oselia.png';
    }

    @Watch('get_active_field_filters', { immediate: true, deep: true })
    @Watch('get_discarded_field_paths', { deep: true })
    @Watch('page_widget')
    private async on_change_filters_or_page_widget() {
        this.throttle_load_thread();
    }

    @Watch('thread', { immediate: true })
    private async onchange_thread() {
        this.throttle_register_thread();
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    private async load_thread() {

        this.is_loading_thread = true;

        if (!this.page_widget) {

            this.thread_messages = [];
            this.assistant = null;
            this.is_loading_thread = false;
            this.has_access_to_thread = false;
            this.thread = null;
            this.too_many_assistants = false;
            this.can_run_assistant = false;
            return;
        }

        await this.set_thread();

        this.is_loading_thread = false;
        this.has_access_to_thread = !!this.thread;
    }

    private async handle_drag_over(event: DragEvent) {
        if (this.has_access_to_thread && !this.is_loading_thread) {
            this.is_dragging = true;
        }
    }

    private async handle_drag_leave(event: DragEvent) {
        if (this.has_access_to_thread && !this.is_loading_thread) {
            this.is_dragging = false;
        }
    }

    private async handle_drop(event: DragEvent) {
        if (this.has_access_to_thread && !this.is_loading_thread) {
            this.is_dragging = false;
        }
    }

    private async open_image_upload() {
        this.enable_image_upload_menu = !this.enable_image_upload_menu;
        this.enable_link_image_menu = false;
    }

    private async open_file_upload() {
        this.enable_image_upload_menu = false;
        this.enable_link_image_menu = false;
        try {
            const fileHandle = await (window as any).showOpenFilePicker({
                multiple: false // Pour permettre la sélection de plusieurs fichiers, mettre à true
            });
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private async upload_image() {
        try {
            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [
                    {
                        description: 'Images',
                        accept: {
                            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']
                        }
                    }
                ],
                excludeAcceptAllOption: true, // Exclure l'option "Tous les fichiers"
                multiple: false // Pour permettre la sélection de plusieurs fichiers, mettre à true
            });
            const file: File = await fileHandle.getFile();
            const formData = new FormData();
            const file_name = 'oselia_file_' + VueAppController.getInstance().data_user.id + '_' + Dates.now() + '.png';
            formData.append('file', file, file_name);

            await AjaxCacheClientController.getInstance().post(
                null,
                '/ModuleFileServer/upload',
                [FileVO.API_TYPE_ID],
                formData,
                null,
                null,
                false,
                30000).then(() => {
                    let new_file = new FileVO();
                    new_file.path = ModuleFile.FILES_ROOT + 'upload/' + file_name;

                    this.thread_images.push(new_file);
                    this.enable_image_upload_menu = false;
                });
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private async handle_hover() {
        alert("hover");
    }

    private async open_link_image() {
        this.enable_link_image_menu = !this.enable_link_image_menu;
    }

    private async upload_link_image() {
        if (!this.link_image_url) {
            return;
        }
        // Do something with the image here

        this.link_image_url = null;
        this.enable_link_image_menu = false;
    }

    private async cancel_link_image() {
        this.link_image_url = null;
        this.enable_link_image_menu = false;
    }

    private async register_thread() {

        // On check qu'on a un thread et un seul
        if (!this.thread) {
            return;
        }

        if (this.current_thread_id == this.thread.id) {
            return;
        }

        await this.unregister_all_vo_event_callbacks();
        this.current_thread_id = this.thread.id;

        await this.set_assistant();
        await this.register_single_vo_updates(GPTAssistantAPIThreadVO.API_TYPE_ID, this.thread.id, reflect<this>().thread);

        // On check qu'on a un assistant et un seul
        if (this.assistant) {
            this.can_run_assistant = true;
        }

        // On récupère les contenus du message
        await this.register_vo_updates_on_list(
            GPTAssistantAPIThreadMessageVO.API_TYPE_ID,
            reflect<this>().thread_messages,
            [filter(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().thread_id).by_num_eq(this.thread.id)]
        );

        this.$nextTick(() => {
            this.scroll_to_bottom();
        });
    }

    private thread_message_updated() {
        //TODO fixme, on devrait redécaler en bas peut-etre que si on était déjà en bas.
        this.$nextTick(() => {
            this.scroll_to_bottom();
        });
    }

    private async set_thread() {

        // On check qu'on a un thread et un seul
        //  Si on a 1 thread, on peut avancer. Sinon on doit indiquer soit qu'il faut restreindre la query à un thread (>1), soit que le thread est introuvable (0)
        const context_query_select: ContextQueryVO = query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));
        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query_select, this.get_discarded_field_paths);
        context_query_select.query_distinct = true;

        const context_query_count: ContextQueryVO = cloneDeep(context_query_select);

        const nb_threads = await context_query_count.select_count();

        if (!nb_threads) {
            if (this.thread) {
                this.thread = null;
            }
            return;
        }

        if (nb_threads > 1) {
            if (this.thread) {
                this.thread = null;
            }
            return;
        }

        // On récupère le thread
        this.thread = await context_query_select.select_vo<GPTAssistantAPIThreadVO>();
    }

    private async set_assistant() {

        // On check qu'on a un assistant et un seul
        //  Si on a 1 assistant, on peut avancer. Sinon on doit indiquer soit qu'il faut restreindre la query à un assistant (>1), soit que le assistant est introuvable (0)
        //  Sauf si on a un current_default_assistant enregistré dans le thread, auquel cas on peut avancer
        const context_query_select: ContextQueryVO = query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));
        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query_select, this.get_discarded_field_paths);

        const context_query_count: ContextQueryVO = cloneDeep(context_query_select);

        const nb_assistants = await context_query_count.select_count();

        if (((!nb_assistants) || (nb_assistants > 1)) && (!!this.thread.current_default_assistant_id)) {
            const default_assistant: GPTAssistantAPIAssistantVO = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_id(this.thread.current_default_assistant_id)
                .select_vo<GPTAssistantAPIAssistantVO>();

            if (!default_assistant) {
                this.too_many_assistants = nb_assistants > 1;
                return;
            }

            this.assistant = default_assistant;
            this.too_many_assistants = false;
            return;
        }

        if (!nb_assistants) {
            return;
        }

        if (nb_assistants > 1) {
            this.too_many_assistants = true;
            return;
        }

        // On récupère le assistant
        const assistant: GPTAssistantAPIAssistantVO = await context_query_select.select_vo<GPTAssistantAPIAssistantVO>();

        if (!assistant) {
            return;
        }

        this.assistant = assistant;
    }

    private async scroll_to_bottom() {
        const thread_container_el = this.$refs.thread_container as HTMLElement;

        if (!thread_container_el) {
            return;
        }

        thread_container_el.scrollTop = thread_container_el.scrollHeight;
    }

    private async send_message() {

        if (!this.new_message_text) {
            return;
        }

        if (!this.thread) {
            return;
        }

        const self = this;
        this.assistant_is_busy = true;
        // self.snotify.async(self.label('OseliaThreadWidgetComponent.send_message.start'), () =>
        //     new Promise(async (resolve, reject) => {

        try {
            const message = self.new_message_text;
            self.new_message_text = null;
            const responses = await ModuleGPT.getInstance().ask_assistant(
                self.assistant.gpt_assistant_id,
                self.thread.gpt_thread_id,
                message,
                [],
                VueAppController.getInstance().data_user.id
            );

            // if (!responses || !responses.length) {
            //     throw new Error('No response');
            // }
            /**
             * Il faut changer de technique pour identifier des erreurs de l'API
             * On devrait pas renvoyer les nouveaux messages maintenant, ça n'a plus de sens, mais bien l'état de le requête - réussie ou échouée
             */

            // self.throttle_load_thread();

            // resolve({
            //     body: self.label('OseliaThreadWidgetComponent.send_message.ok'),
            //     config: {
            //         timeout: 10000,
            //         showProgressBar: true,
            //         closeOnClick: false,
            //         pauseOnHover: true,
            //     },
            // });
        } catch (error) {
            ConsoleHandler.error(error);
            this.snotify.error(self.label('OseliaThreadWidgetComponent.send_message.failed'));
            // reject({
            //     body: self.label('OseliaThreadWidgetComponent.send_message.failed'),
            //     config: {
            //         timeout: 10000,
            //         showProgressBar: true,
            //         closeOnClick: false,
            //         pauseOnHover: true,
            //     },
            // });
        }
        self.assistant_is_busy = false;
        // }));
    }

    private handle_new_message_text_keydown(event: KeyboardEvent) {
        this.$nextTick(() => {
            setTimeout(this.adjustTextareaHeight.bind(this), 10);
        });

        if (event.key === 'Enter') {
            if (event.shiftKey) {
                // Ajoute une nouvelle ligne
                return;
            } else {
                // Empêche le comportement par défaut
                event.preventDefault();
                // Exécute la fonction send
                this.send_message();
            }
        }
    }

    private adjustTextareaHeight() {
        const textarea = this.$refs.new_message_textarea_ref as HTMLTextAreaElement;
        textarea.style.height = 'auto'; // Reset the height
        const scrollHeight = textarea.scrollHeight; // Get the scroll height

        const maxRows = 10;
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const maxHeight = lineHeight * maxRows;

        textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';

        this.$nextTick(() => {
            setTimeout(this.scroll_to_bottom.bind(this), 10);
        });
    }
}