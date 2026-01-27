/**
 * Vietnamese provinces and centrally-governed cities
 * Ordered by population/relevance for the platform
 */
export const VIETNAM_PROVINCES = [
  // 5 Centrally-governed cities (most relevant for the platform)
  { code: 'HCM', name: 'Hồ Chí Minh', nameEn: 'Ho Chi Minh City' },
  { code: 'HN', name: 'Hà Nội', nameEn: 'Hanoi' },
  { code: 'DN', name: 'Đà Nẵng', nameEn: 'Da Nang' },
  { code: 'HP', name: 'Hải Phòng', nameEn: 'Hai Phong' },
  { code: 'CT', name: 'Cần Thơ', nameEn: 'Can Tho' },

  // Major provinces (sorted alphabetically)
  { code: 'AG', name: 'An Giang', nameEn: 'An Giang' },
  { code: 'BRV', name: 'Bà Rịa - Vũng Tàu', nameEn: 'Ba Ria - Vung Tau' },
  { code: 'BG', name: 'Bắc Giang', nameEn: 'Bac Giang' },
  { code: 'BK', name: 'Bắc Kạn', nameEn: 'Bac Kan' },
  { code: 'BL', name: 'Bạc Liêu', nameEn: 'Bac Lieu' },
  { code: 'BN', name: 'Bắc Ninh', nameEn: 'Bac Ninh' },
  { code: 'BTr', name: 'Bến Tre', nameEn: 'Ben Tre' },
  { code: 'BD', name: 'Bình Dương', nameEn: 'Binh Duong' },
  { code: 'BDi', name: 'Bình Định', nameEn: 'Binh Dinh' },
  { code: 'BP', name: 'Bình Phước', nameEn: 'Binh Phuoc' },
  { code: 'BTh', name: 'Bình Thuận', nameEn: 'Binh Thuan' },
  { code: 'CM', name: 'Cà Mau', nameEn: 'Ca Mau' },
  { code: 'CB', name: 'Cao Bằng', nameEn: 'Cao Bang' },
  { code: 'DL', name: 'Đắk Lắk', nameEn: 'Dak Lak' },
  { code: 'DNO', name: 'Đắk Nông', nameEn: 'Dak Nong' },
  { code: 'DB', name: 'Điện Biên', nameEn: 'Dien Bien' },
  { code: 'DNa', name: 'Đồng Nai', nameEn: 'Dong Nai' },
  { code: 'DTh', name: 'Đồng Tháp', nameEn: 'Dong Thap' },
  { code: 'GL', name: 'Gia Lai', nameEn: 'Gia Lai' },
  { code: 'HG', name: 'Hà Giang', nameEn: 'Ha Giang' },
  { code: 'HNa', name: 'Hà Nam', nameEn: 'Ha Nam' },
  { code: 'HT', name: 'Hà Tĩnh', nameEn: 'Ha Tinh' },
  { code: 'HD', name: 'Hải Dương', nameEn: 'Hai Duong' },
  { code: 'HGi', name: 'Hậu Giang', nameEn: 'Hau Giang' },
  { code: 'HB', name: 'Hòa Bình', nameEn: 'Hoa Binh' },
  { code: 'HY', name: 'Hưng Yên', nameEn: 'Hung Yen' },
  { code: 'KH', name: 'Khánh Hòa', nameEn: 'Khanh Hoa' },
  { code: 'KG', name: 'Kiên Giang', nameEn: 'Kien Giang' },
  { code: 'KT', name: 'Kon Tum', nameEn: 'Kon Tum' },
  { code: 'LC', name: 'Lai Châu', nameEn: 'Lai Chau' },
  { code: 'LD', name: 'Lâm Đồng', nameEn: 'Lam Dong' },
  { code: 'LS', name: 'Lạng Sơn', nameEn: 'Lang Son' },
  { code: 'LCa', name: 'Lào Cai', nameEn: 'Lao Cai' },
  { code: 'LA', name: 'Long An', nameEn: 'Long An' },
  { code: 'ND', name: 'Nam Định', nameEn: 'Nam Dinh' },
  { code: 'NA', name: 'Nghệ An', nameEn: 'Nghe An' },
  { code: 'NB', name: 'Ninh Bình', nameEn: 'Ninh Binh' },
  { code: 'NT', name: 'Ninh Thuận', nameEn: 'Ninh Thuan' },
  { code: 'PT', name: 'Phú Thọ', nameEn: 'Phu Tho' },
  { code: 'PY', name: 'Phú Yên', nameEn: 'Phu Yen' },
  { code: 'QB', name: 'Quảng Bình', nameEn: 'Quang Binh' },
  { code: 'QNa', name: 'Quảng Nam', nameEn: 'Quang Nam' },
  { code: 'QNg', name: 'Quảng Ngãi', nameEn: 'Quang Ngai' },
  { code: 'QNi', name: 'Quảng Ninh', nameEn: 'Quang Ninh' },
  { code: 'QTr', name: 'Quảng Trị', nameEn: 'Quang Tri' },
  { code: 'ST', name: 'Sóc Trăng', nameEn: 'Soc Trang' },
  { code: 'SL', name: 'Sơn La', nameEn: 'Son La' },
  { code: 'TN', name: 'Tây Ninh', nameEn: 'Tay Ninh' },
  { code: 'TB', name: 'Thái Bình', nameEn: 'Thai Binh' },
  { code: 'TNg', name: 'Thái Nguyên', nameEn: 'Thai Nguyen' },
  { code: 'TH', name: 'Thanh Hóa', nameEn: 'Thanh Hoa' },
  { code: 'TTH', name: 'Thừa Thiên Huế', nameEn: 'Thua Thien Hue' },
  { code: 'TG', name: 'Tiền Giang', nameEn: 'Tien Giang' },
  { code: 'TV', name: 'Trà Vinh', nameEn: 'Tra Vinh' },
  { code: 'TQ', name: 'Tuyên Quang', nameEn: 'Tuyen Quang' },
  { code: 'VL', name: 'Vĩnh Long', nameEn: 'Vinh Long' },
  { code: 'VP', name: 'Vĩnh Phúc', nameEn: 'Vinh Phuc' },
  { code: 'YB', name: 'Yên Bái', nameEn: 'Yen Bai' },
] as const;

export type Province = (typeof VIETNAM_PROVINCES)[number];
export type ProvinceCode = Province['code'];

/**
 * Get province by code
 */
export function getProvinceByCode(code: string): Province | undefined {
  return VIETNAM_PROVINCES.find((p) => p.code === code);
}

/**
 * Get province display name based on language
 */
export function getProvinceName(
  code: string,
  language: 'vi' | 'en' = 'vi'
): string {
  const province = getProvinceByCode(code);
  if (!province) return code;
  return language === 'vi' ? province.name : province.nameEn;
}
