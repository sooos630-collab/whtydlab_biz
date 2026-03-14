// TODO: DB 연동 시 이 파일 삭제하고 Supabase로 교체

export type ContractTemplateType = "정규직" | "계약직" | "파트타임" | "인턴";

export interface ContractTemplate {
  type: ContractTemplateType;
  title: string;
  description: string;
  content: string;
  updatedAt: string;
}

export function fillTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

export function getTemplateByType(type: ContractTemplateType): ContractTemplate {
  return defaultContractTemplates.find((t) => t.type === type)!;
}

export const ndaTemplate = `<html><head><meta charset="utf-8"><style>
  body { font-family: 'Pretendard', '맑은 고딕', sans-serif; font-size: 13px; line-height: 1.9; color: #191f28; max-width: 720px; margin: 0 auto; padding: 40px 32px; }
  h1 { text-align: center; font-size: 22px; font-weight: 800; margin-bottom: 28px; letter-spacing: -0.03em; }
  h2 { font-size: 14px; font-weight: 700; margin: 20px 0 8px; border-bottom: 1px solid #e5e8eb; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; }
  th, td { border: 1px solid #d1d5db; padding: 7px 12px; font-size: 12.5px; text-align: left; }
  th { background: #f4f6f8; font-weight: 600; width: 120px; white-space: nowrap; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 40px; }
  .sign-box { text-align: center; width: 45%; }
  .sign-box p { margin: 4px 0; font-size: 13px; }
  .sign-line { border-bottom: 1px solid #333; width: 200px; margin: 16px auto 4px; }
  .date-area { text-align: center; margin: 30px 0 10px; font-size: 14px; font-weight: 600; }
  p { margin: 4px 0; }
  ol, ul { padding-left: 18px; margin: 4px 0; }
  li { margin: 2px 0; }
</style></head><body>
<h1>비밀유지서약서</h1>

<p>아래 서약자는 {{company_name}}(이하 "회사")에 재직하는 동안 및 퇴직 이후에도 다음 사항을 준수할 것을 서약합니다.</p>

<h2>제1조 (서약자)</h2>
<table>
  <tr><th>성명</th><td>{{name}}</td><th>생년월일</th><td>{{birth_date}}</td></tr>
  <tr><th>소속</th><td>{{company_name}}</td><th>직위</th><td>{{position}}</td></tr>
  <tr><th>주소</th><td colspan="3">{{address}}</td></tr>
</table>

<h2>제2조 (비밀정보의 정의)</h2>
<p>본 서약서에서 "비밀정보"라 함은 다음 각 호의 정보를 포함합니다.</p>
<ol>
  <li>회사의 경영, 영업, 기술, 재무에 관한 일체의 정보</li>
  <li>고객 정보, 거래처 정보, 가격 정보, 계약 조건</li>
  <li>소프트웨어 소스코드, 디자인 시안, 기획 문서</li>
  <li>인사 정보, 급여 정보, 내부 커뮤니케이션 내용</li>
  <li>기타 회사가 비밀로 관리하는 일체의 정보</li>
</ol>

<h2>제3조 (비밀유지 의무)</h2>
<ol>
  <li>서약자는 업무상 알게 된 비밀정보를 제3자에게 누설, 공개, 제공하지 않습니다.</li>
  <li>비밀정보를 업무 목적 외에 사용하지 않습니다.</li>
  <li>비밀정보가 포함된 문서, 파일, 저장매체를 무단으로 복사, 반출하지 않습니다.</li>
  <li>SNS, 블로그, 커뮤니티 등 온라인 매체에 회사의 비밀정보를 게시하지 않습니다.</li>
</ol>

<h2>제4조 (의무 기간)</h2>
<p>본 비밀유지 의무는 재직 기간 중은 물론, <strong>퇴직 후 2년간</strong> 유효합니다.</p>

<h2>제5조 (자료 반환)</h2>
<p>퇴직 시 업무와 관련하여 보유한 일체의 자료(문서, 전자파일, 복사본 등)를 회사에 반환하며, 개인적으로 보관하고 있는 자료는 즉시 파기합니다.</p>

<h2>제6조 (경업 금지)</h2>
<p>퇴직 후 1년 이내에 회사의 영업과 직접적으로 경쟁하는 사업에 종사하거나 경쟁 업체에 취업하는 경우, 사전에 회사와 협의합니다.</p>

<h2>제7조 (손해배상)</h2>
<p>본 서약을 위반하여 회사에 손해를 끼친 경우, 민·형사상 책임을 지며 그로 인한 손해를 배상합니다.</p>

<h2>제8조 (기타)</h2>
<p>본 서약서에 명시되지 않은 사항은 관련 법령 및 회사 규정에 따릅니다.</p>

<p style="margin-top: 20px;">본인은 위 사항을 충분히 이해하였으며, 이를 성실히 준수할 것을 서약합니다.</p>

<div class="date-area">{{contract_date}}</div>

<div class="sign-row">
  <div class="sign-box">
    <p><strong>회사</strong></p>
    <p>{{company_name}}</p>
    <p>대표이사</p>
    <div class="sign-line"></div>
    <p>(서명 또는 인)</p>
  </div>
  <div class="sign-box">
    <p><strong>서약자</strong></p>
    <p>{{name}}</p>
    <div class="sign-line"></div>
    <p>(서명 또는 인)</p>
  </div>
</div>
</body></html>`;

