import {
  isValidVietnamPhone,
  normalizePhoneNumber,
  toLocalFormat,
  toInternationalFormat,
} from './vietnam-phone.validator';

describe('Vietnam Phone Validator', () => {
  describe('normalizePhoneNumber', () => {
    it('should remove spaces', () => {
      expect(normalizePhoneNumber('090 123 4567')).toBe('0901234567');
    });

    it('should remove dashes', () => {
      expect(normalizePhoneNumber('090-123-4567')).toBe('0901234567');
    });

    it('should remove dots', () => {
      expect(normalizePhoneNumber('090.123.4567')).toBe('0901234567');
    });

    it('should remove parentheses', () => {
      expect(normalizePhoneNumber('(090) 123-4567')).toBe('0901234567');
    });
  });

  describe('isValidVietnamPhone', () => {
    describe('valid local format (0XXXXXXXXX)', () => {
      it('should accept Viettel numbers', () => {
        expect(isValidVietnamPhone('0321234567')).toBe(true); // 032
        expect(isValidVietnamPhone('0961234567')).toBe(true); // 096
        expect(isValidVietnamPhone('0971234567')).toBe(true); // 097
        expect(isValidVietnamPhone('0981234567')).toBe(true); // 098
      });

      it('should accept Vinaphone numbers', () => {
        expect(isValidVietnamPhone('0881234567')).toBe(true); // 088
        expect(isValidVietnamPhone('0911234567')).toBe(true); // 091
        expect(isValidVietnamPhone('0941234567')).toBe(true); // 094
        expect(isValidVietnamPhone('0811234567')).toBe(true); // 081
      });

      it('should accept Mobifone numbers', () => {
        expect(isValidVietnamPhone('0891234567')).toBe(true); // 089
        expect(isValidVietnamPhone('0901234567')).toBe(true); // 090
        expect(isValidVietnamPhone('0931234567')).toBe(true); // 093
        expect(isValidVietnamPhone('0701234567')).toBe(true); // 070
      });

      it('should accept Vietnamobile numbers', () => {
        expect(isValidVietnamPhone('0921234567')).toBe(true); // 092
        expect(isValidVietnamPhone('0561234567')).toBe(true); // 056
        expect(isValidVietnamPhone('0581234567')).toBe(true); // 058
      });

      it('should accept Gmobile numbers', () => {
        expect(isValidVietnamPhone('0991234567')).toBe(true); // 099
        expect(isValidVietnamPhone('0591234567')).toBe(true); // 059
      });
    });

    describe('valid international format (+84XXXXXXXXX)', () => {
      it('should accept +84 format', () => {
        expect(isValidVietnamPhone('+84901234567')).toBe(true);
        expect(isValidVietnamPhone('+84321234567')).toBe(true);
        expect(isValidVietnamPhone('+84881234567')).toBe(true);
      });
    });

    describe('valid numbers with formatting', () => {
      it('should accept numbers with spaces', () => {
        expect(isValidVietnamPhone('090 123 4567')).toBe(true);
        expect(isValidVietnamPhone('+84 90 123 4567')).toBe(true);
      });

      it('should accept numbers with dashes', () => {
        expect(isValidVietnamPhone('090-123-4567')).toBe(true);
        expect(isValidVietnamPhone('+84-90-123-4567')).toBe(true);
      });
    });

    describe('invalid numbers', () => {
      it('should reject numbers with wrong length', () => {
        expect(isValidVietnamPhone('090123456')).toBe(false); // Too short
        expect(isValidVietnamPhone('09012345678')).toBe(false); // Too long
      });

      it('should reject numbers with invalid prefixes', () => {
        expect(isValidVietnamPhone('0101234567')).toBe(false); // 010 not valid
        expect(isValidVietnamPhone('0201234567')).toBe(false); // 020 not valid
        expect(isValidVietnamPhone('0401234567')).toBe(false); // 040 not valid
      });

      it('should reject landline numbers', () => {
        expect(isValidVietnamPhone('02812345678')).toBe(false); // Ho Chi Minh landline
        expect(isValidVietnamPhone('02412345678')).toBe(false); // Hanoi landline
      });

      it('should reject non-Vietnamese numbers', () => {
        expect(isValidVietnamPhone('+11234567890')).toBe(false); // US
        expect(isValidVietnamPhone('+441234567890')).toBe(false); // UK
      });

      it('should reject invalid characters', () => {
        expect(isValidVietnamPhone('090abc4567')).toBe(false);
        expect(isValidVietnamPhone('090#123$456')).toBe(false);
      });
    });
  });

  describe('toLocalFormat', () => {
    it('should convert +84 to 0', () => {
      expect(toLocalFormat('+84901234567')).toBe('0901234567');
    });

    it('should keep 0 format as is', () => {
      expect(toLocalFormat('0901234567')).toBe('0901234567');
    });

    it('should normalize and convert', () => {
      expect(toLocalFormat('+84 90 123 4567')).toBe('0901234567');
    });
  });

  describe('toInternationalFormat', () => {
    it('should convert 0 to +84', () => {
      expect(toInternationalFormat('0901234567')).toBe('+84901234567');
    });

    it('should keep +84 format as is', () => {
      expect(toInternationalFormat('+84901234567')).toBe('+84901234567');
    });

    it('should normalize and convert', () => {
      expect(toInternationalFormat('090 123 4567')).toBe('+84901234567');
    });
  });
});
