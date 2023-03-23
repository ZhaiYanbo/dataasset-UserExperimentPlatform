import http from './http';

// 扩展节点获取增量图数据
export const getExpandGraphFromNode = (
  node: any,
  relationshipTypeName: string
) =>
  http.get('api/getNode', {
    guid: node.guid,
    typeName: node.typeName,
    relationshipTypeName,
  });

// 扩展节点获取增量图数据
export const getExpandGraphFromEdge = (edge: any) =>
  http.get('api/getEdge', {
    guid: edge.guid,
    relationshipTypeName: edge.relationshipTypeName,
  });

// 提示后台缓存数据集
export const setBussinessDatasetCache = (bussinessDomain: string) =>
  http.get('api/setBussinessDatasetCache', {
    bussinessDomain,
  });

// 根据用户初始图谱获取要探索的初始推荐节点
export const getRecommendInitExpandNodes = (
  curGraph: any,
  bussinessDomain: string
) =>
  http.post('api/getRecommendInitExpandNodes', {
    curGraph,
    bussinessDomain,
  });

// 根据用户选择的扩展源节点以及当前图谱上的点边数据（以及当前的主题域），返回相关推荐节点（按评分进行排序）
export const getRecommendNeighbors = (
  initNodeGuid: string,
  curGraph: any,
  bussinessDomain: string
) =>
  http.post('api/getRecommendExpandNodes', {
    initNodeGuid,
    curGraph,
    bussinessDomain,
  });

// 根据用户选择的节点列表以及扩展源节点返回相关的图谱数据
export const getGraphBasedSelectedNodes = (
  initNodeGuid: string,
  selectedNodesGuidArray: string[],
  selectedEdgesGuidArray: string[]
) =>
  http.post('api/getGraphBasedSelectedNodes', {
    initNodeGuid,
    selectedNodesGuidArray,
    selectedEdgesGuidArray,
  });

// 注册用户
export const registerUser = (userInfo: any) =>
  http.post('userStudy/register_user', {
    name: userInfo.name,
    sex: userInfo.sex,
    major: userInfo.major,
    telephone: userInfo.telephone,
  });

// 提交回答
export const postAns = (name: string, ansObj: any) =>
  http.post('userStudy/submit_ans', {
    name,
    ansObj,
  });
