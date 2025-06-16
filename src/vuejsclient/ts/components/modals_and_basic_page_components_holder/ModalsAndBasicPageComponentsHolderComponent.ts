import Component from 'vue-class-component';
import VueAppController from '../../../VueAppController';
import OnPageTranslation from '../OnPageTranslation/component/OnPageTranslation';
import VarsManagerComponent from '../Var/components/manager/VarsManagerComponent';
import VueComponentBase from '../VueComponentBase';
import SharedFiltersModalComponent from '../dashboard_builder/shared_filters/modal/SharedFiltersModalComponent';
import ChecklistItemModalComponent from '../dashboard_builder/widgets/checklist_widget/checklist_item_modal/ChecklistItemModalComponent';
import FavoritesFiltersModalComponent from '../dashboard_builder/widgets/favorites_filters_widget/modal/FavoritesFiltersModalComponent';
import CRUDCreateModalComponent from '../dashboard_builder/widgets/table_widget/crud_modals/create/CRUDCreateModalComponent';
import CRUDUpdateModalComponent from '../dashboard_builder/widgets/table_widget/crud_modals/update/CRUDUpdateModalComponent';
import DocumentHandlerModalComponent from '../document_handler/modal/DocumentHandlerModalComponent';
import DocumentHandlerNeedInfoComponent from '../document_handler/need_info/DocumentHandlerNeedInfoComponent';
import FeedbackHandlerComponent from '../feedback_handler/FeedbackHandlerComponent';
import OseliaChatHandlerComponent from '../oselia_chat/OseliaChatHandlerComponent';
import PopupComponent from '../popup/PopupComponent';
import SupervisionItemModalComponent from '../supervision/dashboard/item_modal/SupervisionItemModalComponent';
import SurveyComponent from '../survey/SurveyComponent';
import './ModalsAndBasicPageComponentsHolderComponent.scss';
import { ModuleModalsAndBasicPageComponentsHolderAction } from './ModalsAndBasicPageComponentsHolderStore';

@Component({
    template: require('./ModalsAndBasicPageComponentsHolderComponent.pug'),
    components: {
        Varsmanagercomponent: VarsManagerComponent,
        Documenthandlermodalcomponent: DocumentHandlerModalComponent,
        Popupcomponent: PopupComponent,
        Onpagetranslation: OnPageTranslation,
        Documenthandlerneedinfocomponent: DocumentHandlerNeedInfoComponent,
        Feedbackhandlercomponent: FeedbackHandlerComponent,
        Surveycomponent: SurveyComponent,
        Oseliachathandlercomponent: OseliaChatHandlerComponent,
        Sharedfiltersmodalcomponent: SharedFiltersModalComponent,
        Crudupdatemodalcomponent: CRUDUpdateModalComponent,
        Favoritesfiltersmodalcomponent: FavoritesFiltersModalComponent,
        Crudcreatemodalcomponent: CRUDCreateModalComponent,
        Checklistitemmodalcomponent: ChecklistItemModalComponent,
        Supervisionitemmodal: SupervisionItemModalComponent,
    }
})
export default class ModalsAndBasicPageComponentsHolderComponent extends VueComponentBase {

    @ModuleModalsAndBasicPageComponentsHolderAction
    private set_Checklistitemmodalcomponent: (Checklistitemmodalcomponent: ChecklistItemModalComponent) => void;

    @ModuleModalsAndBasicPageComponentsHolderAction
    private set_Sharedfiltersmodalcomponent: (Sharedfiltersmodalcomponent: SharedFiltersModalComponent) => void;

    @ModuleModalsAndBasicPageComponentsHolderAction
    private set_Supervisionitemmodal: (Supervisionitemmodal: SupervisionItemModalComponent) => void;

    @ModuleModalsAndBasicPageComponentsHolderAction
    private set_Favoritesfiltersmodalcomponent: (Favoritesfiltersmodalcomponent: FavoritesFiltersModalComponent) => void;

    @ModuleModalsAndBasicPageComponentsHolderAction
    private set_Crudupdatemodalcomponent: (Crudupdatemodalcomponent: CRUDUpdateModalComponent) => void;

    @ModuleModalsAndBasicPageComponentsHolderAction
    private set_Crudcreatemodalcomponent: (Crudcreatemodalcomponent: CRUDCreateModalComponent) => void;


    get has_access_to_onpage_translation(): boolean {
        return VueAppController.getInstance().has_access_to_onpage_translation;
    }

    private mounted() {
        this.set_Sharedfiltersmodalcomponent(this.$refs['Sharedfiltersmodalcomponent'] as SharedFiltersModalComponent);
        this.set_Checklistitemmodalcomponent(this.$refs['Checklistitemmodalcomponent'] as ChecklistItemModalComponent);
        this.set_Supervisionitemmodal(this.$refs['Supervisionitemmodal'] as SupervisionItemModalComponent);
        this.set_Favoritesfiltersmodalcomponent(this.$refs['Favoritesfiltersmodalcomponent'] as FavoritesFiltersModalComponent);
        this.set_Crudupdatemodalcomponent(this.$refs['Crudupdatemodalcomponent'] as CRUDUpdateModalComponent);
        this.set_Crudcreatemodalcomponent(this.$refs['Crudcreatemodalcomponent'] as CRUDCreateModalComponent);
    }
}
