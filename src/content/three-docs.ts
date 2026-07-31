/**
 * 章末の API チップを、公式ドキュメント（英語版）へのリンクにするための対応表。
 *
 * ドキュメントの URL はクラスが属するカテゴリで決まるので、必要なのはクラス名とカテゴリの
 * 対応だけでよい。メソッドやプロパティはアンカーとして後ろに付ける。
 *   Vector3.dot → https://threejs.org/docs/index.html#api/en/math/Vector3.dot
 */

const DOCS_ROOT = 'https://threejs.org/docs/index.html';

/** three 本体。クラス名 → カテゴリ。 */
const CORE: Record<string, string> = {
  // math
  Vector2: 'math', Vector3: 'math', Vector4: 'math',
  Matrix3: 'math', Matrix4: 'math', Quaternion: 'math', Euler: 'math',
  Color: 'math', Box2: 'math', Box3: 'math', Sphere: 'math', Plane: 'math',
  Ray: 'math', Triangle: 'math', Line3: 'math', Frustum: 'math',
  Spherical: 'math', Cylindrical: 'math', MathUtils: 'math',

  // core
  Object3D: 'core', BufferGeometry: 'core', BufferAttribute: 'core',
  InstancedBufferAttribute: 'core', InterleavedBuffer: 'core',
  Raycaster: 'core', Clock: 'core', EventDispatcher: 'core',
  Layers: 'core', Uniform: 'core', GLBufferAttribute: 'core',

  // objects
  Mesh: 'objects', Group: 'objects', Line: 'objects', LineSegments: 'objects',
  LineLoop: 'objects', Points: 'objects', Sprite: 'objects',
  InstancedMesh: 'objects', BatchedMesh: 'objects', LOD: 'objects',
  SkinnedMesh: 'objects', Skeleton: 'objects', Bone: 'objects',

  // materials
  Material: 'materials', MeshBasicMaterial: 'materials',
  MeshStandardMaterial: 'materials', MeshPhysicalMaterial: 'materials',
  MeshLambertMaterial: 'materials', MeshPhongMaterial: 'materials',
  MeshToonMaterial: 'materials', MeshNormalMaterial: 'materials',
  MeshDepthMaterial: 'materials', MeshMatcapMaterial: 'materials',
  LineBasicMaterial: 'materials', LineDashedMaterial: 'materials',
  PointsMaterial: 'materials', SpriteMaterial: 'materials',
  ShaderMaterial: 'materials', RawShaderMaterial: 'materials',
  ShadowMaterial: 'materials',

  // geometries
  BoxGeometry: 'geometries', SphereGeometry: 'geometries',
  PlaneGeometry: 'geometries', CircleGeometry: 'geometries',
  CylinderGeometry: 'geometries', ConeGeometry: 'geometries',
  TorusGeometry: 'geometries', TorusKnotGeometry: 'geometries',
  RingGeometry: 'geometries', CapsuleGeometry: 'geometries',
  IcosahedronGeometry: 'geometries', OctahedronGeometry: 'geometries',
  DodecahedronGeometry: 'geometries', TetrahedronGeometry: 'geometries',
  PolyhedronGeometry: 'geometries', LatheGeometry: 'geometries',
  TubeGeometry: 'geometries', ExtrudeGeometry: 'geometries',
  ShapeGeometry: 'geometries', EdgesGeometry: 'geometries',
  WireframeGeometry: 'geometries',

  // cameras
  Camera: 'cameras', PerspectiveCamera: 'cameras',
  OrthographicCamera: 'cameras', ArrayCamera: 'cameras',
  CubeCamera: 'cameras', StereoCamera: 'cameras',

  // lights
  Light: 'lights', AmbientLight: 'lights', DirectionalLight: 'lights',
  HemisphereLight: 'lights', PointLight: 'lights', RectAreaLight: 'lights',
  SpotLight: 'lights', LightProbe: 'lights',
  LightShadow: 'lights/shadows', DirectionalLightShadow: 'lights/shadows',
  PointLightShadow: 'lights/shadows', SpotLightShadow: 'lights/shadows',

  // scenes
  Scene: 'scenes', Fog: 'scenes', FogExp2: 'scenes',

  // renderers
  WebGLRenderer: 'renderers', WebGLRenderTarget: 'renderers',
  WebGLCubeRenderTarget: 'renderers', WebGLProgram: 'renderers/webgl',
  PMREMGenerator: 'extras', ColorManagement: 'math',

  // textures
  Texture: 'textures', CanvasTexture: 'textures', CubeTexture: 'textures',
  DataTexture: 'textures', Data3DTexture: 'textures', DepthTexture: 'textures',
  VideoTexture: 'textures', CompressedTexture: 'textures',
  FramebufferTexture: 'textures',

  // loaders
  Loader: 'loaders', LoadingManager: 'loaders/managers',
  TextureLoader: 'loaders', FileLoader: 'loaders', ImageLoader: 'loaders',
  CubeTextureLoader: 'loaders', ObjectLoader: 'loaders',
  MaterialLoader: 'loaders', BufferGeometryLoader: 'loaders',
  AudioLoader: 'loaders', ImageBitmapLoader: 'loaders',

  // helpers
  ArrowHelper: 'helpers', AxesHelper: 'helpers', BoxHelper: 'helpers',
  Box3Helper: 'helpers', CameraHelper: 'helpers', GridHelper: 'helpers',
  PolarGridHelper: 'helpers', PlaneHelper: 'helpers',
  DirectionalLightHelper: 'helpers', HemisphereLightHelper: 'helpers',
  PointLightHelper: 'helpers', SpotLightHelper: 'helpers',
  SkeletonHelper: 'helpers', VertexNormalsHelper: 'helpers',

  // extras
  Curve: 'extras/core', CurvePath: 'extras/core', Path: 'extras/core',
  Shape: 'extras/core', ShapePath: 'extras/core',
  CatmullRomCurve3: 'extras/curves', CubicBezierCurve3: 'extras/curves',
  QuadraticBezierCurve3: 'extras/curves', LineCurve3: 'extras/curves',
  CubicBezierCurve: 'extras/curves', QuadraticBezierCurve: 'extras/curves',
  LineCurve: 'extras/curves', EllipseCurve: 'extras/curves',
  SplineCurve: 'extras/curves', ArcCurve: 'extras/curves',

  // animation
  AnimationMixer: 'animation', AnimationClip: 'animation',
  AnimationAction: 'animation', KeyframeTrack: 'animation',

  // audio
  Audio: 'audio', AudioListener: 'audio', PositionalAudio: 'audio',
  AudioAnalyser: 'audio',
};

