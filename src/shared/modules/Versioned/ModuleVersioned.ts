import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import IVersionedVO from './interfaces/IVersionedVO';

export default class ModuleVersioned extends Module {

    public static MODULE_NAME: string = 'Versioned';

    public static PARAM_NAME_ROBOT_USER_ID: string = "ModuleVersioned.ROBOT_USER_ID";
    public static APINAME_RESTORE_TRASHED_VO: string = "RESTORE_TRASHED_VO";

    public static getInstance(): ModuleVersioned {
        if (!ModuleVersioned.instance) {
            ModuleVersioned.instance = new ModuleVersioned();
        }
        return ModuleVersioned.instance;
    }

    private static instance: ModuleVersioned = null;

    public restoreTrashedVo: (vo: IVersionedVO) => Promise<boolean> = APIControllerWrapper.sah(ModuleVersioned.APINAME_RESTORE_TRASHED_VO);

    private constructor() {

        super("versioned", ModuleVersioned.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostAPIDefinition<IVersionedVO, boolean>(
            null,
            ModuleVersioned.APINAME_RESTORE_TRASHED_VO,
            (param: IVersionedVO) => [param._type]
        ));
    }
}