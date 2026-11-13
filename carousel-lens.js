// The liquid preset follows the geometry and motion parameters of React Bits Flex Carousel.
// https://reactbits.dev/components/flex-carousel
const vertex = `#version 300 es
out vec2 uv;
void main() {
  vec2 point = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  uv = point;
  gl_Position = vec4(2.0 * point - 1.0, 0.0, 1.0);
}`;

const cardFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D artwork;
uniform vec2 size;
uniform float radius;
uniform float density;
out vec4 color;
void main() {
  vec2 point = abs((uv - .5) * size) - size * .5 + radius;
  float distance = length(max(point, 0.0)) + min(max(point.x, point.y), 0.0) - radius;
  float alpha = clamp(.5 - distance * density, 0.0, 1.0);
  color = vec4(texture(artwork, vec2(uv.x, 1.0 - uv.y)).rgb * alpha, alpha);
}`;

const lensFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D scene;
uniform vec2 size;
uniform float strength;
out vec4 color;
void main() {
  vec2 point = (uv - .5) * size;
  float angle = radians(62.0);
  float c = cos(angle), s = sin(angle);
  mat2 toLens = mat2(c, -s, s, c);
  vec2 axes = vec2(.74, 1.18) * size.x * .5;
  vec2 local = toLens * point / axes;
  float normalized = max(length(local), 1e-6);
  vec2 gradient = local / (axes * normalized);
  float gradientLength = max(length(gradient), 1e-6);
  float distance = (normalized - 1.0) / gradientLength;
  vec2 normal = transpose(toLens) * gradient / gradientLength;
  vec2 tangent = vec2(-normal.y, normal.x);

  float reach = max(4.0, .38 * (axes.x + axes.y) * .5);
  float t = clamp((distance + reach) / (2.6 * reach), 0.0, 1.0);
  float easing = t*t*t*(10.0 + t*(-15.0 + 6.0*t));
  float edge = 16.0 * pow(t * (1.0 - t), 2.0);
  float centerHalfWidth = size.y * .225;
  float side = sign(point.x) * smoothstep(centerHalfWidth, centerHalfWidth + size.x * .16, abs(point.x));
  float flow = .34 * (axes.x + axes.y) * .45 * side * strength;
  vec2 sampleUv = uv - (vec2(0.0, easing) + tangent * tangent.y * edge * .35) * flow / size;

  color = texture(scene, sampleUv);
  float dispersion = clamp(edge * flow * .45 * .12, -6.0, 6.0) / size.y;
  vec4 red = texture(scene, sampleUv + vec2(0.0, dispersion * .35));
  vec4 blue = texture(scene, sampleUv - vec2(0.0, dispersion * .35));
  if (color.a > .002) {
    color.r = mix(color.r, red.r * color.a / max(red.a, .002), red.a);
    color.b = mix(color.b, blue.b * color.a / max(blue.a, .002), blue.a);
  }
}`;

export function createCarouselLens(track, invalidate) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ecommerce-carousel-canvas';
  const gl = canvas.getContext('webgl2', { alpha: true, depth: false, antialias: false });
  if (!gl) return null;

  function shader(type, source) {
    const object = gl.createShader(type);
    gl.shaderSource(object, source);
    gl.compileShader(object);
    if (!gl.getShaderParameter(object, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(object));
    return object;
  }

  function program(fragment) {
    const object = gl.createProgram();
    const shaders = [shader(gl.VERTEX_SHADER, vertex), shader(gl.FRAGMENT_SHADER, fragment)];
    shaders.forEach(item => gl.attachShader(object, item));
    gl.linkProgram(object);
    shaders.forEach(item => gl.deleteShader(item));
    if (!gl.getProgramParameter(object, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(object));
    return object;
  }

  let cards, lens;
  try {
    cards = program(cardFragment);
    lens = program(lensFragment);
  } catch (error) {
    console.warn('Carousel lens:', error);
    return null;
  }
  const cardUniforms = ['size', 'radius', 'density'].map(name => gl.getUniformLocation(cards, name));
  const lensSize = gl.getUniformLocation(lens, 'size');
  const lensStrength = gl.getUniformLocation(lens, 'strength');
  const framebuffer = gl.createFramebuffer();
  const scene = gl.createTexture();
  const textures = new WeakMap();
  let width = 1;
  let height = 1;
  let density = 1;
  let available = true;

  function bindTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  function resize(nextWidth, nextHeight) {
    if (!available) return;
    width = nextWidth;
    height = nextHeight;
    density = Math.min(devicePixelRatio || 1, 2, Math.sqrt(4.5e6 / (width * height)));
    canvas.width = Math.max(1, Math.round(width * density));
    canvas.height = Math.max(1, Math.round(height * density));
    bindTexture(scene);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, scene, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) fallBack();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function fallBack() {
    available = false;
    track.classList.remove('has-lens');
    canvas.remove();
    invalidate();
  }

  function draw(visibleCards, strength) {
    if (!available) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(cards);
    for (const { image, x, y, width: cardWidth, height: cardHeight, radius } of visibleCards) {
      if (!image.complete || !image.naturalWidth) continue;
      let texture = textures.get(image);
      if (!texture) {
        texture = gl.createTexture();
        bindTexture(texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        textures.set(image, texture);
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.viewport(Math.round(x * density), Math.round((height - y - cardHeight) * density),
        Math.max(1, Math.round(cardWidth * density)), Math.max(1, Math.round(cardHeight * density)));
      gl.uniform2f(cardUniforms[0], cardWidth, cardHeight);
      gl.uniform1f(cardUniforms[1], radius);
      gl.uniform1f(cardUniforms[2], density);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(lens);
    gl.bindTexture(gl.TEXTURE_2D, scene);
    gl.uniform2f(lensSize, width, height);
    gl.uniform1f(lensStrength, strength);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  canvas.addEventListener('webglcontextlost', fallBack);
  track.prepend(canvas);
  track.classList.add('has-lens');
  return { draw, resize, get available() { return available; } };
}
