import ModuleFileServer from '../../server/modules/File/ModuleFileServer';
import Dates from '../../shared/modules/FormatDatesNombres/Dates/Dates';

export default class VersionUpdater {

    // istanbul ignore next: nothing to test
    public static getInstance(): VersionUpdater {
        if (!VersionUpdater.instance) {
            VersionUpdater.instance = new VersionUpdater();
        }
        return VersionUpdater.instance;
    }

    protected static instance: VersionUpdater = null;

    private constructor() { }

    /* istanbul ignore next: really difficult test depending on files */
    public async update_version() {

        // if (!ConfigurationService.node_configuration.activate_pwa) {
        //     return;
        // }

        const package_json_file = './package.json';
        let package_json_content = await ModuleFileServer.getInstance().readFile(package_json_file);

        if (!package_json_content) {
            return null;
        }

        const lines = package_json_content.split('\n');
        for (const i in lines) {
            const line = lines[i];

            if (line.indexOf('"version": "') < 0) {
                continue;
            }

            lines[i] = line.replace(/(^.*"version": "[0-9.]+)(-[0-9a-zA-Z]+)?(".*[\r\n]*$)/i, "$1-" + Dates.now() + "$3");
        }

        package_json_content = lines.join('\n');
        await ModuleFileServer.getInstance().writeFile(package_json_file, package_json_content);
    }
}