"""Claude API 기반 페르소나 피드백 생성."""
import json
import re

import anthropic

from app.config import settings

_PERSONA_PROMPTS: dict[str, str] = {
    "bum_su": (
        "당신은 한국 최고의 발라드 가수 김범수입니다. "
        "음정 하나하나를 생명처럼 여기는 완벽주의자입니다. "
        "피드백은 따뜻하지만 솔직하게, 감성적인 언어를 써서 전달하세요. "
        "발라드 가수 특유의 진중함과 깊은 음악적 통찰이 담겨야 합니다."
    ),
    "iu": (
        "당신은 국민 가수 아이유입니다. "
        "섬세한 감정 표현과 정확한 발음을 무엇보다 중시하는 아티스트입니다. "
        "피드백은 친근하고 구체적으로, 후배를 격려하듯 따뜻하게 전달하세요. "
        "가사와 발음의 전달력에 특별히 주목합니다."
    ),
    "taeyang": (
        "당신은 R&B/소울의 거장 태양(BIGBANG)입니다. "
        "리듬 그루브와 다이내믹한 에너지를 극도로 중시합니다. "
        "피드백은 쿨하고 직설적으로, R&B 용어를 섞어가며 전달하세요. "
        "퍼포먼스 에너지와 리듬감에 가장 주목합니다."
    ),
    "sunmi": (
        "당신은 댄스 팝의 아이콘 선미입니다. "
        "리듬 정확성과 무대 위 존재감을 최우선시하는 퍼포머입니다. "
        "피드백은 날카롭고 패셔너블하게, 자신감 넘치는 어조로 전달하세요. "
        "박자감과 발음 명확성에 집중합니다."
    ),
}

_FALLBACK_SYSTEM = (
    "당신은 전문 보컬 트레이너입니다. "
    "한국어로 구체적이고 건설적인 보컬 피드백을 제공합니다."
)

_USER_PROMPT_TEMPLATE = """\
다음은 보컬 녹음의 5축 채점 결과입니다:
- 음정 정확도: {pitch}/20
- 리듬 안정성: {rhythm}/20
- 음역대 활용: {range}/20
- 다이내믹: {dynamic}/20
- 발음 명확도: {articulation}/20
- 장르: {genre}
- 제목: {title}

위 데이터를 바탕으로 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{{
  "summary": "200자 내외 종합 평가",
  "strengths": [
    {{"timestamp": "MM:SS", "description": "강점 설명 (구체적으로)"}},
    {{"timestamp": "MM:SS", "description": "강점 설명"}},
    {{"timestamp": "MM:SS", "description": "강점 설명"}}
  ],
  "improvements": [
    {{"timestamp": "MM:SS", "description": "개선점 설명 (구체적으로)"}},
    {{"timestamp": "MM:SS", "description": "개선점 설명"}},
    {{"timestamp": "MM:SS", "description": "개선점 설명"}}
  ]
}}
timestamp는 실제 분석 구간(0:00~1:30)에서 의미 있는 시점으로 추정하세요.
반드시 한국어로 작성하고, 페르소나 캐릭터의 화법을 유지하세요."""


def generate(
    persona_name: str,
    dim_scores: dict[str, float],
    genre: str,
    title: str,
) -> dict:
    """
    Claude API로 페르소나 화법의 피드백을 생성한다.
    API 키가 없거나 호출 실패 시 None을 반환한다.
    """
    if not settings.anthropic_api_key:
        return None

    system_prompt = _PERSONA_PROMPTS.get(persona_name, _FALLBACK_SYSTEM)
    user_prompt = _USER_PROMPT_TEMPLATE.format(
        pitch=dim_scores["pitch"],
        rhythm=dim_scores["rhythm"],
        range=dim_scores["range"],
        dynamic=dim_scores["dynamic"],
        articulation=dim_scores["articulation"],
        genre=genre or "알 수 없음",
        title=title or "제목 없음",
    )

    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw = message.content[0].text.strip()
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            raw = match.group(0)
        return json.loads(raw)
    except Exception:
        return None
