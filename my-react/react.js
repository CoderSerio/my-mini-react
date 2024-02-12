/** 所谓渲染，也就是把jsx转为浏览器认识的dom */
const render = (element, container) => {
  console.log("【render】JSX的数据结构", element);
  const { props, type } = element;

  const dom = document.createElement(type);
  dom.innerText = "Hello MyReact";

  container.appendChild(dom);
};

const createElement = () => {};

const React = {
  createElement,
  render,
};

export default React;
