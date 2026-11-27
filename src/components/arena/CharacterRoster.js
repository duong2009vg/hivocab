// src/components/arena/CharacterRoster.js
// Real Bleach vs Naruto (BVN) 16-Fighter Roster & 6 Battleground Maps backed by Cloudflare R2.
import { getBvnFighterUrl, getBvnMapUrl } from '../../config/bvnAssets.js';

function makeFighter(entry) {
  return {
    ...entry,
    ultiName: entry.ultiName || entry.element || 'TUYỆT CHIÊU TỐI THƯỢNG',
    faces: {
      face: getBvnFighterUrl(entry.id, 'face.png'),
      big: getBvnFighterUrl(entry.id, 'face_big.png'),
      bar: getBvnFighterUrl(entry.id, 'face_bar.png'),
      win: getBvnFighterUrl(entry.id, 'face_win.png'),
    },
    framesUrl: getBvnFighterUrl(entry.id, 'frames.json'),
    sheetUrl: getBvnFighterUrl(entry.id, 'sheet_v2.png'),
  };
}

function makeStage(entry) {
  return {
    ...entry,
    previewUrl: getBvnMapUrl(entry.id, 'preview.png'),
    bgUrl: getBvnMapUrl(entry.id, 'bg.png'),
  };
}

export const ARENA_CHARACTERS = [
  // ---------- BLEACH FACTION (8) ----------
  makeFighter({
    id: 'ichigo',
    faction: 'bleach',
    factionLabel: 'Tử Thần (Bleach)',
    name: 'Kurosaki Ichigo',
    shortName: 'ICHIGO',
    title: 'Tử Thần Thay Thế · Shikai',
    element: 'Nguyệt Nha Thiên Xung',
    weapon: 'Trảm Nguyệt Đao (Zangetsu)',
    quote: 'Bảo vệ người thân — mỗi từ vựng thuộc là một nhát Nguyệt Nha Thiên Xung!',
    accent: '#F97316',
    accentDark: '#9A3412',
    auraBg: 'from-[#F97316]/35 via-[#38BDF8]/20 to-transparent',
    fallbackId: 'shadow_reaper',
  }),
  makeFighter({
    id: 'ichigo_bankai',
    faction: 'bleach',
    factionLabel: 'Tử Thần (Bleach)',
    name: 'Ichigo Bankai',
    shortName: 'BANKAI',
    title: 'Thiên Tỏa Trảm Nguyệt (Tensa Zangetsu)',
    element: 'Hắc Nguyệt Tốc Độ',
    weapon: 'Thiên Tỏa Trảm Nguyệt',
    quote: 'Tốc độ phản xạ vượt ngưỡng — áp đảo đối thủ trước khi kịp suy nghĩ!',
    accent: '#EF4444',
    accentDark: '#7F1D1D',
    auraBg: 'from-[#EF4444]/35 via-[#0B0E14]/40 to-transparent',
    fallbackId: 'shadow_reaper',
  }),
  makeFighter({
    id: 'rukia',
    faction: 'bleach',
    factionLabel: 'Tử Thần (Bleach)',
    name: 'Kuchiki Rukia',
    shortName: 'RUKIA',
    title: 'Đội Phó Thập Tam Phiên Đội',
    element: 'Băng Tuyết · Sode no Shirayuki',
    weapon: 'Tụ Bạch Tuyết',
    quote: 'Vũ điệu Bạch Tuyết đóng băng mọi sai lầm trong từng đáp án!',
    accent: '#38BDF8',
    accentDark: '#0369A1',
    auraBg: 'from-[#38BDF8]/30 via-[#E0F2FE]/20 to-transparent',
    fallbackId: 'frost_dragon',
  }),
  makeFighter({
    id: 'byakuya',
    faction: 'bleach',
    factionLabel: 'Tử Thần (Bleach)',
    name: 'Kuchiki Byakuya',
    shortName: 'BYAKUYA',
    title: 'Đội Trưởng Lục Phiên Đội',
    element: 'Thiên Bản Anh · Senbonzakura',
    weapon: 'Thiên Bản Anh',
    quote: 'Tán loạn đi, Thiên Bản Anh — nghìn cánh hoa anh đào chuẩn xác tuyệt đối.',
    accent: '#EC4899',
    accentDark: '#9D174D',
    auraBg: 'from-[#EC4899]/30 via-[#FBCFE8]/20 to-transparent',
    fallbackId: 'sakura_wind',
  }),
  makeFighter({
    id: 'toushirou',
    faction: 'bleach',
    factionLabel: 'Tử Thần (Bleach)',
    name: 'Hitsugaya Tōshirō',
    shortName: 'TOSHIRO',
    title: 'Thiên Tài Băng Long Thập Phiên Đội',
    element: 'Băng Luân Hoàn · Hyōrinmaru',
    weapon: 'Băng Luân Hoàn',
    quote: 'Giữ tâm trí bình tĩnh như băng tuyết, giải mã mọi câu hỏi hóc búa.',
    accent: '#22D3EE',
    accentDark: '#0E7490',
    auraBg: 'from-[#22D3EE]/35 via-[#0284C7]/20 to-transparent',
    fallbackId: 'frost_dragon',
  }),
  makeFighter({
    id: 'kenpachi',
    faction: 'bleach',
    factionLabel: 'Tử Thần (Bleach)',
    name: 'Zaraki Kenpachi',
    shortName: 'KENPACHI',
    title: 'Chiến Thần Thập Nhất Phiên Đội',
    element: 'Cuồng Kiếm Lôi Áp',
    weapon: 'Trảm Phách Đao Khổng Lồ',
    quote: 'Càng gặp đề khó càng phấn khích — chém đôi mọi rào cản từ vựng!',
    accent: '#EAB308',
    accentDark: '#854D0E',
    auraBg: 'from-[#EAB308]/35 via-[#9333EA]/20 to-transparent',
    fallbackId: 'tiger_blade',
  }),
  makeFighter({
    id: 'ulquiorra',
    faction: 'bleach',
    factionLabel: 'Espada · Hueco Mundo',
    name: 'Ulquiorra Cifer',
    shortName: 'ULQUIORRA',
    title: 'Thập Nhẫn Số 4 · Hắc Dực',
    element: 'Hắc Lôi · Cero Oscuras',
    weapon: 'Lôi Thương Hắc Ám',
    quote: 'Trống rỗng? Không — tri thức tích lũy qua từng trận đấu mới là vĩnh cửu.',
    accent: '#10B981',
    accentDark: '#065F46',
    auraBg: 'from-[#10B981]/30 via-[#0F172A]/40 to-transparent',
    fallbackId: 'thunder_scholar',
  }),
  makeFighter({
    id: 'aizen',
    faction: 'bleach',
    factionLabel: 'Espada · Las Noches',
    name: 'Aizen Sōsuke',
    shortName: 'AIZEN',
    title: 'Bậc Thầy Ảo Ảnh Kính Hoa Thủy Nguyệt',
    element: 'Kính Hoa Thủy Nguyệt · Quỷ Đạo',
    weapon: 'Kính Hoa Thủy Nguyệt',
    quote: 'Ngay từ đầu, mọi bẫy ngữ nghĩa trong bài thi đều nằm trong tính toán.',
    accent: '#A855F7',
    accentDark: '#581C87',
    auraBg: 'from-[#A855F7]/30 via-[#1E1B4B]/40 to-transparent',
    fallbackId: 'thunder_scholar',
  }),

  // ---------- NARUTO FACTION (8) ----------
  makeFighter({
    id: 'naruto',
    faction: 'naruto',
    factionLabel: 'Nhẫn Giả (Naruto)',
    name: 'Uzumaki Naruto',
    shortName: 'NARUTO',
    title: 'Nhẫn Giả Bất Khuất Làng Lá',
    element: 'Loa Toàn Hoàn (Rasengan)',
    weapon: 'Ảnh Phân Thân & Rasengan',
    quote: 'Tôi không bao giờ nuốt lời — nhớ trọn bộ từ mới là nhẫn đạo của tôi!',
    accent: '#F59E0B',
    accentDark: '#B45309',
    auraBg: 'from-[#F59E0B]/35 via-[#EA580C]/20 to-transparent',
    fallbackId: 'fox_shinobi',
  }),
  makeFighter({
    id: 'naruto_hermit',
    faction: 'naruto',
    factionLabel: 'Nhẫn Giả (Naruto)',
    name: 'Naruto Tiên Nhân',
    shortName: 'SENNIN',
    title: 'Hiền Nhân Thuật · Diệu Mộc Sơn',
    element: 'Phong Độn Loa Toàn Thủ Lý Kiếm',
    weapon: 'Tiên Pháp Rasenshuriken',
    quote: 'Cảm nhận tự nhiên — nghe phát âm một lần là khắc sâu ý nghĩa!',
    accent: '#E66946',
    accentDark: '#9A3412',
    auraBg: 'from-[#E66946]/35 via-[#FACC15]/25 to-transparent',
    fallbackId: 'fox_shinobi',
  }),
  makeFighter({
    id: 'sasuke',
    faction: 'naruto',
    factionLabel: 'Nhẫn Giả (Naruto)',
    name: 'Uchiha Sasuke',
    shortName: 'SASUKE',
    title: 'Thiên Tài Tộc Uchiha · Lôi Kiếm',
    element: 'Thiên Điểu (Chidori)',
    weapon: 'Thảo Thế Kiếm (Kusanagi)',
    quote: 'Sharingan đọc thấu từng chữ cái — không một đáp án sai nào thoát được.',
    accent: '#3B82F6',
    accentDark: '#1E3A8A',
    auraBg: 'from-[#3B82F6]/35 via-[#60A5FA]/20 to-transparent',
    fallbackId: 'thunder_scholar',
  }),
  makeFighter({
    id: 'sasuke_susanoo',
    faction: 'naruto',
    factionLabel: 'Nhẫn Giả (Naruto)',
    name: 'Sasuke Susanoo',
    shortName: 'SUSANOO',
    title: 'Vạn Hoa Đồng Tả Luân Nhãn',
    element: 'Thiên Chiếu · Hắc Hỏa',
    weapon: 'Cung Tên Susanoo',
    quote: 'Ngọn lửa Amaterasu thiêu rụi mọi giới hạn tốc độ trong đấu trường 1v1.',
    accent: '#8B5CF6',
    accentDark: '#4C1D95',
    auraBg: 'from-[#8B5CF6]/40 via-[#4C1D95]/30 to-transparent',
    fallbackId: 'thunder_scholar',
  }),
  makeFighter({
    id: 'kakashi',
    faction: 'naruto',
    factionLabel: 'Nhẫn Giả (Naruto)',
    name: 'Hatake Kakashi',
    shortName: 'KAKASHI',
    title: 'Thầy Giáo Tả Luân Nhãn · Lôi Thiết',
    element: 'Lôi Thiết · Thần Uy',
    weapon: 'Lôi Thiết (Raikiri)',
    quote: 'Đọc sâu sắc từng ngữ cảnh — đó là bài học đầu tiên của Đội 7.',
    accent: '#0EA5E9',
    accentDark: '#0369A1',
    auraBg: 'from-[#0EA5E9]/30 via-[#64748B]/25 to-transparent',
    fallbackId: 'sage_guardian',
  }),
  makeFighter({
    id: 'itachi',
    faction: 'naruto',
    factionLabel: 'Nhẫn Giả (Akatsuki)',
    name: 'Uchiha Itachi',
    shortName: 'ITACHI',
    title: 'Bậc Thầy Ảo Thuật Nguyệt Độc',
    element: 'Nguyệt Độc · Hào Hỏa Cầu',
    weapon: 'Ảo Thuật Quạ Đen',
    quote: 'Bình tĩnh quan sát, phản đòn chuẩn xác chỉ trong một cái chớp mắt.',
    accent: '#DC2626',
    accentDark: '#7F1D1D',
    auraBg: 'from-[#DC2626]/35 via-[#0F172A]/40 to-transparent',
    fallbackId: 'shadow_reaper',
  }),
  makeFighter({
    id: 'gaara',
    faction: 'naruto',
    factionLabel: 'Nhẫn Giả (Làng Cát)',
    name: 'Gaara Làng Cát',
    shortName: 'GAARA',
    title: 'Phong Ảnh Làng Cát · Sa Bộc Táng',
    element: 'Sa Độn · Khiên Cát Tuyệt Đối',
    weapon: 'Hồ Lô Cát Hoàng Kim',
    quote: 'Phòng ngự kiên cố trước mọi bẫy từ vựng và phản công bằng Sa Bộc Táng!',
    accent: '#D97706',
    accentDark: '#78350F',
    auraBg: 'from-[#D97706]/30 via-[#FDE68A]/20 to-transparent',
    fallbackId: 'tiger_blade',
  }),
  makeFighter({
    id: 'madara',
    faction: 'naruto',
    factionLabel: 'Nhẫn Giả (Huyền Thoại)',
    name: 'Uchiha Madara',
    shortName: 'MADARA',
    title: 'Huyền Thoại Tộc Uchiha',
    element: 'Hào Hỏa Diệt Khước · Thiên Ngại Chấn Tinh',
    weapon: 'Đoàn Phiến Uchiha (Gunbai)',
    quote: 'Ngươi cũng muốn khiêu vũ cùng ta trên bảng xếp hạng ELO sao?',
    accent: '#B91C1C',
    accentDark: '#450A0A',
    auraBg: 'from-[#B91C1C]/35 via-[#7C3AED]/25 to-transparent',
    fallbackId: 'bot_churbito',
  }),
];

