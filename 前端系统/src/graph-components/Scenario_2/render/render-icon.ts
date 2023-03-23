import { GraphOpts } from '../interface';
import {
  abstractNodeInfoConfig,
  nodeInfoConfig,
} from '@/graph-components/common/static-const-value';

/**
 * 绘制节点图标声明 svg 元素
 * @param cfg 图谱属性
 * @param iconTypeList 待补充的箭头属性数据列表
 */
const renderIcon = (cfg: GraphOpts, iconTypeList: string[]) => {
  // 设置节点icon元素
  let iconDefs: any; // 节点icon声明元素
  if (document.querySelector('svg#graph-painter defs#icon-defs')) {
    // 存在则直接获取
    iconDefs = cfg.renderSvg.select('defs#icon-defs');
  } else {
    // 否则新建
    iconDefs = cfg.renderSvg.append('defs').attr('id', 'icon-defs');
  }

  // console.log(new Set(iconTypeList.map((d) => d.typeName)));
  // 遍历待绘制的 icon 元素列表
  iconTypeList.forEach((iconItem: any) => {
    const hrefPath =
      iconItem.typeName.indexOf('abstract') === -1
        ? nodeInfoConfig[iconItem.typeName].icon
        : abstractNodeInfoConfig[iconItem.typeName].icon;
    const params =
      iconItem.typeName.indexOf('abstract') === -1
        ? {
            size: cfg.radius,
            position: cfg.radius / 2,
          }
        : { size: iconItem.r * 2, position: 0 };
    const iconPattern = iconDefs
      .append('pattern')
      .datum(iconItem.iconId)
      .attr('id', `node-icon-${iconItem.iconId}`)
      .attr('width', 1)
      .attr('height', 1);
    iconPattern
      .append('image')
      .attr('href', `./static/graph-icon/${hrefPath}.svg`) // 图标 svg
      .attr('preserveAspectRatio', 'none') // 填充整个circle
      .attr('width', params.size)
      .attr('height', params.size)
      .attr('x', params.position)
      .attr('y', params.position);
  });
};

export default renderIcon;
