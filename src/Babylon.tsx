import React, {} from 'react';
import * as BABYLON from 'babylonjs'
import { Scene, Engine } from 'babylonjs'

let engine: Engine
var scene: Scene
var sceneToRender: Scene
let canvas: HTMLCanvasElement

var createDefaultEngine = function() { 
    return new BABYLON.Engine(canvas, true, 
        { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); 
};

var initFunction = async function() {
    var asyncEngineCreation = async function() {
        try {
            return createDefaultEngine();
        } catch(e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }

    engine = await asyncEngineCreation();
    if (!engine) throw new Error('engine should not be null.');
    scene = createScene();
};

let main = () => {
    sceneToRender = scene        
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
};

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});

const createScene =  () => {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera(
        "camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0), scene, true);
    camera.attachControl(canvas, true);
    /* const light =  */new BABYLON.HemisphericLight(
        "light", new BABYLON.Vector3(0, 1, 0), scene);
    /* const box =  */BABYLON.MeshBuilder.CreateBox("box", {});
    return scene;
}

function App() {
  let refCanvas = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(()=>{
    canvas = refCanvas.current!
    initFunction().then(main)
  })
  return (
    <div className="demo scroll">
        <canvas ref={refCanvas} id="cc" tabIndex={1} width="800" height="800"
          onClick={ev => console.log(ev)} ></canvas>
    </div>
  );
}

export default App;
