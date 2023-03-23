/* eslint-disable brace-style */
/* eslint-disable no-sequences */
/* eslint-disable no-unused-expressions */
import { quadtree } from 'd3-quadtree';
/**
 * 参照官方书写规范，用于表示常量的函数
 * @param x
 */
const constant = (x: number): any => {
  return function () {
    return x;
  };
};
/**
 * 扇形布局约束力模型
 * @param radiuses 扇形内外半径
 * @param angles 扇区起始角度
 * @returns
 */
const forceCircularSector = (radiuses: number[], angles: number[]) => {
  let strength = constant(0.1);
  let nodes: any, strengths: any, positions: any;
  if (angles === null) angles = [0, 360];

  function force(alpha: number) {
    for (let i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i];
      node.vx += (positions.xz[i] - node.x) * strengths[i] * alpha;
      node.vy += (positions.yz[i] - node.y) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    const n = nodes.length;

    strengths = new Array(n);
    positions = {
      xz: new Array(n),
      yz: new Array(n),
    };

    const result = calculatePosition();
    positions.xz = result.x;
    positions.yz = result.y;

    for (let i = 0; i < n; ++i) {
      strengths[i] = +strength(nodes[i], i, nodes);
    }
  }

  /**
   * 计算扇形坐标
   */
  function calculatePosition() {
    let i, j;
    const n = nodes.length;
    const r1 = +radiuses[0];
    const r2 = +radiuses[1];
    const ang1 = +angles[0];
    const ang2 = +angles[1];

    const angleDelta = Math.abs(ang2 - ang1);
    let l = 0;
    let r = r2 - r1;
    const R = r;
    let A = angleDelta / 360;
    let resultNum = 0;
    let resultL = 0;
    while (r - l > 0.1) {
      const d = (l + r) / 2;
      let step = 0;
      let sumD = 0;
      let num = 0;
      while (d * (1 << step) <= R) step += 1;
      while (step >= 0) {
        if (sumD + d * (1 << step) <= R) {
          sumD += d * (1 << step);
          num += 1 << step;
        } else step -= 1;
      }
      const totalL = (6.2832 * A * (r1 + r1 + sumD + d) * num) / 2;
      const singleL = totalL / (n + num);
      if (d > singleL) {
        r = d;
      } else {
        l = d;
      }
      resultNum = num;
      resultL = singleL;
    }

    const x = [];
    const y = [];
    const leftL = new Map();
    r = r1;

    let xItem, yItem;
    for (i = 1; i <= resultNum; i++) {
      r += l;
      const unitA = (resultL / 6.2832 / r) * 360;
      const c = (6.2832 * r * angleDelta) / 360;
      const num = Math.floor(c / resultL) - 1;
      leftL.set(r, c - num * resultL);
      A = ang1;
      for (j = 0; j < num; j++) {
        A += unitA;
        xItem = r * Math.cos((A * Math.PI) / 180);
        yItem = r * Math.sin((A * Math.PI) / 180);
        x.push(xItem);
        y.push(yItem);
      }
    }
    const arr = Array.from(leftL);
    arr.sort((a, b) => b[1] - a[1]);
    const num = n - x.length;
    for (i = 0; i < num; i++) {
      x.push(arr[i][0] * Math.cos((ang1 * Math.PI) / 180));
      y.push(arr[i][0] * Math.sin((ang1 * Math.PI) / 180));
    }
    // 进行随即偏移
    for (i = 0; i < n; i++) {
      // 使用循环使得偏移在半径范围内
      do {
        xItem = x[i];
        yItem = y[i];
        xItem += getRandomPosition(nodes[i].r, nodes[i].r * 1.5);
        yItem += getRandomPosition(nodes[i].r, nodes[i].r * 1.5);
      } while (
        xItem * xItem + yItem * yItem <= r1 * r1 ||
        xItem * xItem + yItem * yItem > r2 * r2
      );
      x[i] = xItem;
      y[i] = yItem;
    }

    return { x, y };
  }

  /**
   * 随机偏移量
   * @param minDistance 偏移距离最小值
   * @param maxDistance 偏移距离最大值
   * @returns {number}
   */
  function getRandomPosition(minDistance: number, maxDistance: number) {
    if (Math.random() < 0.5) {
      return minDistance + Math.round(Math.random() * maxDistance);
    } else {
      return -(minDistance + Math.round(Math.random() * maxDistance));
    }
  }

  force.initialize = function (_: any) {
    nodes = _;
    initialize();
  };

  force.strength = function (_: any) {
    // @ts-nocheck
    return arguments.length
      ? ((strength = typeof _ === 'function' ? _ : constant(+_)),
        initialize(),
        force)
      : strength;
  };

  force.radiuses = function (_: any) {
    // @ts-nocheck
    return arguments.length ? ((radiuses = _), initialize(), force) : radiuses;
  };

  force.angles = function (_: any) {
    // @ts-nocheck
    return arguments.length ? ((angles = _), initialize(), force) : angles;
  };

  return force;
};