export const ARENA_STAGES = [
  makeStage({
    id: 'muyecun',
    name: 'Làng Lá Konoha',
    subtitle: 'Quảng trường Nhẫn Giả dưới núi Hokage',
    stageClass: 'bvn-stage-autumn',
    swatchBg: 'linear-gradient(135deg, #0EA5E9 0%, #78350F 55%, #FDE68A 100%)',
  }),
  makeStage({
    id: 'pubu',
    name: 'Thung Lũng Tận Cùng',
    subtitle: 'Thác nước lịch sử Naruto vs Sasuke',
    stageClass: 'bvn-stage-moonlight',
    swatchBg: 'linear-gradient(135deg, #0F172A 0%, #0284C7 55%, #BAE6FD 100%)',
  }),
  makeStage({
    id: 'jingyantin',
    name: 'Tĩnh Linh Đình (Seireitei)',
    subtitle: 'Đấu trường Tử Thần Hội Thanh Tĩnh',
    stageClass: 'bvn-stage-sunset',
    swatchBg: 'linear-gradient(135deg, #1E1B4B 0%, #B45309 55%, #FDE047 100%)',
  }),
  makeStage({
    id: 'liuhunjie',
    name: 'Lưu Hồn Nhai',
    subtitle: 'Phố cổ Thi Hồn Giới rực ánh hoàng hôn',
    stageClass: 'bvn-stage-sunset',
    swatchBg: 'linear-gradient(135deg, #2D1E2F 0%, #9E3B33 55%, #E6A15C 100%)',
  }),
  makeStage({
    id: 'desert',
    name: 'Sa Mạc Làng Cát',
    subtitle: 'Đồi cát nóng bỏng & gió bão sa mạc',
    stageClass: 'bvn-stage-autumn',
    swatchBg: 'linear-gradient(135deg, #451A03 0%, #D97706 55%, #FEF3C7 100%)',
  }),
  makeStage({
    id: 'louding',
    name: 'Nóc Nhà Đêm Trăng',
    subtitle: 'Sân thượng cổ kính dưới bầu trời đêm',
    stageClass: 'bvn-stage-thunder',
    swatchBg: 'linear-gradient(135deg, #0B0E14 0%, #4C1D95 55%, #38BDF8 100%)',
  }),
];

