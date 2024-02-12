const Comp = ({num}) => {
  return <div>{num}</div>
}
const App = () => {
  return <div id="app">
    <div>Hello</div>
    <div>
      <span>My</span>
      <span>React</span>
    </div>
    <Comp num={2024}></Comp>
  </div>
}

export default App
