import React, {MouseEvent, useState} from 'react';
import {getWebGLContext, initShaders, WebGLContext, resize} from '../lib/utils'
import Github from '../view-source/view-source'
/* 
| x 0 0 0 |    | 1 0 0 x |    | 1     0     0 0 |    | cosα  0 sinα 0 |    | cosα -sinα 0 0 |
| 0 y 0 0 |    | 0 1 0 y |    | 0  cosα -sinα 0 |    | 0     1    0 0 |    | sinα  cosα 0 0 |
| 0 0 z 0 |    | 0 0 1 z |    | 0  sinα  cosα 0 |    |-sinα  0 cosα 0 |    | 0     0    1 0 |
| 0 0 0 1 |    | 0 0 0 1 |    | 0     0     0 1 |    | 0     0    0 1 |    | 0     0    0 1 |
  S(x,y,z)       T(x,y,z)        Rx(α)                 Ry(α)                 Rz(α)           
*/
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Scale;
  uniform vec3 u_Angle;
  attribute vec2 a_TexCoord;
  attribute vec4 a_Color;
  varying vec4 v_FragColor;
  varying vec2 v_TexCoord;
  void main() {
    mat4 scale = mat4(
      vec4(u_Scale, 0.0, 0.0, 0.0),
      vec4(0.0, u_Scale, 0.0, 0.0),
      vec4(0.0, 0.0, u_Scale, 0.0),
      vec4(0.0, 0.0, 0.0, 1.0)
    );
    float PI = 3.1415926;
    float x = u_Angle.x;
    float y = u_Angle.y;
    float z = u_Angle.z;
    mat4 shearX = mat4(
      vec4(1.0, z,   0.0, 0.0),
      vec4(0.0, 1.0, 0.0, 0.0),
      vec4(0.0, 0.0, 1.0, 0.0),
      vec4(0.0, 0.0, 0.0, 1.0)
    );
    mat4 rotateX = mat4(
      vec4(1.0,    0.0,     0.0, 0.0),
      vec4(0.0, cos(x), -sin(x), 0.0),
      vec4(0.0, sin(x),  cos(x), 0.0),
      vec4(0.0,    0.0,     0.0, 1.0)
    );
    mat4 rotateY = mat4(
      vec4( cos(y), 0.0, sin(y), 0.0),
      vec4(    0.0, 1.0,    0.0, 0.0),
      vec4(-sin(y), 0.0, cos(y), 0.0),
      vec4(    0.0, 0.0,    0.0, 1.0)
    );
    mat4 rotateZ = mat4(
      vec4( cos(z), -sin(z), 0.0, 0.0),
      vec4( sin(z),  cos(z), 0.0, 0.0),
      vec4(    0.0,     0.0, 1.0, 0.0),
      vec4(    0.0,     0.0, 0.0, 1.0)
    );

    gl_Position = a_Position * scale * rotateX * rotateY * rotateZ;
    gl_PointSize = 10.0;
    v_TexCoord = a_TexCoord;
    v_FragColor = vec4(vec3(u_Scale), 1) + a_Color;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision highp float;
  uniform sampler2D u_Sampler;
  uniform vec4 u_FragColor;
  varying vec4 v_FragColor;
  varying vec2 v_TexCoord;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    if(r < 0.3){
      // discard;
    }
    gl_FragColor = v_FragColor * 0.0 + texture2D(u_Sampler, v_TexCoord);
  }`;

var gl: WebGLContext;

function main(canvas:HTMLCanvasElement) {
  // Retrieve <canvas> element
  // var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas, false);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
  }

  canvas.addEventListener("webglcontextlost", ()=>{
    console.log('webglcontextlost', canvas);
  });
  canvas.addEventListener("webglcontextrestored", function () {
      console.log("webglcontextrestored", canvas);
  });

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  loadTexture();
  bindColors();
  bindTransform();
  bindIndices();
  requestAnimationFrame(render);
}

function onMove(ev: MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  let target = ev.target as HTMLCanvasElement;
  var rect = target.getBoundingClientRect();
  x = ( x - rect.left - canvas.width/2)/(canvas.width/2);
  y = (-y + rect.top  + canvas.height/2)/(canvas.height/2);
  positions[0] = x;
  positions[1] = y;
}

function render() {
  let x = positions[0];
  let y = positions[1];

  hit = hitTest(x, y);
  resize(gl, gl.canvas as HTMLCanvasElement)

  // Tell WebGL how to convert from clip space to pixels
  // gl.viewport(0, 0, gl.canvas.width*DPR, gl.canvas.height*DPR);
  // console.log(0, 0, gl.canvas.width*DPR, gl.canvas.height*DPR);

  bindVertexs();
  drawElements();
  drawHitPoint();
  // drawArrays();

  requestAnimationFrame(render);
}

var hit: ReturnType<typeof hitTest>;

function onHit (ev: MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  let pt = hit[1];
  positions[pt.index*5] = positions[0];
  positions[pt.index*5+1] = positions[1];
}

function hitTest(cx: number, cy:number) {
  let dist = [];
  for(let ik =0; ik<positions.length; ik+=5){
    let x = positions[ik];
    let y = positions[ik+1];
    dist.push({dist: ((cx - x)**2+(cy - y)**2), x, y, index:ik/5})
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
var indices =[
  1, 2, 3,
  2, 3, 4,
  0, 1, 2, 3, 4
];
// Interleaved Array, vertex with texture coordinates
var positionsOrigin = [
  +0.0, -0.0, 0.0,  0.0, 1.0,
  -0.5,  0.5, 0.0,  0.0, 0.0,
  -0.5, -0.5, 0.0,  0.0, 1.0,
  +0.5,  0.5, 0.0,  1.0, 0.0,
  +0.5, -0.5, 0.0,  1.0, 1.0,
];
var positionsWrap = [
  +0.0, -0.0, 0.0,  0.0, 4.0,
  -0.5,  0.5, 0.0,  0.0, 0.0,
  -0.5, -0.5, 0.0,  0.0, 4.0,
  +0.5,  0.5, 0.0,  4.0, 0.0,
  +0.5, -0.5, 0.0,  4.0, 4.0,
];
var positions = positionsOrigin;

function bindIndices() {
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,  new Uint8Array(indices), gl.STATIC_DRAW);
}

function drawHitPoint() {
  let pt = hit[1];
  let offset = indices.length - positions.length/5 + pt.index;
  gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_BYTE, offset);
  // gl.drawArrays(gl.LINE_STRIP, 0, 1);
  gl.drawArrays(gl.POINTS, 0, 1);
}

var a_Position:number;
function bindVertexs() {
  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
  }

  let data = new Float32Array(positions);
  let FSIZE = data.BYTES_PER_ELEMENT;
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.vertexAttribPointer(
    a_Position,  
    3,            // 3 values per vertex shader iteration
    gl.FLOAT,     // data is 32bit floats
    false,        // don't normalize
    FSIZE * 5,    // stride (0 = auto)
    0,            // offset into buffer
  );
  gl.enableVertexAttribArray(a_Position);
}

var u_Angle: WebGLUniformLocation;
var u_Scale: WebGLUniformLocation;
function bindTransform() {
  u_Scale = gl.getUniformLocation(gl.program, 'u_Scale')!;
  if (!u_Scale) {
    console.log('Failed to get the storage location of u_Scale');
  }
  u_Angle = gl.getUniformLocation(gl.program, 'u_Angle')!;
  if (!u_Angle) {
    console.log('Failed to get the storage location of u_Angle');
  }
  gl.uniform1f(u_Scale, state.size)
  gl.uniform3fv(u_Angle, [state.angleX, state.angleY, state.angleZ ])
}

let a_TexCoord: number
let u_Sampler: WebGLUniformLocation
function loadTexture () {
  //Get the storage location of a_Position, assign and enableffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
  }

  a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord')
  if(a_TexCoord<0) console.log('Failed to get the storage location of a_TexCoord')
  
  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler')!
  if(!u_Sampler) console.log('Failed to get the storage location of u_Sampler')

  let image = new Image();
  image.onload = ()=>{
    bindTextureMap()
    createTexture(image)
  }
  image.src = state.textureImage;
}

function bindTextureMap() {
  var vertexTexCoordBuffer = gl.createBuffer();
  if (!vertexTexCoordBuffer) {
    console.log('Failed to create the buffer object');
  }
  // Bind the buffer object to target
  let data = new Float32Array(positions);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  var FSIZE = data.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(a_Position,
    2,            // xy, 2 values per vertex shader iteration
    gl.FLOAT,     // data is 32bit floats
    false,        // don't normalize
    FSIZE * 5,    // stride (0 = auto)
    0,            // offset into buffer
  );
  gl.enableVertexAttribArray(a_Position);
  
  // Assign the buffer object to a_TexCoord variable
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
  gl.enableVertexAttribArray(a_TexCoord);
}

function createTexture(image: HTMLImageElement) {
  let unit = 0, texture = gl.createTexture()
  // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1) // Flip y axis
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, (gl as any)[state.WRAP_S])
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, (gl as any)[state.WRAP_T])
  let level = state.useMipmap? state.level:0
  gl.texImage2D(gl.TEXTURE_2D,
    level,  // int level
    gl.RGBA, // enum internalformat
            // long width
            // long height
            // int border
    gl.RGBA, // enum format
    gl.UNSIGNED_BYTE, // enum type
    image,  // Object pixels
  )
  // 不能先于 texImage2D 生成 mipmap 否则会被覆盖
  if(state.useMipmap){
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  }
  gl.uniform1i(u_Sampler, unit)
}

var a_Color: number;
// var u_FragColor: WebGLUniformLocation;
function bindColors() {
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

function drawElements() {
  let len = indices.length - positions.length/5;
  gl.drawElements(gl.TRIANGLES, len, gl.UNSIGNED_BYTE, 0);
  // gl.drawElements(gl.POINTS, len, gl.UNSIGNED_BYTE, 0);
}

// function drawArrays() {
//   gl.drawArrays(gl.TRIANGLE_STRIP, 1, positions.length/5-1);
//   // gl.drawArrays(gl.LINE_STRIP, 1, positions.length/5-1);
// }

let state = {
  textureImage: 'sky.JPG',
  useMipmap: false,
  WRAP_S: 'REPEAT',
  WRAP_T: 'REPEAT',
  useWrap: false,
  size: 1.0,
  level: 0.0,
  angleX: 0.0,
  angleY: 0.0,
  angleZ: 0.0,
}

function App() {
  let refCanvas = React.useRef<HTMLCanvasElement>(null)
  const [State, setState] = useState(state)
  state = State
  positions = state.useWrap? positionsWrap:positionsOrigin
  React.useEffect(()=>{
    main(refCanvas.current!)
  })
  let setImg = (val: string) => setState({...state, textureImage: val})
  let setVal = (val: object) => setState({...state, ...val})
  return (
    <div className="demo scroll">
    <Github pathname="src/WebGL/Textured.tsx" />
    <div className="controls">
      <button onClick={ev => setImg('/sky.JPG')}>sky</button>
      <button onClick={ev => setImg('/micro_s.png')}>micro</button>
      <button onClick={ev => setImg('/beechwood_honey.jpg')}>beech</button>
      <button onClick={ev => setImg('/girls.jpg')}>girls</button>
      <button onClick={ev => setImg('/IzumiSakai.jpeg')}>Izumi Sakai</button>
      <hr/>
      Scale <input type="range" defaultValue={state.size} min={0.1} step={0.1} max={5}
        onChange={ev => {state.size = +ev.target.value; bindTransform()}}/>
      <br/>
      angleX <input type="range" defaultValue={state.angleX} min={0.0} step={0.1} max={7}
        onChange={ev => {state.angleX = +ev.target.value; bindTransform()}}/>
      <br/>
      angleY <input type="range" defaultValue={state.angleY} min={0.0} step={0.1} max={7}
        onChange={ev => {state.angleY = +ev.target.value; bindTransform()}}/>
      <br/>
      angleZ <input type="range" defaultValue={state.angleZ} min={0.0} step={0.1} max={7}
        onChange={ev => {state.angleZ = +ev.target.value; bindTransform()}}/>
      { state.useMipmap && 
        <>
        <hr/>
        Level <input type="range" title="WebGL 2+" value={State.level} min={0} max={2}
        onChange={ev => setVal({level: +ev.target.value})}/>
        </>
      }
      <hr/>
      {state.useWrap && (
        <>
        WRAP_S
        <input type='radio' name='s' defaultChecked={true} title='REPEAT' onClick={ev => setVal({WRAP_S:'REPEAT'})} value='REPEAT' />
        <input type='radio' name='s' title='CLAMP_TO_EDGE' onClick={ev => setVal({WRAP_S:'CLAMP_TO_EDGE'})} value='CLAMP_TO_EDGE' />
        <input type='radio' name='s' title='MIRRORED_REPEAT' onClick={ev => setVal({WRAP_S:'MIRRORED_REPEAT'})} value='MIRRORED_REPEAT' />
        WRAP_T
        <input type='radio' name='t' defaultChecked={true} title='REPEAT' onClick={ev => setVal({WRAP_T:'REPEAT'})} value='REPEAT' />
        <input type='radio' name='t' title='CLAMP_TO_EDGE' onClick={ev => setVal({WRAP_T:'CLAMP_TO_EDGE'})} value='CLAMP_TO_EDGE' />
        <input type='radio' name='t' title='MIRRORED_REPEAT' onClick={ev => setVal({WRAP_T:'MIRRORED_REPEAT'})} value='MIRRORED_REPEAT' />  
        <hr/>
        </>
      )}
      <button onClick={ev => setVal({useMipmap: !state.useMipmap})}>
        [{!state.useMipmap? '❌':'⭕'}]Mip-Mapping</button>
      <button onClick={ev => setVal({useWrap: !state.useWrap})}>
        [{!state.useWrap? '❌':'⭕'}]Wrap</button>
    </div>
    <canvas ref={refCanvas} id="cc" touch-action="none" tabIndex={1} width="800" height="800"
      onClick={ev => onHit(ev, refCanvas.current!)}
      onWheel={ev => {state.size += state.size*(ev.deltaY>0? +0.1:-0.1);bindTransform()}}
      onMouseMove={ev => onMove(ev, refCanvas.current!)} ></canvas>
    </div>
  );
}

export default App;
