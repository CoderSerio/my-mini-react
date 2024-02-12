const globalData = {
  shouldYield: false, // 控制workLoop暂停或开启
  nextUnitOfWork: null, // 指向WorkLoop要操作的下一个Fiber
  root: null, // fiber 树的根节点
};

/**
 * 这是一个适配器模式的应用，抹平了创建不同类型虚拟DOM的差异
 * this function serves as an application of the Adapter Pattern,
 * which reconciles differences in creating various types of visual DOM elements.
 */
const jsx2VisualDom = (jsx) => {
  const type = typeof jsx;

  const createVisualTextNode = (jsx) => {
    const vDom = {
      type: "__TEXT_ELEMENT",
      props: {
        nodeValue: jsx,
        children: [],
      },
    };
    return vDom;
  };
  const createVisualElement = (jsx) => {
    const { props, type } = jsx;

    const { children } = props;
    const childrenList = Array.isArray(children) ? children : [children];

    const vDom = {
      type,
      props: {
        ...props,
        children: childrenList.map((child) => {
          const childVDom = jsx2VisualDom(child);
          return childVDom;
        }),
      },
    };

    return vDom;
  };

  let dom = null;
  if (["string", "number"].includes(type)) {
    dom = createVisualTextNode(jsx);
  } else if (typeof jsx === "object") {
    dom = createVisualElement(jsx);
  } else {
    throw "【createDom】失败，不支持该类型的DOM! Failed，Unsupported DOM Type!";
  }
  return dom;
};

/**
 * 虚拟DOM转真实DOM
 * transfer visual DOM to DOM
 */
const visualDom2Dom = (visualDom) => {
  const { type } = visualDom;

  const createTextNode = (visualDom) => {
    const dom = document.createTextNode(visualDom.props?.nodeValue ?? "");
    return dom;
  };
  const createElement = (visualDom) => {
    const dom = document.createElement(visualDom.type);
    updateProps(dom, visualDom.props);

    const { children } = visualDom.props;
    const childVDomList = Array.isArray(children) ? children : [children];
    childVDomList.forEach((childVDom) => {
      const childDom = visualDom2Dom(childVDom);
      dom.appendChild(childDom);
    });

    return dom;
  };

  let dom = null;
  if (type === "__TEXT_ELEMENT") {
    dom = createTextNode(visualDom);
  } else {
    dom = createElement(visualDom);
  }
  return dom;
};

/**
 * 1. 所谓渲染，也就是把JSX转为浏览器认识的DOM, 具体的过程是`JSX->Visual DOM->DOM`
 * 2. 架构调整后，render函数的作用变成了初始化fiber节点
 * 1.`render` means that transfer JSX to DOM， and the procession is `JSX->Visual DOM->DOM`.
 * 2. after the adjustment, the role of the render function has transformed into initializing fiber nodes.
 */
const render = (jsx, container) => {
  // console.log("【render】JSX的数据结构", jsx);
  // const visualDom = jsx2VisualDom(jsx);
  // console.log("【render】虚拟DOM", visualDom);
  // const dom = visualDom2Dom(visualDom);
  // console.log("【render】真实DOM", dom);

  // container.appendChild(dom);
  globalData.nextUnitOfWork = {
    dom: container,
    props: {
      children: [jsx],
    },
  };
  globalData.root = globalData.nextUnitOfWork;
};

/** TODO:
 * 更新组件内容，也用到了适配器模式，抹平了函数组件和原生标签的差异
 * update component, use Adapter Pattern to process the differences between function components and native tags.
 */
const updateComponent = (fiber) => {
  const { type } = fiber;
  const isFunctionComponent = typeof type === "function";

  const updateFunctionComponent = () => {};
  const updateHostComponent = () => {};

  if (isFunctionComponent) {
    updateFunctionComponent();
  } else {
    updateHostComponent();
  }
};

/** 更新参数 */
const updateProps = (obj, props) => {
  Object.keys(props)?.forEach((key) => {
    if (key !== "children") {
      obj[key] = props[key];
    }
  });
};

/**
 * 执行工作循环中的单个任务——对原生标签和函数组件会进行区分处理
 * perform the atom task of the work loop, and perform different processing for native tags and function components.
 * */
const performUnitOfWork = (fiber) => {
  const { type } = fiber;
  // const isFunctionComponent = typeof type === "function";
  updateComponent(fiber);
  updateProps(fiber.dom, fiber.props);
  // TODO: 返回下一个兄弟节点或者子节点，以便于继续执行工作循环————当然，这意味着先要建立fiber树结构
};

/**
 * 工作循环，处理异步更新任务，适时渲染界面
 *  this function schedules and executes update tasks, rendering UI when the main thread is idle
 */
const workLoop = (idleDeadLine) => {
  globalData.shouldYield = false;
  while (!globalData.shouldYield && globalData.nextUnitOfWork) {
    console.log("抽空执行~");
    globalData.nextUnitOfWork = performUnitOfWork(globalData.nextUnitOfWork);
    globalData.shouldYield = idleDeadLine.timeRemaining() > 0;
  }
  if (!globalData.nextUnitOfWork && globalData.root) {
    // TODO：一次loop结束后，需要commit保存本次loop的更新结果
    console.log("【workLoop】这里需要commit以保存更新结果");
  }
  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

const React = {
  render,
};

export default React;
