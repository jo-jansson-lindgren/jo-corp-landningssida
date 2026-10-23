// Start page (index.html): a slow, soft "silk" behind everything, drawn by one small WebGL shader inside the
// fixed backdrop (.l-backdrop from site.js). Folds in cloud and sand with a faint persimmon warmth, lit from
// above; it drifts a little with time, scroll and the mouse. It is drawn at low resolution (it is soft anyway)
// and only while the tab is open, so it costs little. No WebGL: the plain backdrop stays as it was.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }',
    // the cloth: a few broad diagonal folds, bent by slow, large noise so they never look like stripes
    'float cloth(vec2 p){',
    '  float t = uTime * 0.03;',
    '  vec2 w = vec2(fbm(p * 0.35 + vec2(t, -t)), fbm(p * 0.35 + vec2(5.2, 1.3) - t)) - 0.5;',
    '  vec2 q = p + w * 1.6;',
    '  return 0.6 * sin(q.x * 0.9 + q.y * 1.5 + t * 1.5) + 0.4 * sin(q.x * -0.7 + q.y * 1.1 - t * 1.1 + 1.7);',
    '}',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes;',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * 2.6;',
    '  p.y -= uScroll; p += uMouse * 0.08;',
    '  float e = 0.04, h = cloth(p);',
    '  vec3 n = normalize(vec3(h - cloth(p + vec2(e, 0.0)), h - cloth(p + vec2(0.0, e)), e * 0.55));',
    '  vec3 L = normalize(vec3(-0.35 + uMouse.x * 0.15, 0.7 - uMouse.y * 0.1, 0.65));',
    '  float diff = clamp(dot(n, L) * 0.75 + 0.35, 0.0, 1.0);',
    '  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 8.0);',
    '  vec3 paper = vec3(0.941, 0.933, 0.914);',   // #F0EEE9
    '  vec3 sand  = vec3(0.895, 0.868, 0.82);',    // about the sand bands' colour
    '  vec3 warm  = vec3(0.957, 0.808, 0.757);',   // persimmon, washed out
    '  vec3 col = mix(sand, vec3(0.985, 0.98, 0.97), diff);',
    // persimmon warmth only in a few slow patches, and only in the shadows of the folds
    '  float warmth = smoothstep(0.55, 0.85, fbm(p * 0.35 + uTime * 0.01));',
    '  col = mix(col, warm, warmth * (1.0 - diff) * 0.55);',
    '  col += spec * 0.07;',
    // keep it quiet: blend part of the way back to the plain page colour, quieter towards the bottom of the screen
    '  float amount = mix(0.5, 0.8, uv.y);',
    // never darker than just under the page colour, so the small grey text keeps its contrast (4.5:1)
    '  gl_FragColor = vec4(max(mix(paper, col, amount), paper - 0.008), 1.0);',
    '}'
  ].join('\n');

  function start(backdrop) {
    var canvas = document.createElement('canvas');
    canvas.className = 'l-silk';
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return;

    var shader = function (type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // one triangle that covers the screen
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, 'uRes'), uTime = gl.getUniformLocation(prog, 'uTime');
    var uMouse = gl.getUniformLocation(prog, 'uMouse'), uScroll = gl.getUniformLocation(prog, 'uScroll');

    backdrop.insertBefore(canvas, backdrop.firstChild);

    // the silk is soft, so a third of the screen's pixels is plenty; CSS stretches it to full size
    var resize = function () {
      var k = Math.min(Math.max(0.35, 240 / window.innerWidth), 700 / window.innerWidth); // at least 240 px wide on phones
      canvas.width = Math.max(1, Math.round(window.innerWidth * k));
      canvas.height = Math.max(1, Math.round(window.innerHeight * k));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', function () { resize(); if (reduceMotion) draw(0); });

    // the mouse nudges the light and the cloth a little, easing in like the phone's lean (lugn.js)
    var mx = 0, my = 0, tx = 0, ty = 0;
    if (!reduceMotion) {
      window.addEventListener('pointermove', function (e) {
        tx = (e.clientX / window.innerWidth) * 2 - 1;
        ty = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }

    var t0 = performance.now();
    var draw = function (now) {
      mx += (tx - mx) * 0.03; my += (ty - my) * 0.03;
      gl.uniform1f(uTime, reduceMotion ? 12.0 : (now - t0) / 1000 + 12.0);
      gl.uniform2f(uMouse, mx, -my);
      gl.uniform1f(uScroll, reduceMotion ? 0 : window.scrollY / window.innerHeight * 0.35);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    var running = false;
    var loop = function (now) {
      if (document.hidden) { running = false; return; }
      draw(now);
      window.requestAnimationFrame(loop);
    };
    var go = function () {
      if (reduceMotion || running || document.hidden) return;
      running = true;
      window.requestAnimationFrame(loop);
    };
    draw(t0);
    window.requestAnimationFrame(function () { canvas.classList.add('is-on'); }); // next frame, so it fades in
    go();
    document.addEventListener('visibilitychange', go);
  }

  var find = function () {
    var backdrop = document.querySelector('.l-backdrop');
    if (backdrop) start(backdrop);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', find);
  else find();
})();
