import * as THREE from 'three';
import { WolfCharacter } from './WolfMeshBuilder';
import { SeatPlayerInfo, DEFAULT_OUTFIT } from './types';

export class CampfireScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  private characters: Map<number, WolfCharacter> = new Map();
  private seatMeshes: THREE.Mesh[] = [];
  private campfireLight!: THREE.PointLight;
  private ambientLight!: THREE.AmbientLight;
  private moonLight!: THREE.DirectionalLight;
  private flameMeshes: THREE.Mesh[] = [];

  private isNight = true;
  private animFrameId: number | null = null;
  private lastTime = 0;

  // Camera Orbit Controls
  private cameraRadius = 11.5;
  private cameraAngle = Math.PI / 2;
  private cameraHeight = 7.0;
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };

  private onSeatClickCallback?: (seatNumber: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070710);
    this.scene.fog = new THREE.FogExp2(0x070710, 0.04);

    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      60
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.initLights();
    this.initEnvironment();
    this.initCampfire();
    this.initSeats();
    this.initInteractions(canvas);

    this.animate = this.animate.bind(this);
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  private initLights(): void {
    // Ánh sáng môi trường đêm trăng
    this.ambientLight = new THREE.AmbientLight(0x1e1b4b, 0.9);
    this.scene.add(this.ambientLight);

    // Ánh trăng chiếu rọi từ trên cao
    this.moonLight = new THREE.DirectionalLight(0x818cf8, 1.4);
    this.moonLight.position.set(10, 18, -12);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.scene.add(this.moonLight);

    // Ánh lửa bập bùng giữa đống lửa
    this.campfireLight = new THREE.PointLight(0xf97316, 3.5, 18, 1.2);
    this.campfireLight.position.set(0, 0.8, 0);
    this.campfireLight.castShadow = true;
    this.scene.add(this.campfireLight);
  }

  private initEnvironment(): void {
    // Mặt đất bãi cỏ rừng thiêng
    const groundGeo = new THREE.CylinderGeometry(14, 15, 0.5, 18);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9,
      flatShading: true,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Rặng thông Low-Poly bao quanh làng
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9, flatShading: true });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.8, flatShading: true });

    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const dist = 11.5 + Math.random() * 2.5;
      const x = Math.sin(angle) * dist;
      const z = Math.cos(angle) * dist;

      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.2, 5), treeTrunkMat);
      trunk.position.y = 0.6;
      trunk.castShadow = true;
      tree.add(trunk);

      // 3 tầng lá thông tam giác
      for (let layer = 0; layer < 3; layer++) {
        const rad = 1.1 - layer * 0.25;
        const height = 1.2;
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(rad, height, 5), pineMat);
        leaves.position.y = 1.4 + layer * 0.85;
        leaves.castShadow = true;
        tree.add(leaves);
      }

      tree.position.set(x, 0, z);
      tree.scale.setScalar(0.85 + Math.random() * 0.35);
      this.scene.add(tree);
    }

    // Mặt Trăng Tròn lơ lửng trên nền trời
    const moonGeo = new THREE.SphereGeometry(1.8, 12, 12);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(16, 26, -18);
    this.scene.add(moon);
  }

  private initCampfire(): void {
    // Vòng đá quây quanh đống lửa
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8, flatShading: true });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), stoneMat);
      stone.position.set(Math.sin(angle) * 1.0, 0.16, Math.cos(angle) * 1.0);
      stone.rotation.set(Math.random(), Math.random(), Math.random());
      stone.castShadow = true;
      this.scene.add(stone);
    }

    // Thanh củi bắt chéo
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9, flatShading: true });
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 5), woodMat);
      log.position.set(0, 0.15, 0);
      log.rotation.y = (i * Math.PI) / 4;
      log.rotation.z = Math.PI / 4;
      this.scene.add(log);
    }

    // Lửa cháy cách điệu Low-Poly
    const flameMat1 = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85 });
    const flameMat2 = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9 });
    const flameMat3 = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 });

    const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.2, 5), flameMat1);
    f1.position.y = 0.65;
    this.scene.add(f1);
    this.flameMeshes.push(f1);

    const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 4), flameMat2);
    f2.position.set(0.08, 0.55, 0.05);
    this.scene.add(f2);
    this.flameMeshes.push(f2);

    const f3 = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.05, 4), flameMat3);
    f3.position.set(-0.06, 0.58, -0.06);
    this.scene.add(f3);
    this.flameMeshes.push(f3);
  }

  private initSeats(): void {
    const stumpMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.9, flatShading: true });
    const radius = 5.2;

    for (let seat = 1; seat <= 10; seat++) {
      const angle = ((seat - 1) / 10) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      // Gốc cây ngồi (Tree Stump)
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.42, 7), stumpMat);
      stump.position.set(x, 0.21, z);
      stump.castShadow = true;
      stump.receiveShadow = true;
      stump.userData = { seatNumber: seat };
      this.scene.add(stump);
      this.seatMeshes.push(stump);

      // Nhân vật ngồi trên ghế
      const char = new WolfCharacter(DEFAULT_OUTFIT);
      char.root.position.set(x, 0.38, z);
      // Quay mặt về phía đống lửa trung tâm (0, 0, 0)
      char.root.rotation.y = angle + Math.PI;
      this.scene.add(char.root);
      this.characters.set(seat, char);
    }
  }

  private initInteractions(canvas: HTMLCanvasElement): void {
    const getPos = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if ('clientX' in e) {
        return { x: e.clientX, y: e.clientY };
      }
      return { x: 0, y: 0 };
    };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      this.isDragging = true;
      this.previousMousePosition = getPos(e);
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging) return;
      const currentPos = getPos(e);
      const deltaX = currentPos.x - this.previousMousePosition.x;
      const deltaY = currentPos.y - this.previousMousePosition.y;

      // Xoay góc nhìn camera quanh đống lửa
      this.cameraAngle -= deltaX * 0.007;
      this.cameraHeight = Math.max(3.5, Math.min(11.0, this.cameraHeight + deltaY * 0.015));

      this.updateCameraPosition();
      this.previousMousePosition = currentPos;
    };

    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging) return;
      this.isDragging = false;

      // Bắt sự kiện click vào ghế
      const rect = canvas.getBoundingClientRect();
      const pos = 'changedTouches' in e ? e.changedTouches[0] : (e as MouseEvent);
      if (!pos) return;

      const mouseX = ((pos.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((pos.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);
      const intersects = raycaster.intersectObjects(this.seatMeshes);

      if (intersects.length > 0) {
        const clickedSeat = intersects[0].object.userData.seatNumber;
        if (clickedSeat && this.onSeatClickCallback) {
          this.onSeatClickCallback(clickedSeat);
        }
      }
    };

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });
  }

  private updateCameraPosition(): void {
    this.camera.position.x = Math.sin(this.cameraAngle) * this.cameraRadius;
    this.camera.position.z = Math.cos(this.cameraAngle) * this.cameraRadius;
    this.camera.position.y = this.cameraHeight;
    this.camera.lookAt(0, 1.2, 0);
  }

  public setOnSeatClick(callback: (seatNumber: number) => void): void {
    this.onSeatClickCallback = callback;
  }

  public updateSeatsState(seats: SeatPlayerInfo[]): void {
    seats.forEach((info) => {
      const char = this.characters.get(info.seatNumber);
      if (!char) return;

      // Cập nhật trang phục nếu có
      if (info.outfit) {
        char.updateOutfit(info.outfit);
      }

      // Đặt trạng thái còn sống hay chết
      char.setGhostMode(!info.isAlive);

      // Đặt hoạt cảnh theo thời điểm
      if (!info.isAlive) {
        char.setAnimation('slumber');
      } else if (this.isNight) {
        // Ban đêm: Ma Sói mở mắt trừng trừng, Dân Làng cúi đầu ngủ
        if (info.isWerewolf) {
          char.setAnimation('howl');
        } else {
          char.setAnimation('slumber');
        }
      } else {
        // Ban ngày
        if (info.isSpeaking) {
          char.setAnimation('point');
        } else {
          char.setAnimation('idle');
        }
      }
    });
  }

  public setPhase(isNight: boolean): void {
    this.isNight = isNight;
    if (isNight) {
      this.scene.background = new THREE.Color(0x070710);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.setHex(0x070710);
      this.ambientLight.color.setHex(0x1e1b4b);
      this.ambientLight.intensity = 0.8;
      this.moonLight.color.setHex(0x818cf8);
      this.campfireLight.intensity = 4.0;
    } else {
      // Ban ngày bình minh
      this.scene.background = new THREE.Color(0x38bdf8);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.setHex(0xbae6fd);
      this.ambientLight.color.setHex(0xfef08a);
      this.ambientLight.intensity = 1.4;
      this.moonLight.color.setHex(0xffedd5);
      this.campfireLight.intensity = 1.5;
    }
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate(): void {
    this.animFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Ngọn lửa bập bùng
    const flick = Math.sin(now * 0.01) * 0.4 + Math.cos(now * 0.02) * 0.2;
    this.campfireLight.intensity = (this.isNight ? 3.5 : 1.5) + flick;

    this.flameMeshes.forEach((flame, idx) => {
      flame.rotation.y += (idx + 1) * delta * 2;
      const s = 1.0 + Math.sin(now * 0.008 + idx) * 0.15;
      flame.scale.set(s, 1.0 + flick * 0.2, s);
    });

    // Cập nhật hoạt cảnh cho tất cả nhân vật
    this.characters.forEach((char) => {
      char.update(delta);
    });

    this.renderer.render(this.scene, this.camera);
  }

  public destroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.renderer.dispose();
  }
}
