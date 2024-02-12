// web环境的react
import React from "./react";

// 这里甚至用了柯里化
function createRoot(container) {
  return {
    render(element) {
      React.render(element, container);
    },
  };
}

const ReactDom = {
  createRoot,
};

export default ReactDom;
