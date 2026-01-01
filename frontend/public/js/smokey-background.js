
(function() {
    // Configuration
    const config = {
        color: "#1E40AF", // Default dark blue
        backdropBlur: "backdrop-blur-sm" // Tailwind class equivalent
    };

    // Create Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'smokey-background';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none'; // Let clicks pass through
    document.body.prepend(canvas);

    // Add blur overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '-1';
    overlay.style.pointerEvents = 'none';
    // Simple blur effect using CSS since we might not have Tailwind loaded
    overlay.style.backdropFilter = 'blur(4px)'; 
    document.body.prepend(overlay);


    // WebGL Context
    const gl = canvas.getContext("webgl");
    if (!gl) {
        console.error("WebGL not supported");
        return;
    }

    // Shaders
    const vertexSource = `
        attribute vec4 a_position;
        void main() {
            gl_Position = a_position;
        }
    `;

    const fragmentSource = `
        precision mediump float;

        uniform vec2 iResolution;
        uniform float iTime;
        uniform vec2 iMouse;
        uniform vec3 u_color;

        void mainImage(out vec4 fragColor, in vec2 fragCoord){
            vec2 uv = fragCoord / iResolution;
            vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

            float time = iTime * 0.5;

            // Normalize mouse input (0.0 - 1.0) and remap to -1.0 ~ 1.0
            vec2 mouse = iMouse / iResolution;
            vec2 rippleCenter = 2.0 * mouse - 1.0;

            vec2 distortion = centeredUV;
            // Apply distortion for a wavy, smokey effect
            for (float i = 1.0; i < 8.0; i++) {
                distortion.x += 0.5 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
                distortion.y += 0.5 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
            }

            // Create a glowing wave pattern
            float wave = abs(sin(distortion.x + distortion.y + time));
            float glow = smoothstep(0.9, 0.2, wave);

            fragColor = vec4(u_color * glow, 1.0);
        }

        void main() {
            mainImage(gl_FragColor, gl_FragCoord.xy);
        }
    `;

    function compileShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program linking error:", gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Buffer setup
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const iMouseLocation = gl.getUniformLocation(program, "iMouse");
    const uColorLocation = gl.getUniformLocation(program, "u_color");

    // State
    let startTime = Date.now();
    let mousePosition = { x: 0, y: 0 };
    let isHovering = false;

    // Helper: Hex to RGB
    function hexToRgb(hex) {
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        return [r, g, b];
    }

    const [r, g, b] = hexToRgb(config.color);
    gl.uniform3f(uColorLocation, r, g, b);

    // Render Loop
    function render() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Resize canvas if needed
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
        }

        const currentTime = (Date.now() - startTime) / 1000;

        gl.uniform2f(iResolutionLocation, width, height);
        gl.uniform1f(iTimeLocation, currentTime);
        
        // Mouse interaction
        const targetX = isHovering ? mousePosition.x : width / 2;
        const targetY = isHovering ? height - mousePosition.y : height / 2;
        gl.uniform2f(iMouseLocation, targetX, targetY);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }

    // Event Listeners
    window.addEventListener('mousemove', (e) => {
        mousePosition = { x: e.clientX, y: e.clientY };
        isHovering = true;
    });

    window.addEventListener('mouseout', () => {
        isHovering = false;
    });

    // Start
    render();
})();
