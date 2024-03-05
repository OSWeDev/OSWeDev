/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240222RenameFieldIdsToFieldNames implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240222RenameFieldIdsToFieldNames {
        if (!Patch20240222RenameFieldIdsToFieldNames.instance) {
            Patch20240222RenameFieldIdsToFieldNames.instance = new Patch20240222RenameFieldIdsToFieldNames();
        }
        return Patch20240222RenameFieldIdsToFieldNames.instance;
    }

    private static instance: Patch20240222RenameFieldIdsToFieldNames = null;

    get uid(): string {
        return 'Patch20240222RenameFieldIdsToFieldNames';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            /**
             * On rename tous les champs qui nécessitent un renommage en lowercase
             */

            /**
             * Pour la table ref.module_dashboardbuilder_dashboard_pwidget
             * isDraggable
             * isResizable
             * minH
             * minW
             * maxH
             * maxW
             * dragAllowFrom
             * dragIgnoreFrom
             * resizeIgnoreFrom
             * preserveAspectRatio
             */

            // await db.query("ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget RENAME COLUMN isDraggable TO is_draggable;");
            // await db.query("ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget RENAME COLUMN isResizable TO is_resizable;");
            // await db.query("ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget RENAME COLUMN minH TO min_h;");
            // await db.query("ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget RENAME COLUMN minW TO min_w;");
            // await db.query("ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget RENAME COLUMN maxH TO max_h;");
            // await db.query("ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget RENAME COLUMN maxW TO max_w;");
            // await db.query("ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget RENAME COLUMN dragAllowFrom TO drag_allow_from;");
            // await db.query("ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget RENAME COLUMN dragIgnoreFrom TO drag_ignore_from;");
            // await db.query("ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget RENAME COLUMN resizeIgnoreFrom TO resize_ignore_from;");
            // await db.query("ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget RENAME COLUMN preserveAspectRatio TO preserve_aspect_ratio;");
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}