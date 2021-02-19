import React, {MouseEvent, useState} from 'react';
import {getWebGLContext, initShaders, WebGLContext, resize} from '../lib/utils'
import Github from '../view-source/view-source'

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  attribute vec4 a_Transform;
  varying vec4 v_FragColor;
  void main() {
    gl_Position = a_Position + a_Transform;
    gl_PointSize = 10.0;
    v_FragColor = a_Color;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision highp float;
  uniform vec4 u_FragColor;
  varying vec4 v_FragColor;
  uniform float u_Time;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    if(r < 0.3){
      gl_FragColor = 0.2/u_Time + (length(v_FragColor)>0.0? v_FragColor: u_FragColor);
    }
  }`;

function main(canvas:HTMLCanvasElement) {
  // Retrieve <canvas> element
  // var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
  }

  a_Transform = gl.getAttribLocation(gl.program, 'a_Transform');
  if (a_Transform < 0) {
    console.log('Failed to get the storage location of a_Transform');
  }

  // Get the storage location of a_Color
  a_Color = gl.getAttribLocation(gl.program, 'a_Color')!;
  if (!a_Color) {
    console.log('Failed to get the storage location of a_Color');
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')!;
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
  }
  u_Time = gl.getUniformLocation(gl.program, 'u_Time')!;
  if (!u_Time) {
    console.log('Failed to get the storage location of u_Time');
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  bindColors();
  bindIndices();
  timer = requestAnimationFrame(render);
}

var a_Position:number;
var a_Color: number;
var a_Transform: number;
var u_FragColor: WebGLUniformLocation;
var u_Time: WebGLUniformLocation;
var gl: WebGLContext;
var DPR = window.devicePixelRatio;
var hit: ReturnType<typeof hitTest>;

let timer:number | null;
let onMove = (ev: MouseEvent<HTMLCanvasElement>, canvas:HTMLCanvasElement) => {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  let target = ev.target as HTMLCanvasElement;
  var rect = target.getBoundingClientRect();
  x = ( x - rect.left - canvas.width/2)/(canvas.width/2) * DPR;
  y = (-y + rect.top  + canvas.height/2)/(canvas.height/2) * DPR;
  // Store the coordinates to g_points array
  // positions.splice(3*4);
  // positions.push(x, y, 0);
  positions[12] = x;
  positions[13] = y;
}

let render = () => {
  let x = positions[12];
  let y = positions[13];

  hit = hitTest(x, y);
  resize(gl, gl.canvas as HTMLCanvasElement)

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.uniform1f(u_Time, Date.now()*.001%1)
  bindVertexs();
  drawElements();
  drawHitPoint();
  timer = requestAnimationFrame(render);
}


let onHit = (ev: MouseEvent<HTMLCanvasElement>, canvas:HTMLCanvasElement) => {
  let pt = hit[1];
  positions[pt.index] = positions[12];
  positions[pt.index+1] = positions[13];
}

let hitTest = (cx: number, cy: number) => {
  let dist = [];
  for(let ik =0; ik<positions.length; ik+=3){
    let x = positions[ik];
    let y = positions[ik+1];
    dist.push({dist: ((cx - x)**2+(cy - y)**2), x, y, index:ik})
  }
  dist.sort((a, b)=>a.dist>b.dist? 1:-1)
  return dist
}

/**
 *   vc_____________________v13
 *  / |                    /| 
 * v1--------------------v8 |
 * |  |      vf___________| |
 * | /vd    /|            |/v14
 * v2 |   v4--------------v9
 * |  |   |  |__________v15
 * |  |   | /|v10      / |
 * |  |   |/ |________/__| v16
 * |  |   v5/|v11   va| /
 * |  |   |/ |      vb|/
 * |  |   v6----------/
 * |  |   |  |
 * | ve___|__|
 * | /    | /v12
 * |/     |/
 * v3-----v7
 */
var positions = [
  +0, 0, 0.0,
  -1/2,   +1, +1/2, // v1
  -1/2, +4/7, +1/2, // v2
  -1/2,   -1, +1/2, // v3

  -1/9, +4/7, +1/2, // v4
  -1/9,   +0, +1/2, // v5
  -1/9, -1/3, +1/2, // v6
  -1/9,   -1, +1/2, // v7

  +1/2,   +1, +1/2, // v8
  +1/2, +4/7, +1/2, // v9
  +2/5,   +0, +1/2, // va
  +2/5, -1/3, +1/2, // vb

  -1/2,   +1, -1/2, // vc
  -1/2, +4/7, -1/2, // vd
  -1/2,   -1, -1/2, // ve

  -1/9, +4/7, -1/2, // vf
  -1/9,   +0, -1/2, // v10
  -1/9, -1/3, -1/2, // v11
  -1/9,   -1, -1/2, // v12

  +1/2,   +1, -1/2, // v13
  +1/2, +4/7, -1/2, // v14
  +2/5,   +0, -1/2, // v15
  +2/5, -1/3, -1/2, // v16
];
var indices = new Uint8Array([
  1, 8, 9, // FRONT SIDE
  1, 9, 2,
  2, 4, 7,
  2, 7, 3,
  5, 10, 11,
  5, 11, 6,

  12, 19, 20, // BACK SIDE
  12, 20, 13,
  13, 15, 18,
  13, 18, 14,
  16, 21, 22,
  16, 22, 17,

  1,  3,  14, // LEFT SIDE
  1, 14,  12,

  8, 19,  20, // RIGHT SIDE
  8, 20,  9,

  1,  8,  19, // TOP SIDE
  1, 19,  12,
  5, 10,  16,
  5, 16,  21,
]);

let bindIndices = () => {
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

let bindVertexs = () => {
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.vertexAttribPointer(
    a_Position,  
    3,            // 3 values per vertex shader iteration
    gl.FLOAT,     // data is 32bit floats
    false,        // don't normalize
    0,            // stride (0 = auto)
    0,            // offset into buffer
  );
  gl.enableVertexAttribArray(a_Position);
}

let bindColors = () => {
  var colors = new Float32Array([
    1.0, 0.0, 0.0, .8,
    0.0, 1.0, 0.0, .8,
    0.0, 0.0, 1.0, .8,
    1.0, 1.0, 1.0, .8,
  ]);
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  gl.vertexAttribPointer( a_Color,  
    4,            // RGBA, 4 values per vertex shader iteration
    gl.FLOAT,     // data is 32bit floats
    false,        // don't normalize
    0,            // stride (0 = auto)
    0,            // offset into buffer
  );
  gl.enableVertexAttribArray(a_Color);
}

let drawHitPoint = () => {
  let pt = hit[1];
  gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_BYTE, 12 + pt.index/3);
  // gl.drawArrays(gl.LINE_STRIP, 0, positions.length/3);
  // gl.drawArrays(gl.POINTS, 0, positions.length/3);
}

let drawElements = () => {
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
  // gl.drawElements(gl.POINTS, len, gl.UNSIGNED_BYTE, 0);
}

let bindTransform = () => {
  let identity = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    1, 1, 1, 1,
  ])
  let transBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, transBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, identity, gl.STATIC_DRAW)
  gl.vertexAttribPointer(a_Transform,
    4,        // RGBA 4 values per vertex shader iteration
    gl.FLOAT, // 32bit floats
    false,    // don't normalize
    0,        // stride 0 = auto
    0,        // offset 0
    )
  gl.enableVertexAttribArray(a_Transform)
  console.log(state)
}

let state = {
  x:0, y:0, z:0,
  angleX:0, angleY:0, angleZ:0,
  scaleX:0, scaleY:0, scaleZ:0,
}
function App() {
  let refCanvas = React.useRef<HTMLCanvasElement>(null)
  const [State, setState] = useState(state)
  React.useEffect(()=>{
    main(refCanvas.current!)
  })
  state = State;
  let setValue = (val: object) => {
    setState({...State, ...val})
    bindTransform();
  }
  return (
    <div className="demo scroll">
    <Github pathname="src/WebGL/3DF.tsx" />
    <div className="controls">
      x-axis <input max="255" onChange={ev => setValue({x: +ev.target.value})} value={state.x} type="range"/><br/>
      y-axis <input max="255" onChange={ev => setValue({y: +ev.target.value})} value={state.y} type="range"/><br/>
      z-axis <input max="255" onChange={ev => setValue({z: +ev.target.value})} value={state.z} type="range"/><br/>
      angleX <input max="255" onChange={ev => setValue({angleX: +ev.target.value})} value={state.angleX} type="range"/><br/>
      angleY <input max="255" onChange={ev => setValue({angleY: +ev.target.value})} value={state.angleY} type="range"/><br/>
      angleZ <input max="255" onChange={ev => setValue({angleZ: +ev.target.value})} value={state.angleZ} type="range"/><br/>
      scaleX <input max="255" onChange={ev => setValue({scaleX: +ev.target.value})} value={state.scaleX} type="range"/><br/>
      scaleY <input max="255" onChange={ev => setValue({scaleY: +ev.target.value})} value={state.scaleY} type="range"/><br/>
      scaleZ <input max="255" onChange={ev => setValue({scaleZ: +ev.target.value})} value={state.scaleZ} type="range"/><br/>
    </div>
    <canvas ref={refCanvas} id="cc" touch-action="none" tabIndex={1} width="800" height="800"
      onClick={ev => onHit(ev, refCanvas.current!)}
      onMouseMove={ev => onMove(ev, refCanvas.current!)} ></canvas>
    </div>
  );
}

export default App;
