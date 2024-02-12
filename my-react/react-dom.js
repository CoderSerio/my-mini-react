// web环境的react
import React from "./react";

// 这里甚至用了柯里化
function createRoot(element) {
  return {
    render(App) {
      React.render(App, element);
    },
  };
}

const ReactDom = {
  createRoot,
};

export default ReactDom;
