# 복권 시뮬레이터

로또 6/45와 연금복권 720+ 추천 번호를 생성하고, 최근 이력과 즐겨찾기를 브라우저에 저장하는 반응형 웹사이트입니다.

## 기능

- 두 복권 종류별 별도 추천 페이지와 조건 기반 번호 생성
- 1~10게임 묶음 추천, 제외 번호, 복사 및 SVG 이미지 저장
- 생성 이력·즐겨찾기 LocalStorage 저장(복권 종류와 회차 포함)
- 공식 회차 확인을 위한 정기 갱신 스크립트
- GitHub Pages 정적 배포 workflow

번호 생성은 재미를 위한 무작위 조합이며 당첨을 예측하거나 보장하지 않습니다.

## 개발

```bash
npm install
npm run dev
```

## 회차 데이터

`public/data/rounds.json`은 마지막으로 확인한 회차와 다음 추첨 대상을 보관합니다. `.github/workflows/pages.yml`은 매주 목요일·토요일 추첨 이후 동행복권 공식 결과를 확인하고, 새 결과가 실제로 확인된 경우에만 다음 회차를 갱신한 뒤 사이트를 재배포합니다. 공식 응답이 없거나 형식이 달라지면 회차를 올리지 않고 확인 필요 상태를 유지합니다.

공식 결과 확인은 비공식 공개 웹 응답 형식에 의존하므로, 배포 후 Actions 실행 결과와 화면의 회차 상태를 주기적으로 확인해 주세요.

## 배포

GitHub 저장소의 기본 브랜치를 `main`으로 두고 Pages 설정에서 배포 원본을 **GitHub Actions**로 선택합니다. 이후 push 또는 Actions의 `workflow_dispatch`를 실행하면 GitHub Pages가 빌드·배포됩니다.

무료 GitHub Pages는 공개 저장소가 필요할 수 있습니다. 저장소 이름이 `lottery-simulator`인 경우 주소 형식은 `https://<GitHub 사용자명>.github.io/lottery-simulator/`입니다.
