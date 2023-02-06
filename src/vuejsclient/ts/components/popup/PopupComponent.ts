import { sortBy } from 'lodash';
import Component from 'vue-class-component';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import ContextFilterVO, { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import NumSegment from '../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import PopupVO from '../../../../shared/modules/Popup/vos/PopupVO';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VueComponentBase from '../VueComponentBase';
import './PopupComponent.scss';

@Component({
    template: require('./PopupComponent.pug'),
})
export default class PopupComponent extends VueComponentBase {

    private popup: PopupVO = null;
    private popups: PopupVO[] = null;

    private async mounted() {
        let roles: RoleVO[] = await ModuleAccessPolicy.getInstance().getMyRoles();

        this.popups = await query(PopupVO.API_TYPE_ID)
            .filter_by_date_x_ranges('activated_ts_range', [
                RangeHandler.create_single_elt_TSRange(Dates.now(), TimeSegment.TYPE_DAY)
            ])
            .add_filters([ContextFilterVO.or([
                filter(PopupVO.API_TYPE_ID, 'only_roles').is_null_or_empty(),
                filter(PopupVO.API_TYPE_ID, 'only_roles').by_num_x_ranges(RangeHandler.create_multiple_NumRange_from_ids(roles.map((role: RoleVO) => role.id), NumSegment.TYPE_INT)),
            ])])
            .set_sort(new SortByVO(PopupVO.API_TYPE_ID, 'activated_ts_range', true))
            .select_vos<PopupVO>();

        if (!this.popups.length) {
            return;
        }

        this.set_popup();

        $("#popup_modal").on("hidden.bs.modal", () => {
            this.close();

            this.set_popup();
        });
    }

    private close() {
        this.$cookies.set(this.popup.cookie_name, true, {
            expires: Dates.add(Dates.now(), 1, TimeSegment.TYPE_YEAR),
        });

        $('#popup_modal').modal('hide');
    }

    private set_popup() {
        this.popup = null;

        for (let i in this.popups) {
            if (!this.$cookies.get(this.popups[i].cookie_name)) {
                this.popup = this.popups[i];
                break;
            }
        }

        if (!this.popup) {
            return;
        }

        if (!this.$cookies.get(this.popup.cookie_name)) {
            $('#popup_modal').modal('show');
        }
    }
}
