import ConfigurationService from '../../server/env/ConfigurationService';
import ModuleFileServer from '../../server/modules/File/ModuleFileServer';
import Dates from '../../shared/modules/FormatDatesNombres/Dates/Dates';

export default class VersionUpdater {

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

        if (!ConfigurationService.getInstance().getNodeConfiguration().ACTIVATE_PWA) {
            return;
        }

        let package_json_file = './package.json';
        let package_json_content = await ModuleFileServer.getInstance().readFile(package_json_file);

        if (!package_json_content) {
            return null;
        }

        let lines = package_json_content.split('\n');
        for (let i in lines) {
            let line = lines[i];

            if (line.indexOf('"version": "') < 0) {
                continue;
            }

            lines[i] = line.replace(/(^.*"version": "[0-9.]+)(-[0-9a-zA-Z]+)?(".*$)/i, "$1-" + Dates.now() + "$3");
        }

        package_json_content = lines.join('\n');
        await ModuleFileServer.getInstance().writeFile(package_json_file, package_json_content);
    }
}