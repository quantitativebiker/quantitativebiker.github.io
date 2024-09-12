const meshControlStepVertexShader = `
    attribute vec4 aVertexPosition;
    void main(void) {
        gl_Position = aVertexPosition;
    }`;

const meshControlStepFragmentShader = (userFunction) => `
    precision highp float;

    uniform vec2 srcDimensions;
    
    uniform sampler2D in_x;
    uniform sampler2D in_u;
    uniform float t;

    uniform float beta;
    uniform float gam;

    void main(void) {
        vec2 h = 1.0 / srcDimensions;
        vec2 ltextureCoord = gl_FragCoord.xy * h; 

        vec2 right  = ltextureCoord + vec2( 1, 0) * h;
        vec2 left   = ltextureCoord + vec2(-1, 0) * h;
        vec2 top    = ltextureCoord + vec2(0,  1) * h;
        vec2 bottom = ltextureCoord + vec2(0, -1) * h;

        vec4 x_  = texture2D(in_x, ltextureCoord);
        float x = x_.x, y = x_.y;
        
        const float pi = 3.141592653589793; // useful for user specified userFunction involving trig funcs etc
        float u = ` + userFunction + `;
        
        // (2nd pass) FDM derivative approximation for low pass filter
        vec4 uR = texture2D(in_u, right);
        vec4 uL = texture2D(in_u, left);
        vec4 uT = texture2D(in_u, top);
        vec4 uB = texture2D(in_u, bottom);
        
        vec2 xR = texture2D(in_x, right).xy;
        vec2 xL = texture2D(in_x, left).xy;
        vec2 xT = texture2D(in_x, top).xy;
        vec2 xB = texture2D(in_x, bottom).xy;

	    vec2 gradpU = 0.5 * vec2(uR.x - uL.x, uT.x - uB.x) / h;

        // Using a tight stencil 
        vec2 x_xi  = 0.25 * (xR - xL) / h;
        vec2 x_eta = 0.25 * (xT - xB) / h;
        vec2 gradcU = vec2(gradpU.x * x_xi.x  + gradpU.y * x_xi.y,  gradpU.x * x_eta.x + gradpU.y * x_eta.y);

        float term2 = gradcU.x * gradcU.x + gradcU.y * gradcU.y; // uxiuxi + uetaueta
        float term1 = gam * abs(u);

        float w = sqrt(1.0 + beta * beta * term2 + term1 );

        gl_FragColor = vec4(u, gradcU.x, gradcU.y, w);
    }`;

var meshControlProgram = null;
function initialiseMeshControlShader(uFunction) { 
    meshControlProgramNew = loadShader(meshControlStepVertexShader, meshControlStepFragmentShader(uFunction)); 

    if (meshControlProgramNew) {
        if (meshControlProgram) {
            gl.deleteProgram(meshControlProgram);
        }
        meshControlProgram = meshControlProgramNew;
        document.getElementById('ufuncTextBox').style.backgroundColor = '#fff';
    } else {
        document.getElementById('ufuncTextBox').style.backgroundColor = '#f55';
        return;
    }

    meshControlProgram.aVertexPosition = gl.getAttribLocation(meshControlProgram, "aVertexPosition");
    meshControlProgram.srcDimensions = gl.getUniformLocation(meshControlProgram, "srcDimensions");
    meshControlProgram.in_x = gl.getUniformLocation(meshControlProgram, "in_x");
    meshControlProgram.in_u = gl.getUniformLocation(meshControlProgram, "in_u");
    meshControlProgram.t = gl.getUniformLocation(meshControlProgram, "t");
    meshControlProgram.beta = gl.getUniformLocation(meshControlProgram, "beta");
    meshControlProgram.alpha = gl.getUniformLocation(meshControlProgram, "gam");
}

function computeUfunction(t, beta, alpha) {
    // u is customizable user input and
    // needs to be evaluated at all (x,y)
    gl.bindFramebuffer(gl.FRAMEBUFFER, computeFrameBuffer);
    gl.viewport(0,0, computeFrameBuffer.width,computeFrameBuffer.height);

    gl.useProgram(meshControlProgram);
    gl.uniform2f(meshControlProgram.srcDimensions, computeFrameBuffer.width,computeFrameBuffer.height);

    gl.uniform1f(meshControlProgram.beta, beta);
    gl.uniform1f(meshControlProgram.alpha, alpha);

    gl.enableVertexAttribArray(meshControlProgram.aVertexPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, computeIndexBuffer);
    gl.vertexAttribPointer(meshControlProgram.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1i(meshControlProgram.in_x, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, demo.x);

    gl.uniform1i(meshControlProgram.in_u, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, demo.u);

    gl.uniform1f(meshControlProgram.t, t);

    for (var pass = 0; pass < 2; ++ pass) { // 2 passes for catching finite difference derivatives and effective low pass filter
        gl.drawArrays(gl.TRIANGLES, 0, 6); 
        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, computeFrameBuffer.width,computeFrameBuffer.height);
    }

    gl.activeTexture(gl.TEXTURE0);

    // copied into demo.a for use in finding maximum
    gl.bindTexture(gl.TEXTURE_2D, demo.a);
    gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, computeFrameBuffer.width, computeFrameBuffer.height);
    // and b for min
    gl.bindTexture(gl.TEXTURE_2D, demo.b);
    gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, computeFrameBuffer.width, computeFrameBuffer.height);

    gl.readPixels(0,0, computeFrameBuffer.width,computeFrameBuffer.height, gl.RGBA, gl.FLOAT, demo.uData);

    if( saveFrameU ) {
        gl.readPixels(0,0, computeFrameBuffer.width,computeFrameBuffer.height, gl.RGBA, gl.FLOAT, saveSetFramesU[saveSetF]);
        saveFrameU = false;
    }
}
