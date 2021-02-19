import React, {MouseEvent} from 'react';
import {getWebGLContext, initShaders, WebGLContext, resize} from '../lib/utils'
import Github from '../view-source/view-source'

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Offset;
  attribute vec4 a_Color;
  varying vec4 v_FragColor;
  void main() {
    gl_Position = a_Position + (length(a_Offset)!=1.0? a_Offset:vec4(0, 0, 0, 0));
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
  requestAnimationFrame(render);
}

var a_Position:number;
var u_Time: WebGLUniformLocation;
var gl: WebGLContext;
var hit: ReturnType<typeof hitTest>;

let onMove = (ev: MouseEvent<HTMLCanvasElement>, canvas:HTMLCanvasElement) => {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  let target = ev.target as HTMLCanvasElement;
  var rect = target.getBoundingClientRect();
  x = ( x - rect.left - canvas.width/2)/(canvas.width/2);
  y = (-y + rect.top  + canvas.height/2)/(canvas.height/2);
  positions[0] = x;
  positions[1] = y;
}

let render = () => {
  let x = positions[0];
  let y = positions[1];

  // Tell WebGL how to convert from clip space to pixels
  // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  hit = hitTest(x, y);
  resize(gl, gl.canvas as HTMLCanvasElement)

  gl.uniform1f(u_Time, Date.now()*.001%1)

  bindVertexs();
  drawElements();
  drawHitPoint();
  
  requestAnimationFrame(render);
}


let onHit = (ev: MouseEvent<HTMLCanvasElement>, canvas:HTMLCanvasElement) => {
  let pt = hit[1];
  positions[pt.index*3] = positions[0];
  positions[pt.index*3+1] = positions[1];
}

let hitTest = (cx: number, cy: number) => {
  let dist = [];
  for(let ik =0; ik<positions.length; ik+=3){
    let x = positions[ik];
    let y = positions[ik+1];
    dist.push({dist: ((cx - x)**2+(cy - y)**2), x, y, index:ik/3})
  }
  dist.sort((a, b)=>a.dist>b.dist? 1:-1)
  return dist
}

/**
 *   vn--------vn
 *  / |       /| 
 * v1-------v3 |
 * |  |     |  |
 * | /vn    | /vn
 * |/       |/
 * v2-------v4
 */
var positions = [
  +0, -0, 0.0,
  -1, +1, 0.0,
  -1, -1, 0.0,
  +1, +1, 0.0,
  +1, -1, 0.0,
];
var indices = new Uint8Array([
  1, 2, 0,
  2, 4, 0,
  4, 3, 0,
  3, 1, 0,
  0, 1, 2, 3, 4
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


var a_Color: number;
// var u_FragColor: WebGLUniformLocation;
let bindColors = () => {
  // Get the storage location of a_Color
  a_Color = gl.getAttribLocation(gl.program, 'a_Color')!;
  if (!a_Color) {
    console.log('Failed to get the storage location of a_Color');
  }
  // Get the storage location of u_FragColor
  // u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')!;
  // if (!u_FragColor) {
  //   console.log('Failed to get the storage location of u_FragColor');
  // }

  var colors = new Float32Array([
    0.3, 0.3, 0.3, .8,
    1.0, 0.0, 0.0, .8,
    0.0, 1.0, 0.0, .8,
    0.0, 0.0, 1.0, .8,
    0.9, 0.9, 0.9, .8,
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
  let offset = indices.length - positions.length/3 + pt.index;
  gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_BYTE, offset);
  // gl.drawArrays(gl.LINE_STRIP, 0, positions.length/3);
  // gl.drawArrays(gl.POINTS, 0, positions.length/3);
}

let drawElements = () => {
  let len = indices.length - positions.length/3;
  gl.drawElements(gl.TRIANGLES, len, gl.UNSIGNED_BYTE, 0);
  // gl.drawElements(gl.POINTS, len, gl.UNSIGNED_BYTE, 0);
}

function App() {
  let refCanvas = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(()=>{
    main(refCanvas.current!)
  })
  return (
    <div className="demo scroll">
    <div className="controls">
    <Github pathname="src/WebGL/MousePoint.tsx" />
    </div>
    <canvas ref={refCanvas} id="cc" touch-action="none" tabIndex={1} width="800" height="800"
      onClick={ev => onHit(ev, refCanvas.current!)}
      onMouseMove={ev => onMove(ev, refCanvas.current!)} ></canvas>
    </div>
  );
}

export default App;