/**
 * 四叉树斥力重用力模型
 * @returns
 */
const manyBodyReuse = () => {
  let nodes: any;
  let node: any;
  let alpha: any;
  let iter = 0;
  let tree: any;
  let updateClosure: any;
  let updateBH: any;
  let strength = constant(-30);
  let strengths: any;
  let distanceMin2 = 1;
  let distanceMax2 = Infinity;
  let theta2 = 0.81;

  function jiggle() {
    return (Math.random() - 0.5) * 1e-6;
  }

  function x(d: any) {
    return d.x;
  }

  function y(d: any) {
    return d.y;
  }

  updateClosure = function () {
    return function (i: number) {
      if (i % 13 === 0) {
        return true;
      } else {
        return false;
      }
    };
  };

  function force(_: any) {
    let i;
    const n = nodes.length;
    if (!tree || updateBH(iter, nodes)) {
      tree = quadtree(nodes, x, y).visitAfter(accumulate);
      nodes.update.push(iter);
    }
    for (alpha = _, i = 0; i < n; ++i) (node = nodes[i]), tree.visit(apply);
    ++iter;
  }

  function initialize() {
    if (!nodes) return;
    iter = 0;
    nodes.update = [];
    updateBH = updateClosure();
    tree = null;
    let i;
    const n = nodes.length;
    let node;
    strengths = new Array(n);
    for (i = 0; i < n; ++i) {
      (node = nodes[i]), (strengths[node.index] = +strength(node, i, nodes));
    }
  }

  function accumulate(quad: any) {
    let strength = 0;
    let q;
    let c;
    let weight = 0;
    let x;
    let y;
    let i;

    // For internal nodes, accumulate forces from child quadrants.
    if (quad.length) {
      for (x = y = i = 0; i < 4; ++i) {
        if ((q = quad[i]) && (c = Math.abs(q.value))) {
          (strength += q.value), (weight += c), (x += c * q.x), (y += c * q.y);
        }
      }
      quad.x = x / weight;
      quad.y = y / weight;
    }

    // For leaf nodes, accumulate forces from coincident quadrants.
    else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do strength += strengths[q.data.index];
      while ((q = q.next));
    }

    quad.value = strength;
  }

  function apply(quad: any, x1: any, _: any, x2: any) {
    if (!quad.value) return true;

    let x = quad.x - node.x;
    let y = quad.y - node.y;
    let w = x2 - x1;
    let l = x * x + y * y;

    // Apply the Barnes-Hut approximation if possible.
    // Limit forces for very close nodes; randomize direction if coincident.
    if ((w * w) / theta2 < l) {
      if (l < distanceMax2) {
        if (x === 0) (x = jiggle()), (l += x * x);
        if (y === 0) (y = jiggle()), (l += y * y);
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        node.vx += (x * quad.value * alpha) / l;
        node.vy += (y * quad.value * alpha) / l;
      }
      return true;
    }

    // Otherwise, process points directly.
    else if (quad.length || l >= distanceMax2) return;

    // Limit forces for very close nodes; randomize direction if coincident.
    if (quad.data !== node || quad.next) {
      if (x === 0) (x = jiggle()), (l += x * x);
      if (y === 0) (y = jiggle()), (l += y * y);
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
    }

    do {
      if (quad.data !== node) {
        // Use the coordinates of the node and not the quad region.
        x = quad.data.x - node.x;
        y = quad.data.y - node.y;
        l = x * x + y * y;

        // Limit forces for very close nodes; randomize direction if coincident.
        if (x === 0) (x = jiggle()), (l += x * x);
        if (y === 0) (y = jiggle()), (l += y * y);
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);

        w = (strengths[quad.data.index] * alpha) / l;

        node.vx += x * w;
        node.vy += y * w;
      }
    } while ((quad = quad.next));
  }

  force.initialize = function (_: any) {
    nodes = _;
    initialize();
  };

  force.strength = function (_: any) {
    return arguments.length
      ? ((strength = typeof _ === 'function' ? _ : constant(+_)),
        initialize(),
        force)
      : strength;
  };

  force.distanceMin = function (_: any) {
    return arguments.length
      ? ((distanceMin2 = _ * _), force)
      : Math.sqrt(distanceMin2);
  };

  force.distanceMax = function (_: any) {
    return arguments.length
      ? ((distanceMax2 = _ * _), force)
      : Math.sqrt(distanceMax2);
  };

  force.theta = function (_: any) {
    return arguments.length ? ((theta2 = _ * _), force) : Math.sqrt(theta2);
  };

  force.update = function (_: any) {
    return arguments.length
      ? ((updateClosure = _), (updateBH = updateClosure()), force)
      : updateClosure;
  };

  return force;
};

export { forceCircularSector, manyBodyReuse };
