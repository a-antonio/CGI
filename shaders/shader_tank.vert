uniform mat4 mModelView;
uniform mat4 mProjection;
uniform vec3 time;

attribute vec4 vPosition;
attribute vec3 vNormal;
attribute vec4 vColor;


varying vec4 fColor;
varying vec3 fNormal;

void main() {
    gl_Position = mProjection * mModelView * vPosition;
    fColor = vColor;
}