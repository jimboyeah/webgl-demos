// import logo from './logo.svg';
import './App.css';
import Github from './view-source/view-source'

import { lazy, Suspense, useRef } from 'react';
// import ReactDOM from 'react-dom';
import {HashRouter, Route } from './HashRouter'

const Babylon = lazy(()=> import('./Babylon'));
const Primitive = lazy(()=> import('./WebGL/Primitives'));
const Instanced = lazy(()=> import('./WebGL/Instanced'));
const Interleaved = lazy(()=> import('./WebGL/Interleaved'));
const HashOutSine = lazy(()=> import('./WebGL/HashOutSine'));
const MousePoint = lazy(()=> import('./WebGL/MousePoint'));
const Textured = lazy(()=> import('./WebGL/Textured'));
const ThreeDF = lazy(()=> import('./WebGL/3DF'));

const logo = "/micro_s.png"

function App() {
  const ref = useRef<HTMLDivElement>(null)
  let removeDemo = () => {
    // ReactDOM.unmountComponentAtNode(ref.current!);
  }
  return (
    <div ref={ref} className="App columns cLight">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" title="micro-view" />
        <p><a onClick={ev => removeDemo()} className="return grow" href="#">🏡</a></p>
        <Github pathname="" />
      </header>
      <h1>WebGL Demo</h1>
      <div className="rows">
        <div className="col13 columns">
        <a href="#/WebGL/Primitive"> Basic Shape </a>
        <a href="#/WebGL/Instanced"> Instanced Array </a>
        <a href="#/WebGL/Interleaved"> Interleaved Array </a>
        <a href="#/WebGL/HashOutSine"> Hash without Sine </a>
        <a href="#/WebGL/MousePoint"> Mouse Point </a>
        <a href="#/WebGL/Textured"> Textured </a>
        <a href="#/WebGL/3DF"> 3D F </a>
        </div>
      </div>
      <h1>Babylon.js Demo</h1>
      <div className="rows">
        <div className="col13 columns">
        <a href="#/Babylon">Babylon.js Box</a>
        </div>
      </div>
      <br/><br/>      <br/><br/>
      <Suspense fallback={<div>Loading...</div>}>
      <HashRouter>
          <Route path="/Babylon" cp={<Babylon />} />
          <Route path="/WebGL/Primitive"  cp={<Primitive />} />
          <Route path="/WebGL/Instanced"  cp={<Instanced />} />
          <Route path="/WebGL/Interleaved"  cp={<Interleaved />} />
          <Route path="/WebGL/HashOutSine"  cp={<HashOutSine />} />
          <Route path="/WebGL/MousePoint"  cp={<MousePoint />} />
          <Route path="/WebGL/Textured"  cp={<Textured />} />
          <Route path="/WebGL/ThreeDF"  cp={<ThreeDF />} />
      </HashRouter>
      </Suspense>
    </div>
  );
}

export default App;
