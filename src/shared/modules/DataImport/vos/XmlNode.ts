export default class XmlNode {
    public name: string; // element name (empty for text nodes)
    public type: string; // node type (element or text), see NodeType constants
    public value: string; // value of a text node
    public parent: XmlNode; // reference to parent node (null with parentNodes option disabled or root node)
    public attributes: { [name: string]: string }; // map of attributes name => value
    public children: XmlNode[];  // array of children nodes
}