
// demo: x, u, w,  etc
var demo = class {};
var time = 0.0;
var funcShaderChange = true;
var reset = false;

var saveSetR = false;
var saveSetS = false;
var saveSetF = 0;
var saveSetFramesX = [];
var saveSetFramesU = [];
var saveSetNFrames = 20;
var saveSetSkip = 20;
var saveSetSkipHelper = 0;
var saveFrameX = false, saveFrameU = false;

function updateScene() {

    var nX = document.getElementById("nXTextBox").value;
    if (nX.length > 0) {
        nX = Number(nX);
    }

    var nY = document.getElementById("nYTextBox").value;
    if (nY.length > 0) {
        nY = Number(nY);
    }

    if (nX != demo.nX || nY != demo.nY) {
        demo.nX = nX;
        demo.nY = nY;

        createComputeBuffers(demo.nX, demo.nY); 

        initialseMeshmoveStepShader();
        initialiseMaxShader();
        initialiseMinShader();
        initialiseLinesShader();

        initialiseLinesProgram();
        initialiseMeshData(computeFrameBuffer.width, computeFrameBuffer.height,  -1.0,-1.0, 1.0,1.0);
        initialiseBoundaryConditionData(computeFrameBuffer.width, computeFrameBuffer.height);
        resetStateVariables();
        initialiseMeshControlShader(demo.uFunction);
        initialseCheckersShader();
    }

    demo.bcOption = document.querySelector('input[name="bcOption"]:checked').value;

    var dtTextBox = document.getElementById("dtTextBox").value;
    if (dtTextBox.length > 0) {
        demo.dt = Number(dtTextBox);
    }

    var dtauTextBox = document.getElementById("dtauTextBox").value;
    if (dtauTextBox.length > 0) {
        demo.dtau = Number(dtauTextBox);
    }

    var betaTextBox = document.getElementById("betaTextBox").value;
    if (betaTextBox.length > 0) {
        demo.beta = Number(betaTextBox);
    }

    if (demo.beta < 1e-3) {
        document.getElementById("betaTextBox").style.backgroundColor = '#ff5';
    } else {
        document.getElementById("betaTextBox").style.backgroundColor = '#fff';
    }

    var alphaTextBox = document.getElementById("alphaTextBox").value;
    if (alphaTextBox.length > 0) {
        demo.alpha = Number(alphaTextBox);
    }

    var jacobiIterationTextBox = document.getElementById("jacobiIterationTextBox");
    if (jacobiIterationTextBox.value.length > 0){
        demo.jacobiIterationCount = Number(jacobiIterationTextBox.value);
        if (demo.jacobiIterationCount <= 1){
            demo.jacobiIterationCount = 1;
        }
    }

    demo.jacobiX0Option = document.querySelector('input[name="jacobiX0Option"]:checked').value;
    demo.gridColorOption = document.querySelector('input[name="gridColorOption"]:checked').value;
    demo.colorsid = document.querySelector('input[name="colorOption"]:checked').value;

    var gridLineWidthTextBox = document.getElementById("gridLineWidth");
    if (gridLineWidthTextBox.value.length > 0){
    demo.gridLineWidth = Number(gridLineWidthTextBox.value);
        if (demo.gridLineWidth <= 0.0){
            demo.gridLineWidth = 0.0;
        }
    }

    demo.chemtrail = document.getElementById("chemtrailCheck").checked;
    demo.checkers = document.getElementById("checkersCheck").checked;
    
    time += demo.dt;

    computeUfunction(time, demo.beta, demo.alpha);
    computeMaxU();
    computeMinU();
    computeMeshmoveStep_usejacobi();
}

function renderScene() {
    // Lines and background visuals generated here
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    checkersPlot();

    if (demo.chemtrail && demo.gridColorOption != 'off') {
        renderLines(demo.previousX, 1, 0, 1, 1, demo.gridLineWidth);
    }

    if (demo.gridColorOption == 'white') {
        renderLines(demo.x, .9,.9,.9,1,  demo.gridLineWidth);
    } else if (demo.gridColorOption == 'red') {
        renderLines(demo.x, .9,.0,.0,1,  demo.gridLineWidth);
    } else if (demo.gridColorOption == 'off') {
    }
}

