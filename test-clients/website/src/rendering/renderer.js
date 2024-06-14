import { initBuffers,
         initTextBuffers,
         buildTextElement} from './gl-buffers.js';
import { drawMapPlane } from './gl-draw-scene.js';
import { drawPlayers } from './gl-draw-scene.js';
import { drawHUD } from './gl-draw-scene.js';
import { drawText } from './gl-draw-scene.js';
import { initWASD } from '../user-inputs.js';
import { getZoom, getCamPan } from '../user-inputs.js';
import { getGLContext } from '../canvas-getter.js'
import { loadTexture } from './resource-loading.js';
import { initShaderPrograms } from './shaders.js';

const gl           = getGLContext();
let   deltaTime    = 0;
const canvas       = document.getElementById('glcanvas');

const canvasScale  = 2; // Larger = smaller canvas
let   screenWidth  = window.screen.availWidth;
let   screenHeight = window.screen.availHeight;
let   canvasWidth  = Math.floor(screenWidth / canvasScale);
let   canvasHeight = Math.floor(screenHeight / canvasScale);
// We'll want to run this refularly in case
// the screen resolution changes e.g.
// browser window is moved to a different monitor
function screenResUpdate() {
    screenWidth  = window.screen.availWidth;
    screenHeight = window.screen.availHeight;
    canvasWidth  = Math.floor(screenWidth / canvasScale);
    canvasHeight = Math.floor(screenHeight / canvasScale);
}

let   perspMatrix = createPerspMatrix(45);
export function getPerspMatrix() {
    return perspMatrix;
}
let   orthMatrix = createOrthMatrix();
export function getOrthMatrix() {
    return orthMatrix;
}

let modelViewMatrix = mat4.create();
export function getModelViewMatrix() {
    return modelViewMatrix;
}

export function getCamWorldPos() {

}


document.getElementById('fullscreenButton').addEventListener('click', toggleFullScreen);
main();

function main() {
    canvasInit()
    initWASD();
    if (gl === null) {
        return;
    }
    // Flip image pixels into the bottom-to-top order that WebGL expects.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // These are a set of vertex and texture coordinates
    // That cover basically everything in the game that isn't
    // dynamically generated, like text.
    const baseBuffers   = initBuffers       (gl);
    // A set of preloaded buffers for rendering text
    const textBuffers   = initTextBuffers   (gl);
    const programs      = initShaderPrograms(gl);
    const fpscap        = 50;

    document.sperframe  = (1000 / fpscap);
    document.fps        = 0;

    gl.clearColor        (0.0, 0.0, 0.0, 1.0);
    gl.clearDepth        (1.0);
    gl.enable            (gl.DEPTH_TEST);
    gl.enable            (gl.BLEND);
    gl.enable            (gl.CULL_FACE);
    gl.blendFunc         (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc         (gl.LEQUAL);
    gl.clear             (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    gl.useProgram        (programs[0].program);

    startRenderLoop(programs[0], baseBuffers, textBuffers);
}


// Define an array to hold callback functions
let renderCallbacks = [];

// Function to subscribe to the onRender event
export function subscribeToRender(callback) {
    renderCallbacks.push(callback);
}

// Function to unsubscribe from the onRender event
export function unsubscribeFromRender(callback) {
    const index = renderCallbacks.indexOf(callback);
    if (index !== -1) {
        renderCallbacks.splice(index, 1);
    }
}

function startRenderLoop(programInfo, baseBuffers, textBuffers) {
    const textCoords = [0.5, 0.5];
    buildTextElement(gl, "test", textCoords);
    let   then        = 0;
    const mapTexture  = loadTexture(gl, "map01.png");
    const textTexture = loadTexture(gl, "BirdFont88.bmp");
    // zero our texture UV offset
    const uvOffset = vec2.create();
    gl.uniform2fv(programInfo.uniformLocations.uvOffset,
                  uvOffset);

    requestAnimationFrame(render);
    function render(now) {

        renderCallbacks.forEach(callback => {
            callback(deltaTime);
        });

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        document.fps++;
        deltaTime = now - then;
        const wait = document.sperframe - deltaTime;
        then = now;

        const camPan          = getCamPan (deltaTime);
        const camZoom         = getZoom   (deltaTime);

        modelViewMatrix = doCameraTransforms(mat4.create(), camZoom, camPan);

        let locModelViewMatrix = mat4.create();
        mat4.copy(locModelViewMatrix, modelViewMatrix);

        setPersp             (programInfo);

        setPositionAttribute (gl, baseBuffers.vertices, programInfo);
        setTextureAttribute  (gl, baseBuffers.uvs, programInfo);
        gl.bindBuffer        (gl.ELEMENT_ARRAY_BUFFER, baseBuffers.indices);
        drawMapPlane  (gl, 
                       programInfo, 
                       mapTexture, 
                       locModelViewMatrix);
        drawPlayers   (gl, 
                       camZoom, 
                       programInfo, 
                       locModelViewMatrix); 
        setOrtho      (programInfo);
        // From this point we render UI, so we
        // make it orthographic and disable the depth testing
        gl.disable    (gl.DEPTH_TEST);
        // TODO: Have HUD textures and not pass in placeholder
        drawHUD       (gl,
                       programInfo,
                       mat4.create(),
                       mapTexture);
        setPositionAttribute (gl, textBuffers.vertices, programInfo);
        gl.bindBuffer        (gl.ELEMENT_ARRAY_BUFFER, textBuffers.indices);
        drawText      (gl,
                       programInfo,
                       mat4.create(),
                       textTexture);
        setTimeout(() => requestAnimationFrame(render), Math.max(0, wait))
    }
}

function setPersp(programInfo)
{
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
                        false,
                        perspMatrix);
}
function setOrtho(programInfo)
{
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
                        false,
                        orthMatrix);
}

