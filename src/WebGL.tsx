import React, {MouseEvent, useState} from 'react';
import {getWebGLContext, initShaders, WebGLContext, resize} from './lib/utils'
import Github from './view-source/view-source'

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  varying vec4 v_FragColor;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = 10.0;
    v_FragColor = a_Color;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  varying vec4 v_FragColor;
  void main() {
    gl_FragColor = length(u_FragColor)>.0? u_FragColor: v_FragColor;
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
  g_points = [0,0,0];  // The array for the position of a mouse press
  g_colors = [.8,.1,.8,.8];  // The array to store the color of a point
  g_index = [0];  
}

var a_Position:number;
var a_Color: number;
var u_FragColor: WebGLUniformLocation;
var gl: WebGLContext;

var g_points: number[] = [0,0,0];  // The array for the position of a mouse press
var g_colors: number[] = [.8,.1,.8,.8];  // The array to store the color of a point
var g_index: number[] = [0];

function click(ev: MouseEvent<HTMLCanvasElement>, gl:WebGLContext, 
  canvas:HTMLCanvasElement, a_Position:number, u_FragColor: WebGLUniformLocation) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.currentTarget.getBoundingClientRect();
  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  console.log(DRAWMETHOD, [x, y],
    // [canvas.width, canvas.height], 
    // [canvas.clientWidth, canvas.clientHeight],
    // [gl.canvas.width,gl.canvas.height]
  )
  resize(gl, canvas)
  // Store the coordinates to g_points array
  g_points.push(x, y, .0);
  g_index.push(g_index.length);

  if (x >= 0.0 && y >= 0.0) {      // First quadrant
    g_colors.push(1.0, 0.0, 0.0, 1.0);  // Red
  } else if (x < 0.0 && y < 0.0) { // Third quadrant
    g_colors.push(0.0, 1.0, 0.0, 1.0);  // Green
  } else {                         // Others
    g_colors.push(1.0, 1.0, 1.0, 1.0);  // White
  }

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  if(DRAWMETHOD === "VAO") drawVAO()
  if(DRAWMETHOD === "VBO") drawVBO()
  if(DRAWMETHOD === "EBO") drawEBO()
}

let drawVAO = ()=>{
  var len = g_index.length;
  for(var i = 0; i < len; i++) {
    let x = g_points[i*3];
    let y = g_points[i*3+1];
    let z = g_points[i*3+2];
    var rgba = [g_colors[i*4],g_colors[i*4+1],g_colors[i*4+2],g_colors[i*4+3]];

    gl.disableVertexAttribArray(a_Color);
    gl.disableVertexAttribArray(a_Position);

    // Pass the color of a point to u_FragColor variable
    //gl.uniform4fv(u_FragColor, rgba);
    gl.vertexAttrib4f(a_Color, rgba[0], rgba[1], rgba[2], rgba[3]);

    gl.vertexAttrib3fv(a_Position, [x, y, z]);
    gl.drawArrays(gl.POINTS, 0, len);
  }
}
// ext = gl.getExtension("OES_vertex_array_object");
// vao1 = ext.createVertexArrayOES();
// ext.bindVertexArrayOES(vao1);

let drawVBO = ()=>{
  // gl.drawElements(mode, count, type, offset)
  // gl.drawArrays(mode, first, count)
  var len = g_index.length;
  setVBO()
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, len);
  gl.drawArrays(gl.LINES, 0, len);
  gl.drawArrays(gl.POINTS, 0, len);
}

let drawEBO = ()=>{
  var len = g_index.length;
  setVBO()
  // Indices of the vertices
  var indices = new Uint8Array(g_index);
  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) throw new Error("Error for indices buffer");
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  
  // draw elements data from ELEMENT_ARRAY_BUFFER
  gl.drawElements(gl.TRIANGLES, len, gl.UNSIGNED_BYTE, 0);
  gl.drawElements(gl.LINES, len, gl.UNSIGNED_BYTE, 0);
  gl.drawElements(gl.POINTS, len, gl.UNSIGNED_BYTE, 0);
}

let setVBO = ()=>{
  if(useVarying){
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_colors), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(a_Color);
    gl.vertexAttribPointer(
        a_Color,  
        4,            // 4 values per vertex shader iteration
        gl.FLOAT,     // data is 32bit floats
        false,        // don't normalize
        0,            // stride (0 = auto)
        0,            // offset into buffer
    );
  }else{
    // disabled varying and use uniform to set color
    gl.disableVertexAttribArray(a_Color);
    gl.uniform4f(u_FragColor, g_colors[0], g_colors[1], g_colors[2], g_colors[3])
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_points), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(
      a_Position,  
      3,            // 3 values per vertex shader iteration
      gl.FLOAT,     // data is 32bit floats
      false,        // don't normalize
      0,            // stride (0 = auto)
      0,            // offset into buffer
  );
}

let DRAWMETHOD: "VAO" | "VBO" | "EBO" = "VBO";
let useVarying: boolean = false;

function App() {
  let refCanvas = React.useRef<HTMLCanvasElement>(null);
  const [varying, setvarying] = useState(useVarying)
  const [state, setstate] = useState(DRAWMETHOD)
  let setDrawMethod = (ev: MouseEvent<HTMLElement>) => {
    let target:HTMLElement = ev.target as HTMLElement
    if(target.id==="VAO") DRAWMETHOD = "VAO"
    if(target.id==="VBO") DRAWMETHOD = "VBO"
    if(target.id==="EBO") DRAWMETHOD = "EBO"
    if(target.id==="varying") {
      useVarying = !useVarying;
      setvarying(useVarying)
    }
    setstate(DRAWMETHOD)
  }

  React.useEffect(()=>{
    main(refCanvas.current!)
    // return function cleanup() {
    //   console.log("useEffect Cleanup")
    // }
  })
  return (
    <div className="demo scroll" title={state}>
    <Github pathname="src/WebGL.tsx" />
    <p className="controls" onClick={ev => setDrawMethod(ev)}>
    <label htmlFor="VAO"><input type="radio" name="g1" id="VAO" title="Vertex Arrary Object"/> VAO </label>
      <label htmlFor="VBO"><input type="radio" name="g1" id="VBO" defaultChecked={true} title="Vertex Buffer object"/> VBO </label>
      <label htmlFor="EBO"><input type="radio" name="g1" id="EBO" title="Element Buffer Object"/> EBO </label>
      <label id="varying" > [{!varying?"❌":"⭕"}]use varying </label>
    </p>
    <canvas ref={refCanvas} id="cc" touch-action="none" tabIndex={1} width="1136" height="719"
        onClick={ev => click(ev, gl, refCanvas.current!, a_Position, u_FragColor)} ></canvas>
    </div>
  );
}

export default App;
