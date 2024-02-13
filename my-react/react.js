const globalData = {
  shouldYield: false, // 控制workLoop暂停或开启
  nextUnitOfWork: null, // 指向WorkLoop要操作的下一个Fiber
  root: null, // fiber 树的根节点
};

// /**
//  * 这是一个适配器模式的应用，抹平了创建不同类型虚拟DOM的差异
//  * this function serves as an application of the Adapter Pattern,
//  * which reconciles differences in creating various types of visual DOM elements.
//  */
// const jsx2VisualDom = (jsx) => {
//   const type = typeof jsx;

//   const createVisualTextNode = (jsx) => {
//     const vDom = {
//       type: "__TEXT_ELEMENT",
//       props: {
//         nodeValue: jsx,
//         children: [],
//       },
//     };
//     return vDom;
//   };
//   const createVisualElement = (jsx) => {
//     const { props, type } = jsx;

//     const { children } = props;
//     const childrenList = Array.isArray(children) ? children : [children];

//     const vDom = {
//       type,
//       props: {
//         ...props,
//         children: childrenList.map((child) => {
//           const childVDom = jsx2VisualDom(child);
//           return childVDom;
//         }),
//       },
//     };

//     return vDom;
//   };

//   let dom = null;
//   if (["string", "number"].includes(type)) {
//     dom = createVisualTextNode(jsx);
//   } else if (typeof jsx === "object") {
//     dom = createVisualElement(jsx);
//   } else {
//     throw "【createDom】失败，不支持该类型的DOM! Failed，Unsupported DOM Type!";
//   }
//   return dom;
// };

// /**
//  * 虚拟DOM转真实DOM
//  * transfer visual DOM to DOM
//  */
// const visualDom2Dom = (visualDom) => {
//   const { type } = visualDom;

//   const createTextNode = (visualDom) => {
//     const dom = document.createTextNode(visualDom.props?.nodeValue ?? "");
//     return dom;
//   };
//   const createElement = (visualDom) => {
//     const dom = document.createElement(visualDom.type);
//     updateProps(dom, visualDom.props);

//     const { children } = visualDom.props;
//     const childVDomList = Array.isArray(children) ? children : [children];
//     childVDomList.forEach((childVDom) => {
//       const childDom = visualDom2Dom(childVDom);
//       dom.appendChild(childDom);
//     });

//     return dom;
//   };

//   let dom = null;
//   if (type === "__TEXT_ELEMENT") {
//     dom = createTextNode(visualDom);
//   } else {
//     dom = createElement(visualDom);
//   }
//   return dom;
// };

/**
 * 1. 所谓渲染，也就是把JSX转为浏览器认识的DOM, 具体的过程是`JSX->Visual DOM->DOM`
 * 2. 架构调整后，render函数的作用变成了初始化fiber节点
 * 1.`render` means that transfer JSX to DOM， and the procession is `JSX->Visual DOM->DOM`.
 * 2. after the adjustment, the role of the render function has transformed into initializing fiber nodes.
 */
const render = (element, container) => {
  // console.log("【render】JSX的数据结构", jsx);
  // const visualDom = jsx2VisualDom(jsx);
  // console.log("【render】虚拟DOM", visualDom);
  // const dom = visualDom2Dom(visualDom);
  // console.log("【render】真实DOM", dom);

  // container.appendChild(dom);
  globalData.nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
  globalData.root = globalData.nextUnitOfWork;
  console.log("【render】globalData", globalData);
};

/**
 * 将一个fiber节点加入到现有的fiber树上
 * put a new fiber node into the existing fiber tree.
 */
const updateFiberTree = (parentFiber, children) => {
  console.log(
    "【updateFiberTree】parentFiber && children",
    parentFiber,
    children
  );
  let previousFiberNode = null; // 上一次操作的fiber节点

  children?.forEach?.((child, index) => {
    const newFiberNode = {
      dom: child.dom,
      parent: parentFiber,
      child: null,
      sibling: null,
      type: child.type,
      props: child.props,
    };
    if (index === 0) {
      // 第一个子节点，直接塞到child字段
      parentFiber.child = newFiberNode;
    } else {
      previousFiberNode.sibling = newFiberNode;
    }
    previousFiberNode = newFiberNode;
  });
};

/**
 * 更新组件内容，也用到了适配器模式，抹平了函数组件和原生标签的差异
 * update component, use Adapter Pattern to process the differences between function components and native tags.
 */
const updateComponent = (fiber) => {
  const { type, props } = fiber;
  const isFunctionComponent = typeof type === "function";
  console.log("【updateComponent】fiber及其类型", fiber, type);

  const updateFunctionComponent = () => {
    // 函数组件的type就是自身 the Function Component's `type` is itself
    const children = [type(props)];
    updateFiberTree(fiber, children);
  };
  const updateHostComponent = () => {
    if (!fiber.dom) {
      fiber.dom =
        type === "__TEXT_ELEMENT"
          ? document.createTextNode("")
          : document.createElement(type);
    }
    updateProps(fiber.dom, fiber.props);
    updateFiberTree(fiber, fiber.props.children);
  };

  if (isFunctionComponent) {
    updateFunctionComponent();
  } else {
    updateHostComponent();
  }
};

/** 更新参数 */
const updateProps = (obj, props) => {
  if (obj && props) {
    Object.keys(props)?.forEach((key) => {
      if (key !== "children") {
        obj[key] = props[key];
      }
    });
  }
};

/**
 * 执行工作循环中的单个任务——对原生标签和函数组件会进行区分处理
 * perform the atom task of the work loop, and perform different processing for native tags and function components.
 * */
const performUnitOfWork = (fiber) => {
  console.log("【performUnitOfWork】fiber", fiber);
  updateComponent(fiber);
  // updateProps(fiber.dom, fiber.props);

  // 返回下一个兄弟节点或者子节点，以便于继续执行工作循环
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
};

/**
 *  提交更新结果，执行挂载操作
 *  commit the update result, execute the mounting operation
 */
const commitWork = (fiber) => {
  if (!fiber) {
    return;
  }
  let parentFiber = fiber?.parent;
  while (parentFiber && !parentFiber.dom) {
    // 找到第一个有dom的 parentFiber
    parentFiber = parentFiber.parent;
  }
  console.log("【commitWork】parenFiber 和 fiber", parentFiber, fiber);
  if (fiber.dom) {
    parentFiber?.dom?.appendChild(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

/**
 * 工作循环，处理异步更新任务，适时渲染界面
 *  this function schedules and executes update tasks, rendering UI when the main thread is idle
 */
const workLoop = (idleDeadLine) => {
  globalData.shouldYield = false;
  while (!globalData.shouldYield && globalData.nextUnitOfWork) {
    console.log("【workLoop】浏览器空闲，执行工作循环，当前状态", globalData);
    globalData.nextUnitOfWork = performUnitOfWork(globalData.nextUnitOfWork);
    globalData.shouldYield = idleDeadLine.timeRemaining() > 0;
  }
  if (!globalData.nextUnitOfWork && globalData.root) {
    console.log("【workLoop】本轮工作循环任务已完成，即将进行commit挂载DOM");
    commitWork(globalData.root);
    console.log("【workLoop】commit结束，本轮工作循环结束");
    globalData.root = null;
  }
  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

const React = {
  render,
};

export default React;
