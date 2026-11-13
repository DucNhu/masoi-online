import * as THREE from 'three';
import { WolfCharacter } from './WolfMeshBuilder';
import {
  SeatPlayerInfo,
  DEFAULT_OUTFIT,
  CampTentId,
  CAMP_TENTS,
  CampTentInfo,
  PlayerOutfitConfig,
  RemoteRoamPlayer,
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

  // Lều & Lửa tại các Túp Lều Phụ (Lều Sương Mù, Lều Rừng Thông, Lều Núi Tuyết)
  private secondaryLights: THREE.PointLight[] = [];
  private secondaryFlames: THREE.Mesh[] = [];
  private secondaryNpcCharacters: WolfCharacter[] = [];
  private fireflyMeshes: THREE.Mesh[] = [];

  // Nhãn trên khúc gỗ trống (Empty Seat Labels)
  private stumpLabels: Map<number, THREE.Sprite> = new Map();

  // Biển hiệu 3D nổi trên nóc 4 túp lều
  private tentSignboardSprites: Map<CampTentId, THREE.Sprite> = new Map();

  // Nhân vật đại diện người chơi khi đi dạo tự do (Roam Avatar)
  private roamAvatar!: WolfCharacter;
  private mySeatedNumber: number | null = null;
  private playerName = 'Thợ Săn Đêm';
  private playerOutfit: PlayerOutfitConfig = DEFAULT_OUTFIT;
  private lang: 'vi' | 'en' = 'vi';

  // Đồng bộ nhân vật từ xa (Multiplayer 3D Roam Mesh)
  public localPlayerId: string = '';
  private remoteAvatars: Map<
    string,
    {
      character: WolfCharacter;
      targetPos: THREE.Vector3;
      targetAngle: number;
      anim: 'idle' | 'walk';
      isRoaming: boolean;
      seatNumber: number | null;
      tentId: CampTentId;
      lastSeen: number;
    }
  > = new Map();
  private onLocalRoamChangeCallback?: (state: RemoteRoamPlayer) => void;
  private lastRoamBroadcast = 0;
  private prevBroadcastPos = new THREE.Vector3();
  private prevBroadcastAngle = 0;

  private isNight = true;
  private animFrameId: number | null = null;
  private lastTime = 0;

  // Quản lý Chuyển Túp Lều (Tent Switching)
  private activeTentId: CampTentId = 'tent-1';
  private currentCameraCenter: THREE.Vector3 = new THREE.Vector3(0, 1.2, 0);
  private targetCameraCenter: THREE.Vector3 = new THREE.Vector3(0, 1.2, 0);

  // Điều khiển Camera Orbit
  private cameraRadius = 8.5;
  private cameraAngle = Math.PI / 2;
  private cameraHeight = 5.0;
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private hoveredSeat: number | null = null;

  // Chế độ Tự Do Đi Dạo (Free Roam / Walk Mode) - Mặc định khởi đầu ở chế độ Đi Dạo
  public isRoaming = true;
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
  private blurHandler?: () => void;

  /** Các phím mà trình duyệt mặc định dùng để cuộn trang — phải chặn khi điều khiển 3D */
  public static readonly SCROLL_KEYS: readonly string[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];

  /**
   * Tính vector di chuyển (đã chuẩn hóa) tương đối với góc nhìn camera.
   * Camera đặt tại (sin θ, cos θ) * r so với nhân vật và nhìn về nhân vật, nên:
   *   - Tiến (Up/W)  = (-sin θ, -cos θ)  → đi "vào trong" màn hình
   *   - Phải (Right/D) = (cos θ, -sin θ) → đi sang phải màn hình
   * Trả về null khi không có input.
   */
  public static computeCameraRelativeMovement(
    cameraAngle: number,
    inputForward: number,
    inputRight: number
  ): { dirX: number; dirZ: number; facingAngle: number } | null {
    if (inputForward === 0 && inputRight === 0) return null;
    const forwardX = -Math.sin(cameraAngle);
    const forwardZ = -Math.cos(cameraAngle);
    const rightX = Math.cos(cameraAngle);
    const rightZ = -Math.sin(cameraAngle);
    const rawX = inputForward * forwardX + inputRight * rightX;
    const rawZ = inputForward * forwardZ + inputRight * rightZ;
    const len = Math.hypot(rawX, rawZ);
    if (len === 0) return null;
    const dirX = rawX / len;
    const dirZ = rawZ / len;
    return { dirX, dirZ, facingAngle: Math.atan2(dirX, dirZ) };
  }

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
    this.initRoamAvatar();
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
    // 1. Túp Lều #1: "Lều Trăng Máu" (Bàn 1)
    const tent1 = this.createCampTentMesh(0x991b1b, 0xf97316); // Đỏ trăng máu & đèn cam
    tent1.position.set(0, 0, 8.2);
    tent1.rotation.y = Math.PI; // Quay cửa lều hướng về đống lửa
    this.scene.add(tent1);

    // 2. Túp Lều #2: "Lều Sương Mù" (Bàn 2) ở (-16, 0, -14)
    this.createSecondaryCampCluster({
      tentPos: [-16, 0, -9.0],
      tentRotY: Math.PI,
      firePos: [-16, 0, -14],
      clothColor: 0x334155, // Xanh xám sương mờ
      fireColor: 0x06b6d4,  // Lửa xanh băng tuyết
    });

    // 3. Túp Lều #3: "Lều Rừng Thông" (Bàn 3) ở (16, 0, -14)
    this.createSecondaryCampCluster({
      tentPos: [16, 0, -9.0],
      tentRotY: Math.PI,
      firePos: [16, 0, -14],
      clothColor: 0x14532d, // Xanh rêu lá thông già
      fireColor: 0x10b981,  // Lửa xanh ngọc huyền bí
    });

    // 4. Túp Lều #4: "Lều Núi Tuyết" (Bàn 4) ở (0, 0, -24)
    this.createSecondaryCampCluster({
      tentPos: [0, 0, -19.0],
      tentRotY: Math.PI,
      firePos: [0, 0, -24],
      clothColor: 0x0369a1, // Xanh băng núi tuyết
      fireColor: 0x38bdf8,  // Lửa xanh tuyết trắng
    });

    // Tạo Biển Báo 3D Nổi Trên 4 Túp Lều
    this.createAllTentSignboards();
  }

  private createSecondaryCampCluster(config: {
    tentPos: [number, number, number];
    tentRotY: number;
    firePos: [number, number, number];
    clothColor: number;
    fireColor: number;
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

    // Các gốc cây ghế ngồi tự nhiên (Xóa bỏ 100% bot ảo giả lập!)
    const stumpMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.9 });
    for (let n = 0; n < 3; n++) {
      const angle = (n / 3) * Math.PI * 1.6 + 0.4;
      const sx = fx + Math.sin(angle) * 2.8;
      const sz = fz + Math.cos(angle) * 2.8;

      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.35, 6), stumpMat);
      stump.position.set(sx, 0.18, sz);
      this.scene.add(stump);
    }
  }

  // === BIỂN BÁO 3D NỔI TRÊN 4 TÚP LỀU (3D FLOATING TENT SIGNBOARDS) ===
  private createTentSignboardSprite(tent: CampTentInfo): THREE.Sprite {
    const canvas =
      typeof document !== 'undefined' && document.createElement
        ? document.createElement('canvas')
        : null;
    let texture: THREE.Texture;
    if (canvas) {
      canvas.width = 480;
      canvas.height = 104;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const r = 26;
        ctx.fillStyle = 'rgba(10, 15, 29, 0.92)';
        ctx.strokeStyle = tent.themeColor || '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = tent.themeColor || '#ef4444';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, r);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        const title =
          this.lang === 'en'
            ? tent.signboardTitleEn || `${tent.banner} ${tent.nameEn}`
            : tent.signboardTitle || `${tent.banner} ${tent.name}`;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, canvas.width / 2, canvas.height / 2);
      }
      texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
    } else {
      texture = new THREE.Texture();
    }

    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 990;
    sprite.scale.set(3.6, 0.78, 1.0);
    return sprite;
  }

  private createAllTentSignboards(): void {
    const tentSignPositions: Record<CampTentId, [number, number, number]> = {
      'tent-1': [0, 4.4, 8.2],
      'tent-2': [-16, 4.4, -9.0],
      'tent-3': [16, 4.4, -9.0],
      'tent-4': [0, 4.4, -19.0],
    };

    CAMP_TENTS.forEach((tent) => {
      const pos = tentSignPositions[tent.id];
      if (!pos) return;
      const sprite = this.createTentSignboardSprite(tent);
      sprite.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(sprite);
      this.tentSignboardSprites.set(tent.id, sprite);
    });
  }

  // === NHÃN BẢNG TÊN TRÊN KHÚC GỖ TRỐNG (EMPTY STUMP 3D LABELS) ===
  private createStumpLabelSprite(seatNumber: number): THREE.Sprite {
    const canvas =
      typeof document !== 'undefined' && document.createElement
        ? document.createElement('canvas')
        : null;
    let texture: THREE.Texture;
    if (canvas) {
      canvas.width = 400;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const r = 20;
        ctx.fillStyle = 'rgba(10, 15, 29, 0.88)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, r);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelText =
          this.lang === 'en'
            ? `[🪑 Seat #${seatNumber} - Tap to sit]`
            : `[🪑 Ghế #${seatNumber} - Bấm để ngồi]`;
        ctx.fillText(labelText, canvas.width / 2, canvas.height / 2);
      }
      texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
    } else {
      texture = new THREE.Texture();
    }

    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 999;
    sprite.scale.set(1.6, 0.32, 1.0);
    sprite.userData = { seatNumber };
    return sprite;
  }

  // === KHỞI TẠO AVATAR NGƯỜI CHƠI ĐI DẠO METAVERSE ===
  private initRoamAvatar(): void {
    this.roamAvatar = new WolfCharacter(this.playerOutfit);
    this.roamAvatar.setStanding(true);
    this.roamAvatar.root.position.copy(this.roamPosition);
    this.roamAvatar.root.rotation.y = this.roamFacingAngle;
    this.roamAvatar.setNameplate(this.playerName);
    this.roamAvatar.root.visible = this.isRoaming;
    this.scene.add(this.roamAvatar.root);
  }

  public updatePlayerProfile(name: string, outfit: PlayerOutfitConfig): void {
    this.playerName = name;
    this.playerOutfit = outfit;
    if (this.roamAvatar) {
      this.roamAvatar.updateOutfit(outfit);
      this.roamAvatar.setNameplate(name);
    }
  }

  public setLanguage(lang: 'vi' | 'en'): void {
    this.lang = lang;
    // Cập nhật lại các biển hiệu lều
    CAMP_TENTS.forEach((tent) => {
      const existing = this.tentSignboardSprites.get(tent.id);
      if (existing) {
        this.scene.remove(existing);
      }
    });
    this.tentSignboardSprites.clear();
    this.createAllTentSignboards();

    // Cập nhật lại nhãn ghế trống
    this.stumpLabels.forEach((label, seatNumber) => {
      const stump = this.seatMeshes[seatNumber - 1];
      if (stump && label.visible) {
        this.scene.remove(label);
        const newLabel = this.createStumpLabelSprite(seatNumber);
        newLabel.position.set(stump.position.x, 0.72, stump.position.z);
        this.scene.add(newLabel);
        this.stumpLabels.set(seatNumber, newLabel);
      }
    });
  }

  // === XỬ LÝ RAYCAST VA CHẠM GHẾ VÀ NHÂN VẬT ===
  private getSeatFromIntersects(intersects: THREE.Intersection[]): number | null {
    for (const hit of intersects) {
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

      // Kiểm tra bấm vào khúc gỗ / nhân vật / nhãn ghế
      const targets = [
        ...this.seatMeshes,
        ...Array.from(this.characters.values()).map((c) => c.root),
        ...Array.from(this.stumpLabels.values()),
      ];
      const intersects = raycaster.intersectObjects(targets, true);
      const clickedSeat = this.getSeatFromIntersects(intersects);

      if (clickedSeat !== null && this.onSeatClickCallback) {
        this.onSeatClickCallback(clickedSeat);
      } else if (this.isRoaming) {
        // Chế độ Đi Dạo: Click/Tap xuống mặt đất y = 0 để đi bộ tới điểm chạm
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, intersectPoint)) {
          const clampedX = Math.max(-28, Math.min(28, intersectPoint.x));
          const clampedZ = Math.max(-36, Math.min(14, intersectPoint.z));
          this.roamTargetPos = new THREE.Vector3(clampedX, 0.05, clampedZ);
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
        ...Array.from(this.stumpLabels.values()),
      ];
      const intersects = raycaster.intersectObjects(targets, true);
      const hoveredSeat = this.getSeatFromIntersects(intersects);

      if (hoveredSeat !== null) {
        canvas.style.cursor = 'pointer';
        this.setHoveredSeat(hoveredSeat);
        if (this.onSeatHoverCallback) this.onSeatHoverCallback(hoveredSeat);
      } else {
        canvas.style.cursor = this.isRoaming ? 'crosshair' : 'grab';
        this.setHoveredSeat(null);
        if (this.onSeatHoverCallback) this.onSeatHoverCallback(null);
      }
    };

    // Phím tắt bàn phím (WASD, Mũi tên, R Reset)
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      // Chặn trình duyệt cuộn trang khi dùng phím mũi tên / Space để điều khiển 3D
      if (CampfireScene.SCROLL_KEYS.includes(e.key)) {
        e.preventDefault();
      }
      this.keysPressed[e.code] = true;
      this.keysPressed[e.key] = true;
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
      this.keysPressed[e.key] = false;
      this.keysPressed[e.key.toLowerCase()] = false;
    };

    // Mất focus (chuyển tab, alt-tab) thì nhả hết phím để nhân vật không tự chạy mãi
    const onBlur = () => {
      this.keysPressed = {};
    };
    window.addEventListener('blur', onBlur);
    this.blurHandler = onBlur;

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

  public sitAtSeat(seatNumber: number): void {
    this.mySeatedNumber = seatNumber;
    this.isRoaming = false;
    this.roamTargetPos = null;

    if (this.roamAvatar) {
      this.roamAvatar.root.visible = false;
    }

    // Đưa camera về bao quát bàn cắm trại
    this.cameraRadius = 11.5;
    this.cameraHeight = 7.0;
    this.targetCameraCenter.set(0, 1.2, 0);
    this.updateCameraPosition();

    if (this.onRoamStateChangeCallback) {
      this.onRoamStateChangeCallback(false);
    }
    if (this.onLocalRoamChangeCallback) {
      this.onLocalRoamChangeCallback(this.getLocalRoamState());
    }
  }

  public standUp(): void {
    this.mySeatedNumber = null;
    this.isRoaming = true;
    this.roamTargetPos = null;

    if (this.roamAvatar) {
      this.roamAvatar.root.visible = true;
      this.roamAvatar.setStanding(true);
      this.roamAvatar.setAnimation('idle');
      this.roamAvatar.root.position.copy(this.roamPosition);
      this.roamAvatar.root.rotation.y = this.roamFacingAngle;
    }

    this.cameraRadius = 8.5;
    this.cameraHeight = 5.0;
    this.updateCameraPosition();

    if (this.onRoamStateChangeCallback) {
      this.onRoamStateChangeCallback(true);
    }
    if (this.onLocalRoamChangeCallback) {
      this.onLocalRoamChangeCallback(this.getLocalRoamState());
    }
  }

  public setRoaming(enable: boolean): void {
    if (enable) {
      this.standUp();
    } else {
      this.sitAtSeat(this.mySeatedNumber || 1);
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
      if (this.roamAvatar) {
        this.roamAvatar.root.position.copy(this.roamPosition);
      }
      if (this.onLocalRoamChangeCallback) {
        this.onLocalRoamChangeCallback(this.getLocalRoamState());
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

  // === ĐỒNG BỘ NHÂN VẬT METAVERSE MULTIPLAYER TỪ XA ===

  public setLocalPlayerId(id: string): void {
    this.localPlayerId = id;
  }

  public setOnLocalRoamChange(callback: (state: RemoteRoamPlayer) => void): void {
    this.onLocalRoamChangeCallback = callback;
  }

  public getLocalRoamState(): RemoteRoamPlayer {
    const isMoving = Boolean(
      (this.keysPressed['ArrowUp'] ||
        this.keysPressed['ArrowDown'] ||
        this.keysPressed['ArrowLeft'] ||
        this.keysPressed['ArrowRight'] ||
        this.keysPressed['w'] ||
        this.keysPressed['s'] ||
        this.keysPressed['a'] ||
        this.keysPressed['d'] ||
        this.keysPressed['W'] ||
        this.keysPressed['S'] ||
        this.keysPressed['A'] ||
        this.keysPressed['D'] ||
        this.roamTargetPos !== null) &&
        this.isRoaming
    );

    return {
      id: this.localPlayerId || 'local_hunter',
      name: this.playerName,
      outfit: this.playerOutfit,
      position: {
        x: Math.round(this.roamPosition.x * 100) / 100,
        y: Math.round(this.roamPosition.y * 100) / 100,
        z: Math.round(this.roamPosition.z * 100) / 100,
      },
      facingAngle: Math.round(this.roamFacingAngle * 100) / 100,
      anim: isMoving ? 'walk' : 'idle',
      isRoaming: this.isRoaming,
      seatNumber: this.mySeatedNumber,
      tentId: this.activeTentId,
      updatedAt: Date.now(),
    };
  }

  public updateRemotePlayer(player: RemoteRoamPlayer): void {
    if (this.localPlayerId && player.id === this.localPlayerId) return;

    let entry = this.remoteAvatars.get(player.id);
    if (!entry) {
      const character = new WolfCharacter(player.outfit);
      character.setNameplate(player.name);
      character.setStanding(player.isRoaming);
      character.setAnimation(player.anim || 'idle');
      character.root.position.set(player.position.x, player.position.y ?? 0.05, player.position.z);
      character.root.rotation.y = player.facingAngle;
      character.root.visible = true;
      this.scene.add(character.root);

      entry = {
        character,
        targetPos: new THREE.Vector3(player.position.x, player.position.y ?? 0.05, player.position.z),
        targetAngle: player.facingAngle,
        anim: player.anim || 'idle',
        isRoaming: player.isRoaming,
        seatNumber: player.seatNumber,
        tentId: player.tentId,
        lastSeen: Date.now(),
      };
      this.remoteAvatars.set(player.id, entry);
    } else {
      entry.targetPos.set(player.position.x, player.position.y ?? 0.05, player.position.z);
      entry.targetAngle = player.facingAngle;
      entry.anim = player.anim || 'idle';
      entry.isRoaming = player.isRoaming;
      entry.seatNumber = player.seatNumber;
      entry.tentId = player.tentId;
      entry.lastSeen = Date.now();

      // Cập nhật tên nếu thay đổi
      entry.character.setNameplate(player.name);

      // Cập nhật outfit nếu đổi skin/nón
      if (
        entry.character.outfit.skinId !== player.outfit.skinId ||
        entry.character.outfit.hatId !== player.outfit.hatId ||
        entry.character.outfit.eyeGlowId !== player.outfit.eyeGlowId ||
        entry.character.outfit.backItemId !== player.outfit.backItemId
      ) {
        entry.character.updateOutfit(player.outfit);
      }
    }
  }

  public removeRemotePlayer(playerId: string): void {
    const entry = this.remoteAvatars.get(playerId);
    if (entry) {
      this.scene.remove(entry.character.root);
      this.remoteAvatars.delete(playerId);
    }
  }

  public clearAllRemotePlayers(): void {
    for (const entry of this.remoteAvatars.values()) {
      this.scene.remove(entry.character.root);
    }
    this.remoteAvatars.clear();
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
      const stump = this.seatMeshes[info.seatNumber - 1];
      if (!char || !stump) return;

      char.root.userData = { seatNumber: info.seatNumber };

      // Ghế Trống (isEmpty === true hoặc chưa có người ngồi):
      // Ẩn mesh nhân vật tương ứng, hiện nhãn bảng tên trên khúc gỗ
      if (info.isEmpty) {
        char.root.visible = false;

        let labelSprite = this.stumpLabels.get(info.seatNumber);
        if (!labelSprite) {
          labelSprite = this.createStumpLabelSprite(info.seatNumber);
          labelSprite.position.set(stump.position.x, 0.72, stump.position.z);
          this.scene.add(labelSprite);
          this.stumpLabels.set(info.seatNumber, labelSprite);
        }
        labelSprite.visible = true;
        return;
      }

      // Ghế có người chơi ngồi: Hiện mesh nhân vật, ẩn nhãn bảng tên trống
      char.root.visible = true;
      const labelSprite = this.stumpLabels.get(info.seatNumber);
      if (labelSprite) {
        labelSprite.visible = false;
      }

      // Cập nhật trang phục nếu có
      if (info.outfit) {
        char.updateOutfit(info.outfit);
      }

      // Đặt trạng thái còn sống hay hy sinh
      char.setGhostMode(!info.isAlive);

      // Cập nhật Bảng Tên Nổi 3D lơ lửng trên đầu nhân vật
      char.setNameplate(info.name, info.seatNumber, info.isAlive);

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
      const k = this.keysPressed;
      const isUp = Boolean(k['KeyW'] || k['w'] || k['ArrowUp'] || k['arrowup']);
      const isDown = Boolean(k['KeyS'] || k['s'] || k['ArrowDown'] || k['arrowdown']);
      const isLeft = Boolean(k['KeyA'] || k['a'] || k['ArrowLeft'] || k['arrowleft']);
      const isRight = Boolean(k['KeyD'] || k['d'] || k['ArrowRight'] || k['arrowright']);
      const inputForward = (isUp ? 1 : 0) - (isDown ? 1 : 0);
      const inputRight = (isRight ? 1 : 0) - (isLeft ? 1 : 0);

      const player1 = this.characters.get(1);
      const movement = CampfireScene.computeCameraRelativeMovement(this.cameraAngle, inputForward, inputRight);

      if (movement) {
        // Phím bàn phím: hủy bỏ đích chạm Click/Tap-to-Walk
        this.roamTargetPos = null;

        const { dirX, dirZ } = movement;

        this.roamPosition.x += dirX * moveSpeed;
        this.roamPosition.z += dirZ * moveSpeed;

        // Giới hạn trong khuôn viên khu cắm trại
        this.roamPosition.x = Math.max(-28, Math.min(28, this.roamPosition.x));
        this.roamPosition.z = Math.max(-36, Math.min(14, this.roamPosition.z));

        // Xoay hướng mặt nhân vật theo hướng di chuyển
        this.roamFacingAngle = Math.atan2(dirX, dirZ);
        this.roamPosition.y = 0.05;

        if (this.roamAvatar) {
          this.roamAvatar.setStanding(true);
          this.roamAvatar.setAnimation('walk');
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

          if (this.roamAvatar) {
            this.roamAvatar.setStanding(true);
            this.roamAvatar.setAnimation('walk');
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
          if (this.roamAvatar) {
            this.roamAvatar.setStanding(true);
            this.roamAvatar.setAnimation('idle');
          }
        }
      } else {
        // Đứng yên thẳng người thở nhẹ
        this.roamPosition.y = 0.05;
        if (this.roamAvatar) {
          this.roamAvatar.setStanding(true);
          this.roamAvatar.setAnimation('idle');
        }
      }

      // Áp dụng lực đẩy lùi tránh đốm lửa trại (Obstacle Avoidance around Campfire Pits)
      this.applyCampfireObstaclePushback();

      // Cập nhật vị trí avatar người chơi đi dạo
      if (this.roamAvatar) {
        this.roamAvatar.root.position.copy(this.roamPosition);
        this.roamAvatar.root.rotation.y = this.roamFacingAngle;
        this.roamAvatar.update(delta);
      }

      // Phát sóng cập nhật vị trí cho người chơi khác (nếu vị trí thay đổi hoặc định kỳ 1.5s)
      if (this.onLocalRoamChangeCallback) {
        const posChanged = this.roamPosition.distanceToSquared(this.prevBroadcastPos) > 0.002;
        const angleChanged = Math.abs(this.roamFacingAngle - this.prevBroadcastAngle) > 0.04;
        const timeElapsed = now - this.lastRoamBroadcast;

        if ((posChanged || angleChanged) && timeElapsed >= 75) {
          this.lastRoamBroadcast = now;
          this.prevBroadcastPos.copy(this.roamPosition);
          this.prevBroadcastAngle = this.roamFacingAngle;
          this.onLocalRoamChangeCallback(this.getLocalRoamState());
        } else if (timeElapsed >= 1500) {
          this.lastRoamBroadcast = now;
          this.onLocalRoamChangeCallback(this.getLocalRoamState());
        }
      }

      this.updateCameraPosition();
    }

    // Cập nhật hoạt cảnh và nội suy chuyển động cho các nhân vật người chơi từ xa (Remote Roam Mesh)
    for (const [id, entry] of this.remoteAvatars.entries()) {
      if (now - entry.lastSeen > 7000) {
        this.scene.remove(entry.character.root);
        this.remoteAvatars.delete(id);
        continue;
      }

      if (entry.isRoaming) {
        entry.character.root.visible = true;
        entry.character.setStanding(true);
        entry.character.setAnimation(entry.anim);

        // Nội suy vị trí Lerp mượt mà
        entry.character.root.position.lerp(entry.targetPos, 0.22);

        // Nội suy góc quay mặt ngắn nhất
        let diff = entry.targetAngle - entry.character.root.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        entry.character.root.rotation.y += diff * 0.22;

        entry.character.update(delta);
      } else {
        // Người chơi ngồi ở ghế
        entry.character.root.visible = true;
        entry.character.setStanding(false);
        entry.character.setAnimation('idle');
        entry.character.root.position.copy(entry.targetPos);
        entry.character.root.rotation.y = entry.targetAngle;
        entry.character.update(delta);
      }
    }

    // Ngọn lửa bập bùng
    const flick = Math.sin(now * 0.01) * 0.4 + Math.cos(now * 0.02) * 0.2;
    this.campfireLight.intensity = (this.isNight ? 3.8 : 1.6) + flick;

    this.flameMeshes.forEach((flame, idx) => {
      flame.rotation.y += (idx + 1) * delta * 2;
      const s = 1.0 + Math.sin(now * 0.008 + idx) * 0.15;
      flame.scale.set(s, 1.0 + flick * 0.2, s);
    });

    // Lửa phụ ở các lều
    this.secondaryFlames.forEach((flame, idx) => {
      flame.rotation.y += delta * 1.8;
      const s = 0.9 + Math.sin(now * 0.007 + idx) * 0.12;
      flame.scale.set(s, 1.0 + flick * 0.15, s);
    });

    // Đom đóm dập dềnh quanh Lều Núi Tuyết
    this.fireflyMeshes.forEach((fly) => {
      const u = fly.userData;
      fly.position.y = u.baseY + Math.sin(now * 0.002 * u.speed + u.offset) * 0.35;
    });

    // Xoay nhẹ vòng ma thuật dưới ghế khi được chọn
    if (this.highlightRing && this.highlightRing.visible) {
      this.highlightRing.rotation.z += delta * 1.5;
    }

    // Biển hiệu 3D nổi trên nóc lều bồng bềnh nhẹ nhàng
    this.tentSignboardSprites.forEach((sprite) => {
      sprite.position.y = 4.4 + Math.sin(now * 0.002) * 0.08;
    });

    // Cập nhật hoạt cảnh cho các nhân vật ngồi quanh bàn
    this.characters.forEach((char) => {
      char.update(delta);
    });

    this.renderer.render(this.scene, this.camera);
  }

  public destroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.clearAllRemotePlayers();
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
    if (this.blurHandler) {
      window.removeEventListener('blur', this.blurHandler);
    }
    this.renderer.dispose();
  }
}
