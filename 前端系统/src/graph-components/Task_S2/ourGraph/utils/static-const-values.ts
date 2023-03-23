// 普通节点信息配置
const nodeInfoConfig = {
  'dlf.Job': {
    value: 'dlf.Job', // 节点类型名称
    color: '#0DC2F7', // 节点颜色编码
    textLabel: 'dlf.Job', // 节点文本标签
    icon: 'g-job', // 节点 icon 映射
    backgroundColor: '#0DC2F7', // 节点背景图光圈颜色
  },
  'business.LogicEntity': {
    value: 'business.LogicEntity',
    color: '#B21EFF',
    textLabel: 'business.LogicEntity',
    icon: 'g-logic-entity',
    backgroundColor: '#B21EFF',
  },
  'dli.Table': {
    value: 'dli.Table',
    color: '#2C41FF',
    textLabel: 'dli.Table',
    icon: 'g-table',
    backgroundColor: '#2C41FF',
  },
  'business.LogicEntityField': {
    value: 'business.LogicEntityField',
    color: '#B21EFF',
    textLabel: 'business.LogicEntityField',
    icon: 'g-logic-entity-column',
    backgroundColor: '#B21EFF',
  },
  'dli.View': {
    value: 'dli.View',
    color: '#2C41FF',
    textLabel: 'dli.View',
    icon: 'g-default', // 缺失 View 的icon，使用 default 代替
    backgroundColor: '#2C41FF', // 缺失 View 的icon，使用 default 代替
  },
  'process.columnLineage': {
    value: 'process.columnLineage',
    color: '#0DC2F7',
    textLabel: 'process.columnLineage',
    icon: 'g-column-lineage',
    backgroundColor: '#0DC2F7',
  },
  'dlf.dli_sql': {
    value: 'dlf.dli_sql',
    color: '#0DC2F7',
    textLabel: 'dlf.dli_sql',
    icon: 'g-job',
    backgroundColor: '#0DC2F7',
  },
  'dii.InsightNode': {
    value: 'dii.InsightNode',
    color: '#0DC2F7',
    textLabel: 'dii.InsightNode',
    icon: 'g-insight',
    backgroundColor: '#0DC2F7',
  },
  'business.Category': {
    value: 'business.Category',
    color: '#0DC2F7',
    textLabel: 'business.Category',
    icon: 'g-catalog',
    backgroundColor: '#0DC2F7',
  },
  'dlf.sub_node': {
    value: 'dlf.sub_node',
    color: '#0DC2F7',
    textLabel: 'dlf.sub_node',
    icon: 'g-job',
    backgroundColor: '#0DC2F7',
  },
  'dli.Database': {
    value: 'dli.Database',
    color: '#FF9800',
    textLabel: 'dli.Database',
    icon: 'g-database',
    backgroundColor: '#FF9800',
  },
  'business.Insight': {
    value: 'business.Insight',
    color: '#0DC2F7',
    textLabel: 'business.Insight',
    icon: 'g-insight',
    backgroundColor: '#0DC2F7',
  },
  'dli.Column': {
    value: 'dli.Column',
    color: '#2C41FF',
    textLabel: 'dli.Column',
    icon: 'g-column',
    backgroundColor: '#2C41FF',
  },
};

