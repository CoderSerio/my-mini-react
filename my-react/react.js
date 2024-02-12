/** 这是一个适配器模式的应用，抹平了创建不同类型虚拟DOM的差异
 * this function serves as an application of the Adapter Pattern,
 * which reconciles differences in creating various types of visual DOM elements.
 */
const jsx2VisualDom = (jsx) => {
  const type = typeof jsx;
  console.log("type", type);

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

/** 虚拟DOM转真实DOM
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
    Object.keys(visualDom.props).forEach((key) => {
      if (key !== "children") {
        dom[key] = visualDom.props[key];
      }
    });

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
 * 所谓渲染，也就是把JSX转为浏览器认识的DOM, 具体的过程是`JSX->Visual DOM->DOM`
 * `render` means that transfer JSX to DOM， and the procession is `JSX->Visual DOM->DOM`.
 */
const render = (jsx, container) => {
  console.log("【render】JSX的数据结构", jsx);
  // const dom = document.createElement(type);
  const visualDom = jsx2VisualDom(jsx);
  const dom = visualDom2Dom(visualDom);
  console.log("【render】虚拟DOM", visualDom);
  console.log("【render】真实DOM", dom);

  container.appendChild(dom);
};

const createElement = () => {};

const React = {
  createElement,
  render,
};

export default React;
