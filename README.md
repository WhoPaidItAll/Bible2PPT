# Bible2PPT 및 bible2next

## 소개

Bible2PPT와 bible2next는 사용자가 성경 구절을 PPT 슬라이드로 쉽게 변환할 수 있도록 돕는 도구입니다. Bible2PPT는 데스크톱 애플리케이션으로, bible2next는 웹 API 및 애플리케이션으로 개발되었습니다. 각 도구는 서로 다른 환경과 사용 사례에 맞춰져 있으며, 다양한 기능과 사용자 정의 옵션을 제공합니다.

## 목차

1.  [Bible2PPT (데스크톱 애플리케이션)](#bible2ppt-데스크톱-애플리케이션)
    *   [스크린샷](#스크린샷)
    *   [주요 기능](#주요-기능)
    *   [지원되는 성경](#지원되는-성경)
    *   [구절 입력 형식](#구절-입력-형식)
    *   [설치](#설치)
    *   [요구 사항](#요구-사항)
2.  [bible2next (웹 API 및 애플리케이션)](#bible2next-웹-api-및-애플리케이션)
    *   [소개](#소개-1)
    *   [주요 기능](#주요-기능-1)
    *   [지원되는 성경](#지원되는-성경-1)
    *   [시작하기](#시작하기)
        *   [필수 조건](#필수-조건)
        *   [설치](#설치-1)
        *   [데이터베이스 설정](#데이터베이스-설정)
        *   [실행](#실행)
    *   [API 사용 예시](#api-사용-예시)
3.  [템플릿 가이드](#템플릿-가이드)
4.  [기여 방법](#기여-방법)
5.  [라이선스](#라이선스)

## Bible2PPT (데스크톱 애플리케이션)

Bible2PPT는 Windows 데스크톱 환경에서 성경 구절을 PowerPoint 슬라이드로 변환하는 프로그램입니다. 사용자 친화적인 인터페이스와 다양한 사용자 정의 옵션을 제공하여 예배, 성경 공부 등 다양한 목적에 활용될 수 있습니다.

### 스크린샷

(스크린샷 이미지를 여기에 추가할 수 있습니다. 예: `![Bible2PPT 스크린샷](images/screenshot.png)`)

### 주요 기능

*   **오프라인 캐시**: 자주 사용하는 성경 데이터를 로컬에 저장하여 인터넷 연결 없이도 빠르게 사용할 수 있습니다.
*   **장별 분할**: 성경 구절을 장별로 나누어 여러 슬라이드에 걸쳐 표시할 수 있습니다.
*   **다양한 성경 버전 지원**: 여러 언어와 번역본의 성경을 지원합니다. (자세한 목록은 [지원되는 성경](#지원되는-성경) 섹션 참조)
*   **사용자 정의 템플릿**: 사용자가 직접 제작한 PowerPoint 템플릿을 사용하여 슬라이드 디자인을 자유롭게 변경할 수 있습니다.
*   **직관적인 인터페이스**: 사용하기 쉬운 인터페이스를 통해 누구나 쉽게 성경 PPT를 제작할 수 있습니다.

### 지원되는 성경

Bible2PPT는 다음을 포함한 다양한 성경 버전을 지원합니다:

*   **한국어**: 개역개정, 개역한글, 공동번역, 새번역, 쉬운성경, 우리말성경, 현대인의 성경, KJV흠정역
*   **영어**: AKJV (Authorized King James Version), ASV (American Standard Version), BBE (Bible in Basic English), ESV (English Standard Version), GNB (Good News Bible), KJV (King James Version), MSG (The Message), NASB (New American Standard Bible), NIV (New International Version), NKJV (New King James Version), NLT (New Living Translation), TNIV (Today's New International Version), WEB (World English Bible), YLT (Young's Literal Translation)
*   **일본어**: 구어역 (口語訳), 신개역 (新改訳), 신공동역 (新共同訳)
*   **중국어**: 화합본 (和合本), 신역본 (新譯本), 현대중문역본 (現代中文譯本)
*   **독일어**: ELB (Elberfelder), LUT (Lutherbibel), HFA (Hoffnung für Alle)
*   **스페인어**: RVA (Reina-Valera Antigua), NVI (Nueva Versión Internacional)
*   **프랑스어**: LSG (Louis Segond), BDS (Bible du Semeur)
*   **기타**: 성경 목록은 지속적으로 업데이트될 수 있습니다.

### 구절 입력 형식

성경 구절은 다음과 같은 형식으로 입력합니다:

*   `창세기 1:1`
*   `출애굽기 1:1-10`
*   `레위기 1:1,3,5` (쉼표로 여러 구절 구분)
*   `민수기 1:1-5,10-15` (범위와 개별 구절 혼합)
*   `신명기 1장` (장 전체)

### 설치

최신 버전의 Bible2PPT는 [릴리스 페이지](https://github.com/USERNAME/Bible2PPT/releases)에서 다운로드할 수 있습니다. (실제 사용자 이름과 저장소 이름으로 변경해야 합니다)

### 요구 사항

*   .NET Framework (버전 명시, 예: 4.7.2 이상)
*   Microsoft PowerPoint (버전 명시, 예: 2007 이상)

## bible2next (웹 API 및 애플리케이션)

### 소개

bible2next는 Next.js를 기반으로 구축된 웹 API 및 애플리케이션입니다. 성경 데이터를 동적으로 가져와 PPT 파일을 생성하는 기능을 제공하며, 웹 환경에서의 유연한 활용을 목표로 합니다.

### 주요 기능

*   **RESTful API**: 성경 구절을 기반으로 PPT 생성을 요청할 수 있는 API 엔드포인트 (`/api/generate-ppt`)를 제공합니다.
*   **`pptxgenjs` 사용**: 서버 측에서 `pptxgenjs` 라이브러리를 사용하여 프로그래매틱하게 PowerPoint 파일을 생성합니다.
*   **Prisma ORM**: 데이터베이스 관리를 위해 Prisma를 사용하여 성경 데이터를 효율적으로 처리합니다.
*   **사용자 정의 옵션**: API 요청 시 다양한 옵션 (예: 템플릿 색상, 글꼴 크기 등)을 전달하여 생성되는 PPT의 스타일을 조정할 수 있습니다. (구체적인 옵션은 API 문서 참조)
*   **확장성**: Next.js 프레임워크를 사용하여 기능 확장 및 유지보수가 용이합니다.

### 지원되는 성경

bible2next에서 현재 지원하는 성경 버전은 다음과 같습니다. 이 목록은 `prisma/books_seed_data.json` 파일을 통해 관리되며, 향후 변경될 수 있습니다.

*   갓피플 - 개역개정
*   갓피플 - 쉬운성경

데이터베이스에 새로운 성경 데이터를 추가하여 지원 목록을 확장할 수 있습니다.

### 시작하기

#### 필수 조건

*   Node.js (버전 명시, 예: 18.x 이상)
*   npm 또는 yarn

#### 설치

1.  저장소 복제:
    ```bash
    git clone https://github.com/USERNAME/bible2next.git
    cd bible2next
    ```
    (실제 사용자 이름과 저장소 이름으로 변경해야 합니다)

2.  의존성 설치:
    ```bash
    npm install
    # 또는
    # yarn install
    ```

#### 데이터베이스 설정

bible2next는 Prisma를 사용하여 데이터베이스를 관리합니다.

1.  Prisma 클라이언트 생성:
    ```bash
    npx prisma generate
    ```

2.  데이터베이스 스키마 적용:
    ```bash
    npx prisma db push
    ```
    (이 명령어는 `prisma/schema.prisma` 파일에 정의된 스키마를 데이터베이스에 적용합니다. SQLite를 기본으로 사용하며, 필요시 다른 데이터베이스로 변경할 수 있습니다.)

3.  초기 데이터 시딩 (지원되는 성경 목록 등):
    ```bash
    npm run seed
    # 또는
    # npx prisma db seed (package.json 스크립트 설정에 따라 다를 수 있음)
    ```

#### 실행

개발 서버 실행:
```bash
npm run dev
```
애플리케이션은 기본적으로 `http://localhost:3000`에서 실행됩니다.

### API 사용 예시

`POST /api/generate-ppt` 엔드포인트를 사용하여 PPT 생성을 요청할 수 있습니다.

요청 본문 예시 (JSON 형식):

```json
{
  "bibleVersion": "개역개정", // prisma/books_seed_data.json 에 명시된 bibleVersion 값
  "verses": [
    { "book": "창세기", "chapter": 1, "verse": 1 },
    { "book": "요한복음", "chapter": 3, "verse": 16 }
  ],
  "options": { // 선택 사항: pptxgenjs에서 지원하는 다양한 사용자 정의 옵션
    "layout": "LAYOUT_16X9",
    "author": "My Church",
    "company": "Sermon Series",
    "slideNumber": { "x": 0.5, "y": "95%", "color": "FFFFFF" }
  }
}
```

`curl` 또는 `fetch`와 같은 도구를 사용하여 API를 호출할 수 있습니다.

```bash
curl -X POST http://localhost:3000/api/generate-ppt \
-H "Content-Type: application/json" \
-d '{
  "bibleVersion": "개역개정",
  "verses": [
    { "book": "창세기", "chapter": 1, "verse": 1 }
  ]
}' \
--output generated_presentation.pptx
```

## 템플릿 가이드

템플릿 시스템은 주로 **Bible2PPT (데스크톱 애플리케이션)**에서 사용자가 직접 `.pptx` 파일을 수정하여 슬라이드 디자인을 변경하는 방식을 의미합니다.

### Bible2PPT의 플레이스홀더 시스템

Bible2PPT는 PowerPoint 템플릿 파일 내의 특정 텍스트 플레이스홀더(예: `[TITLE]`, `[BODY]`)를 성경 구절 내용으로 대체하여 슬라이드를 생성합니다. 사용자는 자신만의 `.pptx` 템플릿 파일을 만들고, 이 플레이스홀더들을 사용하여 성경 구절이 삽입될 위치와 스타일을 지정할 수 있습니다.

다음은 Bible2PPT 템플릿에서 사용되는 주요 플레이스홀더와 접미사 설명입니다:

| 플레이스홀더        | 설명                                                    |
| ----------------- | ------------------------------------------------------- |
| `[TITLE]`         | 성경 구절의 제목 (예: 창세기 1:1) 이 삽입되는 위치입니다.     |
| `[BODY]`          | 성경 구절의 본문 내용이 삽입되는 위치입니다.                  |
| `[CHAPTER]`       | 현재 슬라이드의 장 번호가 삽입되는 위치입니다. (장별 분할 시 유용) |
| `[BOOK_CHAPTER]`  | 책 이름과 장 번호가 함께 표시됩니다. (예: 창세기 1)        |

**접미사 (Suffixes):**

플레이스홀더 뒤에 숫자를 추가하여 여러 개의 동일한 유형의 텍스트 상자를 구분할 수 있습니다. 예를 들어, 한 슬라이드에 두 개의 본문 영역이 필요한 경우 `[BODY1]`과 `[BODY2]`를 사용할 수 있습니다.

*   `[TITLE1]`, `[TITLE2]`, ...
*   `[BODY1]`, `[BODY2]`, ...

이러한 플레이스홀더와 접미사를 사용하여 사용자는 매우 유연하게 자신만의 슬라이드 레이아웃을 구성할 수 있습니다.

### bible2next의 프로그래매틱 방식

**bible2next**는 `.pptx` 템플릿 파일을 직접 파싱하는 대신, `pptxgenjs` 라이브러리를 사용하여 프로그래매틱하게 PowerPoint 프레젠테이션을 생성합니다. 이는 서버 측에서 코드를 통해 슬라이드의 모든 요소(텍스트, 이미지, 도형, 레이아웃 등)를 직접 정의하고 조작한다는 의미입니다.

따라서 `bible2next`에서의 "템플릿" 또는 "사용자 정의"는 API 요청 시 전달하는 `options` 객체를 통해 이루어집니다. 이 `options` 객체는 `pptxgenjs`가 제공하는 다양한 설정을 포함하며, 이를 통해 글꼴, 색상, 레이아웃, 슬라이드 마스터 등을 제어할 수 있습니다. 직접적인 문자열 치환 방식(`[TITLE]`, `[BODY]`)은 `bible2next`에 적용되지 않습니다.

사용자 정의는 API를 통해 동적으로 이루어지므로, 다양한 요구사항에 맞춰 유연하게 프레젠테이션을 생성할 수 있는 장점이 있습니다.

## 기여 방법

Bible2PPT 및 bible2next 프로젝트에 기여해주셔서 감사합니다! 기여는 언제나 환영입니다. 버그를 발견하거나 새로운 기능을 제안하고 싶다면, GitHub 저장소의 "Issues" 탭을 통해 알려주세요.

코드 변경 사항을 직접 기여하고 싶다면, 다음 단계를 따라주세요:

1.  이 저장소를 Fork 하세요.
2.  새로운 기능 또는 버그 수정을 위한 브랜치를 만드세요. (`git checkout -b feature/amazing-feature` 또는 `git checkout -b fix/annoying-bug`)
3.  변경 사항을 커밋하세요. (`git commit -m 'Add some amazing feature'`)
4.  Fork한 저장소의 브랜치로 푸시하세요. (`git push origin feature/amazing-feature`)
5.  원본 저장소에 Pull Request를 생성해주세요.

자세한 내용은 각 프로젝트의 `CONTRIBUTING.md` 파일(존재하는 경우)을 참조해주세요.

## 라이선스

Bible2PPT와 bible2next는 [MIT 라이선스](LICENSE) 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 확인해주세요.
(LICENSE 파일이 없다면, MIT 라이선스 내용을 포함하는 LICENSE 파일을 프로젝트 루트에 추가해야 합니다.)
