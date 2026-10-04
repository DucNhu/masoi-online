import werewolfCard from '../assets/cards/werewolf.webp';
import seerCard from '../assets/cards/seer.webp';
import witchCard from '../assets/cards/witch.webp';
import bodyguardCard from '../assets/cards/bodyguard.webp';
import hunterCard from '../assets/cards/hunter.webp';
import villagerCard from '../assets/cards/villager.webp';
import cupidCard from '../assets/cards/cupid.webp';
import minionCard from '../assets/cards/minion.webp';
import elderCard from '../assets/cards/elder.webp';
import idiotCard from '../assets/cards/idiot.webp';
import cursedCard from '../assets/cards/cursed.webp';
import mayorCard from '../assets/cards/mayor.webp';
import cardBack from '../assets/cards/card_back.webp';

import nightPhaseBg from '../assets/backgrounds/night_phase.webp';
import dayDawnBg from '../assets/backgrounds/day_dawn.webp';
import dayVotingBg from '../assets/backgrounds/day_voting.webp';
import winVillageBg from '../assets/backgrounds/win_village.webp';
import winWerewolfBg from '../assets/backgrounds/win_werewolf.webp';

import heroBanner from '../assets/brand/hero_banner.webp';
import appIcon from '../assets/brand/app_icon.webp';

import { RoleId } from '../types/game';

/**
 * Ánh xạ chuẩn từ RoleId sang Thẻ bài minh họa Tarot
 */
export const ROLE_CARD_IMAGES: Record<RoleId, string> = {
  WEREWOLF: werewolfCard,
  SEER: seerCard,
  WITCH: witchCard,
  BODYGUARD: bodyguardCard,
  HUNTER: hunterCard,
  VILLAGER: villagerCard,
  CUPID: cupidCard,
  MINION: minionCard,
  ELDER: elderCard,
  IDIOT: idiotCard,
  CURSED: cursedCard,
  MAYOR: mayorCard,
};

/**
 * Mặt sau thẻ bài Ma Sói
 */
export const CARD_BACK_IMAGE = cardBack;

/**
 * Bối cảnh không gian các pha chuyển đổi trong game
 */
export const PHASE_BACKGROUNDS = {
  NIGHT: nightPhaseBg,
  DAY_DAWN: dayDawnBg,
  DAY_VOTING: dayVotingBg,
  DAY_DISCUSSION: dayVotingBg,
  WIN_VILLAGE: winVillageBg,
  WIN_WEREWOLF: winWerewolfBg,
};

/**
 * Nhận diện thương hiệu & Logo
 */
export const BRAND_ASSETS = {
  heroBanner,
  appIcon,
  cardBack,
};
