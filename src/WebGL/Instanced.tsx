import React, {MouseEvent, useState} from 'react';
import {getWebGLContext, initShaders, WebGLContext, resize} from '../lib/utils'
import Github from '../view-source/view-source'

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Offset;
  attribute vec4 a_Color;
  varying vec4 v_FragColor;
  void main() {
    gl_Position = a_Position + a_Offset;
    gl_PointSize = 10.0;
    v_FragColor = a_Color;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  varying vec4 v_FragColor;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    if(r < 0.3){
      gl_FragColor = vec4(1.0-gl_FragCoord.x/800.0, 0.0, 0.0, 1.0);
    }else{
      gl_FragColor = length(v_FragColor)>0.0? v_FragColor: u_FragColor;
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

  a_Offset = gl.getAttribLocation(gl.program, 'a_Offset');
  if (a_Offset < 0) {
    console.log('Failed to get the storage location of a_Offset');
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

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawInstanced();
}

var a_Position:number;
var a_Color: number;
var a_Offset: number;
var u_FragColor: WebGLUniformLocation;
var gl: WebGLContext;

var g_points: number[] = [
  -1,-1,0,
  +1,+1,0,
  +1,-1,0,
];  // The array for the position of a mouse press
var g_colors: number[] = [
  0.8,0.8,0.8,0.8,
  0.8,0.2,0.2,0.8,
  0.2,0.2,0.8,0.8,
];  // The array to store the color of a point
var g_index: number[] = [0, 1, 2];

function click(ev: MouseEvent<HTMLCanvasElement>, gl:WebGLContext, 
  canvas:HTMLCanvasElement, a_Position:number, u_FragColor: WebGLUniformLocation) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.currentTarget.getBoundingClientRect();
  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  // Store the coordinates to g_points array
  g_points.push(x, y, .0);
  g_index.push(g_index.length);
  console.log('x,y', [x, y], g_colors
    // [canvas.width, canvas.height], 
    // [canvas.clientWidth, canvas.clientHeight],
    // [gl.canvas.width,gl.canvas.height]
  )
  resize(gl,canvas)

  // Store the coordinates to g_points array
  if (x >= 0.0 && y >= 0.0) {      // First quadrant
    g_colors.push(1.0, 0.0, 0.0, 1.0);  // Red
  } else if (x < 0.0 && y > 0.0) { // Second quadrant
    g_colors.push(0.0, 1.0, 0.0, 1.0);  // Green
  } else if (x < 0.0 && y < 0.0) { // Third quadrant
    g_colors.push(0.0, 0.0, 1.0, 1.0);  // Blue
  } else {                         // Others
    g_colors.push(1.0, 1.0, 1.0, 1.0);  // White
  }

  if(g_colors.length>4*4) {
    g_colors.splice(0,4)
  }

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawInstanced();
}

let drawInstanced = () => {
  // var colors = new Float32Array([
  //   1.0, 0.0, 0.0, .8,
  //   0.0, 1.0, 0.0, .8,
  //   0.0, 0.0, 1.0, .8,
  //   1.0, 1.0, 1.0, .8,
  // ]);
  let colors = new Float32Array(g_colors);
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

  let count = gridSize;
  var positions = new Float32Array([
    -1/count, +1/count, 0.0,
    -1/count, -1/count, 0.0,
    +1/count, +1/count, 0.0,
    +1/count, -1/count, 0.0,
  ]);
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.vertexAttribPointer(
    a_Position,  
    3,            // 3 values per vertex shader iteration
    gl.FLOAT,     // data is 32bit floats
    false,        // don't normalize
    0,            // stride (0 = auto)
    0,            // offset into buffer
  );
  gl.enableVertexAttribArray(a_Position);

  var offsetArray = [];
  for(var ir = 0; ir < count; ir++){
    for(var ic = 0; ic < count; ic++){
      var x = (ir+0.5-count/2)/count*4;
      var y = (ic+0.5-count/2)/count*4;
      var z = 0;
      offsetArray.push(x,y,z);
    }
  }

  var offsetBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(offsetArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer( a_Offset,
    3,            // 3 values per vertex shader iteration
    gl.FLOAT,     // data is 32bit floats
    false,        // don't normalize
    0,            // stride (0 = auto)
    0,            // offset into buffer
  );
  gl.enableVertexAttribArray(a_Offset);

  var indices = new Uint8Array([
    0, 1, 2,
    2, 1, 3
  ]);

  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  // use extension for WebGL 1.0
  // gl.vertexAttribDivisor(a_Offset, 6);
  var ext = gl.getExtension('ANGLE_instanced_arrays')!;
  ext.vertexAttribDivisorANGLE(a_Offset, 1);
  // draw elements data from ELEMENT_ARRAY_BUFFER
  ext.drawElementsInstancedANGLE(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0, count**2)

  // draw the 1st one as a markup
  gl.drawElements(gl.LINE_STRIP, indices.length, gl.UNSIGNED_BYTE, 0);
  gl.drawElements(gl.POINTS, indices.length, gl.UNSIGNED_BYTE, 0);
  
  // gl.drawArrays(gl.LINE_STRIP, 0, positions.length/3);
  // gl.drawArrays(gl.POINTS, 0, positions.length/3);
}

let gridSize = 4;
function App() {
  let refCanvas = React.useRef<HTMLCanvasElement>(null)
  const [state, setstate] = useState({size: gridSize})
  gridSize = state.size;
  React.useEffect(()=>{
    main(refCanvas.current!)
  })
  return (
    <div className="demo scroll">
    <div className="controls">
    <Github pathname="src/WebGL/Instanced.tsx" />
    set grid size:<br/>
    <input type="range" max="128" min="1" value={state.size} title={`grid size ${state.size}x${state.size}`} 
      onChange={ ev => setstate({size: +ev.target.value})}/><br/>
    <input type="range" max="3200" min="1" value={gridSize} title={`grid size ${state.size}x${state.size}`} 
      onChange={ ev => setstate({size: +ev.target.value})}/><br/>
    </div>
    <canvas ref={refCanvas} id="cc" touch-action="none" tabIndex={1} width="800" height="800"
      onWheel={ev => setstate({size: ev.deltaY>0? state.size+1:state.size-1})}
      onClick={ev => click(ev, gl, refCanvas.current!, a_Position, u_FragColor)} ></canvas>
    </div>
  );
}

export default App;
