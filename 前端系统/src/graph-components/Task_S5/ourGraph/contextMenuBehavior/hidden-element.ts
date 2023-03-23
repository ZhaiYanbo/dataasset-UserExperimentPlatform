import * as d3 from 'd3';
import { Node, Edge } from '../interface';

const hiddenElement = (
  d: Node | Edge,
  contextMenuType: string,
  params: any
) => {
  if (contextMenuType === 'nodeContextMenu') {
    d3.select(`#node-${d.guid}`).attr('opacity', (d) =>
      d.isHidden ? 0.25 : 1
    );
    d.edges.forEach((e: Edge) => {
      d3.select(`#edge-${e.guid}`).attr('opacity', (d) =>
        d.isHidden ? 0.25 : 1
      );
    });
  } else {
    d3.select(`#edge-${d.guid}`).attr('opacity', (d) =>
      d.isHidden ? 0.25 : 1
    );
    d3.select(`#node-${d.sourceId}`).attr('opacity', (d) =>
      d.isHidden ? 0.25 : 1
    );
    d3.select(`#node-${d.targetId}`).attr('opacity', (d) =>
      d.isHidden ? 0.25 : 1
    );
  }
};

export { hiddenElement };