const LEGACY_CHAR_MIGRATION = {
  tiger_blade: 'ichigo',
  shadow_reaper: 'ichigo_bankai',
  fox_shinobi: 'naruto',
  thunder_scholar: 'sasuke',
  sakura_wind: 'byakuya',
  frost_dragon: 'toushirou',
  bot_churbito: 'kakashi',
  sage_guardian: 'naruto_hermit',
};

const LEGACY_STAGE_MIGRATION = {
  sunset_dojo: 'muyecun',
  moonlight_library: 'pubu',
  autumn_village: 'liuhunjie',
  thunder_peak: 'louding',
};

export function getCharacterById(id) {
  const mapped = LEGACY_CHAR_MIGRATION[id] || id;
  return ARENA_CHARACTERS.find((c) => c.id === mapped) || ARENA_CHARACTERS[0];
}

export function getStageById(id) {
  const mapped = LEGACY_STAGE_MIGRATION[id] || id;
  return ARENA_STAGES.find((s) => s.id === mapped) || ARENA_STAGES[0];
}

export function pickRandomStage(excludeId = null) {
  const pool = excludeId ? ARENA_STAGES.filter((s) => s.id !== excludeId) : ARENA_STAGES;
  const list = pool.length ? pool : ARENA_STAGES;
  return list[Math.floor(Math.random() * list.length)] || ARENA_STAGES[0];
}

export function getOpponentCharacter(myCharId, isBotOpp = false, oppSeed = '') {
  const myChar = getCharacterById(myCharId);
  const oppositeFaction = myChar.faction === 'bleach' ? 'naruto' : 'bleach';
  const pool = ARENA_CHARACTERS.filter((c) => c.faction === oppositeFaction);
  if (isBotOpp) {
    if (myChar.faction === 'bleach') return getCharacterById('naruto');
    return getCharacterById('ichigo');
  }
  const str = String(oppSeed || 'rival');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length] || getCharacterById('naruto');
}