function doCameraTransforms(matrix, camZoom, camPan) {
    mat4.translate (matrix,
                    matrix,
                    [0.0, 0.0, (camZoom - 1.2) * 2]);
    mat4.rotate    (matrix,
                    matrix,
                    Math.PI * ((1 - camZoom) * 0.3),
                    [-1, 0, 0]);
    mat4.translate (matrix,
                    matrix,
                    camPan);
    return matrix;
}

function createPerspMatrix(fov) {
    const fieldOfView      = (fov * Math.PI) / 180; // in radians
    const aspect           = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear            = 0.1;
    const zFar             = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    return projectionMatrix;
}
function createOrthMatrix() {
    const orthMatrix = mat4.create();
    mat4.ortho(orthMatrix, 0, 1, 0, 1, -1, 1);

    return orthMatrix;
}

/*
 * Attempts to auto-detect resolution.
 * Maybe replace this with just a resolution
 * selection, or "createElement".
 */
function canvasInit() {
    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;

    canvas.style.width  = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';

    gl.viewport(0, 0, canvas.width, canvas.height);
}

function setPositionAttribute(gl, posBuffer, programInfo) {
    const numComponents = 3;
    const type          = gl.FLOAT;
    const normalize     = false;
    const stride        = 0; 
    const offset        = 0;
    gl.bindBuffer             (gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer    (programInfo.attribLocations.vertexPosition,
                               numComponents,
                               type,
                               normalize,
                               stride,
                               offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

function setColorAttribute(gl, buffers, programInfo) {
    const numComponents = 4;
    const type          = gl.FLOAT;
    const normalize     = false;
    const stride        = 0;
    const offset        = 0;
    gl.bindBuffer             (gl.ARRAY_BUFFER, 
                               buffers.color);
    gl.vertexAttribPointer    (programInfo.attribLocations.vertexColor,
                               numComponents,
                               type,
                               normalize,
                               stride,
                               offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

export function setTextureAttribute(gl, texCoordBuffer, programInfo) {
    const num       = 2; // every coordinate composed of 2 values
    const type      = gl.FLOAT;
    const normalize = false;
    const stride    = 0;
    const offset    = 0;
    gl.bindBuffer         (gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord,
                           num,
                           type,
                           normalize,
                           stride,
                           offset,);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}

function toggleFullScreen() {
    screenResUpdate();
    if (!document.fullscreenElement) {
        canvas.requestFullscreen();
        canvas.width  = screenWidth;
        canvas.height = screenHeight;

        canvas.style.width  = screenWidth + 'px';
        canvas.style.height = screenHeight + 'px';
        gl.viewport(0, 0, screenWidth, screenHeight);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            canvas.width  = canvasWidth;
            canvas.height = canvasHeight;

            canvas.style.width  = canvasWidth + 'px';
            canvas.style.height = canvasHeight + 'px';

            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }
}
document.addEventListener('fullscreenchange', function() {
    screenResUpdate();
    if (!document.fullscreenElement) {
        canvas.width  = canvasWidth;
        canvas.height = canvasHeight;

        canvas.style.width  = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
});
