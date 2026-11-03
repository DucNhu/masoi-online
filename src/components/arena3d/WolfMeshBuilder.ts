import * as THREE from 'three';
import { PlayerOutfitConfig, OUTFIT_SKINS, OUTFIT_EYES } from './types';

export class WolfCharacter {
  public root: THREE.Group;
  public headGroup: THREE.Group;
  public bodyGroup: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public eyes: THREE.Mesh[];
  public hatSlot: THREE.Group;
  public backSlot: THREE.Group;
  public outfit: PlayerOutfitConfig;

  private skinMaterial: THREE.MeshStandardMaterial;
  private eyeMaterial: THREE.MeshStandardMaterial;
  private bellyMaterial: THREE.MeshStandardMaterial;
  private noseMaterial: THREE.MeshStandardMaterial;
  private fangMaterial: THREE.MeshStandardMaterial;

  private animTime = 0;
  private currentAnim: 'idle' | 'howl' | 'point' | 'slumber' = 'idle';

  constructor(outfit: PlayerOutfitConfig) {
    this.outfit = outfit;
    this.root = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.hatSlot = new THREE.Group();
    this.backSlot = new THREE.Group();
    this.eyes = [];

    // Materials
    const skinHex = OUTFIT_SKINS.find((s) => s.id === outfit.skinId)?.hex ?? 0x475569;
    const eyeHex = OUTFIT_EYES.find((e) => e.id === outfit.eyeGlowId)?.hex ?? 0xef4444;

    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: skinHex,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    });

    this.bellyMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.9,
      flatShading: true,
    });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: eyeHex,
      emissive: eyeHex,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });

    this.noseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      flatShading: true,
    });

    this.fangMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      flatShading: true,
    });

    this.buildMesh();
    this.updateOutfit(outfit);
  }

  private buildMesh(): void {
    // === 1. BODY & TORSO ===
    const torsoGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.85, 6);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.skinMaterial);
    torsoMesh.position.y = 0.45;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.bodyGroup.add(torsoMesh);

    // Bụng sói sáng màu (Belly patch)
    const bellyGeo = new THREE.BoxGeometry(0.38, 0.65, 0.15);
    const bellyMesh = new THREE.Mesh(bellyGeo, this.bellyMaterial);
    bellyMesh.position.set(0, 0.45, 0.4);
    this.bodyGroup.add(bellyMesh);

    // Đuôi sói xù (Fluffy tail)
    const tailGeo = new THREE.ConeGeometry(0.18, 0.65, 5);
    const tailMesh = new THREE.Mesh(tailGeo, this.skinMaterial);
    tailMesh.position.set(0, 0.3, -0.45);
    tailMesh.rotation.x = -Math.PI / 3;
    this.bodyGroup.add(tailMesh);

    // Chân ngồi (Sitting legs)
    const legGeo = new THREE.BoxGeometry(0.24, 0.35, 0.45);
    const leftLeg = new THREE.Mesh(legGeo, this.skinMaterial);
    leftLeg.position.set(-0.35, 0.15, 0.15);
    leftLeg.castShadow = true;
    this.bodyGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, this.skinMaterial);
    rightLeg.position.set(0.35, 0.15, 0.15);
    rightLeg.castShadow = true;
    this.bodyGroup.add(rightLeg);

    // === 2. ARMS ===
    const armGeo = new THREE.BoxGeometry(0.16, 0.55, 0.18);
    armGeo.translate(0, -0.22, 0); // Đặt pivot ở vai

    const leftArmMesh = new THREE.Mesh(armGeo, this.skinMaterial);
    this.leftArm.position.set(-0.5, 0.75, 0.05);
    this.leftArm.add(leftArmMesh);
    this.bodyGroup.add(this.leftArm);

    const rightArmMesh = new THREE.Mesh(armGeo, this.skinMaterial);
    this.rightArm.position.set(0.5, 0.75, 0.05);
    this.rightArm.add(rightArmMesh);
    this.bodyGroup.add(this.rightArm);

    // === 3. HEAD & SNOUT ===
    this.headGroup.position.set(0, 0.95, 0.05);

    // Hộp sọ đầu sói (Cranial box)
    const headGeo = new THREE.BoxGeometry(0.58, 0.52, 0.55);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Mõm sói nhô ra phía trước (Muzzle/Snout)
    const muzzleGeo = new THREE.BoxGeometry(0.36, 0.26, 0.42);
    const muzzleMesh = new THREE.Mesh(muzzleGeo, this.skinMaterial);
    muzzleMesh.position.set(0, -0.1, 0.45);
    muzzleMesh.castShadow = true;
    this.headGroup.add(muzzleMesh);

    // Mũi đen (Black nose tip)
    const noseGeo = new THREE.BoxGeometry(0.14, 0.1, 0.1);
    const noseMesh = new THREE.Mesh(noseGeo, this.noseMaterial);
    noseMesh.position.set(0, -0.04, 0.68);
    this.headGroup.add(noseMesh);

    // Nanh nhọn hai bên (Sharp fangs)
    const fangGeo = new THREE.ConeGeometry(0.04, 0.12, 3);
    const leftFang = new THREE.Mesh(fangGeo, this.fangMaterial);
    leftFang.position.set(-0.1, -0.22, 0.48);
    leftFang.rotation.x = Math.PI;
    this.headGroup.add(leftFang);

    const rightFang = new THREE.Mesh(fangGeo, this.fangMaterial);
    rightFang.position.set(0.1, -0.22, 0.48);
    rightFang.rotation.x = Math.PI;
    this.headGroup.add(rightFang);

    // Hai tai sói nhọn dựng đứng (Pointy triangular ears)
    const earGeo = new THREE.ConeGeometry(0.15, 0.42, 3);
    const leftEar = new THREE.Mesh(earGeo, this.skinMaterial);
    leftEar.position.set(-0.22, 0.4, 0);
    leftEar.rotation.z = 0.2;
    leftEar.rotation.x = -0.1;
    this.headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, this.skinMaterial);
    rightEar.position.set(0.22, 0.4, 0);
    rightEar.rotation.z = -0.2;
    rightEar.rotation.x = -0.1;
    this.headGroup.add(rightEar);

    // Mắt phát sáng rực rỡ (Glowing neon eyes)
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.08, 0.06);
    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    leftEye.position.set(-0.16, 0.06, 0.29);
    this.headGroup.add(leftEye);
    this.eyes.push(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    rightEye.position.set(0.16, 0.06, 0.29);
    this.headGroup.add(rightEye);
    this.eyes.push(rightEye);

    // Socket gắn Mũ
    this.hatSlot.position.set(0, 0.32, 0);
    this.headGroup.add(this.hatSlot);

    // Socket gắn Đồ Sau Lưng
    this.backSlot.position.set(0, 0.55, -0.3);
    this.bodyGroup.add(this.backSlot);

    this.root.add(this.bodyGroup);
    this.root.add(this.headGroup);
  }

  public updateOutfit(newOutfit: PlayerOutfitConfig): void {
    this.outfit = newOutfit;

    // 1. Cập nhật màu lông
    const skinData = OUTFIT_SKINS.find((s) => s.id === newOutfit.skinId);
    if (skinData) {
      this.skinMaterial.color.setHex(skinData.hex);
    }

    // 2. Cập nhật mắt phát sáng
    const eyeData = OUTFIT_EYES.find((e) => e.id === newOutfit.eyeGlowId);
    if (eyeData) {
      this.eyeMaterial.color.setHex(eyeData.hex);
      this.eyeMaterial.emissive.setHex(eyeData.hex);
    }

    // 3. Cập nhật Mũ (Hat attachment)
    this.hatSlot.clear();
    this.buildHatMesh(newOutfit.hatId);

    // 4. Cập nhật Đồ sau lưng (Back item)
    this.backSlot.clear();
    this.buildBackMesh(newOutfit.backItemId);
  }

  private buildHatMesh(hatId: string): void {
    switch (hatId) {
      case 'CONICAL_HAT': {
        // Nón lá Việt Nam
        const mat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8, flatShading: true });
        const cone = new THREE.ConeGeometry(0.68, 0.32, 12);
        const mesh = new THREE.Mesh(cone, mat);
        mesh.position.y = 0.15;
        this.hatSlot.add(mesh);
        break;
      }
      case 'WITCH': {
        // Mũ phù thủy
        const mat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.7, flatShading: true });
        // Vành mũ
        const brim = new THREE.CylinderGeometry(0.55, 0.55, 0.05, 12);
        const brimMesh = new THREE.Mesh(brim, mat);
        // Chóp mũ
        const tip = new THREE.ConeGeometry(0.3, 0.75, 8);
        const tipMesh = new THREE.Mesh(tip, mat);
        tipMesh.position.y = 0.38;
        tipMesh.rotation.z = -0.15; // Hơi nghiêng ma mị
        this.hatSlot.add(brimMesh);
        this.hatSlot.add(tipMesh);
        break;
      }
      case 'COWBOY': {
        // Mũ cao bồi
        const mat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9, flatShading: true });
        const brim = new THREE.CylinderGeometry(0.62, 0.62, 0.04, 10);
        const brimMesh = new THREE.Mesh(brim, mat);
        const top = new THREE.CylinderGeometry(0.28, 0.32, 0.32, 8);
        const topMesh = new THREE.Mesh(top, mat);
        topMesh.position.y = 0.16;
        this.hatSlot.add(brimMesh);
        this.hatSlot.add(topMesh);
        break;
      }
      case 'CROWN': {
        // Vương miện vàng hoàng gia
        const mat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.8,
          roughness: 0.2,
          flatShading: true,
        });
        const ring = new THREE.CylinderGeometry(0.35, 0.35, 0.16, 6, 1, true);
        const crownMesh = new THREE.Mesh(ring, mat);
        crownMesh.position.y = 0.1;
        this.hatSlot.add(crownMesh);
        break;
      }
      case 'BANDANA': {
        // Băng đô đỏ
        const mat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, flatShading: true });
        const strip = new THREE.CylinderGeometry(0.36, 0.36, 0.1, 8);
        const stripMesh = new THREE.Mesh(strip, mat);
        stripMesh.position.y = -0.05;
        this.hatSlot.add(stripMesh);
        break;
      }
      default:
        break;
    }
  }

  private buildBackMesh(backId: string): void {
    switch (backId) {
      case 'CAPE': {
        // Áo choàng đỏ
        const mat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7, flatShading: true });
        const capeGeo = new THREE.BoxGeometry(0.55, 0.85, 0.06);
        const capeMesh = new THREE.Mesh(capeGeo, mat);
        capeMesh.position.set(0, -0.2, -0.08);
        capeMesh.rotation.x = 0.2;
        this.backSlot.add(capeMesh);
        break;
      }
      case 'SWORD': {
        // Kiếm hiệp sau lưng
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        const hiltMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.03), bladeMat);
        const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.06), hiltMat);
        hilt.position.y = 0.35;
        const swordGroup = new THREE.Group();
        swordGroup.add(blade);
        swordGroup.add(hilt);
        swordGroup.rotation.z = Math.PI / 4;
        this.backSlot.add(swordGroup);
        break;
      }
      case 'POTION': {
        // Bình độc dược xanh ngọc
        const bottleMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 0.8,
          roughness: 0.1,
        });
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.35, 6), bottleMat);
        bottle.rotation.z = -0.3;
        this.backSlot.add(bottle);
        break;
      }
      case 'SHIELD': {
        // Khiên hộ vệ
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.5, flatShading: true });
        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 8), shieldMat);
        shield.rotation.x = Math.PI / 2;
        this.backSlot.add(shield);
        break;
      }
      default:
        break;
    }
  }

  public setAnimation(anim: 'idle' | 'howl' | 'point' | 'slumber'): void {
    this.currentAnim = anim;
  }

  public update(delta: number): void {
    this.animTime += delta;

    switch (this.currentAnim) {
      case 'idle': {
        // Nhịp thở nhẹ nhàng
        const breathe = Math.sin(this.animTime * 2.5) * 0.03;
        this.headGroup.position.y = 0.95 + breathe * 0.5;
        this.headGroup.rotation.x = breathe * 0.4;
        this.headGroup.rotation.z = Math.sin(this.animTime * 1.2) * 0.03;
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
        this.eyeMaterial.emissiveIntensity = 1.0 + Math.sin(this.animTime * 4) * 0.3;
        break;
      }
      case 'howl': {
        // Ngửa cổ tru trăng
        this.headGroup.rotation.x = -Math.PI / 4 + Math.sin(this.animTime * 6) * 0.05;
        this.headGroup.position.y = 1.05;
        this.leftArm.rotation.x = -Math.PI / 6;
        this.rightArm.rotation.x = -Math.PI / 6;
        this.eyeMaterial.emissiveIntensity = 2.0;
        break;
      }
      case 'point': {
        // Giơ tay chỉ thẳng buộc tội
        this.rightArm.rotation.x = -Math.PI / 2;
        this.headGroup.rotation.x = 0.1;
        this.eyeMaterial.emissiveIntensity = 1.6;
        break;
      }
      case 'slumber': {
        // Cúi đầu ngủ ban đêm
        this.headGroup.rotation.x = Math.PI / 5;
        this.headGroup.position.y = 0.88;
        this.leftArm.rotation.x = 0.1;
        this.rightArm.rotation.x = 0.1;
        this.eyeMaterial.emissiveIntensity = 0.1; // Mắt mờ đi khi ngủ
        break;
      }
    }
  }

  public setGhostMode(isDead: boolean): void {
    if (isDead) {
      this.skinMaterial.color.setHex(0x64748b);
      this.skinMaterial.transparent = true;
      this.skinMaterial.opacity = 0.45;
      this.eyeMaterial.emissiveIntensity = 0.2;
    } else {
      const skinHex = OUTFIT_SKINS.find((s) => s.id === this.outfit.skinId)?.hex ?? 0x475569;
      this.skinMaterial.color.setHex(skinHex);
      this.skinMaterial.transparent = false;
      this.skinMaterial.opacity = 1.0;
    }
  }
}
