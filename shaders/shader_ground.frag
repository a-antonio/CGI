precision highp float;

uniform vec4 uColor;

varying vec3 fNormal;

varying vec4 fColor;

void main() {
    gl_FragColor = uColor;
}