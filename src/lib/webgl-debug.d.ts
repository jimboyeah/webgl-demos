export default WebGLDebugUtils;
declare namespace WebGLDebugUtils {
    export { init };
    export { mightBeEnum };
    export { glEnumToString };
    export { glFunctionArgToString };
    export { makeDebugContext };
    export { makeLostContextSimulatingContext };
    export { resetToInitialState };
}
/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
declare function init(ctx: WebGLRenderingContext): void;
/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
declare function mightBeEnum(value: any): boolean;
/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
declare function glEnumToString(value: number): string;
/**
 * Returns the string version of a WebGL argument.
 * Attempts to convert enum arguments to strings.
 * @param {string} functionName the name of the WebGL function.
 * @param {number} argumentIndx the index of the argument.
 * @param {*} value The value of the argument.
 * @return {string} The value as a string.
 */
declare function glFunctionArgToString(functionName: string, argumentIndex: any, value: any): string;
/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 */
declare function makeDebugContext(ctx: WebGLRenderingContext, opt_onErrorFunc: (arg0: any, arg1: any, arg2: any) => void): {
    getError(): string | number;
};
declare function makeLostContextSimulatingContext(ctx: any): {
    loseContext(): void;
    restoreContext(): void;
    getError(): any;
    checkFramebufferStatus: any;
    getAttribLocation: any;
    getVertexAttribOffset: any;
    isContextLost(): boolean;
    registerOnContextLostListener(listener: any): void;
    registerOnContextRestoredListener(listener: any): void;
};
declare function resetToInitialState(ctx: any): void;
