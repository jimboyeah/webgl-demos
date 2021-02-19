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
    mainImage(gl_FragColor, vec2(gl_FragCoord));
  }
  // Hash without Sine
// MIT License...
/* Copyright (c)2014 David Hoskins.

// ALL HASHES ARE in the 'COMMON' tab

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

// https://www.shadertoy.com/view/4djSRW
// Trying to find a Hash function that is the same on all systems
// and doesn't rely on trigonometry functions that lose accuracy with high values. 
// New one on the left, sine function on the right.

// *NB: This is for integer scaled floats only! i.e. Standard noise functions.

#define ITERATIONS 1


//----------------------------------------------------------------------------------------
float hashOld12(vec2 p)
{
    // Two typical hashes...
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    
    // This one is better, but it still stretches out quite quickly...
    // But it's really quite bad on my Mac(!)
    //return fract(sin(dot(p, vec2(1.0,113.0)))*43758.5453123);

}

vec3 hashOld33( vec3 p )
{
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return fract(sin(p)*43758.5453123);
}

//----------------------------------------------------------------------------------------
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 position = fragCoord.xy;
    vec2 uv = fragCoord.xy / iResolution.xy;
#if 1
	float a = 0.0, b = a;
    for (int t = 0; t < ITERATIONS; t++)
    {
        float v = float(t+1)*.152;
        vec2 pos = (position * v + iTime * 1500. + 50.0);
        a += hash12(pos);
    	b += hashOld12(pos);
    }
    vec3 col = vec3(mix(b, a, step(uv.x, .5))) / float(ITERATIONS);
#else
	vec3 a = vec3(0.0), b = a;
    for (int t = 0; t < ITERATIONS; t++)
    {
        float v = float(t+1)*.132;
        vec3 pos = vec3(position, iTime*.3) + iTime * 500. + 50.0;
        a += hash33(pos);
        b += hashOld33(pos);
    }
    vec3 col = vec3(mix(b, a, step(uv.x, .5))) / float(ITERATIONS);
#endif

    col = mix(vec3(.4, 0.0, 0.0), col, smoothstep(.5, .495, uv.x) + smoothstep(.5, .505, uv.x));
	fragColor = vec4(col, 1.0);
}
  `;

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
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW); //给缓冲区填充数据

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
  const [state, setstate] = useState(gridSize)
  gridSize = state;
  React.useEffect(()=>{
    main(refCanvas.current!)
  })
  return (
    <div className="demo scroll">
    <div className="controls">
    <Github pathname="src/WebGL/HashOutSine.tsx" />
    set grid size:<br/>
    <input type="range" max="128" min="1" value={state} title={`grid size ${state}x${state}`} 
      onChange={ ev => setstate(+ev.target.value)}/><br/>
    <input type="range" max="3200" min="1" value={gridSize} title={`grid size ${state}x${state}`} 
      onChange={ ev => setstate(+ev.target.value)}/><br/>
    </div>
    <canvas ref={refCanvas} id="cc" touch-action="none" tabIndex={1} width="800" height="800"
      onWheel={ev => setstate(ev.deltaY>0? state+1:state-1)}
      onClick={ev => click(ev, gl, refCanvas.current!, a_Position, u_FragColor)} ></canvas>
    </div>
  );
}

export default App;
