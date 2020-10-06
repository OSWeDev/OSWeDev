// import VarDAG from '../VarDAG';
// import VarDAGNode from '../VarDAGNode';

// /**
//  * Visiteur qui doit charger les deps de voisinage et down pour les ajouter / relier dans l'arbre.
//  * Les deps ne sont pas sensées changer, on marque le noeud comme chargé
//  */
// export default class VarDAGDefineNodePropagateRequest {

//     public varDAGVisitorDefineNodePropagateRequest(node: VarDAGNode, dag: VarDAG): boolean {

//         if (node.ongoing_update || (!node.marked_for_update)) {

//             node.marked_for_update = false;
//             return false;
//         }

//         // On impact => vers tous les incomings
//         for (let i in node.incoming) {
//             let incoming: VarDAGNode = node.incoming[i] as VarDAGNode;

//             if (incoming.ongoing_update) {
//                 continue;
//             }

//             if (incoming.marked_for_update) {
//                 continue;
//             }

//             incoming.marked_for_update = true;
//             if (incoming.marked_for_next_update) {
//                 incoming.marked_for_next_update = false;
//             }
//         }

//         // On demande les deps, si elles sont pas déjà calculées
//         for (let i in node.outgoing) {
//             let outgoing: VarDAGNode = node.outgoing[i] as VarDAGNode;

//             if (outgoing.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE)) {
//                 continue;
//             }

//             if (outgoing.ongoing_update) {
//                 continue;
//             }

//             if (outgoing.marked_for_update) {
//                 continue;
//             }

//             outgoing.marked_for_update = true;
//             if (outgoing.marked_for_next_update) {
//                 outgoing.marked_for_next_update = false;
//             }
//         }

//         node.marked_for_update = false;
//         node.ongoing_update = true;
//         return false;
//     }
// }