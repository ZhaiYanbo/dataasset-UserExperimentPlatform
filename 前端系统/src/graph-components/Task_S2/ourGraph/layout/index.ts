import ActualForceLayout from './actual-force-layout';
import VirtualForceLayout from './virtual-force-layout';

const Layout = (cfg: any) => {
  const layout = cfg.type || 'VirtualForceLayout';
  let layoutMode;
  switch (layout) {
    case 'ActualForceLayout':
      layoutMode = new ActualForceLayout(cfg);
      break;
    case 'VirtualForceLayout':
      layoutMode = new VirtualForceLayout(cfg);
      break;
    default:
      layoutMode = new VirtualForceLayout(cfg);
  }
  return layoutMode;
};

export default Layout;
