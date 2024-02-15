const globalData = {
  shouldYield: false, // 控制workLoop暂停或开启
  nextUnitOfWork: null, // 指向WorkLoop要操作的下一个Fiber
  wipRoot: null, // 正在处理过程中的 fiber 树的根节点，
  curRoot: null, // 现在已经显示在屏幕上的内容对应的 fiber树的根节点
};

/**
 * 更新fiber，过程可以概括为交换双缓存树
 * update fiber, and its exact procession is to swap the double cache tree
 */
const update = () => {
  // console.log(
  //   "%c【update】即将开始更新globalData，当前状态",
  //   "color:#00ff33 ",
  //   globalData
  // );
  globalData.wipRoot = {
    dom: globalData.curRoot.dom,
    props: globalData.curRoot.props,
    alternate: globalData.curRoot,
  };
  globalData.nextUnitOfWork = globalData.wipRoot;
  console.log(
    "%c【update】已更新globalData，当前状态",
    "color:#00ff33 ",
    globalData
  );
};

/**
 * 1. 所谓渲染，也就是把JSX转为浏览器认识的DOM, 具体的过程是`JSX->Visual DOM->DOM`
 * 2. 架构调整后，render函数的作用变成了初始化fiber节点
 * 1.`render` means that transfer JSX to DOM， and the procession is `JSX->Visual DOM->DOM`.
 * 2. after the adjustment, the role of the render function has transformed into initializing fiber nodes.
 */
const render = (element, container) => {
  globalData.wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };
  globalData.nextUnitOfWork = globalData.wipRoot;
  console.log("%c【render】开始渲染，当前状态", "color:#00ff33", globalData);
};

/**
 * 将一个fiber节点加入到现有的fiber树上, 这个过程在 react 中叫做 reconcile
 * put a new fiber node into the existing fiber tree, and this procession is called reconcile in official react
 */
const updateFiberTree = (parentFiber, children) => {
  if (!parentFiber || !children) return;
  console.log(
    "【updateFiberTree (reconcile)】parentFiber && children",
    parentFiber,
    children
  );

  const childList = Array.isArray(children) ? children : [children];
  // ["string", "number"].includes(typeof children);
  let previousFiberNode = null; // 创建链表过程中，上一次操作的fiber节点
  let alternateFiberNode = parentFiber?.alternate?.child; // 双缓存树体系中，对应的fiber节点，这里初始化为第一个子节点

  childList.forEach?.((child, index) => {
    const isSameType =
      alternateFiberNode && alternateFiberNode?.type === child.type;

    let newFiberNode = null;
    if (isSameType) {
      newFiberNode = {
        dom: alternateFiberNode?.dom,
        parent: parentFiber,
        child: null,
        sibling: null,
        type: child.type,
        props: child.props,
        alternate: alternateFiberNode,
        effectTag: "UPDATE",
      };
    } else {
      const isTextNode = ["string", "number"].includes(typeof child);
      newFiberNode = {
        dom: isTextNode ? document.createTextNode(child) : child.dom,
        parent: parentFiber,
        child: null,
        sibling: null,
        type: isTextNode ? "__TEXT_ELEMENT" : child.type,
        props: child.props,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    if (index === 0) {
      // 第一个子节点，直接塞到child字段
      parentFiber.child = newFiberNode;
    } else {
      previousFiberNode.sibling = newFiberNode;
    }
    previousFiberNode = newFiberNode;
    alternateFiberNode = alternateFiberNode?.sibling ?? null;
  });
};

/**
 * 更新组件内容，也用到了适配器模式，抹平了函数组件和原生标签的差异
 * update component, use Adapter Pattern to process the differences between function components and native tags.
 */
const updateComponent = (fiber) => {
  const { type, props } = fiber;
  const isFunctionComponent = typeof type === "function";

  const updateFunctionComponent = () => {
    console.log("【updateComponent-函数组件】fiber及其类型", type, fiber);
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
    console.log("【updateComponent-原生组件】fiber及其类型", type, fiber);
    updateProps(fiber.dom, fiber.props);
    updateFiberTree(fiber, fiber.props?.children);
  };

  if (isFunctionComponent) {
    updateFunctionComponent();
  } else {
    updateHostComponent();
  }
};

/**
 *  更新参数, 这里为了做最小量更新，还需要对比新旧props
 *  update props with the min cost by only updating the changed part
 */
const updateProps = (obj, newProps, oldProps) => {
  if (!obj) return;

  if (oldProps) {
    // 为了节省开销，避免多余的dom操作，所以不能直接全部删
    Object.keys(oldProps)?.forEach((key) => {
      if (key !== "children" && !key.startsWith("on") && !newProps[key]) {
        obj[key] = props[key];
      }
    });
  }

  if (newProps) {
    Object.keys(newProps).forEach((key) => {
      if (key.startsWith("on")) {
        const event = key.slice(2).toLowerCase();
        obj.addEventListener(event, newProps[key]);
      }
      if (key !== "children" && !key.startsWith("on")) {
        obj[key] = newProps[key];
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
  return null;
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

  if (fiber.dom) {
    if (fiber.effectTag === "UPDATE") {
      console.log(
        "【commitWork-更新】parenFiberDOM 和 fiberDOM",
        parentFiber.dom,
        fiber.dom
      );
      updateProps(fiber.dom, fiber.props, fiber.alternate?.props);
    } else if (fiber.effectTag === "PLACEMENT") {
      console.log(
        "【commitWork-挂载】parenFiberDOM 和 fiberDOM",
        parentFiber.dom,
        fiber.dom
      );
      parentFiber?.dom?.appendChild(fiber.dom);
    }
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

/**
 * 工作循环，处理异步更新任务，适时渲染界面
 * this function schedules and executes update tasks, rendering UI when the main thread is idle
 */
const workLoop = (idleDeadLine) => {
  globalData.shouldYield = false;
  while (!globalData.shouldYield && globalData.nextUnitOfWork) {
    console.log(
      "%c【workLoop】浏览器空闲，执行工作循环，当前状态",
      "color: #ff3700",
      globalData
    );
    globalData.nextUnitOfWork = performUnitOfWork(globalData.nextUnitOfWork);
    globalData.shouldYield = idleDeadLine.timeRemaining() > 0;
  }
  if (!globalData.nextUnitOfWork && globalData.wipRoot) {
    console.log(
      "%c【workLoop】本轮工作循环任务已完成，即将进行commit挂载DOM, 当前状态",
      "color:skyblue",
      globalData
    );
    commitWork(globalData.wipRoot);
    console.log(
      "%c【workLoop】commit结束，本轮工作循环结束，当前状态",
      "color: purple",
      globalData
    );
    globalData.curRoot = globalData.wipRoot;
    globalData.wipRoot = null;
  }
  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

const React = {
  render,
  update,
};

export default React;