/** three/addons（examples）側。クラス名 → カテゴリ。 */
const ADDONS: Record<string, string> = {
  OrbitControls: 'controls',
  MapControls: 'controls',
  TrackballControls: 'controls',
  FlyControls: 'controls',
  PointerLockControls: 'controls',
  TransformControls: 'controls',
  DragControls: 'controls',
  GLTFLoader: 'loaders',
  DRACOLoader: 'loaders',
  OBJLoader: 'loaders',
  FBXLoader: 'loaders',
  SVGLoader: 'loaders',
  CSS2DRenderer: 'renderers',
  CSS3DRenderer: 'renderers',
  EffectComposer: 'postprocessing',
  RenderPass: 'postprocessing',
  UnrealBloomPass: 'postprocessing',
  OutputPass: 'postprocessing',
  ShaderPass: 'postprocessing',
  SMAAPass: 'postprocessing',
  BufferGeometryUtils: 'utils',
  RoomEnvironment: 'environments',
};

/**
 * three のものではない、または公式ドキュメントに項目が無いためリンクしない名前。
 * ここに無い未知のクラス名は、整合性チェックで警告される。
 */
const UNLINKED = new Set(['Math', 'Number', 'GLSL', 'WebGL', 'window', 'document', 'requestAnimationFrame']);

/** 'Vector3.dot' や 'THREE.Vector3' から、公式ドキュメントの URL を作る。 */
export function docsUrl(api: string): string | null {
  const trimmed = api.replace(/^THREE\./, '');
  const [className, ...rest] = trimmed.split('.');
  if (!className) return null;

  const member = rest.join('.');
  const anchor = member ? `${className}.${member}` : className;

  const core = CORE[className];
  if (core) return `${DOCS_ROOT}#api/en/${core}/${anchor}`;

  const addon = ADDONS[className];
  if (addon) return `${DOCS_ROOT}#examples/en/${addon}/${anchor}`;

  return null;
}

/** 整合性チェック用。リンクを張れないが、それが意図どおりかを判定する。 */
export function isKnownUnlinked(api: string): boolean {
  const className = api.replace(/^THREE\./, '').split('.')[0] ?? '';
  return UNLINKED.has(className);
}