function tick() {

    if (funcShaderChange) {
        var uFunctionHTML = document.getElementById('ufuncTextBox');
        demo.uFunction = uFunctionHTML.value;
        initialiseMeshControlShader(demo.uFunction);
        funcShaderChange = false;
    }
    if (reset) {
        resetStateVariables();
        reset = false;
    }

    if (saveSetR) {
        resetStateVariables();
        saveSetR = false;

        saveSetS = true;
        saveSetSkipHelper = 0;

        saveSetF = -1;
    }

    updateScene();
    renderScene();

    if (saveSetS) {
         saveSetSkipHelper += 1;
         if (saveSetSkipHelper == saveSetSkip) {
             saveSetSkipHelper = 0;
             saveSetF += 1;
             if (saveSetF == saveSetNFrames) {
                 saveSetS = false;
                 // do save.
                 console.log('saving...');
                 doAnimationSave();
             }else{
                 saveFrameX = true;
                 saveFrameU = true;
             }
         }
    }

    requestAnimationFrame(tick);
}

function resetStateVariables() {
    time = 0.0;

    var width = computeFrameBuffer.width, height = computeFrameBuffer.height;
    demo.dummyData = new Float32Array(Array.from({length: width * height * 4}, (v,i) => { return 1.0; }));
    demo.dummyDataForSave = new Float32Array(Array.from({length: width * height * 3}, (v,i) => { return 1.0; }));
    demo.xData = new Float32Array(Array.from({length: width * height * 4}, (v,i) => { return 1.0; }));
    demo.uData = new Float32Array(Array.from({length: width * height * 4}, (v,i) => { return 1.0; }));

    saveSetFramesX = [];
    saveSetFramesU = [];
    for (var i = 0; i < saveSetNFrames; ++i) {
        saveSetFramesX.push( new Float32Array(Array.from({length: width * height * 4}, (v,i) => { return 1.0; })) );
        saveSetFramesU.push( new Float32Array(Array.from({length: width * height * 4}, (v,i) => { return 1.0; })) );
    }

    demo.x00 = createComputeTexture(width, height, initialMeshData);
    demo.previousX = createComputeTexture(width, height, initialMeshData);
    demo.x = createComputeTexture(width, height, initialMeshData);
    demo.xk = createComputeTexture(width, height, initialMeshData);
    demo.boundaryConditionDirichlet = createComputeTexture(width, height, boundaryConditionDataDirichlet);
    demo.boundaryConditionNatural = createComputeTexture(width, height, boundaryConditionDataNatural);
    demo.u = createComputeTexture(width, height, demo.dummyData); 
    demo.renderTex = createComputeTexture(width, height, demo.dummyData); 
    demo.a = createComputeTexture(width, height, demo.dummyData); 
    demo.b = createComputeTexture(width, height, demo.dummyData); 
    demo.uMin = 0.0;
    demo.uMax = 1.0;
    demo.dt = 0.03;
    demo.beta = 0.0; 
    demo.alpha = 0.0;
    demo.jacobiIterationCount = 64;
}

function startDemo() {
    var canvas = document.getElementById("movingmeshdemocanvas");

    initGL(canvas);

    demo.uFunction = document.getElementById('ufuncTextBox').value;

    demo.nX = 64;
    demo.nY = 64;
    createComputeBuffers(demo.nX, demo.nY);

    initialseMeshmoveStepShader();
    initialiseMaxShader();
    initialiseMinShader();
    initialiseLinesShader();

    initialiseLinesProgram();
    initialiseMeshData(computeFrameBuffer.width, computeFrameBuffer.height,  -1.0,-1.0, 1.0,1.0);
    initialiseBoundaryConditionData(computeFrameBuffer.width, computeFrameBuffer.height);
    resetStateVariables();
    initialiseMeshControlShader(demo.uFunction);
    initialseCheckersShader();

    tick();
}

