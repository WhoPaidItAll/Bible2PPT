# Bible2PPT 프로젝트 문서화

#### 1. 프로젝트 개요
- **프로젝트 이름**: Bible2PPT
- **설명**: 성경 데이터를 기반으로 PowerPoint 프레젠테이션을 생성하는 데스크탑 애플리케이션. 주로 Windows 환경에서 동작하며, GUI를 통해 사용자 입력을 받고, 데이터베이스(SQLite)를 사용해 성경 데이터를 관리하며, PowerPoint 파일을 생성합니다.
- **언어 및 프레임워크**: C# (Microsoft .NET), Windows Forms (GUI 빌딩), Microsoft.Extensions.DependencyInjection (의존성 주입).
- **저장소**: GitHub (WhoPaidItAll/Bible2PPT), 로컬 경로: /workspace/Bible2PPT
- **주요 기능**:
  - 성경 데이터 조회 및 처리.
  - PowerPoint 템플릿 생성 및 빌드.
  - 사용자 설정 관리 (e.g., 템플릿 옵션, 데이터베이스 구성).
  - 네비게이션 기반 UI (e.g., 빌드, 히스토리, 템플릿, 설정 페이지).

#### 2. 아키텍터 및 구성 요소
- **전체 구조**:
  - **진입점**: Program.cs에서 애플리케이션 시작, 서비스를 초기화하고 Windows Forms 애플리케이션을 실행.
  - **GUI 레이어**: MainForm.cs를 중심으로 한 폼 기반 UI. 여러 패널(빌드, 히스토리, 템플릿, 설정)을 네비게이션으로 관리.
  - **서비스 레이어**: 의존성 주입을 통해 BibleService, TemplateService, BuildService 등을 제공. 데이터베이스 접근과 비즈니스 로직을 처리.
  - **데이터베이스 및 구성**: SQLite를 사용한 데이터 저장 (e.g., bindex-v3.db, build-v3.db). AppConfig.cs에서 설정 값을 직렬화하여 관리.
  - **외부 통합**: PowerPoint 생성 로직 (e.g., Interop), 오류 처리 (e.g., MessageBox 사용).

- **주요 클래스 및 역할**:
  - **Program.cs**: 애플리케이션의 메인 엔트리. 서비스를 구성하고, SplashForm과 MainForm을 로드. Dependency Injection을 설정하여 서비스를 주입.
  - **MainForm.cs**: 핵심 UI 로직. 폼 초기화, 네비게이션(버튼 클릭 이벤트), 작업 취소(CancellationTokenSource), 서비스와의 상호작용을 담당. 예: 빌드 패널, 히스토리 패널 등.
  - **AppConfig.cs**: 애플리케이션 설정 관리. 이진 직렬화를 통해 옵션(예: 템플릿 텍스트 표시, 데이터베이스 경로)을 저장. 정적 속성으로 구성 경로를 정의.
  - **기타 파일**:
    - SplashForm.cs: 시작 스플래시 화면.
    - Services (e.g., BibleService.cs): 성경 데이터 처리, 데이터베이스 쿼리.
    - BinaryConfig.cs: AppConfig의 기반 클래스, 설정 직렬화 로직.

#### 3. 의존성 및 외부 라이브러리
- **주요 의존성**:
  - Microsoft.EntityFrameworkCore: ORM으로 SQLite 데이터베이스 관리.
  - Microsoft.Extensions.DependencyInjection: 서비스 주입.
  - System.Windows.Forms: GUI 컴포넌트.
  - Microsoft.Office.Interop.PowerPoint: PowerPoint와의 통합 (Windows 전용).
  - 기타: System.Configuration (설정 파일), System.IO (파일 처리).
- **데이터베이스**: SQLite (e.g., "Data Source=bindex-v3.db"). 스키마는 EntityFrameworkCore를 통해 정의.
- **설치 방법**: C# 프로젝트이므로, NuGet 패키지 매니저를 통해 관리. 예: `dotnet add package Microsoft.EntityFrameworkCore.Sqlite`.

#### 4. 기능 상세
- **코어 기능**:
  - **성경 데이터 처리**: BibleService를 통해 데이터베이스에서 성경 텍스트를 조회. 쿼리 예: 성경 버전 ID, 장/절 검색.
  - **PPT 생성**: BuildService를 사용해 템플릿을 기반으로 PowerPoint 파일 생성. 옵션(예: 장별 분리, 캐시 사용)을 AppConfig에서 제어.
  - **UI 상호작용**: MainForm에서 패널 전환, 버튼 이벤트 처리. 예: 네비게이션 클릭 시 해당 패널 활성화.
  - **설정 관리**: AppConfig를 통해 사용자 설정 저장/로드. 예: 템플릿 텍스트 옵션 (항상 표시, 선택적 표시).
  - **오류 처리**: 예외 발생 시 MessageBox로 사용자에게 알림 (e.g., PowerPoint 설치 확인).

- **작동 흐름**:
  1. 애플리케이션 시작: Program.cs에서 서비스 초기화.
  2. UI 로드: MainForm 표시, 사용자 입력 대기.
  3. 데이터 처리: 서비스 호출로 데이터베이스 접근.
  4. 출력: PowerPoint 파일 생성 및 저장.

#### 5. 잠재적 문제점 및 개선 사항
- **문제점**:
  - Windows 의존성: Interop를 사용하므로, Windows 외 플랫폼에서 동작하지 않음.
  - 오류 처리: 간단한 MessageBox 사용으로, 더 세련된 로깅 시스템이 부족.
  - 성능: 대량 데이터 처리 시 캐시 옵션(UseCache)이 있지만, 최적화가 필요.
- **개선 제안**:
  - 크로스플랫폼 지원: Python 포팅 시, GUI를 Tkinter로 대체하여 macOS/Linux 지원.
  - 보안: 데이터베이스 연결 문자열을 하드코딩하지 않도록 수정.
  - 테스트: C#에서 단위 테스트가 없어 보임; Python 포팅 시 pytest를 활용.

#### 6. 결론 및 다음 단계
- **문서화 요약**: 이 프로젝트는 간단한 데스크탑 도구로, GUI 중심의 C# 애플리케이션입니다. 데이터베이스와 PowerPoint 통합이 핵심입니다.
- **다음 행동**: 이 문서가 도움이 되었기를 바랍니다. 이제 포팅 계획으로 돌아가, 서비스 클래스 포팅(예: BibleService)부터 시작하겠습니다. 계속 진행하시겠습니까? 아니면 추가 문서화가 필요하신가요?