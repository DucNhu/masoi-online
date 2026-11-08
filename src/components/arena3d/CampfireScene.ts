import * as THREE from 'three';
import { WolfCharacter } from './WolfMeshBuilder';
import {
  SeatPlayerInfo,
  DEFAULT_OUTFIT,
  CampTentId,
  CAMP_TENTS,
} from './types';

export class CampfireScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Ghế & Nhân vật tại Túp Lều Chính (Lều Trăng Máu)
  private characters: Map<number, WolfCharacter> = new Map();
  private seatMeshes: THREE.Mesh[] = [];
  private campfireLight!: THREE.PointLight;
  private ambientLight!: THREE.AmbientLight;
  private moonLight!: THREE.DirectionalLight;
  private flameMeshes: THREE.Mesh[] = [];
  private highlightRing!: THREE.Mesh;
  private highlightRingMaterial!: THREE.MeshBasicMaterial;

  // Lều & Lửa tại các Túp Lều Phụ (Lều Sương Mù, Lều Rừng Thông, Lều Đom Đóm)
  private secondaryLights: THREE.PointLight[] = [];
  private secondaryFlames: THREE.Mesh[] = [];
  private secondaryNpcCharacters: WolfCharacter[] = [];
  private fireflyMeshes: THREE.Mesh[] = [];

  private isNight = true;
  private animFrameId: number | null = null;
  private lastTime = 0;

  // Quản lý Chuyển Túp Lều (Tent Switching)
  private activeTentId: CampTentId = 'tent-1';
  private currentCameraCenter: THREE.Vector3 = new THREE.Vector3(0, 1.2, 0);
  private targetCameraCenter: THREE.Vector3 = new THREE.Vector3(0, 1.2, 0);

  // Điều khiển Camera Orbit
  private cameraRadius = 11.5;
  private cameraAngle = Math.PI / 2;
  private cameraHeight = 7.0;
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private hoveredSeat: number | null = null;

  // Chế độ Tự Do Đi Dạo (Free Roam / Walk Mode)
  public isRoaming = false;
  private roamPosition = new THREE.Vector3(0, 0.05, 5.8);
  private roamFacingAngle = Math.PI;
  private roamTargetPos: THREE.Vector3 | null = null;
  private pointerDownCoord = { x: 0, y: 0 };
  private keysPressed: Record<string, boolean> = {};
  private onTentNearbyCallback?: (tentId: CampTentId) => void;
  private onRoamStateChangeCallback?: (isRoaming: boolean) => void;

  private onSeatClickCallback?: (seatNumber: number) => void;
  private onSeatHoverCallback?: (seatNumber: number | null) => void;

  private canvasElement?: HTMLCanvasElement;
  private wheelHandler?: (e: WheelEvent) => void;
  private pointerDownHandler?: (e: MouseEvent | TouchEvent) => void;
  private pointerMoveHandler?: (e: MouseEvent | TouchEvent) => void;
  private pointerUpHandler?: (e: MouseEvent | TouchEvent) => void;
  private mouseMoveHoverHandler?: (e: MouseEvent) => void;
  private keyDownHandler?: (e: KeyboardEvent) => void;
  private keyUpHandler?: (e: KeyboardEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070710);
    this.scene.fog = new THREE.FogExp2(0x070710, 0.028);

    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
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
    this.initCampgroundTents();
    this.initInteractions(canvas);

    this.animate = this.animate.bind(this);
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  private initLights(): void {
    // Ánh sáng môi trường đêm trăng rừng sâu
    this.ambientLight = new THREE.AmbientLight(0x1e1b4b, 0.9);
    this.scene.add(this.ambientLight);

    // Ánh trăng chiếu rọi từ trên cao
    this.moonLight = new THREE.DirectionalLight(0x818cf8, 1.4);
    this.moonLight.position.set(16, 26, -18);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.scene.add(this.moonLight);

    // Ánh lửa bập bùng giữa đống lửa trung tâm (Lều Trăng Máu)
    this.campfireLight = new THREE.PointLight(0xf97316, 3.8, 20, 1.2);
    this.campfireLight.position.set(0, 0.8, 0);
    this.campfireLight.castShadow = true;
    this.scene.add(this.campfireLight);
  }

  private initEnvironment(): void {
    // Mặt đất bãi cỏ rộng lớn của Khu Cắm Trại Đêm 3D (R = 44)
    const groundGeo = new THREE.CylinderGeometry(44, 46, 0.6, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.95,
      flatShading: true,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.3;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Lối mòn đá cuội nối từ Lều Trung Tâm tới 3 Lều phụ
    this.createStoneTrail([0, 0, 0], [-16, 0, -14]);
    this.createStoneTrail([0, 0, 0], [16, 0, -14]);
    this.createStoneTrail([0, 0, 0], [0, 0, -24]);

    // Rặng thông Low-Poly bao quanh khu rừng cắm trại
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9, flatShading: true });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.8, flatShading: true });
    const darkPineMat = new THREE.MeshStandardMaterial({ color: 0x022c22, roughness: 0.8, flatShading: true });

    // Vành đai thông bao ngoài
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const dist = 32 + Math.random() * 9;
      const x = Math.sin(angle) * dist;
      const z = Math.cos(angle) * dist;
      this.createPineTree(x, z, treeTrunkMat, i % 2 === 0 ? pineMat : darkPineMat);
    }

    // Các cụm cây nhỏ tạo không gian ấm cúng giữa các lều
    const middleTrees = [
      [-9, -8], [9, -8], [-8, -20], [8, -20],
      [-22, -6], [22, -6], [-7, 8], [7, 8]
    ];
    middleTrees.forEach(([x, z], idx) => {
      this.createPineTree(x, z, treeTrunkMat, idx % 2 === 0 ? pineMat : darkPineMat, 0.75);
    });

    // Mặt Trăng Tròn lơ lửng trên nền trời
    const moonGeo = new THREE.SphereGeometry(2.4, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(24, 38, -28);
    this.scene.add(moon);

    // Đom đóm lơ lửng quanh khu vực "Lều Đom Đóm" (0, 0, -24)
    const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const fireflyGeo = new THREE.SphereGeometry(0.08, 6, 6);
    for (let f = 0; f < 18; f++) {
      const fly = new THREE.Mesh(fireflyGeo, fireflyMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.0 + Math.random() * 4.5;
      fly.position.set(
        Math.sin(angle) * radius,
        0.8 + Math.random() * 2.2,
        -24 + Math.cos(angle) * radius
      );
      fly.userData = {
        baseY: fly.position.y,
        speed: 1.2 + Math.random() * 1.5,
        offset: Math.random() * Math.PI * 2,
      };
      this.scene.add(fly);
      this.fireflyMeshes.push(fly);
    }
  }

  private createPineTree(
    x: number,
    z: number,
    trunkMat: THREE.Material,
    leavesMat: THREE.Material,
    scale = 1.0
  ): void {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.4, 5), trunkMat);
    trunk.position.y = 0.7;
    trunk.castShadow = true;
    tree.add(trunk);

    for (let layer = 0; layer < 3; layer++) {
      const rad = 1.2 - layer * 0.28;
      const height = 1.35;
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(rad, height, 5), leavesMat);
      leaves.position.y = 1.5 + layer * 0.95;
      leaves.castShadow = true;
      tree.add(leaves);
    }

    tree.position.set(x, 0, z);
    tree.scale.setScalar((0.85 + Math.random() * 0.35) * scale);
    this.scene.add(tree);
  }

  private createStoneTrail(from: [number, number, number], to: [number, number, number]): void {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true });
    const lanternWood = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const lanternGlow = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 1.0,
    });

    const steps = 7;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = from[0] + (to[0] - from[0]) * t + (Math.sin(i * 2) * 0.35);
      const z = from[2] + (to[2] - from[2]) * t;

      // Hòn đá lát đường
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.1, 6), stoneMat);
      stone.position.set(x, 0.04, z);
      stone.rotation.y = Math.random() * Math.PI;
      this.scene.add(stone);

      // Cột đèn lồng gỗ ở giữa lối đi
      if (i === 3 || i === 5) {
        const post = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 5), lanternWood);
        pole.position.y = 0.6;
        post.add(pole);

        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), lanternGlow);
        lamp.position.y = 1.15;
        post.add(lamp);

        post.position.set(x + 0.85, 0, z);
        this.scene.add(post);

        const lampLight = new THREE.PointLight(0xfef08a, 0.8, 3.5);
        lampLight.position.set(x + 0.85, 1.2, z);
        this.scene.add(lampLight);
      }
    }
  }

  // === DỰNG TÚP LỀU 3D BẰNG THREE.JS (CANVAS TENT 3D MESH) ===
  private createCampTentMesh(clothColor: number, lanternColor: number): THREE.Group {
    const tent = new THREE.Group();

    // Mái vải lều tam giác hình chóp (A-frame canvas tent)
    const clothMat = new THREE.MeshStandardMaterial({
      color: clothColor,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const tentBody = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3.2, 4), clothMat);
    tentBody.position.y = 1.6;
    tentBody.rotation.y = Math.PI / 4; // Xoay 45 độ để có 4 mặt phẳng vuông vức
    tentBody.castShadow = true;
    tentBody.receiveShadow = true;
    tent.add(tentBody);

    // Cửa lều (mảng tối lùi vào tạo chiều sâu bên trong lều)
    const innerDoorMat = new THREE.MeshBasicMaterial({ color: 0x05050c });
    const innerDoor = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.8, 3), innerDoorMat);
    innerDoor.position.set(0, 0.9, 1.45);
    tent.add(innerDoor);

    // Khung cọc gỗ bắt chéo ở đỉnh lều (Timber poles)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.9, flatShading: true });
    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.8, 5), poleMat);
    pole1.position.set(-0.25, 1.65, 1.4);
    pole1.rotation.z = -0.22;
    tent.add(pole1);

    const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.8, 5), poleMat);
    pole2.position.set(0.25, 1.65, 1.4);
    pole2.rotation.z = 0.22;
    tent.add(pole2);

    // Đèn lồng treo trước cửa lều
    const lanternPeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55), poleMat);
    lanternPeg.position.set(0, 2.15, 1.6);
    lanternPeg.rotation.x = Math.PI / 2;
    tent.add(lanternPeg);

    const lanternBoxMat = new THREE.MeshStandardMaterial({
      color: lanternColor,
      emissive: lanternColor,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    const lanternBox = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.26, 6), lanternBoxMat);
    lanternBox.position.set(0, 1.9, 1.85);
    lanternBox.castShadow = true;
    tent.add(lanternBox);

    // Ánh sáng ấm áp tỏa ra từ đèn lồng trước lều
    const lanternLight = new THREE.PointLight(lanternColor, 1.4, 6.0, 1.5);
    lanternLight.position.set(0, 1.9, 1.9);
    tent.add(lanternLight);

    return tent;
  }

  private initCampfire(): void {
    // Vòng đá quây quanh đống lửa trung tâm
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
      char.root.userData = { seatNumber: seat };
      char.setNameplate(`Người Chơi ${seat}`, seat, true);
      this.scene.add(char.root);
      this.characters.set(seat, char);
    }

    // Vòng ma thuật phát sáng dưới ghế khi hover chuột hoặc nhắm skill
    const ringGeo = new THREE.RingGeometry(0.62, 0.78, 24);
    this.highlightRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.highlightRing = new THREE.Mesh(ringGeo, this.highlightRingMaterial);
    this.highlightRing.rotation.x = -Math.PI / 2;
    this.highlightRing.position.y = 0.03;
    this.highlightRing.visible = false;
    this.scene.add(this.highlightRing);
  }

  // === KHỞI TẠO 4 CỤM TÚP LỀU TRONG KHU CẮM TRẠI ĐÊM (MULTI-TENT CAMPGROUNDS) ===
  private initCampgroundTents(): void {
    // 1. Túp Lều #1: "Lều Trăng Máu" (Đặt ngay sát đống lửa trung tâm ở z = 8.2)
    const tent1 = this.createCampTentMesh(0x991b1b, 0xf97316); // Đỏ trăng máu & đèn cam
    tent1.position.set(0, 0, 8.2);
    tent1.rotation.y = Math.PI; // Quay cửa lều hướng về đống lửa
    this.scene.add(tent1);

    // 2. Túp Lều #2: "Lều Sương Mù" ở (-16, 0, -14)
    this.createSecondaryCampCluster({
      tentPos: [-16, 0, -9.0],
      tentRotY: Math.PI,
      firePos: [-16, 0, -14],
      clothColor: 0x334155, // Xanh xám sương mờ
      fireColor: 0x06b6d4,  // Lửa xanh băng tuyết
      npcCount: 3,
      skinIds: ['WOLF_SNOW', 'CAMPER_GIRL', 'WOLF_SHADOW'],
    });

    // 3. Túp Lều #3: "Lều Rừng Thông" ở (16, 0, -14)
    this.createSecondaryCampCluster({
      tentPos: [16, 0, -9.0],
      tentRotY: Math.PI,
      firePos: [16, 0, -14],
      clothColor: 0x14532d, // Xanh rêu lá thông già
      fireColor: 0x10b981,  // Lửa xanh ngọc huyền bí
      npcCount: 3,
      skinIds: ['WOLF_GOLD', 'WOLF_GRAY', 'KITSUNE_FOX'],
    });

    // 4. Túp Lều #4: "Lều Đom Đóm" ở (0, 0, -24)
    this.createSecondaryCampCluster({
      tentPos: [0, 0, -19.0],
      tentRotY: Math.PI,
      firePos: [0, 0, -24],
      clothColor: 0x713f12, // Vàng nâu mật ong ấm áp
      fireColor: 0xfacc15,  // Lửa vàng hổ phách
      npcCount: 2,
      skinIds: ['KITSUNE_FOX', 'WOLF_BLOOD'],
    });
  }

  private createSecondaryCampCluster(config: {
    tentPos: [number, number, number];
    tentRotY: number;
    firePos: [number, number, number];
    clothColor: number;
    fireColor: number;
    npcCount: number;
    skinIds: ('WOLF_GRAY' | 'WOLF_SNOW' | 'WOLF_BLOOD' | 'WOLF_SHADOW' | 'WOLF_GOLD' | 'CAMPER_GIRL' | 'KITSUNE_FOX')[];
  }): void {
    // Túp lều 3D
    const tent = this.createCampTentMesh(config.clothColor, config.fireColor);
    tent.position.set(...config.tentPos);
    tent.rotation.y = config.tentRotY;
    this.scene.add(tent);

    // Mini campfire
    const [fx, _fy, fz] = config.firePos;
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), stoneMat);
      stone.position.set(fx + Math.sin(angle) * 0.7, 0.12, fz + Math.cos(angle) * 0.7);
      this.scene.add(stone);
    }

    // Củi lửa mini
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.9, 5), woodMat);
      log.position.set(fx, 0.12, fz);
      log.rotation.y = (i * Math.PI) / 3;
      log.rotation.z = Math.PI / 4;
      this.scene.add(log);
    }

    // Ngọn lửa mini
    const miniFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.8, 4),
      new THREE.MeshBasicMaterial({ color: config.fireColor, transparent: true, opacity: 0.85 })
    );
    miniFlame.position.set(fx, 0.45, fz);
    this.scene.add(miniFlame);
    this.secondaryFlames.push(miniFlame);

    // Ánh sáng bập bùng từ lửa trại phụ
    const pLight = new THREE.PointLight(config.fireColor, 2.2, 10.0, 1.3);
    pLight.position.set(fx, 0.65, fz);
    this.scene.add(pLight);
    this.secondaryLights.push(pLight);

    // Các gốc cây ghế ngồi & NPC đang ngồi quanh lửa
    const stumpMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.9 });
    for (let n = 0; n < config.npcCount; n++) {
      const angle = (n / config.npcCount) * Math.PI * 1.6 + 0.4;
      const sx = fx + Math.sin(angle) * 2.8;
      const sz = fz + Math.cos(angle) * 2.8;

      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.35, 6), stumpMat);
      stump.position.set(sx, 0.18, sz);
      this.scene.add(stump);

      const skinId = config.skinIds[n % config.skinIds.length] || 'WOLF_GRAY';
      const npc = new WolfCharacter({
        skinId,
        hatId: n === 0 ? 'CONICAL_HAT' : 'NONE',
        eyeGlowId: 'RED',
        backItemId: 'NONE',
      });
      npc.root.position.set(sx, 0.35, sz);
      npc.root.rotation.y = angle + Math.PI;
      const titles = ['Phượt Thủ Rừng', 'Tiên Tri Ẩn Sĩ', 'Thợ Săn Gió', 'Nữ Sinh Cắm Trại', 'Hồ Ly Tuyết'];
      npc.setNameplate(titles[n % titles.length]);
      this.scene.add(npc.root);
      this.secondaryNpcCharacters.push(npc);
    }
  }

  // === XỬ LÝ RAYCAST VA CHẠM GHẾ VÀ NHÂN VẬT ===
  private getSeatFromIntersects(intersects: THREE.Intersection[]): number | null {
    for (const hit of intersects) {
      if (hit.object instanceof THREE.Sprite || hit.object.type === 'Sprite') {
        continue;
      }
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if (typeof obj.userData?.seatNumber === 'number') {
          return obj.userData.seatNumber;
        }
        obj = obj.parent;
      }
    }
    return null;
  }

  // === ĐẨY LÙI TRÁNH ĐỐM LỬA TRẠI (CAMPFIRE OBSTACLE PUSHBACK) ===
  private applyCampfireObstaclePushback(): void {
    const campfireCenters: [number, number][] = [
      [0, 0],
      [-16, -14],
      [16, -14],
      [0, -24],
    ];
    const minCampfireDist = 1.35;
    for (const [cfX, cfZ] of campfireCenters) {
      const dX = this.roamPosition.x - cfX;
      const dZ = this.roamPosition.z - cfZ;
      const dist = Math.hypot(dX, dZ);
      if (dist < minCampfireDist && dist > 0.0001) {
        const push = minCampfireDist - dist;
        this.roamPosition.x += (dX / dist) * push;
        this.roamPosition.z += (dZ / dist) * push;
      }
    }
  }

  // === ĐIỀU KHIỂN & TƯƠNG TÁC (INTERACTIONS) ===
  private initInteractions(canvas: HTMLCanvasElement): void {
    this.canvasElement = canvas;
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
      const pos = getPos(e);
      this.previousMousePosition = pos;
      this.pointerDownCoord = pos;
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging) return;
      const currentPos = getPos(e);
      const deltaX = currentPos.x - this.previousMousePosition.x;
      const deltaY = currentPos.y - this.previousMousePosition.y;

      // Xoay góc nhìn camera
      this.cameraAngle -= deltaX * 0.007;
      this.cameraHeight = Math.max(3.0, Math.min(13.0, this.cameraHeight + deltaY * 0.015));

      this.updateCameraPosition();
      this.previousMousePosition = currentPos;
    };

    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      canvas.style.cursor = this.hoveredSeat !== null ? 'pointer' : 'grab';

      const rect = canvas.getBoundingClientRect();
      const pos = 'changedTouches' in e ? e.changedTouches[0] : (e as MouseEvent);
      if (!pos) return;

      const currentPos = { x: pos.clientX, y: pos.clientY };
      const dragDist = Math.hypot(currentPos.x - this.pointerDownCoord.x, currentPos.y - this.pointerDownCoord.y);

      // Nếu kéo xoay camera quá xa (> 6px), coi là thao tác xoay, bỏ qua click/tap
      if (dragDist > 6) return;

      const mouseX = ((pos.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((pos.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

      if (this.isRoaming) {
        // Chế độ Đi Dạo: Click/Tap xuống mặt đất y = 0 để đi bộ tới điểm chạm
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, intersectPoint)) {
          const clampedX = Math.max(-28, Math.min(28, intersectPoint.x));
          const clampedZ = Math.max(-36, Math.min(14, intersectPoint.z));
          this.roamTargetPos = new THREE.Vector3(clampedX, 0.05, clampedZ);
        }
      } else {
        // Chế độ Quản Trò / Đấu Trường: Click chọn ghế hoặc thân nhân vật
        const targets = [
          ...this.seatMeshes,
          ...Array.from(this.characters.values()).map((c) => c.root),
        ];
        const intersects = raycaster.intersectObjects(targets, true);
        const clickedSeat = this.getSeatFromIntersects(intersects);
        if (clickedSeat !== null && this.onSeatClickCallback) {
          this.onSeatClickCallback(clickedSeat);
        }
      }
    };

    // Cuộn chuột để Zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.006;
      this.cameraRadius = Math.max(4.5, Math.min(22.0, this.cameraRadius + e.deltaY * zoomSpeed));
      this.updateCameraPosition();
    };

    // Rê chuột hover ghế hoặc nhân vật
    const onMouseMoveHover = (e: MouseEvent) => {
      if (this.isDragging) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);
      const targets = [
        ...this.seatMeshes,
        ...Array.from(this.characters.values()).map((c) => c.root),
      ];
      const intersects = raycaster.intersectObjects(targets, true);
      const hoveredSeat = this.getSeatFromIntersects(intersects);

      if (hoveredSeat !== null) {
        canvas.style.cursor = 'pointer';
        this.setHoveredSeat(hoveredSeat);
        if (this.onSeatHoverCallback) this.onSeatHoverCallback(hoveredSeat);
      } else {
        canvas.style.cursor = 'grab';
        this.setHoveredSeat(null);
        if (this.onSeatHoverCallback) this.onSeatHoverCallback(null);
      }
    };

    // Phím tắt bàn phím (WASD, Mũi tên, R Reset)
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      this.keysPressed[e.code] = true;
      this.keysPressed[e.key.toLowerCase()] = true;

      if (!this.isRoaming) {
        const stepAngle = 0.06;
        const zoomStep = 0.6;
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
          this.cameraAngle += stepAngle;
          this.updateCameraPosition();
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
          this.cameraAngle -= stepAngle;
          this.updateCameraPosition();
        } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
          this.cameraRadius = Math.max(4.5, this.cameraRadius - zoomStep);
          this.updateCameraPosition();
        } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
          this.cameraRadius = Math.min(22.0, this.cameraRadius + zoomStep);
          this.updateCameraPosition();
        } else if (e.key.toLowerCase() === 'r') {
          this.resetCamera();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysPressed[e.code] = false;
      this.keysPressed[e.key.toLowerCase()] = false;
    };

    this.pointerDownHandler = onPointerDown;
    this.pointerMoveHandler = onPointerMove;
    this.pointerUpHandler = onPointerUp;
    this.wheelHandler = onWheel;
    this.mouseMoveHoverHandler = onMouseMoveHover;
    this.keyDownHandler = onKeyDown;
    this.keyUpHandler = onKeyUp;

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousemove', onMouseMoveHover);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  // === QUẢN LÝ CHẾ ĐỘ ĐI DẠO & ĐỔI LỀU (ROAM & TENT SWITCHING) ===

  public setRoaming(enable: boolean): void {
    this.isRoaming = enable;
    this.roamTargetPos = null;
    const player1 = this.characters.get(1);

    if (enable) {
      // Đứng dậy khỏi Ghế #1 và tiến ra bãi cỏ (chạm mặt đất y = 0.05)
      this.roamPosition.set(0, 0.05, 5.8);
      this.roamFacingAngle = Math.PI;
      if (player1) {
        player1.setStanding(true);
        player1.root.position.copy(this.roamPosition);
        player1.root.rotation.y = this.roamFacingAngle;
        player1.setAnimation('idle');
      }
      this.cameraRadius = 8.5;
      this.cameraHeight = 5.0;
    } else {
      // Ngồi lại vào ghế của Lều hiện tại
      if (player1) {
        const stump = this.seatMeshes[0];
        if (stump) {
          player1.setStanding(false);
          player1.root.position.set(stump.position.x, 0.38, stump.position.z);
          player1.root.rotation.y = Math.PI;
          player1.setAnimation('idle');
        }
      }
      this.resetCamera();
    }

    if (this.onRoamStateChangeCallback) {
      this.onRoamStateChangeCallback(enable);
    }
  }

  public switchTent(tentId: CampTentId): void {
    const tent = CAMP_TENTS.find((t) => t.id === tentId);
    if (!tent) return;

    this.activeTentId = tentId;
    this.targetCameraCenter.set(tent.lookAt[0], tent.lookAt[1], tent.lookAt[2]);

    // Nếu đang ở chế độ đi dạo, hướng nhân vật bước tới gần lều mới
    if (this.isRoaming) {
      this.roamPosition.set(tent.position[0], 0.05, tent.position[2] + 4.5);
      this.roamTargetPos = null;
      const player1 = this.characters.get(1);
      if (player1) {
        player1.root.position.copy(this.roamPosition);
      }
    }
  }

  public getActiveTentId(): CampTentId {
    return this.activeTentId;
  }

  public setOnTentNearby(callback: (tentId: CampTentId) => void): void {
    this.onTentNearbyCallback = callback;
  }

  public setOnRoamStateChange(callback: (isRoaming: boolean) => void): void {
    this.onRoamStateChangeCallback = callback;
  }

  // === CẬP NHẬT CAMERA & VỊ TRÍ ===

  private updateCameraPosition(): void {
    if (this.isRoaming) {
      // Camera đi theo nhân vật người chơi ở góc nhìn thứ 3
      const targetCamX = this.roamPosition.x + Math.sin(this.cameraAngle) * this.cameraRadius;
      const targetCamZ = this.roamPosition.z + Math.cos(this.cameraAngle) * this.cameraRadius;
      const targetCamY = this.roamPosition.y + this.cameraHeight;

      this.camera.position.set(targetCamX, targetCamY, targetCamZ);
      this.camera.lookAt(this.roamPosition.x, this.roamPosition.y + 1.2, this.roamPosition.z);
    } else {
      // Camera xoay quanh tâm của Túp Lều đang chọn
      this.camera.position.x = this.currentCameraCenter.x + Math.sin(this.cameraAngle) * this.cameraRadius;
      this.camera.position.z = this.currentCameraCenter.z + Math.cos(this.cameraAngle) * this.cameraRadius;
      this.camera.position.y = this.currentCameraCenter.y + this.cameraHeight;
      this.camera.lookAt(this.currentCameraCenter.x, this.currentCameraCenter.y, this.currentCameraCenter.z);
    }
  }

  public setOnSeatClick(callback: (seatNumber: number) => void): void {
    this.onSeatClickCallback = callback;
  }

  public updateSeatsState(seats: SeatPlayerInfo[]): void {
    seats.forEach((info) => {
      const char = this.characters.get(info.seatNumber);
      if (!char) return;

      char.root.userData = { seatNumber: info.seatNumber };

      // Cập nhật trang phục nếu có
      if (info.outfit) {
        char.updateOutfit(info.outfit);
      }

      // Đặt trạng thái còn sống hay hy sinh
      char.setGhostMode(!info.isAlive);

      // Cập nhật Bảng Tên Nổi 3D lơ lửng trên đầu nhân vật
      char.setNameplate(info.name, info.seatNumber, info.isAlive);

      // Nếu là người chơi số 1 và đang ở chế độ Đi Dạo (isRoaming):
      // Chỉ cập nhật outfit / nameplate / ghostMode, KHÔNG ép animation về slumber hay tư thế ngồi!
      if (info.seatNumber === 1 && this.isRoaming) {
        return;
      }

      // Đặt hoạt cảnh theo thời điểm
      if (!info.isAlive) {
        char.setAnimation('slumber');
      } else if (this.isNight) {
        if (info.isWerewolf) {
          char.setAnimation('howl');
        } else {
          char.setAnimation('slumber');
        }
      } else {
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
      this.secondaryLights.forEach((l) => { l.intensity = 2.4; });
    } else {
      // Ban ngày bình minh khu cắm trại
      this.scene.background = new THREE.Color(0x38bdf8);
      if (this.scene.fog) (this.scene.fog as THREE.FogExp2).color.setHex(0xbae6fd);
      this.ambientLight.color.setHex(0xfef08a);
      this.ambientLight.intensity = 1.4;
      this.moonLight.color.setHex(0xffedd5);
      this.campfireLight.intensity = 1.6;
      this.secondaryLights.forEach((l) => { l.intensity = 1.2; });
    }
  }

  public setOnSeatHover(callback: (seatNumber: number | null) => void): void {
    this.onSeatHoverCallback = callback;
  }

  public setHoveredSeat(seatNumber: number | null): void {
    this.hoveredSeat = seatNumber;
    if (!this.highlightRing) return;
    if (seatNumber === null) {
      this.highlightRing.visible = false;
    } else {
      const stump = this.seatMeshes[seatNumber - 1];
      if (stump) {
        this.highlightRing.position.x = stump.position.x;
        this.highlightRing.position.z = stump.position.z;
        this.highlightRingMaterial.color.setHex(0x38bdf8);
        this.highlightRing.visible = true;
      }
    }
  }

  /**
   * Đánh dấu ghế mục tiêu với màu sắc tương ứng theo kỹ năng
   */
  public highlightSeat(seatNumber: number | null, hexColor = 0x38bdf8): void {
    if (!this.highlightRing) return;
    if (seatNumber === null) {
      this.highlightRing.visible = false;
    } else {
      const stump = this.seatMeshes[seatNumber - 1];
      if (stump) {
        this.highlightRing.position.x = stump.position.x;
        this.highlightRing.position.z = stump.position.z;
        this.highlightRingMaterial.color.setHex(hexColor);
        this.highlightRing.visible = true;
      }
    }
  }

  public zoom(delta: number): void {
    this.cameraRadius = Math.max(4.5, Math.min(22.0, this.cameraRadius + delta));
    this.updateCameraPosition();
  }

  public orbit(deltaAngle: number): void {
    this.cameraAngle += deltaAngle;
    this.updateCameraPosition();
  }

  public resetCamera(): void {
    this.cameraRadius = 11.5;
    this.cameraAngle = Math.PI / 2;
    this.cameraHeight = 7.0;
    const tent = CAMP_TENTS.find((t) => t.id === this.activeTentId);
    if (tent) {
      this.targetCameraCenter.set(tent.lookAt[0], tent.lookAt[1], tent.lookAt[2]);
    }
    this.updateCameraPosition();
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // === VÒNG LẶP RENDER & CẬP NHẬT HOẠT CẢNH (ANIMATION LOOP) ===
  private animate(): void {
    this.animFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Chuyển mượt tâm camera khi đổi túp lều
    if (!this.isRoaming) {
      this.currentCameraCenter.lerp(this.targetCameraCenter, 0.06);
      this.updateCameraPosition();
    }

    // Xử lý di chuyển khi ở chế độ Đi Dạo Tự Do (Free Roam)
    if (this.isRoaming) {
      const moveSpeed = 5.5 * delta;
      let moveX = 0;
      let moveZ = 0;

      // Phím di chuyển
      if (this.keysPressed['KeyW'] || this.keysPressed['w'] || this.keysPressed['ArrowUp']) {
        moveZ -= 1;
      }
      if (this.keysPressed['KeyS'] || this.keysPressed['s'] || this.keysPressed['ArrowDown']) {
        moveZ += 1;
      }
      if (this.keysPressed['KeyA'] || this.keysPressed['a'] || this.keysPressed['ArrowLeft']) {
        moveX -= 1;
      }
      if (this.keysPressed['KeyD'] || this.keysPressed['d'] || this.keysPressed['ArrowRight']) {
        moveX += 1;
      }

      const player1 = this.characters.get(1);

      if (moveX !== 0 || moveZ !== 0) {
        // Phím bàn phím: hủy bỏ đích chạm Click/Tap-to-Walk
        this.roamTargetPos = null;

        // Chuẩn hóa vector di chuyển
        const len = Math.hypot(moveX, moveZ);
        const normX = moveX / len;
        const normZ = moveZ / len;

        // Xoay hướng di chuyển theo góc nhìn camera
        const forwardAngle = this.cameraAngle + Math.PI;
        const dirX = normX * Math.cos(forwardAngle) - normZ * Math.sin(forwardAngle);
        const dirZ = normX * Math.sin(forwardAngle) + normZ * Math.cos(forwardAngle);

        this.roamPosition.x += dirX * moveSpeed;
        this.roamPosition.z += dirZ * moveSpeed;

        // Giới hạn trong khuôn viên khu cắm trại
        this.roamPosition.x = Math.max(-28, Math.min(28, this.roamPosition.x));
        this.roamPosition.z = Math.max(-36, Math.min(14, this.roamPosition.z));

        // Xoay hướng mặt nhân vật theo hướng di chuyển
        this.roamFacingAngle = Math.atan2(dirX, dirZ);
        this.roamPosition.y = 0.05;

        if (player1) {
          player1.setStanding(true);
          player1.setAnimation('walk');
        }

        // Kiểm tra xem đã tới gần Túp Lều nào chưa
        for (const tent of CAMP_TENTS) {
          const dist = Math.hypot(this.roamPosition.x - tent.position[0], this.roamPosition.z - tent.position[2]);
          if (dist < 5.2 && this.activeTentId !== tent.id) {
            this.activeTentId = tent.id;
            this.targetCameraCenter.set(tent.lookAt[0], tent.lookAt[1], tent.lookAt[2]);
            if (this.onTentNearbyCallback) {
              this.onTentNearbyCallback(tent.id);
            }
          }
        }
      } else if (this.roamTargetPos) {
        // Di chuyển tự động tới điểm chạm đất (Click / Tap-to-Walk cho Mobile & PC)
        const distToTarget = Math.hypot(
          this.roamTargetPos.x - this.roamPosition.x,
          this.roamTargetPos.z - this.roamPosition.z
        );

        if (distToTarget > 0.25) {
          const dirX = (this.roamTargetPos.x - this.roamPosition.x) / distToTarget;
          const dirZ = (this.roamTargetPos.z - this.roamPosition.z) / distToTarget;
          const step = Math.min(distToTarget, moveSpeed);

          this.roamPosition.x += dirX * step;
          this.roamPosition.z += dirZ * step;
          this.roamPosition.x = Math.max(-28, Math.min(28, this.roamPosition.x));
          this.roamPosition.z = Math.max(-36, Math.min(14, this.roamPosition.z));

          this.roamFacingAngle = Math.atan2(dirX, dirZ);
          this.roamPosition.y = 0.05;

          if (player1) {
            player1.setStanding(true);
            player1.setAnimation('walk');
          }

          // Kiểm tra xem đã tới gần Túp Lều nào chưa
          for (const tent of CAMP_TENTS) {
            const dist = Math.hypot(this.roamPosition.x - tent.position[0], this.roamPosition.z - tent.position[2]);
            if (dist < 5.2 && this.activeTentId !== tent.id) {
              this.activeTentId = tent.id;
              this.targetCameraCenter.set(tent.lookAt[0], tent.lookAt[1], tent.lookAt[2]);
              if (this.onTentNearbyCallback) {
                this.onTentNearbyCallback(tent.id);
              }
            }
          }
        } else {
          // Đã tới đích chạm đất: dừng lại đứng thở trên mặt cỏ
          this.roamTargetPos = null;
          this.roamPosition.y = 0.05;
          if (player1) {
            player1.setStanding(true);
            player1.setAnimation('idle');
          }
        }
      } else {
        // Đứng yên thẳng người thở nhẹ
        this.roamPosition.y = 0.05;
        if (player1) {
          player1.setStanding(true);
          player1.setAnimation('idle');
        }
      }

      // Áp dụng lực đẩy lùi tránh đốm lửa trại (Obstacle Avoidance around Campfire Pits)
      this.applyCampfireObstaclePushback();

      // Cập nhật vị trí nhân vật người chơi #1
      if (player1) {
        player1.root.position.copy(this.roamPosition);
        player1.root.rotation.y = this.roamFacingAngle;
      }

      this.updateCameraPosition();
    }

    // Ngọn lửa bập bùng
    const flick = Math.sin(now * 0.01) * 0.4 + Math.cos(now * 0.02) * 0.2;
    this.campfireLight.intensity = (this.isNight ? 3.8 : 1.6) + flick;

    this.flameMeshes.forEach((flame, idx) => {
      flame.rotation.y += (idx + 1) * delta * 2;
      const s = 1.0 + Math.sin(now * 0.008 + idx) * 0.15;
      flame.scale.set(s, 1.0 + flick * 0.2, s);
    });

    // Lửa phụ ở 3 lều
    this.secondaryFlames.forEach((flame, idx) => {
      flame.rotation.y += delta * 1.8;
      const s = 0.9 + Math.sin(now * 0.007 + idx) * 0.12;
      flame.scale.set(s, 1.0 + flick * 0.15, s);
    });

    // Đom đóm dập dềnh quanh Lều Đom Đóm
    this.fireflyMeshes.forEach((fly) => {
      const u = fly.userData;
      fly.position.y = u.baseY + Math.sin(now * 0.002 * u.speed + u.offset) * 0.35;
    });

    // Xoay nhẹ vòng ma thuật dưới ghế khi được chọn
    if (this.highlightRing && this.highlightRing.visible) {
      this.highlightRing.rotation.z += delta * 1.5;
    }

    // Cập nhật hoạt cảnh cho tất cả nhân vật chính & phụ
    this.characters.forEach((char) => {
      char.update(delta);
    });
    this.secondaryNpcCharacters.forEach((npc) => {
      npc.update(delta);
    });

    this.renderer.render(this.scene, this.camera);
  }

  public destroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.canvasElement) {
      if (this.pointerDownHandler) {
        this.canvasElement.removeEventListener('mousedown', this.pointerDownHandler);
        this.canvasElement.removeEventListener('touchstart', this.pointerDownHandler);
      }
      if (this.wheelHandler) this.canvasElement.removeEventListener('wheel', this.wheelHandler);
      if (this.mouseMoveHoverHandler) this.canvasElement.removeEventListener('mousemove', this.mouseMoveHoverHandler);
    }
    if (this.pointerMoveHandler) {
      window.removeEventListener('mousemove', this.pointerMoveHandler);
      window.removeEventListener('touchmove', this.pointerMoveHandler);
    }
    if (this.pointerUpHandler) {
      window.removeEventListener('mouseup', this.pointerUpHandler);
      window.removeEventListener('touchend', this.pointerUpHandler);
    }
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
    }
    if (this.keyUpHandler) {
      window.removeEventListener('keyup', this.keyUpHandler);
    }
    this.renderer.dispose();
  }
}
