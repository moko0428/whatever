import { NextRequest } from 'next/server';

export async function GET() {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const totalLockers = Number(process.env.TOTAL_LOCKERS) || 200;

  if (!scriptUrl) {
    return Response.json({ error: 'GOOGLE_APPS_SCRIPT_URL not configured' }, { status: 500 });
  }

  const res = await fetch(scriptUrl, { cache: 'no-store' });
  if (!res.ok) {
    return Response.json({ error: '데이터를 불러오는데 실패했습니다.' }, { status: 502 });
  }

  const data = await res.json();

  type Locker = { number: number; department: string; name: string; startDate: string; endDate: string };
  const allLockers: Locker[] = (data.lockers ?? []).map(
    (item: { number: unknown; department: unknown; name: unknown; startDate: unknown; endDate: unknown }) => ({
      number: Number(item.number),
      department: String(item.department ?? ''),
      name: String(item.name ?? ''),
      startDate: String(item.startDate ?? ''),
      endDate: String(item.endDate ?? ''),
    })
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const occupied: Locker[] = [];
  const empty: number[] = [];

  for (const locker of allLockers) {
    const hasName = locker.name.trim() !== '';
    const endDate = locker.endDate ? new Date(locker.endDate) : null;
    const isPastEndDate = endDate !== null && endDate <= today;

    if (hasName && !isPastEndDate) {
      occupied.push(locker);
    } else {
      empty.push(locker.number);
    }
  }

  return Response.json({ empty, total: totalLockers, occupied });
}

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

  const text = await res.text();
  let data: { error?: string };
  try {
    data = JSON.parse(text);
  } catch {
    return Response.json({ error: '스크립트 응답 오류 — Apps Script 재배포가 필요할 수 있습니다.' }, { status: 502 });
  }

  if (!res.ok || data.error) {
    return Response.json({ error: data.error || '시트 업데이트에 실패했습니다.' }, { status: 502 });
  }

  return Response.json({ success: true });
}
