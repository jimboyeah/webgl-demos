// declare module "cuon-utils.js" {
export declare function initShaders(gl: WebGLRenderingContext, vshader: string, fshader: string) : boolean

export declare function createProgram(gl: WebGLRenderingContext, vshader: string, fshader: string) : WebGLProgram
/**
 * @param [type] gl.FRAGMENT_SHADER | gl.VERTEX_SHADER
 */
export declare function loadShader(gl: WebGLRenderingContext, type: GLenum, source: string) : WebGLShader

export declare function getWebGLContext(canvas: HTMLCanvasElement, opt_debug:any) :WebGLRenderingContext
// }
// module.exports = {}
