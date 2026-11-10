import * as THREE from 'three';
import {
  PlayerOutfitConfig,
  OUTFIT_SKINS,
  OUTFIT_EYES,
  OutfitSkinItem,
} from './types';

// Helper rút gọn hiển thị tên bảng tên 3D (Hỗ trợ tiếng Việt trọn vẹn lên tới 22 ký tự)
export function formatNameplateDisplayName(name: string, seatNumber?: number, maxLen = 22): string {
  const displayName = seatNumber ? `#${seatNumber} ${name}` : name;
  return displayName.length > maxLen ? displayName.slice(0, maxLen - 1) + '…' : displayName;
}

export class WolfCharacter {
  public root: THREE.Group;
  public headGroup: THREE.Group;
  public bodyGroup: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public isStanding = false;
  public eyes: THREE.Mesh[];
  public hatSlot: THREE.Group;
  public backSlot: THREE.Group;
  public outfit: PlayerOutfitConfig;
  public nameplateSprite?: THREE.Sprite;

  // Materials
  private skinMaterial: THREE.MeshStandardMaterial;
  private jacketMaterial: THREE.MeshStandardMaterial;
  private scarfMaterial: THREE.MeshStandardMaterial;
  private hairMaterial: THREE.MeshStandardMaterial;
  private eyeMaterial: THREE.MeshStandardMaterial;
  private blushMaterial: THREE.MeshStandardMaterial;
  private noseMaterial: THREE.MeshStandardMaterial;
  private bootMaterial: THREE.MeshStandardMaterial;

  // Dynamic mesh references for rebuilds
  private hairGroup: THREE.Group;
  private faceFeaturesGroup: THREE.Group;
  private scarfMesh?: THREE.Mesh;
  private tailMesh?: THREE.Mesh;

  private animTime = 0;
  private currentAnim: 'idle' | 'howl' | 'point' | 'slumber' | 'walk' = 'idle';

