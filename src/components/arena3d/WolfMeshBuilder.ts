import * as THREE from 'three';
import {
  type PlayerOutfitConfig,
  OUTFIT_SKINS,
  OUTFIT_EYES,
  type OutfitSkinItem,
} from './types.ts';

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
  private furMaterial: THREE.MeshStandardMaterial;
  private laceMaterial: THREE.MeshStandardMaterial;
  private scleraMaterial: THREE.MeshStandardMaterial;
  private darkPupilMaterial: THREE.MeshStandardMaterial;
  private eyelashMaterial: THREE.MeshStandardMaterial;
  private mouthMaterial: THREE.MeshStandardMaterial;
  private buttonMaterial: THREE.MeshStandardMaterial;
  private highlightMaterial: THREE.MeshBasicMaterial;
  private cheekHighlightMaterial: THREE.MeshBasicMaterial;

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
      side: THREE.DoubleSide,
    });

    this.scarfMaterial = new THREE.MeshStandardMaterial({
      color: skinData.scarfColor,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    this.hairMaterial = new THREE.MeshStandardMaterial({
      color: skinData.hairColor,
      roughness: 0.45,
      metalness: 0.08,
    });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: eyeHex,
      emissive: eyeHex,
      emissiveIntensity: 0.55,
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

    this.furMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      roughness: 0.85,
    });

    this.laceMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    this.scleraMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffafa,
      roughness: 0.4,
    });

    this.darkPupilMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.3,
    });

    this.eyelashMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.5,
    });

    this.mouthMaterial = new THREE.MeshStandardMaterial({
      color: 0x9f1239,
      roughness: 0.6,
    });

    this.buttonMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.75,
      roughness: 0.25,
    });

    this.highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    this.cheekHighlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
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
    // === 1. THÂN CHIBI LIỀN MẠCH DÁNG GIỌT NƯỚC XUÔI MỀM (LATHEGEOMETRY) ===
    // Khép kín ở cổ (r = 0.12, y = 0.76) rồi cong xuôi mềm xuống dưới:
    // (0.12, 0.76) -> (0.20, 0.73) -> (0.26, 0.67) -> (0.23, 0.56) -> (0.205, 0.46)
    // TUYỆT ĐỐI không có điểm nào ngoài rìa cao hơn bên trong làm vểnh nhọn đầu vai
    const torsoPoints: THREE.Vector2[] = [
      new THREE.Vector2(0, 0.46),
      new THREE.Vector2(0.205, 0.46),
      new THREE.Vector2(0.23, 0.56),
      new THREE.Vector2(0.26, 0.67),
      new THREE.Vector2(0.20, 0.73),
      new THREE.Vector2(0.12, 0.76),
      new THREE.Vector2(0, 0.76),
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 32);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.jacketMaterial);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.bodyGroup.add(torsoMesh);

    // Cổ áo lá sen / Áo choàng vai Peter Pan bo tròn cong xuôi mềm ôm sát thân như bánh mochi
    const capeletPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.125, 0.76),
      new THREE.Vector2(0.21, 0.73),
      new THREE.Vector2(0.27, 0.67),
      new THREE.Vector2(0.26, 0.58),
      new THREE.Vector2(0.22, 0.52),
      new THREE.Vector2(0.205, 0.51),
    ];
    const capeletGeo = new THREE.LatheGeometry(capeletPoints, 32);
    const capeletMesh = new THREE.Mesh(capeletGeo, this.scarfMaterial);
    capeletMesh.castShadow = true;
    capeletMesh.receiveShadow = true;
    this.scarfMesh = capeletMesh;
    this.bodyGroup.add(capeletMesh);

    // Vòng bo cổ ấm áp ở chân cổ
    const collarGeo = new THREE.TorusGeometry(0.125, 0.024, 16, 32);
    const collarMesh = new THREE.Mesh(collarGeo, this.scarfMaterial);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.set(0, 0.76, 0);
    collarMesh.castShadow = true;
    this.bodyGroup.add(collarMesh);

    // Nơ xinh trước ngực: Nút thắt tròn giữa ngực (z = 0.25, y = 0.62)
    const knotGeo = new THREE.SphereGeometry(0.034, 16, 16);
    const knotMesh = new THREE.Mesh(knotGeo, this.scarfMaterial);
    knotMesh.position.set(0, 0.62, 0.25);
    knotMesh.castShadow = true;
    this.bodyGroup.add(knotMesh);

    // 2 cánh nơ phồng tròn bằng SphereGeometry bóp nhẹ
    const bowWingGeo = new THREE.SphereGeometry(0.046, 16, 16);

    const leftBow = new THREE.Mesh(bowWingGeo, this.scarfMaterial);
    leftBow.scale.set(1.35, 0.82, 0.65);
    leftBow.position.set(-0.06, 0.62, 0.245);
    leftBow.rotation.z = 0.20;
    leftBow.rotation.y = 0.12;
    leftBow.castShadow = true;
    this.bodyGroup.add(leftBow);

    const rightBow = new THREE.Mesh(bowWingGeo, this.scarfMaterial);
    rightBow.scale.set(1.35, 0.82, 0.65);
    rightBow.position.set(0.06, 0.62, 0.245);
    rightBow.rotation.z = -0.20;
    rightBow.rotation.y = -0.12;
    rightBow.castShadow = true;
    this.bodyGroup.add(rightBow);

    // Dải ruy băng nơ rủ nhẹ
    const ribbonGeo = new THREE.CapsuleGeometry(0.014, 0.07, 8, 12);
    const leftRibbon = new THREE.Mesh(ribbonGeo, this.scarfMaterial);
    leftRibbon.position.set(-0.028, 0.56, 0.245);
    leftRibbon.rotation.z = 0.22;
    leftRibbon.castShadow = true;
    this.bodyGroup.add(leftRibbon);

    const rightRibbon = new THREE.Mesh(ribbonGeo, this.scarfMaterial);
    rightRibbon.position.set(0.028, 0.56, 0.245);
    rightRibbon.rotation.z = -0.22;
    rightRibbon.castShadow = true;
    this.bodyGroup.add(rightRibbon);

    // 2 cúc áo tròn xinh xắn trước ngực
    const buttonGeo = new THREE.SphereGeometry(0.022, 14, 14);

    const topButton = new THREE.Mesh(buttonGeo, this.buttonMaterial);
    topButton.scale.set(1.0, 1.0, 0.45);
    topButton.position.set(0, 0.54, 0.235);
    topButton.castShadow = true;
    this.bodyGroup.add(topButton);

    const bottomButton = new THREE.Mesh(buttonGeo, this.buttonMaterial);
    bottomButton.scale.set(1.0, 1.0, 0.45);
    bottomButton.position.set(0, 0.49, 0.225);
    bottomButton.castShadow = true;
    this.bodyGroup.add(bottomButton);

    // === 2. VÁY XÒE CHỮ A XẾP LY LƯỢN SÓNG LIỀN KHỐI (VERTEX-MODULATED PLEATED BELL SKIRT) ===
    // Khởi tạo CylinderGeometry 96 segments rồi điều biến đỉnh (vertex-modulation):
    // Eo y = 0.46 (r = 0.205) mượt 100% không gai nhọn -> gấu y = 0.12 (r = 0.45) tỏa 14 múi xếp ly bồng bềnh
    const skirtGeo = new THREE.CylinderGeometry(0.205, 0.45, 0.34, 96, 16, false);
    const pos = skirtGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (Math.hypot(x, z) > 0.001) {
        const t = (0.17 - y) / 0.34; // 0 tại eo (y = +0.17), 1 tại gấu (y = -0.17)
        const theta = Math.atan2(z, x);
        const baseR = 0.205 + Math.pow(t, 0.88) * 0.245;
        const pleatWave = Math.pow(t, 1.15) * 0.032 * Math.cos(theta * 14);
        const finalR = baseR + pleatWave;
        pos.setX(i, Math.cos(theta) * finalR);
        pos.setZ(i, Math.sin(theta) * finalR);
      }
    }
    skirtGeo.computeVertexNormals();

    const skirtMesh = new THREE.Mesh(skirtGeo, this.jacketMaterial);
    skirtMesh.position.set(0, 0.29, 0.01);
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    this.bodyGroup.add(skirtMesh);

    // Lớp váy lót ren trắng kem (0xfffbeb) lượn sóng 28 múi bèo nhún nhỏ ngay dưới gấu váy (y = 0.115)
    const laceGeo = new THREE.CylinderGeometry(0.42, 0.455, 0.04, 96, 4, true);
    const lacePos = laceGeo.attributes.position;
    for (let i = 0; i < lacePos.count; i++) {
      const x = lacePos.getX(i);
      const y = lacePos.getY(i);
      const z = lacePos.getZ(i);
      if (Math.hypot(x, z) > 0.001) {
        const theta = Math.atan2(z, x);
        const tLace = (0.02 - y) / 0.04;
        const laceWave = (0.010 + tLace * 0.012) * Math.cos(theta * 28);
        const rCurrent = Math.hypot(x, z) + laceWave;
        lacePos.setX(i, Math.cos(theta) * rCurrent);
        lacePos.setZ(i, Math.sin(theta) * rCurrent);
      }
    }
    laceGeo.computeVertexNormals();
    const laceMesh = new THREE.Mesh(laceGeo, this.laceMaterial);
    laceMesh.position.set(0, 0.115, 0.01);
    laceMesh.castShadow = true;
    this.bodyGroup.add(laceMesh);

    // Đai ruy băng mềm tại đúng eo cao y = 0.46
    const waistBeltGeo = new THREE.TorusGeometry(0.208, 0.020, 12, 32);
    const waistBeltMesh = new THREE.Mesh(waistBeltGeo, this.scarfMaterial);
    waistBeltMesh.rotation.x = Math.PI / 2;
    waistBeltMesh.position.set(0, 0.46, 0);
    waistBeltMesh.castShadow = true;
    this.bodyGroup.add(waistBeltMesh);

    // Nơ nhỏ xinh sau lưng
    const backBowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), this.scarfMaterial);
    backBowKnot.position.set(0, 0.46, -0.215);
    backBowKnot.castShadow = true;
    this.bodyGroup.add(backBowKnot);

    const backBowWingGeo = new THREE.SphereGeometry(0.040, 12, 12);
    const leftBackBow = new THREE.Mesh(backBowWingGeo, this.scarfMaterial);
    leftBackBow.scale.set(1.25, 0.8, 0.55);
    leftBackBow.position.set(-0.05, 0.46, -0.21);
    leftBackBow.rotation.z = 0.20;
    this.bodyGroup.add(leftBackBow);

    const rightBackBow = new THREE.Mesh(backBowWingGeo, this.scarfMaterial);
    rightBackBow.scale.set(1.25, 0.8, 0.55);
    rightBackBow.position.set(0.05, 0.46, -0.21);
    rightBackBow.rotation.z = -0.20;
    this.bodyGroup.add(rightBackBow);

    // === 3. CHÂN & GIÀY BỐT CHIBI BO TRÒN (KHÔNG ĐÂM XUYÊN VÁY KHI NGỒI) ===
    // Khớp hông hạ thấp (y = 0.16) để khi ngồi (rotation.x = -1.25) giày thò nhẹ dưới gấu váy y ~ 0.08..0.12
    const legGeo = new THREE.CapsuleGeometry(0.082, 0.12, 12, 16);
    const bootGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const bootFurGeo = new THREE.TorusGeometry(0.082, 0.018, 12, 24);

    // Khớp hông chân trái
    this.leftLeg.position.set(-0.15, 0.16, 0.02);
    const leftLegMesh = new THREE.Mesh(legGeo, this.jacketMaterial);
    leftLegMesh.position.set(0, -0.06, 0);
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);

    const leftBoot = new THREE.Mesh(bootGeo, this.bootMaterial);
    leftBoot.scale.set(0.88, 0.65, 1.20);
    leftBoot.position.set(0, -0.14, 0.03);
    leftBoot.castShadow = true;
    this.leftLeg.add(leftBoot);

    const leftBootFur = new THREE.Mesh(bootFurGeo, this.furMaterial);
    leftBootFur.rotation.x = Math.PI / 2;
    leftBootFur.position.set(0, -0.11, 0.01);
    leftBootFur.castShadow = true;
    this.leftLeg.add(leftBootFur);

    this.bodyGroup.add(this.leftLeg);

    // Khớp hông chân phải
    this.rightLeg.position.set(0.15, 0.16, 0.02);
    const rightLegMesh = new THREE.Mesh(legGeo, this.jacketMaterial);
    rightLegMesh.position.set(0, -0.06, 0);
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);

    const rightBoot = new THREE.Mesh(bootGeo, this.bootMaterial);
    rightBoot.scale.set(0.88, 0.65, 1.20);
    rightBoot.position.set(0, -0.14, 0.03);
    rightBoot.castShadow = true;
    this.rightLeg.add(rightBoot);

    const rightBootFur = new THREE.Mesh(bootFurGeo, this.furMaterial);
    rightBootFur.rotation.x = Math.PI / 2;
    rightBootFur.position.set(0, -0.11, 0.01);
    rightBootFur.castShadow = true;
    this.rightLeg.add(rightBootFur);

    this.bodyGroup.add(this.rightLeg);

    // Mặc định khởi tạo ngồi (isStanding = false): góc nghiêng -1.25 rad (< -1.0)
    this.leftLeg.rotation.x = -1.25;
    this.rightLeg.rotation.x = -1.25;
    this.bodyGroup.position.y = 0;
    this.headGroup.position.y = 0.98;

    // === 4. VAI & CÁNH TAY XOAY ĐÚNG CHIỀU CHỮ A (BISHOP SLEEVES & HANDS) ===
    // Đảo đúng chiều chữ A trong Three.js:
    // leftArm (ở -X, hướng xuống -Y): rotation.z = -0.38 (xoay ra ngoài sang trái -X)
    // rightArm (ở +X): rotation.z = +0.38 (xoay ra ngoài sang phải +X)
    // Khớp vai đặt tại (±0.24, 0.66, 0.02) ôm liền mượt từ cầu vai xuôi ra ngoài
    // Điểm đầu vai bắt đầu từ tâm trục (0, 0.055) tạo chỏm cầu kín tròn trịa 100%, không hở miệng ống
    const sleevePoints: THREE.Vector2[] = [
      new THREE.Vector2(0, 0.055),
      new THREE.Vector2(0.055, 0.048),
      new THREE.Vector2(0.088, 0.020),
      new THREE.Vector2(0.095, -0.020),
      new THREE.Vector2(0.096, -0.060),
      new THREE.Vector2(0.088, -0.120),
      new THREE.Vector2(0.098, -0.190),
      new THREE.Vector2(0.118, -0.260),
      new THREE.Vector2(0.105, -0.310),
      new THREE.Vector2(0.072, -0.340),
      new THREE.Vector2(0, -0.340),
    ];
    const sleeveGeo = new THREE.LatheGeometry(sleevePoints, 24);

    const handGeo = new THREE.SphereGeometry(0.085, 20, 20);
    const thumbGeo = new THREE.SphereGeometry(0.032, 12, 12);
    const cuffGeo = new THREE.TorusGeometry(0.076, 0.022, 12, 24);

    // TAY TRÁI (Khớp vai đặt tại -0.24, 0.66, 0.02, góc nghiêng chữ A -0.38)
    this.leftArm.position.set(-0.24, 0.66, 0.02);
    this.leftArm.rotation.z = -0.38;

    const leftSleeve = new THREE.Mesh(sleeveGeo, this.jacketMaterial);
    leftSleeve.castShadow = true;
    leftSleeve.receiveShadow = true;

    const leftHand = new THREE.Mesh(handGeo, this.skinMaterial);
    leftHand.scale.set(0.95, 1.05, 0.88);
    leftHand.position.set(0, -0.38, 0);
    leftHand.castShadow = true;

    const leftThumb = new THREE.Mesh(thumbGeo, this.skinMaterial);
    leftThumb.scale.set(1.0, 1.2, 0.85);
    leftThumb.position.set(0.062, 0.015, 0.032);
    leftHand.add(leftThumb);

    const leftCuff = new THREE.Mesh(cuffGeo, this.furMaterial);
    leftCuff.rotation.x = Math.PI / 2;
    leftCuff.position.set(0, -0.33, 0);
    leftCuff.castShadow = true;

    // BẢO TOÀN TUYỆT ĐỐI BẤT BIẾN TEST:
    // child 0: leftSleeve, child 1: leftHand
    this.leftArm.add(leftSleeve); // child 0
    this.leftArm.add(leftHand);   // child 1
    this.leftArm.add(leftCuff);   // child 2
    this.bodyGroup.add(this.leftArm);

    // TAY PHẢI (Khớp vai đặt tại 0.24, 0.66, 0.02, góc nghiêng chữ A +0.38)
    this.rightArm.position.set(0.24, 0.66, 0.02);
    this.rightArm.rotation.z = 0.38;

    const rightSleeve = new THREE.Mesh(sleeveGeo, this.jacketMaterial);
    rightSleeve.castShadow = true;
    rightSleeve.receiveShadow = true;

    const rightHand = new THREE.Mesh(handGeo, this.skinMaterial);
    rightHand.scale.set(0.95, 1.05, 0.88);
    rightHand.position.set(0, -0.38, 0);
    rightHand.castShadow = true;

    const rightThumb = new THREE.Mesh(thumbGeo, this.skinMaterial);
    rightThumb.scale.set(1.0, 1.2, 0.85);
    rightThumb.position.set(-0.062, 0.015, 0.032);
    rightHand.add(rightThumb);

    const rightCuff = new THREE.Mesh(cuffGeo, this.furMaterial);
    rightCuff.rotation.x = Math.PI / 2;
    rightCuff.position.set(0, -0.33, 0);
    rightCuff.castShadow = true;

    this.rightArm.add(rightSleeve); // child 0
    this.rightArm.add(rightHand);   // child 1
    this.rightArm.add(rightCuff);   // child 2
    this.bodyGroup.add(this.rightArm);

    // === 5. ĐẦU CHIBI BẦU BĨNH & MẮT ANIME KAWAII ĐA LỚP ===
    this.headGroup.position.set(0, 0.98, 0.02);

    // BẢO TOÀN INVARIANT TEST: child 0 của headGroup BẮT BUỘC là headMesh
    const headGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    headMesh.scale.set(1.06, 0.97, 1.0);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh); // child 0

    // Hai má ửng hồng phúng phính bầu bĩnh
    const blushGeo = new THREE.SphereGeometry(0.08, 18, 18);
    const leftBlush = new THREE.Mesh(blushGeo, this.blushMaterial);
    leftBlush.scale.set(1.15, 0.68, 0.22);
    leftBlush.position.set(-0.175, -0.055, 0.295);
    this.headGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, this.blushMaterial);
    rightBlush.scale.set(1.15, 0.68, 0.22);
    rightBlush.position.set(0.175, -0.055, 0.295);
    this.headGroup.add(rightBlush);

    // Chấm sáng lung linh trên má
    const cheekHighlightGeo = new THREE.SphereGeometry(0.014, 8, 8);
    const leftCheekSparkle = new THREE.Mesh(cheekHighlightGeo, this.cheekHighlightMaterial);
    leftCheekSparkle.position.set(-0.175, -0.045, 0.315);
    this.headGroup.add(leftCheekSparkle);

    const rightCheekSparkle = new THREE.Mesh(cheekHighlightGeo, this.cheekHighlightMaterial);
    rightCheekSparkle.position.set(0.175, -0.045, 0.315);
    this.headGroup.add(rightCheekSparkle);

    // Mũi hạt đậu nhỏ xinh
    const noseGeo = new THREE.SphereGeometry(0.022, 12, 12);
    const noseMesh = new THREE.Mesh(noseGeo, this.noseMaterial);
    noseMesh.scale.set(1.1, 0.85, 0.75);
    noseMesh.position.set(0, -0.035, 0.342);
    this.headGroup.add(noseMesh);

    // Miệng cười mèo/sói nhí chữ ω (:3) đáng yêu ghép 2 cung tròn nhỏ cạnh nhau
    const lipGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 16, Math.PI);
    const leftLip = new THREE.Mesh(lipGeo, this.mouthMaterial);
    leftLip.rotation.z = Math.PI;
    leftLip.position.set(-0.02, -0.088, 0.334);
    this.headGroup.add(leftLip);

    const rightLip = new THREE.Mesh(lipGeo, this.mouthMaterial);
    rightLip.rotation.z = Math.PI;
    rightLip.position.set(0.02, -0.088, 0.334);
    this.headGroup.add(rightLip);

    // ĐÔI MẮT ANIME ĐA LỚP ÔM CONG THEO GÒ MÁ (MULTI-LAYER NENDOROID EYES)
    // Lớp nền lòng trắng mắt (Sclera)
    const scleraGeo = new THREE.SphereGeometry(0.095, 24, 24);

    const leftSclera = new THREE.Mesh(scleraGeo, this.scleraMaterial);
    leftSclera.scale.set(0.96, 1.10, 0.28);
    leftSclera.position.set(-0.125, 0.03, 0.308);
    leftSclera.rotation.y = -0.20;
    this.headGroup.add(leftSclera);

    const rightSclera = new THREE.Mesh(scleraGeo, this.scleraMaterial);
    rightSclera.scale.set(0.96, 1.10, 0.28);
    rightSclera.position.set(0.125, 0.03, 0.308);
    rightSclera.rotation.y = 0.20;
    this.headGroup.add(rightSclera);

    // Tròng mắt màu chính (đẩy vào this.eyes, BẢO TOÀN this.eyes.length === 2)
    const eyeGeo = new THREE.SphereGeometry(0.078, 24, 24);

    const leftEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    leftEye.scale.set(0.92, 1.14, 0.30);
    leftEye.position.set(-0.125, 0.03, 0.316);
    leftEye.rotation.y = -0.20;

    const rightEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    rightEye.scale.set(0.92, 1.14, 0.30);
    rightEye.position.set(0.125, 0.03, 0.316);
    rightEye.rotation.y = 0.20;

    // Con ngươi sâu thẳm gọn gàng (Dark Pupil: position.z = 0.048 nhô rõ trên mặt cầu 0.078)
    const pupilGeo = new THREE.SphereGeometry(0.043, 18, 18);

    const leftPupil = new THREE.Mesh(pupilGeo, this.darkPupilMaterial);
    leftPupil.scale.set(0.90, 1.05, 0.85);
    leftPupil.position.set(0, 0.006, 0.048);
    leftEye.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, this.darkPupilMaterial);
    rightPupil.scale.set(0.90, 1.05, 0.85);
    rightPupil.position.set(0, 0.006, 0.048);
    rightEye.add(rightPupil);

    // 3 đốm sáng lấp lánh (Triple Kawaii Catchlights đặt ở z = 0.076..0.080 nhô sắc nét trên con ngươi)
    const catchlight1Geo = new THREE.SphereGeometry(0.025, 12, 12);
    const catchlight2Geo = new THREE.SphereGeometry(0.014, 10, 10);
    const catchlight3Geo = new THREE.SphereGeometry(0.008, 8, 8);

    // Left Eye catchlights
    const leftC1 = new THREE.Mesh(catchlight1Geo, this.highlightMaterial);
    leftC1.position.set(-0.024, 0.028, 0.076);
    leftEye.add(leftC1);

    const leftC2 = new THREE.Mesh(catchlight2Geo, this.highlightMaterial);
    leftC2.position.set(0.022, -0.024, 0.078);
    leftEye.add(leftC2);

    const leftC3 = new THREE.Mesh(catchlight3Geo, this.highlightMaterial);
    leftC3.position.set(0.014, 0.014, 0.080);
    leftEye.add(leftC3);

    // Right Eye catchlights
    const rightC1 = new THREE.Mesh(catchlight1Geo, this.highlightMaterial);
    rightC1.position.set(0.024, 0.028, 0.076);
    rightEye.add(rightC1);

    const rightC2 = new THREE.Mesh(catchlight2Geo, this.highlightMaterial);
    rightC2.position.set(-0.022, -0.024, 0.078);
    rightEye.add(rightC2);

    const rightC3 = new THREE.Mesh(catchlight3Geo, this.highlightMaterial);
    rightC3.position.set(-0.014, 0.014, 0.080);
    rightEye.add(rightC3);

    this.headGroup.add(leftEye);
    this.eyes.push(leftEye);

    this.headGroup.add(rightEye);
    this.eyes.push(rightEye);

    // Mí mắt trên cong vòm ngang thanh nhã (XÓA BỎ VẠCH ĐỨNG GÂY DẤU CỘNG +)
    // Dùng arc = Math.PI * 0.85 với rotation.z = Math.PI * 0.075 úp chuẩn xác lên đỉnh trên của mắt
    const lashGeo = new THREE.TorusGeometry(0.084, 0.013, 10, 24, Math.PI * 0.85);

    const leftLash = new THREE.Mesh(lashGeo, this.eyelashMaterial);
    leftLash.rotation.set(-0.12, -0.20, Math.PI * 0.075);
    leftLash.position.set(-0.125, 0.052, 0.320);
    this.headGroup.add(leftLash);

    const rightLash = new THREE.Mesh(lashGeo, this.eyelashMaterial);
    rightLash.rotation.set(-0.12, 0.20, Math.PI * 0.075);
    rightLash.position.set(0.125, 0.052, 0.320);
    this.headGroup.add(rightLash);

    // Chân mày nhỏ thanh mảnh đặt cao hơn mắt (y = 0.155, z = 0.315), vòm ngang hiền hòa
    const browGeo = new THREE.TorusGeometry(0.055, 0.008, 8, 16, Math.PI * 0.6);

    const leftBrow = new THREE.Mesh(browGeo, this.eyelashMaterial);
    leftBrow.position.set(-0.125, 0.155, 0.315);
    leftBrow.rotation.set(0.12, -0.18, Math.PI * 0.2);
    this.headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, this.eyelashMaterial);
    rightBrow.position.set(0.125, 0.155, 0.315);
    rightBrow.rotation.set(0.12, 0.18, Math.PI * 0.2);
    this.headGroup.add(rightBrow);

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

    const hasHat = this.outfit.hatId && this.outfit.hatId !== 'NONE';

    // 1. Mũ tóc 3D ôm quanh đầu (Khi đội mũ, hạ nhẹ độ phồng đỉnh scale.y = 0.92 để không xuyên mũ)
    const hairCapGeo = new THREE.SphereGeometry(0.355, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const hairCap = new THREE.Mesh(hairCapGeo, this.hairMaterial);
    hairCap.scale.set(1.0, hasHat ? 0.92 : 1.0, 1.0);
    hairCap.position.set(0, 0.02, -0.02);
    hairCap.castShadow = true;
    this.hairGroup.add(hairCap);

    // 2. Mái ngố / Mái mưa Chibi ôm sát trán (Forehead hugging bangs)
    // Nằm thấp hơn hatSlot (y = 0.24) tại y = 0.19, z = 0.315 để không bao giờ đâm xuyên mũ
    const bangOffsets = [-0.15, -0.05, 0.05, 0.15];
    const bangGeo = new THREE.SphereGeometry(0.075, 16, 16);
    bangOffsets.forEach((xOffset, i) => {
      const bang = new THREE.Mesh(bangGeo, this.hairMaterial);
      bang.scale.set(0.92 + (i % 2) * 0.06, 1.35, 0.38);
      bang.position.set(xOffset, 0.19, 0.315);
      bang.rotation.x = -0.32;
      bang.rotation.y = xOffset * 0.6;
      bang.castShadow = true;
      this.hairGroup.add(bang);
    });

    // 3. Hai lọn tóc mai ôm má mềm mại bằng CapsuleGeometry
    const sideBangGeo = new THREE.CapsuleGeometry(0.048, 0.20, 10, 14);

    const leftSideBang = new THREE.Mesh(sideBangGeo, this.hairMaterial);
    leftSideBang.scale.set(1.1, 1.0, 0.8);
    leftSideBang.position.set(-0.31, 0.05, 0.12);
    leftSideBang.rotation.z = -0.22;
    leftSideBang.rotation.x = 0.10;
    this.hairGroup.add(leftSideBang);

    const rightSideBang = new THREE.Mesh(sideBangGeo, this.hairMaterial);
    rightSideBang.scale.set(1.1, 1.0, 0.8);
    rightSideBang.position.set(0.31, 0.05, 0.12);
    rightSideBang.rotation.z = 0.22;
    rightSideBang.rotation.x = 0.10;
    this.hairGroup.add(rightSideBang);

    // 4. Đặc điểm riêng từng nhân vật
    const flaredEars =
      this.outfit.hatId === 'CONICAL_HAT' ||
      this.outfit.hatId === 'WITCH' ||
      this.outfit.hatId === 'COWBOY';

    if (skinData.id === 'WOLF_BLOOD') {
      // DẠNG SÓI HỒNG NGUYỆT: Kemonomimi / Sói Nhí Chibi
      // Giữ trọn khuôn mặt bầu bĩnh đáng yêu có miệng :3, điểm thêm 2 răng nanh sói trắng xinh xắn
      const fangGeo = new THREE.ConeGeometry(0.010, 0.026, 8);
      const fangMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

      const leftFang = new THREE.Mesh(fangGeo, fangMat);
      leftFang.position.set(-0.032, -0.098, 0.338);
      leftFang.rotation.x = Math.PI;
      this.faceFeaturesGroup.add(leftFang);

      const rightFang = new THREE.Mesh(fangGeo, fangMat);
      rightFang.position.set(0.032, -0.098, 0.338);
      rightFang.rotation.x = Math.PI;
      this.faceFeaturesGroup.add(rightFang);

      // Chiếc mũi sói nhỏ xinh hơi nhô nhẹ (z = 0.355)
      const noseTipMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
      const wolfNose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), noseTipMat);
      wolfNose.scale.set(1.15, 0.85, 0.9);
      wolfNose.position.set(0, -0.032, 0.355);
      this.faceFeaturesGroup.add(wolfNose);

      // Tai sói bông mềm mại
      const earGeo = new THREE.ConeGeometry(0.12, 0.35, 12);
      const innerEarMat = new THREE.MeshStandardMaterial({ color: 0xf87171, roughness: 0.5 });
      const innerEarGeo = new THREE.ConeGeometry(0.065, 0.24, 12);

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
        leftEar.position.set(-0.2, 0.38, -0.05);
        leftEar.rotation.z = 0.25;
        rightEar.position.set(0.2, 0.38, -0.05);
        rightEar.rotation.z = -0.25;
      }
      this.faceFeaturesGroup.add(leftEar);
      this.faceFeaturesGroup.add(rightEar);

      // Đuôi sói bông xù sau lưng bo tròn giọt nước CapsuleGeometry
      const tailGeo = new THREE.CapsuleGeometry(0.14, 0.46, 12, 18);
      this.tailMesh = new THREE.Mesh(tailGeo, this.hairMaterial);
      this.tailMesh.scale.set(1.05, 1.25, 0.9);
      this.tailMesh.position.set(0, 0.28, -0.42);
      this.tailMesh.rotation.x = -Math.PI / 3;
      this.tailMesh.castShadow = true;
      this.bodyGroup.add(this.tailMesh);
    } else if (skinData.id === 'KITSUNE_FOX') {
      // DẠNG HỒ LY TINH LINH: Có tai cáo trắng viền hồng xinh xắn + đuôi hồ ly bông xù
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

      // Đuôi hồ ly cong mềm mại bằng CapsuleGeometry kèm chóp lông trắng kem
      const foxTailGeo = new THREE.CapsuleGeometry(0.15, 0.48, 14, 18);
      this.tailMesh = new THREE.Mesh(foxTailGeo, this.hairMaterial);
      this.tailMesh.scale.set(1.1, 1.28, 0.92);
      this.tailMesh.position.set(0, 0.30, -0.42);
      this.tailMesh.rotation.x = -Math.PI / 3.4;
      this.tailMesh.castShadow = true;

      const foxTipGeo = new THREE.SphereGeometry(0.11, 14, 14);
      const foxTip = new THREE.Mesh(foxTipGeo, this.furMaterial);
      foxTip.position.set(0, 0.28, 0);
      this.tailMesh.add(foxTip);

      this.bodyGroup.add(this.tailMesh);
    } else if (skinData.id === 'CAMPER_GIRL') {
      // DẠNG NỮ SINH CẮM TRẠI: Mái tóc bím dài ngang lưng mềm mại bằng CapsuleGeometry
      const lockGeo = new THREE.CapsuleGeometry(0.058, 0.42, 10, 16);
      const tieGeo = new THREE.TorusGeometry(0.055, 0.015, 10, 20);

      const leftLock = new THREE.Mesh(lockGeo, this.hairMaterial);
      leftLock.scale.set(1.05, 1.0, 0.85);
      leftLock.position.set(-0.28, -0.12, 0.02);
      leftLock.rotation.z = -0.15;
      leftLock.rotation.x = 0.08;
      leftLock.castShadow = true;

      const leftTie = new THREE.Mesh(tieGeo, this.scarfMaterial);
      leftTie.rotation.x = Math.PI / 2;
      leftTie.position.set(0, 0.14, 0);
      leftLock.add(leftTie);
      this.hairGroup.add(leftLock);

      const rightLock = new THREE.Mesh(lockGeo, this.hairMaterial);
      rightLock.scale.set(1.05, 1.0, 0.85);
      rightLock.position.set(0.28, -0.12, 0.02);
      rightLock.rotation.z = 0.15;
      rightLock.rotation.x = 0.08;
      rightLock.castShadow = true;

      const rightTie = new THREE.Mesh(tieGeo, this.scarfMaterial);
      rightTie.rotation.x = Math.PI / 2;
      rightTie.position.set(0, 0.14, 0);
      rightLock.add(rightTie);
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
      this.eyeMaterial.emissiveIntensity = 0.55;
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
      hatClearance = 0.72;
    } else if (hatId === 'CONICAL_HAT') {
      hatClearance = 0.52;
    } else if (hatId === 'COWBOY') {
      hatClearance = 0.50;
    } else if (hatId === 'CROWN') {
      hatClearance = 0.46;
    } else {
      hatClearance = 0.36;
    }

    const hasTallEars = skinId === 'WOLF_BLOOD' || skinId === 'KITSUNE_FOX';
    const earClearance =
      hasTallEars && (hatId === 'NONE' || hatId === 'BANDANA' || hatId === 'CROWN')
        ? 0.58
        : 0.36;

    return baseHeadY + Math.max(hatClearance, earClearance) + 0.28;
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
      this.leftLeg.rotation.x = -1.25;
      this.rightLeg.rotation.x = -1.25;
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
        this.leftArm.rotation.z = -0.38;
        this.rightArm.rotation.z = 0.38;
        if (this.isStanding) {
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        } else {
          this.leftLeg.rotation.x = -1.25;
          this.rightLeg.rotation.x = -1.25;
        }
        this.eyeMaterial.emissiveIntensity = 0.55 + Math.sin(this.animTime * 3) * 0.10;
        break;
      }
      case 'howl': {
        currentHeadOffset = 0.07;
        this.bodyGroup.position.y = baseBodyY;
        this.headGroup.rotation.x = -Math.PI / 4 + Math.sin(this.animTime * 6) * 0.05;
        this.headGroup.position.y = baseHeadY + currentHeadOffset;
        this.leftArm.rotation.x = -Math.PI / 6;
        this.rightArm.rotation.x = -Math.PI / 6;
        this.leftArm.rotation.z = -0.38;
        this.rightArm.rotation.z = 0.38;
        if (this.isStanding) {
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        } else {
          this.leftLeg.rotation.x = -1.25;
          this.rightLeg.rotation.x = -1.25;
        }
        this.eyeMaterial.emissiveIntensity = 1.1;
        break;
      }
      case 'point': {
        currentHeadOffset = 0;
        this.bodyGroup.position.y = baseBodyY;
        this.rightArm.rotation.x = -Math.PI / 2;
        this.rightArm.rotation.z = 0.12;
        this.leftArm.rotation.x = 0;
        this.leftArm.rotation.z = -0.38;
        this.headGroup.position.y = baseHeadY;
        this.headGroup.rotation.x = 0.08;
        if (this.isStanding) {
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        } else {
          this.leftLeg.rotation.x = -1.25;
          this.rightLeg.rotation.x = -1.25;
        }
        this.eyeMaterial.emissiveIntensity = 0.85;
        break;
      }
      case 'slumber': {
        currentHeadOffset = -0.08;
        this.bodyGroup.position.y = baseBodyY;
        this.headGroup.rotation.x = Math.PI / 5;
        this.headGroup.position.y = baseHeadY + currentHeadOffset;
        this.leftArm.rotation.x = 0.08;
        this.rightArm.rotation.x = 0.08;
        this.leftArm.rotation.z = -0.38;
        this.rightArm.rotation.z = 0.38;
        if (this.isStanding) {
          this.leftLeg.rotation.x = 0;
          this.rightLeg.rotation.x = 0;
        } else {
          this.leftLeg.rotation.x = -1.25;
          this.rightLeg.rotation.x = -1.25;
        }
        this.eyeMaterial.emissiveIntensity = 0.12;
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
        this.leftArm.rotation.z = -0.38;
        this.rightArm.rotation.z = 0.38;
        const bob = Math.abs(Math.sin(walkCycle)) * 0.045;
        currentHeadOffset = bob;
        this.bodyGroup.position.y = 0.22 + bob;
        this.headGroup.position.y = 1.20 + bob;
        this.headGroup.rotation.x = 0;
        this.headGroup.rotation.z = Math.sin(walkCycle * 0.5) * 0.03;
        this.eyeMaterial.emissiveIntensity = 0.55 + Math.sin(this.animTime * 3) * 0.10;
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

      this.scarfMaterial.color.setHex(0x475569);
      this.scarfMaterial.transparent = true;
      this.scarfMaterial.opacity = 0.45;

      this.hairMaterial.color.setHex(0x334155);
      this.hairMaterial.transparent = true;
      this.hairMaterial.opacity = 0.45;

      this.bootMaterial.color.setHex(0x1e293b);
      this.bootMaterial.transparent = true;
      this.bootMaterial.opacity = 0.45;

      this.furMaterial.transparent = true;
      this.furMaterial.opacity = 0.35;

      this.laceMaterial.transparent = true;
      this.laceMaterial.opacity = 0.35;

      this.blushMaterial.opacity = 0.15;
      this.eyeMaterial.emissiveIntensity = 0.15;
    } else {
      const skinData = this.getSkinData(this.outfit.skinId);
      this.skinMaterial.color.setHex(skinData.skinTone);
      this.skinMaterial.transparent = false;
      this.skinMaterial.opacity = 1.0;

      this.jacketMaterial.color.setHex(skinData.jacketColor);
      this.jacketMaterial.transparent = false;
      this.jacketMaterial.opacity = 1.0;

      this.scarfMaterial.color.setHex(skinData.scarfColor);
      this.scarfMaterial.transparent = false;
      this.scarfMaterial.opacity = 1.0;

      this.hairMaterial.color.setHex(skinData.hairColor);
      this.hairMaterial.transparent = false;
      this.hairMaterial.opacity = 1.0;

      this.bootMaterial.color.setHex(0x1e293b);
      this.bootMaterial.transparent = false;
      this.bootMaterial.opacity = 1.0;

      this.furMaterial.transparent = false;
      this.furMaterial.opacity = 1.0;

      this.laceMaterial.transparent = false;
      this.laceMaterial.opacity = 1.0;

      this.blushMaterial.opacity = 0.6;
      this.eyeMaterial.emissiveIntensity = 0.55;
    }
  }
}
