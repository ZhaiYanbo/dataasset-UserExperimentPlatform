// 画布边距
interface Margin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// 图参数
interface GraphOpts {
  width: number;
  height: number;
  radius: number;
  labelPadding: number;
  backgroundPadding: number;
  center: number[];
  margin: Margin;
  renderSvg: any; // 具体的图谱渲染svg元素

  legendContainer: string;

  [propName: string]: any;
}

// 社区
interface Community {
  // 社区ID
  communityID: number;
  // 社区点的集合
  Nodes: any;
}

// 节点
interface Node {
  // 基本业务属性
  guid: string;
  typeName: string;

  // 图谱属性
  r?: number;
  neighborEdges?: any[]; // 连边记录
  properties?: {
    isAbstract: boolean; // 是否为虚拟超点
    containNodes?: string[]; // 所包含的子节点 guid 列表
    containEdges?: string[]; // 所包含的子连边 guid 列表

    isSimplified: boolean; // 是否在初始时被化简
    isBackbone: boolean; // 是否为网络骨架
    community: number;

    // 超点特有属性，记录了当前所含子节点的位置信息，以用于更新凸包位置
    forceNodes: any;
    forceEdges: any;

    [propName: string]: any;
  };

  [propName: string]: any;
}

// 连边
interface Edge {
  // 基本业务属性
  guid: string;
  relationshipTypeName: string;
  typeName: string;

  // 图谱属性
  source: [string, any]; // 源节点
  sourceID?: string; // 源节点guid
  sourceTypeName: string; // 源节点类型
  target: [string, any]; // 端节点
  targetID?: string; // 端节点guid
  targetTypeName: string; // 端节点类型

  properties?: {
    isAbstract: boolean; // 是否为虚拟连边

    isSimplified: boolean; // 是否在初始时被化简
    isBackbone: boolean; // 是否为网络骨架

    [propName: string]: any;
  };

  [propName: string]: any;
}

export { Margin, GraphOpts, Node, Edge, Community };
