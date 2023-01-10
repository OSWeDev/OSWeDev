import Component from 'vue-class-component';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import ContextFilterVO, { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
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

    private async mounted() {
        let roles: RoleVO[] = await ModuleAccessPolicy.getInstance().getMyRoles();

        this.popup = await query(PopupVO.API_TYPE_ID)
            .filter_by_date_x_ranges('activated_ts_range', [
                RangeHandler.create_single_elt_TSRange(Dates.now(), TimeSegment.TYPE_DAY)
            ])
            .add_filters([ContextFilterVO.or([
                filter(PopupVO.API_TYPE_ID, 'only_roles').is_null_or_empty(),
                filter(PopupVO.API_TYPE_ID, 'only_roles').by_num_x_ranges(RangeHandler.create_multiple_NumRange_from_ids(roles.map((role: RoleVO) => role.id), NumSegment.TYPE_INT)),
            ])])
            .select_vo<PopupVO>();

        if (!this.popup) {
            return;
        }

        if (!this.$cookies.get(this.popup.cookie_name)) {
            $('#popup_modal').modal('show');
        }

        $("#popup_modal").on("hidden.bs.modal", () => {
            this.close();
        });
    }

    private close() {
        this.$cookies.set(this.popup.cookie_name, true, {
            expires: Dates.add(Dates.now(), 1, TimeSegment.TYPE_YEAR),
        });

        $('#popup_modal').modal('hide');
    }
}
