import { Node, Edge, VirtualNode } from '../interface';

const consoleInfos = (
  d: Node | VirtualNode | Edge,
  contextMenuType: string,
  params: any = {}
): void => {
  if (contextMenuType === 'nodeContextMenu') {
    console.log('节点', d);
  } else {
    console.log('连边', d);
  }
};

export default consoleInfos;