// 虚拟节点（超点）信息配置
const abstractNodeInfoConfig = {
  // 下面的是对于边缘簇结构的虚拟超点定义（即不含簇中心的）
  'abstract-cluster-dlf.Job': {
    value: 'abstract-cluster-dlf.Job',
    color: '#0DC2F7',
    textLabel: 'abstract-cluster-dlf.Job',
    icon: 'cluster-job',
    backgroundColor: '#0DC2F7',
  },
  'abstract-cluster-business.LogicEntity': {
    value: 'abstract-cluster-business.LogicEntity',
    color: '#B21EFF',
    textLabel: 'abstract-cluster-business.LogicEntity',
    icon: 'cluster-logic-entity',
    backgroundColor: '#B21EFF',
  },
  'abstract-cluster-dli.Table': {
    value: 'abstract-cluster-dli.Table',
    color: '#2C41FF',
    textLabel: 'abstract-cluster-dli.Table',
    icon: 'cluster-table',
    backgroundColor: '#2C41FF',
  },
  'abstract-cluster-business.LogicEntityField': {
    value: 'abstract-cluster-business.LogicEntityField',
    color: '#B21EFF',
    textLabel: 'abstract-cluster-business.LogicEntityField',
    icon: 'cluster-logic-entity-column',
    backgroundColor: '#B21EFF',
  },
  'abstract-cluster-dli.View': {
    value: 'abstract-cluster-dli.View',
    color: '#2C41FF',
    textLabel: 'abstract-cluster-dli.View',
    icon: 'cluster-default',
    backgroundColor: '#2C41FF',
  },
  'abstract-cluster-process.columnLineage': {
    value: 'abstract-cluster-process.columnLineage',
    color: '#0DC2F7',
    textLabel: 'abstract-cluster-process.columnLineage',
    icon: 'cluster-column-lineage',
    backgroundColor: '#0DC2F7',
  },
  'abstract-cluster-dlf.dli_sql': {
    value: 'abstract-cluster-dlf.dli_sql',
    color: '#0DC2F7',
    textLabel: 'abstract-cluster-dlf.dli_sql',
    icon: 'cluster-job',
    backgroundColor: '#0DC2F7',
  },
  'abstract-cluster-dii.InsightNode': {
    value: 'abstract-cluster-dii.InsightNode',
    color: '#0DC2F7',
    textLabel: 'abstract-cluster-dii.InsightNode',
    icon: 'cluster-insight',
    backgroundColor: '#0DC2F7',
  },
  'abstract-cluster-business.Category': {
    value: 'abstract-cluster-business.Category',
    color: '#0DC2F7',
    textLabel: 'abstract-cluster-business.Category',
    icon: 'cluster-catalog',
    backgroundColor: '#0DC2F7',
  },
  'abstract-cluster-dlf.sub_node': {
    value: 'abstract-cluster-dlf.sub_node',
    color: '#0DC2F7',
    textLabel: 'abstract-cluster-dlf.sub_node',
    icon: 'cluster-job',
    backgroundColor: '#0DC2F7',
  },
  'abstract-cluster-dli.Database': {
    value: 'abstract-cluster-dli.Database',
    color: '#FF9800',
    textLabel: 'abstract-cluster-dli.Database',
    icon: 'cluster-database',
    backgroundColor: '#FF9800',
  },
  'abstract-cluster-business.Insight': {
    value: 'abstract-cluster-business.Insight',
    color: '#0DC2F7',
    textLabel: 'abstract-cluster-business.Insight',
    icon: 'cluster-insight',
    backgroundColor: '#0DC2F7',
  },
  'abstract-cluster-dli.Column': {
    value: 'abstract-cluster-dli.Column',
    color: '#2C41FF',
    textLabel: 'abstract-cluster-dli.Column',
    icon: 'cluster-column',
    backgroundColor: '#2C41FF',
  },

  // 下面的是对于簇结构的虚拟超点定义（即含簇中心的）
  'abstract-dlf.Job-include-center': {
    value: 'abstract-dlf.Job-include-center',
    color: '#0DC2F7',
    textLabel: 'abstract-dlf.Job',
    icon: 'cluster-job-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-business.LogicEntity-include-center': {
    value: 'abstract-business.LogicEntity-include-center',
    color: '#B21EFF',
    textLabel: 'abstract-business.LogicEntity',
    icon: 'cluster-logic-entity-include-center',
    backgroundColor: '#B21EFF',
  },
  'abstract-dli.Table-include-center': {
    value: 'abstract-dli.Table-include-center',
    color: '#2C41FF',
    textLabel: 'abstract-dli.Table',
    icon: 'cluster-table-include-center',
    backgroundColor: '#2C41FF',
  },
  'abstract-business.LogicEntityField-include-center': {
    value: 'abstract-business.LogicEntityField-include-center',
    color: '#B21EFF',
    textLabel: 'abstract-business.LogicEntityField',
    icon: 'cluster-logic-entity-column-include-center',
    backgroundColor: '#B21EFF',
  },
  'abstract-dli.View-include-center': {
    value: 'abstract-dli.View-include-center',
    color: '#2C41FF',
    textLabel: 'abstract-dli.View',
    icon: 'cluster-default-include-center',
    backgroundColor: '#2C41FF',
  },
  'abstract-process.columnLineage-include-center': {
    value: 'abstract-process.columnLineage-include-center',
    color: '#0DC2F7',
    textLabel: 'abstract-process.columnLineage',
    icon: 'cluster-column-lineage-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-dlf.dli_sql-include-center': {
    value: 'abstract-dlf.dli_sql-include-center',
    color: '#0DC2F7',
    textLabel: 'abstract-dlf.dli_sql',
    icon: 'cluster-job-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-dii.InsightNode-include-center': {
    value: 'abstract-dii.InsightNode-include-center',
    color: '#0DC2F7',
    textLabel: 'abstract-dii.InsightNode',
    icon: 'cluster-insight-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-business.Category-include-center': {
    value: 'abstract-business.Category-include-center',
    color: '#0DC2F7',
    textLabel: 'abstract-business.Category',
    icon: 'cluster-catalog-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-dlf.sub_node-include-center': {
    value: 'abstract-dlf.sub_node-include-center',
    color: '#0DC2F7',
    textLabel: 'abstract-dlf.sub_node',
    icon: 'cluster-job-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-dli.Database-include-center': {
    value: 'abstract-dli.Database-include-center',
    color: '#FF9800',
    textLabel: 'abstract-dli.Database',
    icon: 'cluster-database-include-center',
    backgroundColor: '#FF9800',
  },
  'abstract-business.Insight-include-center': {
    value: 'abstract-business.Insight-include-center',
    color: '#0DC2F7',
    textLabel: 'abstract-business.Insight',
    icon: 'cluster-insight-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-dli.Column-include-center': {
    value: 'abstract-dli.Column-include-center',
    color: '#2C41FF',
    textLabel: 'abstract-dli.Column',
    icon: 'cluster-column-include-center',
    backgroundColor: '#2C41FF',
  },

  // 下面的是对单级多重桥结构的虚拟超点定义
  'abstract-single-bridge-dlf.Job': {
    value: 'abstract-single-bridge-dlf.Job',
    color: '#0DC2F7',
    textLabel: 'abstract-single-bridge-dlf.Job',
    icon: 'cluster-job-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-single-bridge-business.LogicEntity': {
    value: 'abstract-single-bridge-business.LogicEntity',
    color: '#B21EFF',
    textLabel: 'abstract-single-bridge-business.LogicEntity',
    icon: 'cluster-logic-entity-include-center',
    backgroundColor: '#B21EFF',
  },
  'abstract-single-bridge-dli.Table': {
    value: 'abstract-single-bridge-dli.Table',
    color: '#2C41FF',
    textLabel: 'abstract-single-bridge-dli.Table',
    icon: 'cluster-table-include-center',
    backgroundColor: '#2C41FF',
  },
  'abstract-single-bridge-business.LogicEntityField': {
    value: 'abstract-single-bridge-business.LogicEntityField',
    color: '#B21EFF',
    textLabel: 'abstract-single-bridge-business.LogicEntityField',
    icon: 'cluster-logic-entity-column-include-center',
    backgroundColor: '#B21EFF',
  },
  'abstract-single-bridge-dli.View': {
    value: 'abstract-single-bridge-dli.View',
    color: '#2C41FF',
    textLabel: 'abstract-single-bridge-dli.View',
    icon: 'cluster-default-include-center',
    backgroundColor: '#2C41FF',
  },
  'abstract-single-bridge-process.columnLineage': {
    value: 'abstract-single-bridge-process.columnLineage',
    color: '#0DC2F7',
    textLabel: 'abstract-single-bridge-process.columnLineage',
    icon: 'cluster-column-lineage-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-single-bridge-dlf.dli_sql': {
    value: 'abstract-single-bridge-dlf.dli_sql',
    color: '#0DC2F7',
    textLabel: 'abstract-single-bridge-dlf.dli_sql',
    icon: 'cluster-job-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-single-bridge-dii.InsightNode': {
    value: 'abstract-single-bridge-dii.InsightNode',
    color: '#0DC2F7',
    textLabel: 'abstract-single-bridge-dii.InsightNode',
    icon: 'cluster-insight-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-single-bridge-business.Category': {
    value: 'abstract-single-bridge-business.Category',
    color: '#0DC2F7',
    textLabel: 'abstract-single-bridge-business.Category',
    icon: 'cluster-catalog-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-single-bridge-dlf.sub_node': {
    value: 'abstract-single-bridge-dlf.sub_node',
    color: '#0DC2F7',
    textLabel: 'abstract-single-bridge-dlf.sub_node',
    icon: 'cluster-job-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-single-bridge-dli.Database': {
    value: 'abstract-single-bridge-dli.Database',
    color: '#FF9800',
    textLabel: 'abstract-single-bridge-dli.Database',
    icon: 'cluster-database-include-center',
    backgroundColor: '#FF9800',
  },
  'abstract-single-bridge-business.Insight': {
    value: 'abstract-single-bridge-business.Insight',
    color: '#0DC2F7',
    textLabel: 'abstract-single-bridge-business.Insight',
    icon: 'cluster-insight-include-center',
    backgroundColor: '#0DC2F7',
  },
  'abstract-single-bridge-dli.Column': {
    value: 'abstract-single-bridge-dli.Column',
    color: '#2C41FF',
    textLabel: 'abstract-single-bridge-dli.Column',
    icon: 'cluster-column-include-center',
    backgroundColor: '#2C41FF',
  },

  // 下面的是对二级多重桥结构的虚拟超点定义
  // "abstract-double-bridge-business.LogicEntityField_dli.Column": {
  //   value: "abstract-double-bridge-business.LogicEntityField_dli.Column",
  //   color: "#F66F6A",
  //   textLabel: "",
  //   icon: "tb-logic-entity-field_column",
  //   backgroundColor: "#F66F6A",
  // },

  'abstract-double-bridge-business.LogicEntityField_dli.Column': {
    value: 'abstract-double-bridge-business.LogicEntityField_dli.Column',
    color: '#B2E1FF',
    textLabel: '',
    icon: 'tb-logic-entity-field_column_userstudy',
    backgroundColor: '#B2E1FF',
  },
};

// 连边信息配置
const edgeInfoConfig = {
  PARENT_CHILD: {
    value: 'PARENT_CHILD',
    color: '#888888',
  },
  LOGICAL_PHYSICAL: {
    value: 'LOGICAL_PHYSICAL',
    color: '#888888',
  },
  DATA_FLOW: {
    value: 'DATA_FLOW',
    color: '#888888',
  },
  PK_FK: {
    value: 'PK_FK',
    color: '#888888',
  },
};

// 虚拟层级结构背景颜色
const virtualColor = {
  level1: '#EEEEEE',
  level2: '#ffffff00',
  level3: '#ffffff00',
  level4: '#ffffff00',
};

// 扇形聚类相关配置项
const sectorCfg = {
  // 层级凸包背景颜色
  sectorHullFill: {
    L1: '#99CCFFa0',
    L2: '#FFCC33a0',
    L3: '#99CC99a0',
    others: '#cccccca0',
  },
  sectorLevelLabel: 'categoryLevel', // 扇形聚类的层级标识名
  sectorRootTypeName: 'business.Category', // 扇形聚类的类型名
  sectorParentLabel: 'parentCategory', // 扇形聚类层级关系标识名（父级）
  sectorChildrenLabel: 'childrenCategory', // 扇形聚类层级关系标识名（子级）
};

// 其他的全局配置项
const globalCfg = {
  abstractHullFill: '#cccccca0', // 超点展开后的凸包背景颜色
  abstractLogicEntityfieldTypeName:
    'abstract-double-bridge-business.LogicEntityField_dli.Column', // 业务属性与字段一对一关联的超点类型名称
};

export {
  nodeInfoConfig,
  abstractNodeInfoConfig,
  edgeInfoConfig,
  virtualColor,
  sectorCfg,
  globalCfg,
};