const commonStyle = `
  body { font-family: 'Pretendard', '맑은 고딕', sans-serif; font-size: 13px; line-height: 1.9; color: #191f28; max-width: 720px; margin: 0 auto; padding: 40px 32px; }
  h1 { text-align: center; font-size: 22px; font-weight: 800; margin-bottom: 28px; letter-spacing: -0.03em; }
  h2 { font-size: 14px; font-weight: 700; margin: 20px 0 8px; border-bottom: 1px solid #e5e8eb; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; }
  th, td { border: 1px solid #d1d5db; padding: 7px 12px; font-size: 12.5px; text-align: left; }
  th { background: #f4f6f8; font-weight: 600; width: 120px; white-space: nowrap; }
  .sign-area { margin-top: 40px; text-align: center; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 40px; }
  .sign-box { text-align: center; width: 45%; }
  .sign-box p { margin: 4px 0; font-size: 13px; }
  .sign-line { border-bottom: 1px solid #333; width: 200px; margin: 16px auto 4px; }
  .date-area { text-align: center; margin: 30px 0 10px; font-size: 14px; font-weight: 600; }
  p { margin: 4px 0; }
  ol, ul { padding-left: 18px; margin: 4px 0; }
  li { margin: 2px 0; }
`;

export const defaultContractTemplates: ContractTemplate[] = [
  {
    type: "정규직",
    title: "정규직 근로계약서",
    description: "무기한 근로계약, 연봉제, 퇴직금 적용",
    updatedAt: new Date().toISOString(),
    content: `<html><head><meta charset="utf-8"><style>${commonStyle}</style></head><body>
<h1>표준 근로계약서 (정규직)</h1>

<p>아래 당사자는 다음과 같이 근로계약을 체결하고 이를 성실히 이행할 것을 약정합니다.</p>

<h2>제1조 (당사자)</h2>
<table>
  <tr><th>사업장명</th><td>{{company_name}}</td><th>사업장 주소</th><td>{{company_address}}</td></tr>
  <tr><th>근로자 성명</th><td>{{name}}</td><th>생년월일</th><td>{{birth_date}}</td></tr>
  <tr><th>주소</th><td colspan="3">{{address}}</td></tr>
</table>

<h2>제2조 (근로계약기간)</h2>
<p>근로계약기간: {{start_date}} ~ <strong>정함이 없음 (무기계약)</strong></p>
<p>수습기간: 입사일로부터 3개월</p>

<h2>제3조 (근무장소 및 업무)</h2>
<table>
  <tr><th>근무장소</th><td>{{company_address}}</td></tr>
  <tr><th>담당업무</th><td>{{position}} 및 관련 업무</td></tr>
</table>

<h2>제4조 (근로시간 및 휴일)</h2>
<ol>
  <li>근무시간: 09:00 ~ 18:00 (휴게시간 12:00 ~ 13:00 포함)</li>
  <li>주 5일 근무 (월~금), 주휴일: 일요일</li>
  <li>법정 공휴일은 유급휴일로 한다.</li>
</ol>

<h2>제5조 (임금)</h2>
<table>
  <tr><th>연봉</th><td>{{salary}} (세전)</td></tr>
  <tr><th>지급일</th><td>매월 25일 (해당 월분)</td></tr>
  <tr><th>지급방법</th><td>근로자 명의 은행계좌 입금</td></tr>
</table>
<p>연봉에는 기본급, 식대, 교통비가 포함됩니다.</p>

<h2>제6조 (퇴직금)</h2>
<p>1년 이상 계속 근로 시 퇴직급여를 지급합니다.</p>

<h2>제7조 (연차유급휴가)</h2>
<p>근로기준법에 따라 연차유급휴가를 부여합니다.</p>

<h2>제8조 (사회보험)</h2>
<p>국민연금, 건강보험, 고용보험, 산업재해보상보험에 가입합니다.</p>

<h2>제9조 (비밀유지)</h2>
<p>근로자는 재직 중 및 퇴직 후 업무상 알게 된 영업비밀을 외부에 누설하지 않습니다.</p>

<h2>제10조 (해고 및 퇴직)</h2>
<ol>
  <li>근로자가 퇴직하고자 할 경우 30일 전에 서면으로 통보합니다.</li>
  <li>사용자가 근로자를 해고하고자 할 경우 30일 전에 서면으로 통보하거나 30일분의 해고예고수당을 지급합니다.</li>
</ol>

<h2>제11조 (기타)</h2>
<p>이 계약서에 명시되지 않은 사항은 근로기준법 및 회사 취업규칙에 따릅니다.</p>

<div class="date-area">{{contract_date}}</div>

<div class="sign-row">
  <div class="sign-box">
    <p><strong>사용자 (갑)</strong></p>
    <p>{{company_name}}</p>
    <p>대표이사</p>
    <div class="sign-line"></div>
    <p>(서명 또는 인)</p>
  </div>
  <div class="sign-box">
    <p><strong>근로자 (을)</strong></p>
    <p>{{name}}</p>
    <div class="sign-line"></div>
    <p>(서명 또는 인)</p>
  </div>
</div>
</body></html>`,
  },

  {
    type: "계약직",
    title: "계약직 근로계약서",
    description: "기간제 근로계약, 월급제, 갱신조건 포함",
    updatedAt: new Date().toISOString(),
    content: `<html><head><meta charset="utf-8"><style>${commonStyle}</style></head><body>
<h1>근로계약서 (계약직 / 기간제)</h1>

<p>아래 당사자는 다음과 같이 기간제 근로계약을 체결하고 이를 성실히 이행할 것을 약정합니다.</p>

<h2>제1조 (당사자)</h2>
<table>
  <tr><th>사업장명</th><td>{{company_name}}</td><th>사업장 주소</th><td>{{company_address}}</td></tr>
  <tr><th>근로자 성명</th><td>{{name}}</td><th>생년월일</th><td>{{birth_date}}</td></tr>
  <tr><th>주소</th><td colspan="3">{{address}}</td></tr>
</table>

<h2>제2조 (근로계약기간)</h2>
<table>
  <tr><th>계약시작일</th><td>{{start_date}}</td></tr>
  <tr><th>계약종료일</th><td>{{end_date}}</td></tr>
</table>
<p>계약기간 만료 30일 전까지 갱신 여부를 서면 통보합니다. 별도 통보 없을 시 동일 조건으로 갱신된 것으로 봅니다.</p>

<h2>제3조 (근무장소 및 업무)</h2>
<table>
  <tr><th>근무장소</th><td>{{company_address}}</td></tr>
  <tr><th>담당업무</th><td>{{position}} 및 관련 업무</td></tr>
</table>

<h2>제4조 (근로시간 및 휴일)</h2>
<ol>
  <li>근무시간: 09:00 ~ 18:00 (휴게시간 12:00 ~ 13:00 포함)</li>
  <li>주 5일 근무 (월~금), 주휴일: 일요일</li>
</ol>

<h2>제5조 (임금)</h2>
<table>
  <tr><th>월 급여</th><td>{{salary}} (세전)</td></tr>
  <tr><th>지급일</th><td>매월 25일</td></tr>
  <tr><th>지급방법</th><td>근로자 명의 은행계좌 입금</td></tr>
</table>

<h2>제6조 (퇴직금)</h2>
<p>1년 이상 계속 근로 시 퇴직급여를 지급합니다.</p>

<h2>제7조 (연차유급휴가)</h2>
<p>근로기준법에 따라 연차유급휴가를 비례 부여합니다.</p>

<h2>제8조 (사회보험)</h2>
<p>국민연금, 건강보험, 고용보험, 산업재해보상보험에 가입합니다.</p>

<h2>제9조 (비밀유지)</h2>
<p>근로자는 재직 중 및 퇴직 후 업무상 알게 된 영업비밀을 외부에 누설하지 않습니다.</p>

<h2>제10조 (계약해지)</h2>
<ol>
  <li>계약기간 중 해지 시 30일 전에 서면 통보합니다.</li>
  <li>기간제법 제4조에 따라 2년을 초과하여 사용 시 무기계약으로 전환됩니다.</li>
</ol>

<div class="date-area">{{contract_date}}</div>

<div class="sign-row">
  <div class="sign-box">
    <p><strong>사용자 (갑)</strong></p>
    <p>{{company_name}}</p>
    <p>대표이사</p>
    <div class="sign-line"></div>
    <p>(서명 또는 인)</p>
  </div>
  <div class="sign-box">
    <p><strong>근로자 (을)</strong></p>
    <p>{{name}}</p>
    <div class="sign-line"></div>
    <p>(서명 또는 인)</p>
  </div>
</div>
</body></html>`,
  },

  {
    type: "파트타임",
    title: "파트타임 근로계약서",
    description: "단시간 근로계약, 시급/월급, 근무시간 명시",
    updatedAt: new Date().toISOString(),
    content: `<html><head><meta charset="utf-8"><style>${commonStyle}</style></head><body>
<h1>단시간 근로계약서 (파트타임)</h1>

<p>아래 당사자는 다음과 같이 단시간 근로계약을 체결하고 이를 성실히 이행할 것을 약정합니다.</p>

<h2>제1조 (당사자)</h2>
<table>
  <tr><th>사업장명</th><td>{{company_name}}</td><th>사업장 주소</th><td>{{company_address}}</td></tr>
  <tr><th>근로자 성명</th><td>{{name}}</td><th>생년월일</th><td>{{birth_date}}</td></tr>
  <tr><th>주소</th><td colspan="3">{{address}}</td></tr>
</table>

<h2>제2조 (근로계약기간)</h2>
<table>
  <tr><th>계약시작일</th><td>{{start_date}}</td></tr>
  <tr><th>계약종료일</th><td>{{end_date}}</td></tr>
</table>

<h2>제3조 (근무장소 및 업무)</h2>
<table>
  <tr><th>근무장소</th><td>{{company_address}}</td></tr>
  <tr><th>담당업무</th><td>{{position}} 및 관련 업무</td></tr>
</table>

<h2>제4조 (근로시간 및 근무일)</h2>
<table>
  <tr><th>주 근무일수</th><td>주 __일 (요일: ____________)</td></tr>
  <tr><th>근무시간</th><td>__:__ ~ __:__ (1일 __시간)</td></tr>
  <tr><th>주 소정근로시간</th><td>__시간</td></tr>
  <tr><th>휴게시간</th><td>__:__ ~ __:__</td></tr>
</table>
<p>※ 근무일 및 시간은 업무 사정에 따라 사전 협의 후 변경할 수 있습니다.</p>

<h2>제5조 (임금)</h2>
<table>
  <tr><th>급여</th><td>{{salary}} (세전)</td></tr>
  <tr><th>지급일</th><td>매월 25일</td></tr>
  <tr><th>지급방법</th><td>근로자 명의 은행계좌 입금</td></tr>
</table>
<p>주휴수당은 1주 소정근로시간 15시간 이상 시 별도 산정합니다.</p>

<h2>제6조 (연차유급휴가)</h2>
<p>근로기준법 제18조에 따라 통상 근로자의 근로시간에 비례하여 부여합니다.</p>

<h2>제7조 (사회보험)</h2>
<p>월 60시간 이상 근무 시 4대 보험 가입, 미만 시 고용보험·산재보험만 가입합니다.</p>

<h2>제8조 (비밀유지)</h2>
<p>근로자는 재직 중 및 퇴직 후 업무상 알게 된 영업비밀을 외부에 누설하지 않습니다.</p>

<h2>제9조 (계약해지)</h2>
<p>계약기간 중 해지 시 14일 전에 서면 통보합니다.</p>

<div class="date-area">{{contract_date}}</div>

<div class="sign-row">
  <div class="sign-box">
    <p><strong>사용자 (갑)</strong></p>
    <p>{{company_name}}</p>
    <p>대표이사</p>
    <div class="sign-line"></div>
    <p>(서명 또는 인)</p>
  </div>
  <div class="sign-box">
    <p><strong>근로자 (을)</strong></p>
    <p>{{name}}</p>
    <div class="sign-line"></div>
    <p>(서명 또는 인)</p>
  </div>
</div>
</body></html>`,
  },

  {
    type: "인턴",
    title: "인턴 근로계약서",
    description: "수습/인턴 계약, 평가 후 정규직 전환 조건 포함",
    updatedAt: new Date().toISOString(),
    content: `<html><head><meta charset="utf-8"><style>${commonStyle}</style></head><body>
<h1>인턴 근로계약서</h1>

<p>아래 당사자는 다음과 같이 인턴 근로계약을 체결하고 이를 성실히 이행할 것을 약정합니다.</p>

<h2>제1조 (당사자)</h2>
<table>
  <tr><th>사업장명</th><td>{{company_name}}</td><th>사업장 주소</th><td>{{company_address}}</td></tr>
  <tr><th>근로자 성명</th><td>{{name}}</td><th>생년월일</th><td>{{birth_date}}</td></tr>
  <tr><th>주소</th><td colspan="3">{{address}}</td></tr>
</table>

<h2>제2조 (인턴 기간)</h2>
<table>
  <tr><th>인턴 시작일</th><td>{{start_date}}</td></tr>
  <tr><th>인턴 종료일</th><td>{{end_date}}</td></tr>
</table>
<p>인턴 기간 종료 후 평가 결과에 따라 정규직 전환 여부를 결정합니다.</p>

<h2>제3조 (근무장소 및 업무)</h2>
<table>
  <tr><th>근무장소</th><td>{{company_address}}</td></tr>
  <tr><th>담당업무</th><td>{{position}} 보조 및 관련 업무</td></tr>
  <tr><th>지도담당자</th><td>(추후 지정)</td></tr>
</table>

<h2>제4조 (근로시간 및 휴일)</h2>
<ol>
  <li>근무시간: 09:00 ~ 18:00 (휴게시간 12:00 ~ 13:00 포함)</li>
  <li>주 5일 근무 (월~금), 주휴일: 일요일</li>
</ol>

<h2>제5조 (임금)</h2>
<table>
  <tr><th>월 급여</th><td>{{salary}} (세전)</td></tr>
  <tr><th>지급일</th><td>매월 25일</td></tr>
  <tr><th>지급방법</th><td>근로자 명의 은행계좌 입금</td></tr>
</table>

<h2>제6조 (평가 및 정규직 전환)</h2>
<ol>
  <li>인턴 기간 중 업무 수행능력, 근태, 팀 적응도 등을 종합 평가합니다.</li>
  <li>평가 결과 우수 시 정규직으로 전환하며, 별도의 정규직 근로계약서를 체결합니다.</li>
  <li>전환 불가 시 인턴 기간 만료일에 근로관계가 종료됩니다.</li>
</ol>

<h2>제7조 (사회보험)</h2>
<p>국민연금, 건강보험, 고용보험, 산업재해보상보험에 가입합니다.</p>

<h2>제8조 (비밀유지)</h2>
<p>근로자는 재직 중 및 퇴직 후 업무상 알게 된 영업비밀 및 기업 정보를 외부에 누설하지 않습니다.</p>

<h2>제9조 (계약해지)</h2>
<ol>
  <li>인턴 기간 중 근로자의 귀책사유가 있을 경우 계약을 해지할 수 있습니다.</li>
  <li>근로자가 중도 퇴직 시 7일 전에 서면 통보합니다.</li>
</ol>

<div class="date-area">{{contract_date}}</div>

<div class="sign-row">
  <div class="sign-box">
    <p><strong>사용자 (갑)</strong></p>
    <p>{{company_name}}</p>
    <p>대표이사</p>
    <div class="sign-line"></div>
    <p>(서명 또는 인)</p>
  </div>
  <div class="sign-box">
    <p><strong>근로자 (을)</strong></p>
    <p>{{name}}</p>
    <div class="sign-line"></div>
    <p>(서명 또는 인)</p>
  </div>
</div>
</body></html>`,
  },
];
