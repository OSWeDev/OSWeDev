import * as $ from 'jquery';
import { Component, Prop, Watch } from 'vue-property-decorator';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import { ModuleCRUDAction } from '../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import VueComponentBase from '../../VueComponentBase';
import Datatable from '../vos/Datatable';
import DatatableField from '../vos/DatatableField';
import ManyToManyReferenceDatatableField from '../vos/ManyToManyReferenceDatatableField';
import ManyToOneReferenceDatatableField from '../vos/ManyToOneReferenceDatatableField';
import OneToManyReferenceDatatableField from '../vos/OneToManyReferenceDatatableField';
import SimpleDatatableField from '../vos/SimpleDatatableField';

@Component({
    template: require('./DatatableComponent.pug'),
    components: {}
})
export default class DatatableComponent extends VueComponentBase {

    private static ACTIONS_COLUMN_ID: string = "__actions_column__";
    private static MULTISELECT_COLUMN_ID: string = "__multiselect_column__";

    private static ACTIONS_COLUMN_TRANSLATABLE_CODE: string = "datatable.actions_column" + DefaultTranslation.DEFAULT_LABEL_EXTENSION;

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @ModuleCRUDAction
    public setSelectedVOs: (selectedVOs: IDistantVOBase[]) => void;

    @Prop()
    private datatable: Datatable<IDistantVOBase>;

    @Prop({
        default: true
    })
    private load_datas: boolean;

    @Prop({
        default: false
    })
    private update_button: boolean;

    @Prop({
        default: false
    })
    private delete_button: boolean;

    @Prop({
        default: false
    })
    private multiselectable: boolean;

    private allselected_chck: boolean = false;
    private selected_datas: { [id: number]: IDistantVOBase };
    private loaded: boolean = false;

    private datatable_data: IDistantVOBase[] = [];


    public async mounted() {

        await this.loadDatatable();

        // Activate tooltip
        $('[data-toggle="tooltip"]').tooltip();

        // Select/Deselect checkboxes
        var checkbox = $('table tbody input[type="checkbox"]');
        $("#selectAll").click(() => {
            if (this['checked']) {
                checkbox.each(() => {
                    this['checked'] = true;
                });
            } else {
                checkbox.each(() => {
                    this['checked'] = false;
                });
            }
        });
        checkbox.click(() => {
            if (!this['checked']) {
                $("#selectAll").prop("checked", false);
            }
        });
    }

    @Watch('datatable')
    private async loadDatatable() {
        this.selected_datas = {};
        this.loaded = false;

        // On doit charger les vos concernés par cette datatable, donc le vo de base, et toutes les références aussi
        if (this.load_datas) {
            await Promise.all(this.loadDatasFromDatatable(this.datatable));
        }

        this.loaded = true;

        this.update_datatable_data();
        this.$store.watch(
            function (state) {
                return state.DAOStore.storedDatasArray;
            },
            this.update_datatable_data,
            {
                deep: true
            }
        );
    }

