export default interface IDashboardGridItem {
    isDraggable: boolean;
    isResizable: boolean;
    static: boolean;
    minH: number;
    minW: number;
    maxH: number;
    maxW: number;
    x: number;
    y: number;
    w: number;
    h: number;
    i: number;
    dragAllowFrom: string;
    resizeIgnoreFrom: string;
    preserveAspectRatio: boolean;
}