import ForceLayout from './force-layout';

const Layout = (cfg: any) => {
  const layout = cfg.type || 'ForceLayout';
  let layoutMode;
  switch (layout) {
    case 'ForceLayout':
      layoutMode = new ForceLayout(cfg);
      break;
    default:
      layoutMode = new ForceLayout(cfg);
  }
  return layoutMode;
};

export default Layout;
