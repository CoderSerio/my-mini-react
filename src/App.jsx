import React from '../my-react/react'
const data = {id: 1}

const handleClickWithoutUpdate = () => {
  data.id ++;
  console.log('click!', data.id)
}
const handleClick= () => {
  handleClickWithoutUpdate()
  React.update()
}

const Comp = ({num}) => {
  return (
    <div className="comp">
      <div>{num}————{data.id}</div>
      <div style={{display: 'flex'}}>
        <button onClick={handleClickWithoutUpdate}>+1 without update</button>
        <button onClick={handleClick}>+1</button>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <div id="app">
      <div>Hello</div>
      <div>
        <span>My</span>
        <span>React</span>
      </div>
      <Comp num={2024}></Comp>
      <Comp num={111}></Comp>
    </div>
  )
}

export default App
