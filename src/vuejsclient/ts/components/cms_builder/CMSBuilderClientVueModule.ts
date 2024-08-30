import CMSBuilderVueModuleBase from './CMSBuilderVueModuleBase';

export default class CMSBuilderClientVueModule extends CMSBuilderVueModuleBase {

    protected static instance: CMSBuilderClientVueModule = null;

    protected constructor() {
        super();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): CMSBuilderClientVueModule {
        if (!CMSBuilderClientVueModule.instance) {
            CMSBuilderClientVueModule.instance = new CMSBuilderClientVueModule();
        }

        return CMSBuilderClientVueModule.instance;
    }

    public async initializeAsync() {

        await super.initializeAsync();
    }
}