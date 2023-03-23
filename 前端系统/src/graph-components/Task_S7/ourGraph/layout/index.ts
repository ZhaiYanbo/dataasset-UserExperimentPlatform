import NewCircularLayout from './circular-layout-new';
import RandomLayout from './random-layout';
import Force from './force-layout';
import GridLayout from './grid-layout';
import Concentric from './concentric-layout';

const Layout = (cfg: any) => {
  const layout = cfg.type || 'Force';
  let layoutMode;
  switch (layout) {
    case 'Force':
      layoutMode = new Force(cfg);
      break;
    case 'Circular':
      layoutMode = new NewCircularLayout(cfg);
      break;
    case 'Random':
      layoutMode = new RandomLayout(cfg);
      break;
    case 'Grid':
      layoutMode = new GridLayout(cfg);
      break;
    case 'Concentric':
      layoutMode = new Concentric(cfg);
      break;
    default:
      layoutMode = new RandomLayout(cfg);
  }
  return layoutMode;
};

export default Layout;
