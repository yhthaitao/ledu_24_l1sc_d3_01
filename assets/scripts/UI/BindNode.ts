const { ccclass } = cc._decorator;

@ccclass
export default class BindNode extends cc.Component {
    __preload() {
        this.bindNode(this.node, this);
    }

    //遍历全部节点，绑定节点名字（重名的只会绑定第一个符合条件的节点）
    bindNode(node: cc.Node, target: any) {
        if (!node || !target) {
            return;
        }

        let _nameTag: string = '_'; //名字以 '_' 开头的节点才会被绑定

        let nodeList = [node];
        let i = 0;
        while (node) {
            let nodeName = node.name;
            if (_nameTag === nodeName[0] && !target[nodeName]) {
                target[nodeName] = node;
                // cc.log('bindNode:  ', nodeName);
            }

            const bindComp = node.getComponent(BindNode);
            if (0 === i || !bindComp) {
                nodeList = nodeList.concat(node.children); //节点有脚本继承了BindNode，就不再绑定其子节点
            }

            node = nodeList[++i];
        }
    }
}
