// 图谱对象
export interface GraphInstance {
  subSimulation: any; // 当前连通子图力模型
  subNodes: any; // 当前连通子图节点数据
  subEdges: any; // 当前连通子图连边数据

  subContainer: any; // 当前连通子图绘制承载容器
  subLinksG: any; // 连边SVG元素group
  subNodesG: any; // 节点SVG元素group
}

// 画布边距
export interface Margin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// 图参数
export interface GraphOpts {
  container?: string | HTMLElement;
  width?: number;
  height?: number;
  data?: any;
  layout?: string;
  keyId: string;
  radius: number;
  labelPadding: number;
  backgroundPadding: number;
  renderSvg: any;

  [propName: string]: any;
}

// 节点
export interface Node {
  guid: string;
  label?: string;
  typeName?: string; // 节点类型
  textLabel?: string; // 节点icon简称label
  bussinessDomain?: string; // 所属的主题域
  isFixed?: boolean; // 子图布局后是否固定

  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  lastCoordinateX?: number; // 上一次位置的 x
  lastCoordinateY?: number; // 上一次位置的 y

  isKey?: boolean;
  properties?: Properties;
  color?: string;
  degree?: number;

  selected?: boolean;
  neighbors?: Node[]; // 相邻节点
  edges?: Edge[]; // 相邻连边
  isHidden?: boolean;

  // **********以下是关系扩展用的数据结构
  expandRelations?: any;
  // 当前扩展状态（即图谱上是否展示了对应关系下的所有点边数据）
  currentExpandStatus?: {
    [propName: string]: boolean;
  };
  // 是否曾经扩展过（即是否发送过扩展请求）
  isExpandChildren?: {
    [propName: string]: boolean;
  };
  // 关系扩展后节点哈希记录，id - Node
  isExpandChildNodeMap?: {
    [propName: string]: object;
  };
  // 关系扩展后连边哈希记录，id - Edge
  isExpandChildLinkMap?: {
    [propName: string]: object;
  };
  // 增量后子节点数组，Node类型
  expandChildrenNode?: {
    [propName: string]: object[];
  };
  // 增量后的连边数组，Edge类型
  expandChildrenLink?: {
    [propName: string]: object[];
  };

  isDragged?: boolean; // 是否拖拽

  // **********以下是路径记忆用的数据结构
  isRemember?: boolean;

  // **********以下是钉住/解锁用的数据结构
  isPinStatus?: boolean;
  isPinRemember?: boolean;

  // **********以下是用于记录 拓展次数的数据结构 (主要影响的是连边电磁力 -> 连边长度)
  expandTimeOfNode: number;
  expandRoot: string;
  isExtend: boolean;
}

// 连边
export interface Edge {
  guid: string;
  source: string;
  target: string;
  sourceId?: string;
  targetId?: string;
  typeName?: string;
  label?: string;
  relationshipTypeName?: string; // 连边类型
  bussinessDomain?: string; // 所属的主题域

  sourceNode?: Node;
  targetNode?: Node;
  color: string;
  selected?: boolean;
  isHidden?: boolean;
  properties?: Properties;

  // **********以下是路径记忆用的数据结构
  isRemember?: void;

  // **********以下是关系扩展用的数据结构
  expandRelations?: string[];
  isRelationshipExpand?: false;
  relationshipTypeExpandData?: {
    nodes: [];
    edges: [];
  };
  // 拓展次数 (影响边长度)
  expandRoot: string;
  expandTimeOfEdge: number;
  //是否拉长节点
  isExtend: boolean;
}

// 其他属性
export interface Properties {
  [propName: string]: any;
}

// 布局模式
export type LayoutMode =
  | 'Force'
  | 'Grid'
  | 'Circular'
  | 'Concentric'
  | 'Random';