    private update_datatable_data() {

        if (!this.loaded) {
            return;
        }

        // Stocker la data suivant le type dans le store et renvoyer la valeur du store (comme ça on impact les modifs en live)
        // Comment on gère des types de données, qui ne seraient pas exactement issues de la base (comme le nom de la boutique liée au lieu de l'id ???)
        // Comment on gère le filtrage des colonnes sur ces types de données (car on veut voir un sous ensemble de colonne)

        // On commence par charger la liste des données concernées
        // Un getter du store qui renvoie les datas de base, version distant vo et on va chercher ensuite tous les fields utiles, et les refs
        let baseDatas_byid: { [id: number]: IDistantVOBase } = this.getStoredDatas[this.datatable.moduleTable.vo_type]; //TODO chargement depuis le store
        this.datatable_data = [];

        for (let j in baseDatas_byid) {
            let baseData: IDistantVOBase = baseDatas_byid[j];

            if (!baseData) {
                continue;
            }

            let resData: IDistantVOBase = {
                id: baseData.id,
                _type: baseData._type
            };

            // Les colonnes de contrôle
            if (this.multiselectable) {
                if (this.selected_datas && this.selected_datas[baseData.id]) {
                    resData[DatatableComponent.MULTISELECT_COLUMN_ID] = true;
                } else {
                    resData[DatatableComponent.MULTISELECT_COLUMN_ID] = false;
                }
            }

            // TODO en fait on peut vérifier suivant les droits en édition sur ce vo...
            if (this.update_button || this.delete_button) {
                resData[DatatableComponent.ACTIONS_COLUMN_ID] = true;
            }

            for (let i in this.datatable.fields) {
                let field: DatatableField<any, any> = this.datatable.fields[i];

                try {

                    if (field.type == SimpleDatatableField.FIELD_TYPE) {
                        resData[field.datatable_field_uid] = field.dataToIHM(baseData[(field as SimpleDatatableField<any, any>).moduleTableField.field_id]);
                    } else if (field.type == ManyToOneReferenceDatatableField.FIELD_TYPE) {
                        let manyToOneField: ManyToOneReferenceDatatableField<any> = (field) as ManyToOneReferenceDatatableField<any>;

                        // On va chercher la valeur du champs depuis la valeur de la donnée liée
                        let ref_data: IDistantVOBase = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type][baseData[manyToOneField.srcField.field_id]];
                        resData[field.datatable_field_uid] = manyToOneField.dataToHumanReadable(ref_data);
                    } else if (field.type == OneToManyReferenceDatatableField.FIELD_TYPE) {
                        // let oneToManyField: OneToManyReferenceDatatableField<any> = (field) as OneToManyReferenceDatatableField<any>;

                        // // On va chercher la valeur du champs depuis la valeur de la donnée liée
                        // let ref_data: IDistantVOBase = this.getStoredDatas[oneToManyField.targetModuleTable.vo_type][baseData[oneToManyField.destField.field_id]];
                        // resData[field.datatable_field_uid] = oneToManyField.dataToHumanReadable(ref_data, this.getStoredDatas);
                    } else if (field.type == ManyToManyReferenceDatatableField.FIELD_TYPE) {
                        // let oneToManyField: OneToManyReferenceDatatableField<any> = (field) as OneToManyReferenceDatatableField<any>;

                        // // On va chercher la valeur du champs depuis la valeur de la donnée liée
                        // let ref_data: IDistantVOBase = this.getStoredDatas[oneToManyField.targetModuleTable.vo_type][baseData[oneToManyField.destField.field_id]];
                        // resData[field.datatable_field_uid] = oneToManyField.dataToHumanReadable(ref_data, this.getStoredDatas);
                    }
                } catch (error) {
                    console.error(error);
                    resData[field.datatable_field_uid] = null;
                }
            }
            this.datatable_data.push(resData);
        }
    }

    get datatable_columns_labels(): any {
        let res: any = {};

        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];
            res[field.datatable_field_uid] = this.t(field.translatable_title);
        }

        // On ajoute les colonnes de contrôle
        if (this.multiselectable) {
            res[DatatableComponent.MULTISELECT_COLUMN_ID] = null;
        }

        if (this.update_button || this.delete_button) {
            res[DatatableComponent.ACTIONS_COLUMN_ID] = this.t(DatatableComponent.ACTIONS_COLUMN_TRANSLATABLE_CODE);
        }

        return res;
    }

    get datatable_columns(): string[] {
        let res: string[] = [];

        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];
            res.push(field.datatable_field_uid);
        }

        // On ajoute les colonnes de contrôle
        if (this.multiselectable) {
            res.unshift(DatatableComponent.MULTISELECT_COLUMN_ID);
        }

        if (this.update_button || this.delete_button) {
            res.push(DatatableComponent.ACTIONS_COLUMN_ID);
        }

        return res;
    }

    get filterable_columns(): string[] {
        let res: string[] = [];

        for (let i in this.datatable.fields) {
            let field: DatatableField<any, any> = this.datatable.fields[i];
            res.push(field.datatable_field_uid);
        }

        return res;
    }

    get datatable_options(): any {
        return {
            filterByColumn: true,
            filterable: this.filterable_columns,
            perPage: 50,
            // TODO TRADS
            /*texts: {
                count: 'Total',
                records: 'Lignes'
            },*/
            // pagination: { chunk: 10, dropdown: false },
            headings: this.datatable_columns_labels
        };

    }

    @Watch("selected_datas", { deep: true })
    private onSelectData() {
        this.allselected_chck = true;

        for (let i in this.datatable_data) {
            if (!this.selected_datas[this.datatable_data[i].id]) {
                this.allselected_chck = false;
            }
        }
    }

    private selectAll() {

        if (!this.allselected_chck) {
            for (let i in this.datatable_data) {
                this.selected_datas[this.datatable_data[i].id] = this.datatable_data[i];
            }
        } else {
            for (let i in this.datatable_data) {
                delete this.selected_datas[this.datatable_data[i].id];
            }
        }
    }

    private selectVO(id: number) {
        this.setSelectedVOs([this.getStoredDatas[this.datatable.moduleTable.vo_type][id]]);
    }
}