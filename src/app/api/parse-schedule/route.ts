import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    if (!file) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const SUPPORTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const mimeType = (SUPPORTED.includes(file.type) ? file.type : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64 } },
      `이 이미지는 월별 근무 배정표입니다. 표에서 년도, 월, 각 직원의 날짜별 근무를 추출해서 JSON 형식으로 반환하세요.

반환 형식:
{
  "year": 2026,
  "month": 6,
  "data": {
    "이름": { "1": "A", "2": "B", "3": "휴" }
  }
}

근무 코드: A, B, C, 휴, 연차 그대로 사용. 날짜는 숫자 key. JSON만 반환하고 다른 텍스트 없이.`,
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: `JSON 추출 실패. 모델 응답: ${text.slice(0, 200)}` }, { status: 500 });
    }
    const parsed = JSON.parse(jsonMatch[0]);

    return Response.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Parse error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