function save() {
    var elm = document.createElement('a');

    for (var i=0; i<computeFrameBuffer.height; ++i ) {
        for (var j=0; j<computeFrameBuffer.width; ++j ) {
            demo.dummyDataForSave[(i*computeFrameBuffer.width + j)*3 + 0] = demo.xData[(i*computeFrameBuffer.width + j)*4 + 0];
            demo.dummyDataForSave[(i*computeFrameBuffer.width + j)*3 + 1] = demo.xData[(i*computeFrameBuffer.width + j)*4 + 1];
            demo.dummyDataForSave[(i*computeFrameBuffer.width + j)*3 + 2] = demo.uData[(i*computeFrameBuffer.width + j)*4 + 0];
        }
    }

    var python =  `
%matplotlib notebook

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.collections as pltpc
xyudata = np.array([` + demo.dummyDataForSave + `])
gN, gK = `+demo.nX+`,`+demo.nY+`
X,Y,U = xyudata.reshape((gN,gK,3)).T
indicies = [ [i + j*gK, i+1 + j*gK, i+gK+1 + j*gK, i+gK + j*gK] for i in range(gK-1) for j in range(gN-1)]
fig, ax = plt.subplots(1,1,  figsize=(8,8))
ax.contourf(X,Y,U, levels=256, cmap='hot') 
xy = np.c_[X.flatten(),Y.flatten()]
verts = xy[indicies]
ax.add_collection(pltpc.PolyCollection(verts, linewidth=.8, color='white', facecolor='None')) `;

    elm.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(python));
    elm.setAttribute('download', 'grid.txt');

    elm.style.display = 'none';
    document.body.appendChild(elm);
    elm.click();
    document.body.removeChild(elm);
}


function doAnimationSave() {
    var elm = document.createElement('a');

var python = `
%matplotlib notebook

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.collections as pltpc
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation, PillowWriter
from IPython import display

gN, gK = `+demo.nX+`,`+demo.nY+`
indicies = [ [i + j*gK, i+1 + j*gK, i+gK+1 + j*gK, i+gK + j*gK] for i in range(gK-1) for j in range(gN-1)]
xyudata = []
`;

for (var k=0; k<saveSetFramesX.length; ++k){

    for (var i=0; i<computeFrameBuffer.height; ++i ) {
        for (var j=0; j<computeFrameBuffer.width; ++j ) {
            demo.dummyDataForSave[(i*computeFrameBuffer.width + j)*3 + 0] = saveSetFramesX[k][(i*computeFrameBuffer.width + j)*4 + 0];
            demo.dummyDataForSave[(i*computeFrameBuffer.width + j)*3 + 1] = saveSetFramesX[k][(i*computeFrameBuffer.width + j)*4 + 1];
            demo.dummyDataForSave[(i*computeFrameBuffer.width + j)*3 + 2] = saveSetFramesU[k][(i*computeFrameBuffer.width + j)*4 + 0];
        }
    }

    python +=  `
xyudata.append(np.array([` + demo.dummyDataForSave + `]))
 `;
}

python += `
plt.ioff()

fig, ax = plt.subplots(1,1,  figsize=(4,4))
plt.tight_layout(pad=0.0)
plt.subplots_adjust(top=1.01,left=-0.01,right=1.01,bottom=-0.01)

def animate(frame):
    global xyudata, ax, gN, gK, indicies
    X,Y,U = xyudata[frame].reshape((gN,gK,3)).T
    ax.contourf(X,Y,U, levels=256, cmap='hot') 
    xy = np.c_[X.flatten(),Y.flatten()]
    verts = xy[indicies]
    ax.add_collection(pltpc.PolyCollection(verts, linewidth=.4, color='white', facecolor='None')) 

    display.clear_output()
    display.HTML(f'frame: {frame}')
    return [ax]

ani = FuncAnimation(fig, animate, frames=np.arange(0,len(xyudata),1), blit=True, interval=0.4, repeat=True)

writer = PillowWriter(fps=10, metadata=dict(artist='Me'), bitrate=10000000)
giffname = 'gifname.gif'
ani.save(giffname, writer=writer)
display.HTML(f'<td> <img src="{giffname}" width=512px /> </td>')

`;

    elm.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(python));
    elm.setAttribute('download', 'grid.txt');

    elm.style.display = 'none';
    document.body.appendChild(elm);
    elm.click();
    document.body.removeChild(elm);
}
