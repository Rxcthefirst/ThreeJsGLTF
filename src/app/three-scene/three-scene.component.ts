import { Component, OnInit, AfterViewInit, ElementRef, Input, ViewChild } from '@angular/core';
import * as THREE from 'three';

import {
  GLTF,
  GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-three-scene',
  templateUrl: './three-scene.component.html',
  styleUrls: ['./three-scene.component.css']
})
export class ThreeSceneComponent {

  
  
  @ViewChild('canvas')
  private canvasRef!: ElementRef;
  
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  
  private aspect!: number;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private hemisphere!: THREE.HemisphereLight;
  private loader!: GLTFLoader;
  private mainLight!: THREE.DirectionalLight;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;

  deltaX = 0.01;
  deltaY = 0.01;
  deltaZ = 0.01;
  far = 100;
  fov = 35;
  gammaFactor = 2.2;
  gammaOutput = true;
  near = 1;
  physicallyCorrectLights = true;
  sceneBackground = 0x8fbcd4;

  clock = new THREE.Clock();
  mixers = new Array<THREE.AnimationMixer>();
  flamingoPosition = new THREE.Vector3(7.5, 0, -10);
  flamingoUrl = 'https://rawcdn.githack.com/mrdoob/three.js/7249d12dac2907dac95d36227d62c5415af51845/examples/models/gltf/Flamingo.glb';
  parrotPosition = new THREE.Vector3(0, 0, 2.5);
  parrotUrl = 'https://rawcdn.githack.com/mrdoob/three.js/7249d12dac2907dac95d36227d62c5415af51845/examples/models/gltf/Parrot.glb';
  storkPosition = new THREE.Vector3(0, -2.5, -10);
  storkUrl = 'https://rawcdn.githack.com/mrdoob/three.js/7249d12dac2907dac95d36227d62c5415af51845/examples/models/gltf/Stork.glb'
  
  directionalLightOptions = {
    color: 0xffffff,
    intensity: 5
  };

  hemisphereOptions = {
    skyColor: 0xddeeff,
    groundColor: 0x0f0e0d,
    intensity: 5
  };


  @Input() public texture: string = '/assets/tri_pattern.jpg'
  @Input() public rotationSpeedX: number = 0.05;
  @Input() public rotationSpeedY: number = 0.01;
  @Input() public size: number = 200;

  //private loader = new THREE.TextureLoader();
  private geometry = new THREE.BoxGeometry(1,1,1);
  //private material = new THREE.MeshBasicMaterial({map: this.loader.load(this.texture)})

  //private cube: THREE.Mesh = new THREE.Mesh(this.geometry, this.material);


  // * Stage properties

  @Input() public cameraZ: number = 400;
  @Input() public fieldOfView: number = 1;
  @Input('nearClipping') public nearClippingPlane: number = 1;
  @Input('farClipping') public farClippingPlane: number = 1000;
  
  ngAfterViewInit(): void {
      this.createScene();
      this.startRenderingLoop();

      window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  ngOnInit() {

  }



  /**
   * @private
   * @memberof CubeComponent
   */
  private createScene() {
    //* Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.sceneBackground);
    //this.scene.add(this.cube);


    //* Camera
    //let aspectRatio = this.getAspectRatio();
    // this.camera = new THREE.PerspectiveCamera(
    //   this.fov,
    //   this.aspect,
    //   this.near,
    //   this.far
    // );
    // this.camera.position.set(-1.5, 1.5, 6.5);
    this.createCamera();
    this.createControls();
    this.createLight();
    this.createModels();
  }

  private getAspectRatio() {
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  private createCamera = () => {
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.aspect,
      this.near,
      this.far
    );

    // this.camera.position.set(-75, 35, 142);
    this.camera.position.set(-1.5, 1.5, 6.5);
  }


  // CONTROLS

  private createControls = () => this.controls = new OrbitControls(this.camera, this.canvas);

  private createLight = () => {
    this.hemisphere = new THREE.HemisphereLight(
      this.hemisphereOptions.skyColor,
      this.hemisphereOptions.groundColor,
      this.hemisphereOptions.intensity
    );

    this.mainLight = new THREE.DirectionalLight(
      this.directionalLightOptions.color,
      this.directionalLightOptions.intensity
    );
    this.mainLight.position.set(10, 10, 10);

    this.scene.add(this.hemisphere, this.mainLight);
  }

  private createModels = () => {
    this.loader = new GLTFLoader();
    const loadModel = (gltf: GLTF, position: THREE.Vector3) => {
      const model = gltf.scene.children[0];
      model.position.copy(position);
      model.scale.set(0.02, 0.02, 0.02);

      const animation = gltf.animations[0];

      const mixer = new THREE.AnimationMixer(model);
      this.mixers.push(mixer);

      const action = mixer.clipAction(animation);
      action.play();

      this.scene.add(model);
    }
    
    this.loader.load(
      this.parrotUrl,
      gltf => loadModel(gltf, this.parrotPosition),
      () => {},
      err => console.log(err)
    );

    this.loader.load(
      this.flamingoUrl,
      gltf => loadModel(gltf, this.flamingoPosition),
      () => {},
      err => console.log(err)
    );

    this.loader.load(
      this.storkUrl,
      gltf => loadModel(gltf, this.storkPosition),
      () => {},
      err => console.log(err)
    );
  }



  // /** 
  //  *@private
  //  *@memberof CubeComponent
  // */
  // private animateCube() {
  //   this.cube.rotation.x += this.rotationSpeedX;
  //   this.cube.rotation.y += this.rotationSpeedY;
  // }

  /**
   * Start the rendering loop
   * 
   * @private
   * @memberof CubeComponent
   */
  private startRenderingLoop() {
    //* Renderer
    // Use canvas in template
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    

    let component: ThreeSceneComponent = this;
    (function render() {
      requestAnimationFrame(render);
      //component.animateCube();
      component.update();
      component.renderer.render(component.scene, component.camera);
    }()); 
  }

  private onWindowResize() {
    
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }

  // INITIALIZATION

  private update = () => {
    const delta = this.clock.getDelta();
    this.mixers.forEach(x => x.update(delta));
  }

}
