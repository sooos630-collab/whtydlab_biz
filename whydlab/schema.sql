-- 사업자 기본정보
CREATE TABLE business_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT '',
  registration_number TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  zipcode TEXT DEFAULT '',
  opening_date DATE,
  birth_date DATE,
  founder_tags TEXT[] DEFAULT '{}',
  business_scale TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 업태/종목
CREATE TABLE business_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES business_info(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '',
  item TEXT NOT NULL DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인력 및 자격
CREATE TABLE personnel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES business_info(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 자격 및 증빙서류
CREATE TABLE certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES business_info(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL DEFAULT '',
  certificate_name TEXT NOT NULL DEFAULT '',
  details TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 직접생산업체 등록
CREATE TABLE direct_productions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES business_info(id) ON DELETE CASCADE,
  certificate_name TEXT NOT NULL DEFAULT '',
  major_category TEXT DEFAULT '',
  minor_category TEXT DEFAULT '',
  detail_item TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 나라장터 등록코드
CREATE TABLE nara_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES business_info(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_info_updated_at
  BEFORE UPDATE ON business_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 초기 데이터 삽입
INSERT INTO business_info (company_name, registration_number, address, zipcode, opening_date, birth_date, founder_tags, business_scale)
VALUES (
  '와이디랩',
  '546-09-02884',
  '경기 화성시 동탄영천로 150 B동 12층 1210호',
  '18462',
  '2024-03-25',
  '1994-06-30',
  ARRAY['7년 이내 스타트업', '청년 창업자'],
  '5인 미만 소규모 사업장'
);

-- 업태/종목 초기 데이터
INSERT INTO business_types (business_id, category, item, sort_order)
SELECT id, '서비스업', '광고대행업', 1 FROM business_info LIMIT 1;
INSERT INTO business_types (business_id, category, item, sort_order)
SELECT id, '건설업', '도배,실내장식 및 내장 목공사업', 2 FROM business_info LIMIT 1;
INSERT INTO business_types (business_id, category, item, sort_order)
SELECT id, '도소매', '전자상거래', 3 FROM business_info LIMIT 1;
INSERT INTO business_types (business_id, category, item, sort_order)
SELECT id, '도소매', '구매대행업', 4 FROM business_info LIMIT 1;
INSERT INTO business_types (business_id, category, item, sort_order)
SELECT id, '정보통신업', '응용소프트웨어 개발 및 공급업', 5 FROM business_info LIMIT 1;
INSERT INTO business_types (business_id, category, item, sort_order)
SELECT id, '정보통신업', '컴퓨터 프로그래밍 서비스업', 6 FROM business_info LIMIT 1;
INSERT INTO business_types (business_id, category, item, sort_order)
SELECT id, '전문, 과학 및 기술 서비스업', '시각디자인업', 7 FROM business_info LIMIT 1;

-- 인력 및 자격 초기 데이터
INSERT INTO personnel (business_id, title, description, status, sort_order)
SELECT id, '대표자 1인', '한국디자인진흥원 : 멀티미디어 디자인 전문인력', 'active', 1 FROM business_info LIMIT 1;
INSERT INTO personnel (business_id, title, description, status, sort_order)
SELECT id, '팀장 1인', '한국디자인진흥원 : 시각디자인 전문인력', 'active', 2 FROM business_info LIMIT 1;
INSERT INTO personnel (business_id, title, description, status, sort_order)
SELECT id, '추가 1명', '곧 입사 예정', 'planned', 3 FROM business_info LIMIT 1;

-- 자격 및 증빙서류 초기 데이터
INSERT INTO certificates (business_id, issuer, certificate_name, details, sort_order)
SELECT id, '한국디자인진흥원', '산업디자인전문회사', '업종: 산업디자인 / 전문분야: 시각디자인', 1 FROM business_info LIMIT 1;
INSERT INTO certificates (business_id, issuer, certificate_name, details, sort_order)
SELECT id, '중소벤처기업부', '중소기업 확인서', '소기업(소상공인)', 2 FROM business_info LIMIT 1;

-- 직접생산업체 등록 초기 데이터
INSERT INTO direct_productions (business_id, certificate_name, major_category, minor_category, detail_item, sort_order)
SELECT id, '직접생산업체 증명서', '편집디자인 그래픽 및 예술관련 서비스', '아트디자인서비스', '디자인 서비스', 1 FROM business_info LIMIT 1;
INSERT INTO direct_productions (business_id, certificate_name, major_category, minor_category, detail_item, sort_order)
SELECT id, '직접생산업체 증명서', '공학연구 및 기술 기반 서비스', '소프트웨어 유지 및 지원', '소프트웨어 유지 및 지원 서비스', 2 FROM business_info LIMIT 1;
INSERT INTO direct_productions (business_id, certificate_name, major_category, minor_category, detail_item, sort_order)
SELECT id, '영상 제작 직접생산업체', '', '', '', 3 FROM business_info LIMIT 1;
INSERT INTO direct_productions (business_id, certificate_name, major_category, minor_category, detail_item, sort_order)
SELECT id, '기타행사대행업 직접생산업체', '', '', '', 4 FROM business_info LIMIT 1;

-- 나라장터 등록코드 초기 데이터
INSERT INTO nara_codes (business_id, name, code, sort_order)
SELECT id, '산업디자인전문회사', '4440', 1 FROM business_info LIMIT 1;
INSERT INTO nara_codes (business_id, name, code, sort_order)
SELECT id, '소프트웨어사업자', '1468', 2 FROM business_info LIMIT 1;
INSERT INTO nara_codes (business_id, name, code, sort_order)
SELECT id, '소프트웨어사업자', '1469', 3 FROM business_info LIMIT 1;
INSERT INTO nara_codes (business_id, name, code, sort_order)
SELECT id, '기타자유업(광고대행사)', '9902', 4 FROM business_info LIMIT 1;
