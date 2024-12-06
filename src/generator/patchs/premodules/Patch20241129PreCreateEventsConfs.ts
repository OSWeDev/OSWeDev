// /* istanbul ignore file: no unit tests on patchs */

// import { IDatabase } from 'pg-promise';
// import IGeneratorWorker from '../../IGeneratorWorker';

// export default class Patch20241129PreCreateEventsConfs implements IGeneratorWorker {


//     private static instance: Patch20241129PreCreateEventsConfs = null;

//     private constructor() { }

//     get uid(): string {
//         return 'Patch20241129PreCreateEventsConfs';
//     }

//     // istanbul ignore next: nothing to test
//     public static getInstance(): Patch20241129PreCreateEventsConfs {
//         if (!Patch20241129PreCreateEventsConfs.instance) {
//             Patch20241129PreCreateEventsConfs.instance = new Patch20241129PreCreateEventsConfs();
//         }
//         return Patch20241129PreCreateEventsConfs.instance;
//     }

//     public async work(db: IDatabase<any>) {

//         await db.query("CREATE TABLE IF NOT EXISTS ref.module_eventify_eventify_event_conf (" +
//             "    id bigint NOT NULL DEFAULT nextval('ref.module_eventify_eventify_event_conf_id_seq'::regclass), " +
//             "    name text COLLATE pg_catalog.default NOT NULL, " +
//             "    version_edit_author_id bigint, " +
//             "    version_author_id bigint, " +
//             "    version_edit_timestamp bigint, " +
//             "    version_timestamp bigint, " +
//             "    version_num bigint, " +
//             "    trashed boolean, " +
//             "    parent_id bigint, " +
//             "    CONSTRAINT module_eventify_eventify_event_conf_pkey PRIMARY KEY (id), " +
//             "    CONSTRAINT module_eventify_eventify_event_conf_name_key UNIQUE (name), " +
//             "    CONSTRAINT version_author_id_fkey FOREIGN KEY (version_author_id) " +
//             "        REFERENCES ref.user (id) MATCH SIMPLE " +
//             "        ON UPDATE NO ACTION " +
//             "        ON DELETE SET DEFAULT, " +
//             "    CONSTRAINT version_edit_author_id_fkey FOREIGN KEY (version_edit_author_id) " +
//             "        REFERENCES ref.user (id) MATCH SIMPLE " +
//             "        ON UPDATE NO ACTION " +
//             "        ON DELETE SET DEFAULT );"
//         );

//         await db.query("CREATE INDEX IF NOT EXISTS eventify_eventify_event_confname_idx " +
//             "ON ref.module_eventify_eventify_event_conf USING btree " +
//             "(name COLLATE pg_catalog.default ASC NULLS LAST) " +
//             "TABLESPACE pg_default; ");
//         await db.query("CREATE INDEX IF NOT EXISTS eventify_eventify_event_confparent_id_idx " +
//             "ON ref.module_eventify_eventify_event_conf USING btree " +
//             "(parent_id ASC NULLS LAST) " +
//             "TABLESPACE pg_default; ");
//         await db.query("CREATE INDEX IF NOT EXISTS eventify_eventify_event_confversion_author_id_idx " +
//             "ON ref.module_eventify_eventify_event_conf USING btree " +
//             "(version_author_id ASC NULLS LAST) " +
//             "TABLESPACE pg_default; ");
//         await db.query("CREATE INDEX IF NOT EXISTS eventify_eventify_event_confversion_edit_author_id_idx " +
//             "ON ref.module_eventify_eventify_event_conf USING btree " +
//             "(version_edit_author_id ASC NULLS LAST) " +
//             "TABLESPACE pg_default; ");

//         // Insert name = 'ThrottledQueryServerController.push_throttled_select_query_params_by_fields_labels' in ref.
//         await db.query("INSERT INTO ref.module_eventify_eventify_event_conf (name) VALUES ('ThrottledQueryServerController.push_throttled_select_query_params_by_fields_labels')");
//     }
// }