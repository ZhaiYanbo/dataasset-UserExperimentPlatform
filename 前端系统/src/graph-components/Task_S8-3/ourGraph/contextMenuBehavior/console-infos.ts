import { Node, Edge } from '../interface';

const consoleInfos = (d: Node | Edge, contextMenuType: string): void => {
  if (contextMenuType === 'nodeContextMenu') {
    console.log('节点', d);
  } else {
    console.log('连边', d);
  }
};

export default consoleInfos;
