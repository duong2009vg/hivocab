// src/data/bilingualVolMeta.js
// Metadata & Tiêu đề Tiếng Việt cho 10 tập sách IELTS Reading (Vol 1 – Vol 10)

export const VOL_BOOK_PALETTES = [
  { cover: '#7F2C23', coverDark: '#521A14', accentColor: '#F6E2A5' }, // Burgundy Leather
  { cover: '#1D4D3E', coverDark: '#102F25', accentColor: '#DDF2D1' }, // Hunter Botanical
  { cover: '#223A5E', coverDark: '#132238', accentColor: '#E5ECF6' }, // Royal Navy
  { cover: '#8C4D27', coverDark: '#592E14', accentColor: '#FCE8C5' }, // Warm Chestnut
  { cover: '#4A2C52', coverDark: '#2D1933', accentColor: '#F3DDF7' }, // Regal Plum
  { cover: '#2B5B6C', coverDark: '#183742', accentColor: '#D8F1F5' }, // Petrol Slate
  { cover: '#6E5A28', coverDark: '#473915', accentColor: '#FBF0C7' }, // Antique Ochre
  { cover: '#394D63', coverDark: '#202D3B', accentColor: '#DCE8F5' }, // Midnight Blue
  { cover: '#5D352B', coverDark: '#3A1E18', accentColor: '#F7E0D4' }, // Espresso Oxide
  { cover: '#3B5439', coverDark: '#223321', accentColor: '#E2F2D9' }, // Cedar Sage
];

const VOL_META_MAP = {
  1: {
    code: 'VOL 01',
    titleEn: 'IELTS Vol 1',
    titleVi: 'Bộ Đề Đọc Song Ngữ Tập 1',
    subtitleVi: 'Lịch sử, Tự nhiên & Kinh doanh',
    testsCount: 10,
    passagesCount: 30,
  },
  2: {
    code: 'VOL 02',
    titleEn: 'IELTS Vol 2',
    titleVi: 'Bộ Đề Đọc Song Ngữ Tập 2',
    subtitleVi: 'Tiến hóa, Tâm lý & Công nghệ',
    testsCount: 10,
    passagesCount: 30,
  },
  3: {
    code: 'VOL 03',
    titleEn: 'IELTS Vol 3',
    titleVi: 'Bộ Đề Đọc Song Ngữ Tập 3',
    subtitleVi: 'Môi trường, Khoa học & Giáo dục',
    testsCount: 10,
    passagesCount: 30,
  },
  4: {
    code: 'VOL 04',
    titleEn: 'IELTS Vol 4',
    titleVi: 'Bộ Đề Đọc Song Ngữ Tập 4',
    subtitleVi: 'Khảo cổ, Văn hóa & Truyền thông',
    testsCount: 10,
    passagesCount: 30,
  },
  5: {
    code: 'VOL 05',
    titleEn: 'IELTS Vol 5',
    titleVi: 'Bộ Đề Đọc Song Ngữ Tập 5',
    subtitleVi: 'Xã hội, Luật pháp & Đổi mới',
    testsCount: 10,
    passagesCount: 30,
  },
  6: {
    code: 'VOL 06',
    titleEn: 'IELTS Vol 6',
    titleVi: 'Bộ Đề Đọc Song Ngữ Tập 6',
    subtitleVi: 'Sinh học, Đô thị & Bảo tàng',
    testsCount: 10,
    passagesCount: 30,
  },
  7: {
    code: 'VOL 07',
    titleEn: 'IELTS Vol 7',
    titleVi: 'Bộ Đề Đọc Song Ngữ Tập 7',
    subtitleVi: 'Văn minh, Khoa học & Nghệ thuật',
    testsCount: 16,
    passagesCount: 48,
  },
  8: {
    code: 'VOL 08',
    titleEn: 'IELTS Vol 8',
    titleVi: 'Bộ Đề Đọc Song Ngữ Tập 8',
    subtitleVi: 'Sức khỏe, Vật lý & Khám phá',
    testsCount: 12,
    passagesCount: 36,
  },
  9: {
    code: 'VOL 09',
    titleEn: 'IELTS Vol 9',
    titleVi: 'Bộ Đề Đọc Song Ngữ Tập 9',
    subtitleVi: 'Địa lý, Ngôn ngữ & Cổ đại',
    testsCount: 12,
    passagesCount: 36,
  },
  10: {
    code: 'VOL 10',
    titleEn: 'IELTS Vol 10',
    titleVi: 'Bộ Đề Đọc Song Ngữ Tập 10',
    subtitleVi: 'Phát minh, Giáo dục & Đời sống',
    testsCount: 10,
    passagesCount: 30,
  },
};

export function extractVolNumber(bookName) {
  const m = String(bookName || '').match(/vol\.?\s*(\d+)/i);
  return m ? Number.parseInt(m[1], 10) : null;
}

export function getVolBookMeta(bookOrName, fallbackIdx = 0) {
  const rawName = typeof bookOrName === 'string' ? bookOrName : bookOrName?.name || '';
  const volNum = extractVolNumber(rawName);
  const preset = volNum && VOL_META_MAP[volNum] ? VOL_META_MAP[volNum] : null;
  const paletteIdx = volNum ? (volNum - 1) % VOL_BOOK_PALETTES.length : fallbackIdx % VOL_BOOK_PALETTES.length;
  const palette = VOL_BOOK_PALETTES[paletteIdx];

  if (preset) {
    return {
      ...preset,
      volNumber: volNum,
      ...palette,
    };
  }

  return {
    volNumber: volNum || fallbackIdx + 1,
    code: `TẬP ${String(fallbackIdx + 1).padStart(2, '0')}`,
    titleEn: rawName || `Reading Vol ${fallbackIdx + 1}`,
    titleVi: rawName ? `Bộ Đề Đọc ${rawName}` : `Bộ Đề Đọc Song Ngữ Tập ${fallbackIdx + 1}`,
    subtitleVi: 'Tuyển tập bài đọc song ngữ Anh–Việt',
    testsCount: null,
    passagesCount: null,
    ...palette,
  };
}
