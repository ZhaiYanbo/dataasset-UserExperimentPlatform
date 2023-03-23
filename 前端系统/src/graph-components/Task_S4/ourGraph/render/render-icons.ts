import { GraphOpts } from '../interface';
import { nodeInfoConfig } from '@/graph-components/common/static-const-value';

/**
 * 绘制节点图标声明 svg 元素
 * @param cfg 图谱属性
 * @param iconTypeList 待补充的箭头属性数据列表
 */
const renderIcons = (cfg: GraphOpts, iconTypeList: (string | undefined)[]) => {
  // 设置节点icon元素
  let iconDefs: any; // 节点icon声明元素
  if (document.querySelector(`svg#graph-painter defs#icon-defs`)) {
    // 存在则直接获取
    iconDefs = cfg.renderSvg.select('defs#icon-defs');
  } else {
    // 否则新建
    iconDefs = cfg.renderSvg.append('defs').attr('id', 'icon-defs');
  }

  // 遍历待绘制的 icon 元素列表
  iconTypeList.forEach((iconType: string) => {
    const iconPattern = iconDefs
      .append('pattern')
      .datum(iconType)
      .attr('id', `node-icon-${iconType}`)
      .attr('width', 1)
      .attr('height', 1);
    iconPattern
      .append('image')
      .attr('href', `./static/graph-icon/${nodeInfoConfig[iconType].icon}.svg`) // 图标 svg
      .attr('preserveAspectRatio', 'none') // 填充整个circle
      .attr('width', cfg.radius)
      .attr('height', cfg.radius)
      .attr('x', cfg.radius / 2)
      .attr('y', cfg.radius / 2);
  });
};

export default renderIcons;