  constructor(outfit: PlayerOutfitConfig) {
    this.outfit = outfit;
    this.root = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.hatSlot = new THREE.Group();
    this.backSlot = new THREE.Group();
    this.hairGroup = new THREE.Group();
    this.faceFeaturesGroup = new THREE.Group();
    this.eyes = [];

    const skinData = this.getSkinData(outfit.skinId);
    const eyeHex = OUTFIT_EYES.find((e) => e.id === outfit.eyeGlowId)?.hex ?? 0xef4444;

    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: skinData.skinTone,
      roughness: 0.45,
      metalness: 0.05,
    });

    this.jacketMaterial = new THREE.MeshStandardMaterial({
      color: skinData.jacketColor,
      roughness: 0.65,
      metalness: 0.1,
    });

    this.scarfMaterial = new THREE.MeshStandardMaterial({
      color: skinData.scarfColor,
      roughness: 0.75,
      metalness: 0.05,
    });

    this.hairMaterial = new THREE.MeshStandardMaterial({
      color: skinData.hairColor,
      roughness: 0.45,
      metalness: 0.08,
    });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: eyeHex,
      emissive: eyeHex,
      emissiveIntensity: 1.3,
      roughness: 0.15,
      metalness: 0.1,
    });

    this.blushMaterial = new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      roughness: 0.85,
      transparent: true,
      opacity: 0.6,
    });

    this.noseMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
    });

    this.bootMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
    });

    this.buildBaseMesh();
    this.buildArchetypeFeatures(skinData);
    this.updateOutfit(outfit);
  }

  private getSkinData(skinId: string): OutfitSkinItem {
    return (
      OUTFIT_SKINS.find((s) => s.id === skinId) ||
      OUTFIT_SKINS[0]
    );
  }

  private buildBaseMesh(): void {
    // === 1. THÂN & ÁO KHOÁC CẮM TRẠI (COZY CAMPING JACKET) ===
    const torsoGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.72, 24);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.jacketMaterial);
    torsoMesh.position.y = 0.42;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.bodyGroup.add(torsoMesh);

    // Dải khóa kéo / nẹp áo thể thao giữa ngực
    const zipperGeo = new THREE.BoxGeometry(0.03, 0.68, 0.04);
    const zipperMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const zipperMesh = new THREE.Mesh(zipperGeo, zipperMat);
    zipperMesh.position.set(0, 0.42, 0.33);
    this.bodyGroup.add(zipperMesh);

    // VÒNG KHĂN QUÀNG CỔ ẤM ÁP (COZY CAMPING SCARF)
    const scarfGeo = new THREE.TorusGeometry(0.26, 0.075, 16, 32);
    this.scarfMesh = new THREE.Mesh(scarfGeo, this.scarfMaterial);
    this.scarfMesh.rotation.x = Math.PI / 2;
    this.scarfMesh.position.set(0, 0.74, 0.02);
    this.scarfMesh.castShadow = true;
    this.bodyGroup.add(this.scarfMesh);

    // Vạt khăn quàng buông xuống ngực
    const scarfTailGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.32, 16);
    const scarfTail = new THREE.Mesh(scarfTailGeo, this.scarfMaterial);
    scarfTail.position.set(0.09, 0.56, 0.32);
    scarfTail.rotation.z = -0.15;
    scarfTail.rotation.x = 0.2;
    this.bodyGroup.add(scarfTail);

    // Chân & Giày bốt cắm trại (Hip Joint Groups, Legs and Boots)
    const legGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.38, 16);
    const bootSoleGeo = new THREE.BoxGeometry(0.22, 0.12, 0.42);

    // Khớp hông chân trái (-0.20, 0.34, 0)
    this.leftLeg.position.set(-0.20, 0.34, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.jacketMaterial);
    leftLegMesh.position.set(0, -0.16, 0);
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);

    const leftBoot = new THREE.Mesh(bootSoleGeo, this.bootMaterial);
    leftBoot.position.set(0, -0.32, 0.05);
    leftBoot.castShadow = true;
    this.leftLeg.add(leftBoot);
    this.bodyGroup.add(this.leftLeg);

    // Khớp hông chân phải (0.20, 0.34, 0)
    this.rightLeg.position.set(0.20, 0.34, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, this.jacketMaterial);
    rightLegMesh.position.set(0, -0.16, 0);
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);

    const rightBoot = new THREE.Mesh(bootSoleGeo, this.bootMaterial);
    rightBoot.position.set(0, -0.32, 0.05);
    rightBoot.castShadow = true;
    this.rightLeg.add(rightBoot);
    this.bodyGroup.add(this.rightLeg);

    // Mặc định khởi tạo ngồi (isStanding = false):
    this.leftLeg.rotation.x = -Math.PI / 2.2;
    this.rightLeg.rotation.x = -Math.PI / 2.2;
    this.bodyGroup.position.y = 0;
    this.headGroup.position.y = 0.98;

    // === 2. TAY ÁO & BÀN TAY CHIBI BO TRÒN (ARMS & CHIBI HANDS) ===
    const sleeveGeo = new THREE.CylinderGeometry(0.095, 0.11, 0.46, 16);
    sleeveGeo.translate(0, -0.18, 0);

    const handGeo = new THREE.SphereGeometry(0.085, 16, 16);
    handGeo.translate(0, -0.42, 0);

    // Tay trái
    const leftSleeve = new THREE.Mesh(sleeveGeo, this.jacketMaterial);
    const leftHand = new THREE.Mesh(handGeo, this.skinMaterial);
    this.leftArm.position.set(-0.42, 0.72, 0.04);
    this.leftArm.add(leftSleeve);
    this.leftArm.add(leftHand);
    this.bodyGroup.add(this.leftArm);

    // Tay phải
    const rightSleeve = new THREE.Mesh(sleeveGeo, this.jacketMaterial);
    const rightHand = new THREE.Mesh(handGeo, this.skinMaterial);
    this.rightArm.position.set(0.42, 0.72, 0.04);
    this.rightArm.add(rightSleeve);
    this.rightArm.add(rightHand);
    this.bodyGroup.add(this.rightArm);

    // === 3. ĐẦU CHIBI BẦU BĨNH 3D (SMOOTH CHIBI HEAD) ===
    this.headGroup.position.set(0, 0.98, 0.02);

    const headGeo = new THREE.SphereGeometry(0.34, 24, 24);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Hai má ửng hồng dễ thương (Cute Pink Blushes)
    const blushGeo = new THREE.SphereGeometry(0.065, 12, 12);
    const leftBlush = new THREE.Mesh(blushGeo, this.blushMaterial);
    leftBlush.scale.set(1.0, 0.6, 0.25);
    leftBlush.position.set(-0.17, -0.05, 0.29);
    this.headGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, this.blushMaterial);
    rightBlush.scale.set(1.0, 0.6, 0.25);
    rightBlush.position.set(0.17, -0.05, 0.29);
    this.headGroup.add(rightBlush);

    // Mũi nhỏ xinh (Cute button nose)
    const noseGeo = new THREE.SphereGeometry(0.03, 12, 12);
    const noseMesh = new THREE.Mesh(noseGeo, this.noseMaterial);
    noseMesh.position.set(0, -0.02, 0.335);
    this.headGroup.add(noseMesh);

    // Miệng cười nhẹ nhàng (Gentle Smile)
    const smileGeo = new THREE.TorusGeometry(0.045, 0.012, 8, 16, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
    const smileMesh = new THREE.Mesh(smileGeo, smileMat);
    smileMesh.position.set(0, -0.1, 0.32);
    smileMesh.rotation.z = Math.PI; // Vòng cung cười lên
    this.headGroup.add(smileMesh);

    // ĐÔI MẮT ANIME / CHIBI CÓ ĐỐM SÁNG (GLOWING CHIBI EYES - ĐÚNG 2 THREE.Mesh)
    const eyeGeo = new THREE.SphereGeometry(0.075, 16, 16);

    const highlightGeo = new THREE.SphereGeometry(0.024, 8, 8);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Mắt trái
    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    leftEye.scale.set(0.9, 1.15, 0.35);
    leftEye.position.set(-0.13, 0.06, 0.3);
    const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    leftHighlight.position.set(0.028, 0.028, 0.055);
    leftEye.add(leftHighlight);
    this.headGroup.add(leftEye);
    this.eyes.push(leftEye);

    // Mắt phải
    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    rightEye.scale.set(0.9, 1.15, 0.35);
    rightEye.position.set(0.13, 0.06, 0.3);
    const rightHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    rightHighlight.position.set(0.028, 0.028, 0.055);
    rightEye.add(rightHighlight);
    this.headGroup.add(rightEye);
    this.eyes.push(rightEye);

    // Thêm Hair Group và Face Features Group
    this.headGroup.add(this.hairGroup);
    this.headGroup.add(this.faceFeaturesGroup);

    // Socket gắn Mũ
    this.hatSlot.position.set(0, 0.24, 0);
    this.headGroup.add(this.hatSlot);

    // Socket gắn Đồ Sau Lưng
    this.backSlot.position.set(0, 0.52, -0.28);
    this.bodyGroup.add(this.backSlot);

    this.root.add(this.bodyGroup);
    this.root.add(this.headGroup);
  }

  // === XÂY DỰNG TÓC VÀ ĐẶC ĐIỂM CHỦNG TỘC (HAIR & ARCHETYPE) ===
  private buildArchetypeFeatures(skinData: OutfitSkinItem): void {
    this.hairGroup.clear();
    this.faceFeaturesGroup.clear();

    if (this.tailMesh) {
      this.bodyGroup.remove(this.tailMesh);
      this.tailMesh = undefined;
    }

    // 1. Mũ tóc 3D ôm quanh đầu
    const hairCapGeo = new THREE.SphereGeometry(0.355, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const hairCap = new THREE.Mesh(hairCapGeo, this.hairMaterial);
    hairCap.position.set(0, 0.02, -0.02);
    hairCap.castShadow = true;
    this.hairGroup.add(hairCap);

    // 2. Mái tóc phía trước (Front stylized bangs)
    const bangAngles = [-0.18, -0.06, 0.06, 0.18];
    bangAngles.forEach((angle, i) => {
      const bangGeo = new THREE.ConeGeometry(0.055, 0.18 + (i % 2) * 0.04, 12);
      const bang = new THREE.Mesh(bangGeo, this.hairMaterial);
      bang.position.set(angle * 1.1, 0.22, 0.28);
      bang.rotation.x = -Math.PI * 0.75;
      bang.rotation.z = angle * 0.8;
      this.hairGroup.add(bang);
    });

    // 3. Hai lọn tóc mai ôm má (Side bangs)
    const sideBangGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.26, 12);
    const leftSideBang = new THREE.Mesh(sideBangGeo, this.hairMaterial);
    leftSideBang.position.set(-0.31, 0.05, 0.12);
    leftSideBang.rotation.z = -0.2;
    this.hairGroup.add(leftSideBang);

    const rightSideBang = new THREE.Mesh(sideBangGeo, this.hairMaterial);
    rightSideBang.position.set(0.31, 0.05, 0.12);
    rightSideBang.rotation.z = 0.2;
    this.hairGroup.add(rightSideBang);

    // 4. Đặc điểm riêng từng nhân vật
    const flaredEars =
      this.outfit.hatId === 'CONICAL_HAT' ||
      this.outfit.hatId === 'WITCH' ||
      this.outfit.hatId === 'COWBOY';

    if (skinData.id === 'WOLF_BLOOD') {
      // DẠNG SÓI HỒNG NGUYỆT: Có mõm sói bo tròn mịn màng + tai sói ngầu
      const muzzleGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.28, 16);
      const muzzleMesh = new THREE.Mesh(muzzleGeo, this.skinMaterial);
      muzzleMesh.position.set(0, -0.06, 0.38);
      muzzleMesh.rotation.x = Math.PI / 2;
      this.faceFeaturesGroup.add(muzzleMesh);

      const noseTipMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
      const wolfNose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), noseTipMat);
      wolfNose.position.set(0, -0.04, 0.52);
      this.faceFeaturesGroup.add(wolfNose);

      // Tai sói nhọn mềm mại
      const earGeo = new THREE.ConeGeometry(0.12, 0.35, 12);
      const leftEar = new THREE.Mesh(earGeo, this.hairMaterial);
      const rightEar = new THREE.Mesh(earGeo, this.hairMaterial);

      if (flaredEars) {
        leftEar.position.set(-0.24, 0.26, -0.02);
        leftEar.rotation.z = 0.58;
        rightEar.position.set(0.24, 0.26, -0.02);
        rightEar.rotation.z = -0.58;
      } else {
        leftEar.position.set(-0.2, 0.38, -0.05);
        leftEar.rotation.z = 0.25;
        rightEar.position.set(0.2, 0.38, -0.05);
        rightEar.rotation.z = -0.25;
      }
      this.faceFeaturesGroup.add(leftEar);
      this.faceFeaturesGroup.add(rightEar);

      // Đuôi sói xù sau lưng
      const tailGeo = new THREE.ConeGeometry(0.15, 0.65, 12);
      this.tailMesh = new THREE.Mesh(tailGeo, this.hairMaterial);
      this.tailMesh.position.set(0, 0.28, -0.42);
      this.tailMesh.rotation.x = -Math.PI / 3;
      this.bodyGroup.add(this.tailMesh);
    } else if (skinData.id === 'KITSUNE_FOX') {
      // DẠNG HỒ LY TINH LINH: Có tai cáo trắng viền hồng xinh xắn + đuôi hồ ly
      const earGeo = new THREE.ConeGeometry(0.11, 0.32, 12);
      const innerEarMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 });
      const innerEarGeo = new THREE.ConeGeometry(0.06, 0.24, 12);

      const leftEar = new THREE.Mesh(earGeo, this.hairMaterial);
      const leftInner = new THREE.Mesh(innerEarGeo, innerEarMat);
      leftInner.position.set(0, 0, 0.03);
      leftEar.add(leftInner);

      const rightEar = new THREE.Mesh(earGeo, this.hairMaterial);
      const rightInner = new THREE.Mesh(innerEarGeo, innerEarMat);
      rightInner.position.set(0, 0, 0.03);
      rightEar.add(rightInner);

      if (flaredEars) {
        leftEar.position.set(-0.24, 0.26, -0.02);
        leftEar.rotation.z = 0.58;
        rightEar.position.set(0.24, 0.26, -0.02);
        rightEar.rotation.z = -0.58;
      } else {
        leftEar.position.set(-0.19, 0.38, -0.02);
        leftEar.rotation.z = 0.28;
        rightEar.position.set(0.19, 0.38, -0.02);
        rightEar.rotation.z = -0.28;
      }
      this.faceFeaturesGroup.add(leftEar);
      this.faceFeaturesGroup.add(rightEar);

      // Đuôi hồ ly cong mềm mại
      const tailGeo = new THREE.CylinderGeometry(0.08, 0.18, 0.68, 16);
      this.tailMesh = new THREE.Mesh(tailGeo, this.hairMaterial);
      this.tailMesh.position.set(0, 0.3, -0.42);
      this.tailMesh.rotation.x = -Math.PI / 3.5;
      this.bodyGroup.add(this.tailMesh);
    } else if (skinData.id === 'CAMPER_GIRL') {
      // DẠNG NỮ SINH CẮM TRẠI: Mái tóc dài ngang lưng hai bên (Charming Twin Locks)
      const lockGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.52, 12);
      const leftLock = new THREE.Mesh(lockGeo, this.hairMaterial);
      leftLock.position.set(-0.28, -0.12, 0.02);
      leftLock.rotation.z = -0.15;
      this.hairGroup.add(leftLock);

      const rightLock = new THREE.Mesh(lockGeo, this.hairMaterial);
      rightLock.position.set(0.28, -0.12, 0.02);
      rightLock.rotation.z = 0.15;
      this.hairGroup.add(rightLock);
    }
  }

  public updateOutfit(newOutfit: PlayerOutfitConfig): void {
    this.outfit = newOutfit;
    const skinData = this.getSkinData(newOutfit.skinId);

    // 1. Cập nhật màu sắc vật liệu
    this.skinMaterial.color.setHex(skinData.skinTone);
    this.jacketMaterial.color.setHex(skinData.jacketColor);
    this.scarfMaterial.color.setHex(skinData.scarfColor);
    this.hairMaterial.color.setHex(skinData.hairColor);

    // 2. Cập nhật đặc điểm khuôn mặt & tóc theo archetype
    this.buildArchetypeFeatures(skinData);

    // 3. Cập nhật mắt phát sáng
    const eyeData = OUTFIT_EYES.find((e) => e.id === newOutfit.eyeGlowId);
    if (eyeData) {
      this.eyeMaterial.color.setHex(eyeData.hex);
      this.eyeMaterial.emissive.setHex(eyeData.hex);
    }

    // 4. Cập nhật Mũ
    this.hatSlot.clear();
    this.buildHatMesh(newOutfit.hatId);

    // 5. Cập nhật Đồ sau lưng
    this.backSlot.clear();
    this.buildBackMesh(newOutfit.backItemId);

    // 6. Cập nhật lại độ cao bảng tên tránh mũ và tai đâm xuyên
    if (this.nameplateSprite) {
      this.nameplateSprite.position.y = this.getTopClearanceY();
    }
  }

  private buildHatMesh(hatId: string): void {
    switch (hatId) {
      case 'CONICAL_HAT': {
        // Nón lá Việt Nam tre mộc mạc bo tròn thanh nhã
        const hatGroup = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({
          color: 0xd4a373,
          roughness: 0.75,
          metalness: 0.05,
        });
        const cone = new THREE.ConeGeometry(0.60, 0.26, 28);
        const mesh = new THREE.Mesh(cone, mat);
        mesh.position.y = 0.10;
        mesh.castShadow = true;
        hatGroup.add(mesh);

        // Chóp nón lá
        const tipMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), tipMat);
        tip.position.y = 0.23;
        hatGroup.add(tip);

        this.hatSlot.add(hatGroup);
        break;
      }
      case 'WITCH': {
        // Mũ phù thủy tím huyền bí
        const hatGroup = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.55 });
        const brim = new THREE.CylinderGeometry(0.50, 0.50, 0.035, 24);
        const brimMesh = new THREE.Mesh(brim, mat);
        brimMesh.position.y = 0.02;
        brimMesh.castShadow = true;

        // Dải ruy băng vàng quanh mũ
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.3 });
        const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.27, 0.05, 20), ribbonMat);
        ribbon.position.y = 0.05;

        const tip = new THREE.ConeGeometry(0.25, 0.46, 20);
        const tipMesh = new THREE.Mesh(tip, mat);
        tipMesh.position.set(-0.03, 0.25, 0);
        tipMesh.rotation.z = -0.16;
        tipMesh.castShadow = true;

        hatGroup.add(brimMesh);
        hatGroup.add(ribbon);
        hatGroup.add(tipMesh);
        this.hatSlot.add(hatGroup);
        break;
      }
      case 'COWBOY': {
        // Mũ cao bồi dã ngoại da bò
        const hatGroup = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
        const brim = new THREE.CylinderGeometry(0.54, 0.54, 0.035, 24);
        const brimMesh = new THREE.Mesh(brim, mat);
        brimMesh.position.y = 0.02;
        brimMesh.castShadow = true;

        const crown = new THREE.CylinderGeometry(0.24, 0.28, 0.22, 16);
        const crownMesh = new THREE.Mesh(crown, mat);
        crownMesh.position.y = 0.13;
        crownMesh.castShadow = true;

        hatGroup.add(brimMesh);
        hatGroup.add(crownMesh);
        this.hatSlot.add(hatGroup);
        break;
      }
      case 'CROWN': {
        // Vương miện hoàng gia nạm ngọc
        const hatGroup = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.85,
          roughness: 0.25,
        });
        const ring = new THREE.CylinderGeometry(0.30, 0.30, 0.14, 12, 1, true);
        const crownMesh = new THREE.Mesh(ring, goldMat);
        crownMesh.position.y = 0.08;
        hatGroup.add(crownMesh);

        // 4 viên ngọc lấp lánh trên vương miện
        const gemColors = [0xef4444, 0x06b6d4, 0x10b981, 0xa855f7];
        gemColors.forEach((col, idx) => {
          const angle = (idx / 4) * Math.PI * 2;
          const gemMat = new THREE.MeshStandardMaterial({
            color: col,
            emissive: col,
            emissiveIntensity: 0.8,
            roughness: 0.1,
          });
          const gem = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), gemMat);
          gem.position.set(Math.sin(angle) * 0.30, 0.16, Math.cos(angle) * 0.30);
          hatGroup.add(gem);
        });

        this.hatSlot.add(hatGroup);
        break;
      }
      case 'BANDANA': {
        // Băng đô ninja đỏ
        const mat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.65 });
        const strip = new THREE.CylinderGeometry(0.362, 0.362, 0.075, 24);
        const stripMesh = new THREE.Mesh(strip, mat);
        stripMesh.position.y = -0.06;
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
        // Áo choàng nhung đỏ rực
        const mat = new THREE.MeshStandardMaterial({
          color: 0xb91c1c,
          roughness: 0.65,
          side: THREE.DoubleSide,
        });
        const capeGeo = new THREE.CylinderGeometry(0.28, 0.44, 0.82, 16, 1, true, 0, Math.PI);
        const capeMesh = new THREE.Mesh(capeGeo, mat);
        capeMesh.position.set(0, -0.14, -0.06);
        capeMesh.rotation.y = Math.PI;
        capeMesh.rotation.x = 0.22;
        capeMesh.castShadow = true;
        this.backSlot.add(capeMesh);
        break;
      }
      case 'SWORD': {
        // Thanh kiếm hiệp sĩ đeo chéo
        const swordGroup = new THREE.Group();
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        const hiltMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });

        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.88, 0.025), bladeMat);
        const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.05), hiltMat);
        hilt.position.y = 0.34;
        const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), hiltMat);
        pommel.position.y = 0.46;

        swordGroup.add(blade);
        swordGroup.add(hilt);
        swordGroup.add(pommel);
        swordGroup.rotation.z = Math.PI / 4;
        this.backSlot.add(swordGroup);
        break;
      }
      case 'POTION': {
        // Bình độc dược xanh ngọc phát sáng
        const bottleMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: 0.9,
          roughness: 0.1,
          transparent: true,
          opacity: 0.9,
        });
        const corkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.34, 16), bottleMat);
        const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 12), corkMat);
        cork.position.y = 0.2;
        bottle.add(cork);
        bottle.rotation.z = -0.3;
        this.backSlot.add(bottle);
        break;
      }
      case 'SHIELD': {
        // Khiên hộ vệ
        const shieldGroup = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.5 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });

        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 24), woodMat);
        shield.rotation.x = Math.PI / 2;

        const boss = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), rimMat);
        boss.position.z = 0.04;
        shield.add(boss);

        shieldGroup.add(shield);
        this.backSlot.add(shieldGroup);
        break;
      }
      default:
        break;
    }
  }

  // === TÍNH TOÁN ĐỘ CAO AN TOÀN CHO BẢNG TÊN NỔI (TOP NAMEPLATE CLEARANCE) ===
  public getTopClearanceY(animOffset = 0): number {
    const baseHeadY = (this.isStanding ? 1.20 : 0.98) + animOffset;
    const hatId = this.outfit?.hatId || 'NONE';
    const skinId = this.outfit?.skinId || 'WOLF_GRAY';

    let hatClearance = 0.36;
    if (hatId === 'WITCH') {
      hatClearance = 0.72; // 0.24 + 0.48
    } else if (hatId === 'CONICAL_HAT') {
      hatClearance = 0.51; // 0.24 + 0.27
    } else if (hatId === 'COWBOY') {
      hatClearance = 0.49; // 0.24 + 0.25
    } else if (hatId === 'CROWN') {
      hatClearance = 0.44; // 0.24 + 0.20
    } else {
      hatClearance = 0.36;
    }

    const hasTallEars = skinId === 'WOLF_BLOOD' || skinId === 'KITSUNE_FOX';
    const earClearance =
      hasTallEars && (hatId === 'NONE' || hatId === 'BANDANA' || hatId === 'CROWN')
        ? 0.56
        : 0.36;

    return baseHeadY + Math.max(hatClearance, earClearance) + 0.25;
  }

  // === BẢNG TÊN NỔI 3D (3D FLOATING NAMEPLATE) ===
  public setNameplate(name: string, seatNumber?: number, isAlive = true): void {
    if (this.nameplateSprite) {
      this.root.remove(this.nameplateSprite);
      this.nameplateSprite = undefined;
    }

    let texture: THREE.Texture;
    if (typeof document !== 'undefined' && document.createElement) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Vẽ nền bo góc
        ctx.clearRect(0, 0, 320, 64);
        const r = 16;
        ctx.fillStyle = isAlive ? 'rgba(10, 15, 29, 0.72)' : 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = isAlive ? '#38bdf8' : '#ef4444';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(8, 8, 304, 48, r);
        ctx.fill();
        ctx.stroke();

        // Text tên nhân vật
        ctx.fillStyle = isAlive ? '#f8fafc' : '#fca5a5';
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const truncated = formatNameplateDisplayName(name, seatNumber, 22);
        ctx.fillText(truncated, 160, 32);
      }
      texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
    } else {
      texture = new THREE.Texture();
    }

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.renderOrder = 999;
    sprite.scale.set(1.25, 0.25, 1.0);
    sprite.position.set(0, this.getTopClearanceY(), 0);

    this.nameplateSprite = sprite;
    this.root.add(sprite);
  }

  public setStanding(standing: boolean): void {
    this.isStanding = standing;
    if (standing) {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.bodyGroup.position.y = 0.22;
      this.headGroup.position.y = 1.20;
    } else {
      this.leftLeg.rotation.x = -Math.PI / 2.2;
      this.rightLeg.rotation.x = -Math.PI / 2.2;
      this.bodyGroup.position.y = 0;
      this.headGroup.position.y = 0.98;
    }
    if (this.nameplateSprite) {
      this.nameplateSprite.position.y = this.getTopClearanceY();
    }
  }

  public setAnimation(anim: 'idle' | 'howl' | 'point' | 'slumber' | 'walk'): void {
    if (anim === 'walk' && !this.isStanding) {
      this.setStanding(true);
    }
    this.currentAnim = anim;
  }

  public update(delta: number): void {
    this.animTime += delta;
    const baseHeadY = this.isStanding ? 1.20 : 0.98;
    const baseBodyY = this.isStanding ? 0.22 : 0;
    let currentHeadOffset = 0;

    switch (this.currentAnim) {
      case 'idle': {
        const breathe = Math.sin(this.animTime * 2.5) * 0.025;
        currentHeadOffset = breathe * 0.5;
        this.bodyGroup.position.y = baseBodyY;
        this.headGroup.position.y = baseHeadY + currentHeadOffset;
        this.headGroup.rotation.x = breathe * 0.3;
        this.headGroup.rotation.z = Math.sin(this.animTime * 1.2) * 0.02;
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
        if (this.isStanding) {
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        } else {
          this.leftLeg.rotation.x = -Math.PI / 2.2;
          this.rightLeg.rotation.x = -Math.PI / 2.2;
        }
        this.eyeMaterial.emissiveIntensity = 1.2 + Math.sin(this.animTime * 4) * 0.3;
        break;
      }
      case 'howl': {
        currentHeadOffset = 0.07;
        this.bodyGroup.position.y = baseBodyY;
        this.headGroup.rotation.x = -Math.PI / 4 + Math.sin(this.animTime * 6) * 0.05;
        this.headGroup.position.y = baseHeadY + currentHeadOffset;
        this.leftArm.rotation.x = -Math.PI / 6;
        this.rightArm.rotation.x = -Math.PI / 6;
        if (this.isStanding) {
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        } else {
          this.leftLeg.rotation.x = -Math.PI / 2.2;
          this.rightLeg.rotation.x = -Math.PI / 2.2;
        }
        this.eyeMaterial.emissiveIntensity = 2.0;
        break;
      }
      case 'point': {
        currentHeadOffset = 0;
        this.bodyGroup.position.y = baseBodyY;
        this.rightArm.rotation.x = -Math.PI / 2;
        this.leftArm.rotation.x = 0;
        this.headGroup.position.y = baseHeadY;
        this.headGroup.rotation.x = 0.08;
        if (this.isStanding) {
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        } else {
          this.leftLeg.rotation.x = -Math.PI / 2.2;
          this.rightLeg.rotation.x = -Math.PI / 2.2;
        }
        this.eyeMaterial.emissiveIntensity = 1.5;
        break;
      }
      case 'slumber': {
        currentHeadOffset = -0.08;
        this.bodyGroup.position.y = baseBodyY;
        this.headGroup.rotation.x = Math.PI / 5;
        this.headGroup.position.y = baseHeadY + currentHeadOffset;
        this.leftArm.rotation.x = 0.08;
        this.rightArm.rotation.x = 0.08;
        if (this.isStanding) {
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        } else {
          this.leftLeg.rotation.x = -Math.PI / 2.2;
          this.rightLeg.rotation.x = -Math.PI / 2.2;
        }
        this.eyeMaterial.emissiveIntensity = 0.15;
        break;
      }
      case 'walk': {
        if (!this.isStanding) {
          this.setStanding(true);
        }
        const walkCycle = this.animTime * 11;
        this.leftLeg.rotation.x = Math.sin(walkCycle) * 0.65;
        this.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.65;
        this.leftArm.rotation.x = -Math.sin(walkCycle) * 0.5;
        this.rightArm.rotation.x = Math.sin(walkCycle) * 0.5;
        const bob = Math.abs(Math.sin(walkCycle)) * 0.045;
        currentHeadOffset = bob;
        this.bodyGroup.position.y = 0.22 + bob;
        this.headGroup.position.y = 1.20 + bob;
        this.headGroup.rotation.x = 0;
        this.headGroup.rotation.z = Math.sin(walkCycle * 0.5) * 0.03;
        this.eyeMaterial.emissiveIntensity = 1.2 + Math.sin(this.animTime * 4) * 0.3;
        break;
      }
    }

    if (this.nameplateSprite) {
      this.nameplateSprite.position.y = this.getTopClearanceY(currentHeadOffset);
    }
  }

  public setGhostMode(isDead: boolean): void {
    if (isDead) {
      this.skinMaterial.color.setHex(0x64748b);
      this.skinMaterial.transparent = true;
      this.skinMaterial.opacity = 0.45;
      this.jacketMaterial.color.setHex(0x334155);
      this.jacketMaterial.transparent = true;
      this.jacketMaterial.opacity = 0.45;
      this.eyeMaterial.emissiveIntensity = 0.2;
    } else {
      const skinData = this.getSkinData(this.outfit.skinId);
      this.skinMaterial.color.setHex(skinData.skinTone);
      this.skinMaterial.transparent = false;
      this.skinMaterial.opacity = 1.0;
      this.jacketMaterial.color.setHex(skinData.jacketColor);
      this.jacketMaterial.transparent = false;
      this.jacketMaterial.opacity = 1.0;
      this.eyeMaterial.emissiveIntensity = 1.3;
    }
  }
}
