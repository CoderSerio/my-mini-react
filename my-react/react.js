/** 这是一个适配器模式的应用，抹平了创建不同类型DOM的差异
 * this function serves as an application of the Adapter Pattern,
 * which reconciles differences in creating various types of DOM elements.
 */
const createDom = (element) => {
  const type = typeof element;
  console.log("type", type);

  const createTextNode = (element) => {
    return document.createTextNode(element);
  };
  const createElement = (element) => {
    console.log("【createElement】element", element);
  };

  let dom = null;
  if (["string", "number"].includes(type)) {
    dom = createTextNode(element);
  } else if (typeof element === "object") {
    dom = createElement(element);
  } else {
    throw "【createDom】失败，不支持该类型的DOM! Failed，Unsupported DOM Type!";
  }
  return dom;
};

/**
 * 所谓渲染，也就是把jsx转为浏览器认识的dom
 * `render` means that transfer jsx to dom
 */
const render = (element, container) => {
  console.log("【render】JSX的数据结构", element);
  const { props, type } = element;

  // const dom = document.createElement(type);
  const dom = createDom(element);
  container.appendChild(dom);
};

const createElement = () => {};

const React = {
  createElement,
  render,
};

export default React;
