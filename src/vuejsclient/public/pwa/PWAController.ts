/* istanbul ignore file: nothing to test */

export default class PWAController {

    public static getInstance(): PWAController {
        if (!PWAController.instance) {
            PWAController.instance = new PWAController();
        }
        return PWAController.instance;
    }

    private static instance: PWAController = null;

    public custom_initialize_pwa: (jquery: any, app_name: string, sw_file: string) => Promise<void>;

    public async initialize_pwa(jquery: any, app_name: string, sw_file: string) {
        if (this.custom_initialize_pwa) {
            await this.custom_initialize_pwa(jquery, app_name, sw_file);
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register(sw_file, { scope: '/' }).then(async (registration) => {
                console.log('SW registered: ', registration);

                await registration.update();
            }).catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
        }
    }
}