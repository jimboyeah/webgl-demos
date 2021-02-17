import logo from './logo.svg';
import './App.css';
import Github from './view-source/view-source'

import { lazy, Suspense } from 'react';
import {HashRouter, Route } from './HashRouter'

const Babylon = lazy(()=> import('./Babylon'));
const WebGL = lazy(()=> import('./WebGL'));
const WebGLInstanced = lazy(()=> import('./WebGLInstanced'));
const WebGLInterleaved = lazy(()=> import('./WebGLInterleaved'));

function App() {
  return (
    <div className="App columns cLight">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p><a className="return grow" href="#">🏡</a></p>
        <Github pathname="" />
      </header>
      <h1>WebGL Demo</h1>
      <div className="rows">
        <div className="col13 columns">
        <a href="#/WebGL/list"> Basic Shape </a>
        <a href="#/WebGLInstanced"> Instanced Array </a>
        <a href="#/WebGLInterleaved"> Interleaved Array </a>
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
          <Route path="/WebGL"  cp={<WebGL />} />
          <Route path="/WebGLInstanced"  cp={<WebGLInstanced />} />
          <Route path="/WebGLInterleaved"  cp={<WebGLInterleaved />} />
      </HashRouter>
      </Suspense>
    </div>
  );
}

export default App;
