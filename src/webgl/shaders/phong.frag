precision mediump float;

//uniform mat4 uModelViewMatrix;
uniform mat4 uViewMatrix;

uniform vec4 uMaterialColor;
uniform sampler2D uSampler;
uniform bool isTexture;
uniform bool uUseLighting;

uniform vec3 uLightingDirection[8];
uniform vec3 uDirectionalColor[8];
uniform vec3 uPointLightLocation[8];
uniform vec3 uPointLightColor[8];
uniform bool uSpecular;
uniform float uShininess;
uniform float uConstantAttenuation;
uniform float uLinearAttenuation;
uniform float uQuadraticAttenuation;

uniform int uDirectionalLightCount;
uniform int uPointLightCount;

varying vec3 vNormal;
varying vec2 vTexCoord;
varying vec3 vViewPosition;
varying vec3 vAmbientColor;

vec3 V;
vec3 N;

const float specularFactor = 2.0;
const float diffuseFactor = 0.73;

struct LightResult {
	float specular;
	float diffuse;
};

float phongSpecular(
  vec3 lightDirection,
  vec3 viewDirection,
  vec3 surfaceNormal,
  float shininess) {

  vec3 R = normalize(reflect(-lightDirection, surfaceNormal));  
  return pow(max(0.0, dot(R, viewDirection)), shininess);
}

float lambertDiffuse(
  vec3 lightDirection,
  vec3 surfaceNormal) {
  return max(0.0, dot(-lightDirection, surfaceNormal));
}

LightResult light(vec3 lightVector) {

  vec3 L = normalize(lightVector);

  //compute our diffuse & specular terms
  LightResult lr;
  if (uSpecular)
    lr.specular = phongSpecular(L, V, N, uShininess);
  lr.diffuse = lambertDiffuse(L, N);
  return lr;
}

void main(void) {

  V = normalize(vViewPosition);
  N = vNormal;

  vec3 diffuse = vec3(0.0);
  float specular = 0.0;

  for (int j = 0; j < 8; j++) {
    if( j < uDirectionalLightCount){
      vec3 dir = (uViewMatrix * vec4(uLightingDirection[j], 0.0)).xyz;
      LightResult result = light(dir);
      diffuse += result.diffuse * uDirectionalColor[j];
      specular += result.specular;
    }

    if( j < uPointLightCount){
      vec3 lightPosition = (uViewMatrix * vec4(uPointLightLocation[j], 1.0)).xyz;
      vec3 lightVector = vViewPosition - lightPosition;
    
      //calculate attenuation
      float lightDistance = length(lightVector);
      float fallOffFactor =  1.0 / (constantAttenuation + lightDistance * (linearAttenuation + quadraticAttenuation * lightDistance));

      LightResult result = light(lightVector);
      diffuse += result.diffuse * uPointLightColor[j] * fallOffFactor;
      specular += result.specular * fallOffFactor;
    }
  }

  gl_FragColor = isTexture ? texture2D(uSampler, vTexCoord) : uMaterialColor;
  gl_FragColor.rgb = gl_FragColor.rgb * (diffuse * diffuseFactor + vAmbientColor) + specular * specularFactor;
}