import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return Response.json({ error: 'GOOGLE_APPS_SCRIPT_URL not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { department, name, lockerNumber } = body;

  if (!department || !name || !lockerNumber) {
    return Response.json({ error: '부서, 성함, 사물함 번호를 모두 입력해주세요.' }, { status: 400 });
  }

  const res = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ department, name, lockerNumber: String(lockerNumber) }),
  });

  if (!res.ok) {
    return Response.json({ error: '시트 업데이트에 실패했습니다.' }, { status: 502 });
  }

  const data = await res.json();
  if (data.error) {
    return Response.json({ error: data.error }, { status: 502 });
  }
  if (data.duplicate) {
    return Response.json({ duplicate: true }, { status: 409 });
  }

  return Response.json({ success: true });
}
