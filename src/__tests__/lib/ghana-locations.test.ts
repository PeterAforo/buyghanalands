import {
  ghanaRegions,
  getRegions,
  getConstituencies,
  getDistricts,
  getRegionByName,
  getConstituencyByName,
} from '@/lib/ghana-locations';

describe('Ghana Locations Library', () => {
  describe('ghanaRegions constant', () => {
    it('should have 16 regions', () => {
      expect(ghanaRegions.length).toBe(16);
    });

    it('should include Greater Accra', () => {
      const greaterAccra = ghanaRegions.find(r => r.name === 'Greater Accra');
      expect(greaterAccra).toBeDefined();
    });

    it('should include Ashanti', () => {
      const ashanti = ghanaRegions.find(r => r.name === 'Ashanti');
      expect(ashanti).toBeDefined();
    });

    it('should have capital for each region', () => {
      ghanaRegions.forEach(region => {
        expect(region.capital).toBeDefined();
        expect(region.capital.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getRegions', () => {
    it('should return array of region names', () => {
      const regions = getRegions();
      expect(regions.length).toBe(16);
      expect(regions).toContain('Greater Accra');
      expect(regions).toContain('Ashanti');
    });
  });

  describe('getRegionByName', () => {
    it('should return region by exact name', () => {
      const region = getRegionByName('Greater Accra');
      expect(region).toBeDefined();
      expect(region?.name).toBe('Greater Accra');
      expect(region?.capital).toBe('Accra');
    });

    it('should return undefined for invalid name', () => {
      const region = getRegionByName('Invalid Region');
      expect(region).toBeUndefined();
    });
  });

  describe('getConstituencies', () => {
    it('should return constituencies for valid region', () => {
      const constituencies = getConstituencies('Greater Accra');
      expect(constituencies.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid region', () => {
      const constituencies = getConstituencies('Invalid Region');
      expect(constituencies).toEqual([]);
    });

    it('should include Accra Central in Greater Accra', () => {
      const constituencies = getConstituencies('Greater Accra');
      expect(constituencies).toContain('Accra Central');
    });
  });

  describe('getDistricts', () => {
    it('should return districts for valid region and constituency', () => {
      const districts = getDistricts('Greater Accra', 'Accra Central');
      expect(districts.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid region', () => {
      const districts = getDistricts('Invalid Region', 'Accra Central');
      expect(districts).toEqual([]);
    });

    it('should return empty array for invalid constituency', () => {
      const districts = getDistricts('Greater Accra', 'Invalid Constituency');
      expect(districts).toEqual([]);
    });

    it('should include Accra Metropolitan', () => {
      const districts = getDistricts('Greater Accra', 'Accra Central');
      expect(districts).toContain('Accra Metropolitan');
    });
  });

  describe('getConstituencyByName', () => {
    it('should return constituency for valid region and name', () => {
      const constituency = getConstituencyByName('Greater Accra', 'Accra Central');
      expect(constituency).toBeDefined();
      expect(constituency?.name).toBe('Accra Central');
    });

    it('should return undefined for invalid region', () => {
      const constituency = getConstituencyByName('Invalid Region', 'Accra Central');
      expect(constituency).toBeUndefined();
    });

    it('should return undefined for invalid constituency', () => {
      const constituency = getConstituencyByName('Greater Accra', 'Invalid');
      expect(constituency).toBeUndefined();
    });
  });
});
