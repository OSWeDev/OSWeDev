
import HourSegment from "../../DataRender/vos/HourSegment";

export default class Durations {

    public static from_segmentation(nb: number, segmentation: number = HourSegment.TYPE_SECOND): number {

        return this.add(0, nb, segmentation);
    }

    /**
     * @param duration timestamp in secs to update
     * @param nb offset
     * @param segmentation type of offset, based on HourSegment.TYPE_*
     * @returns updated date
     */
    public static add(duration: number, nb: number, segmentation: number = HourSegment.TYPE_SECOND): number {

        switch (segmentation) {

            case HourSegment.TYPE_HOUR:
                return 60 * 60 * nb + duration;
            case HourSegment.TYPE_MINUTE:
                return 60 * nb + duration;
            case HourSegment.TYPE_SECOND:
                return 60 * nb + duration;

            default:
                return null;
        }
    }

    /**
     * @param a left
     * @param b right
     * @param segmentation type of segmentation, based on HourSegment.TYPE_* - aplied to a and b before diff
     * @param do_not_floor - defaults to false
     * @returns diff value between a and b
     */
    public static diff(a: number, b: number, segmentation: number = HourSegment.TYPE_SECOND): number {

        let a_ = a;
        let b_ = b;

        switch (segmentation) {

            case HourSegment.TYPE_HOUR:
                return (a_ - a_ % 3600) - (b_ - b_ % 3600);
            case HourSegment.TYPE_MINUTE:
                return (a_ - a_ % 60) - (b_ - b_ % 60);
            case HourSegment.TYPE_SECOND:
                return a_ - b_;
            default:
                return null;
        }
    }

    public static as(duration: number, segmentation: number): number {
        switch (segmentation) {

            case HourSegment.TYPE_HOUR:
                return duration / 3600;
            case HourSegment.TYPE_MINUTE:
                return duration / 60;
            case HourSegment.TYPE_SECOND:
                return duration;
            default:
                return null;
        }
    }

    public static hours(duration: number): number {
        return ((duration - duration % 3600) / 3600) % 3600;
    }

    public static minutes(duration: number): number {
        return ((duration - duration % 60) / 60) % 60;
    }

    public static seconds(duration: number): number {
        return duration % 60;
    }
}