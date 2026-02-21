# CD情報検索フロントエンド（`cd-search-front`）

React + Vite で構築した CD 情報検索フロントエンドです。  
バックエンド API（`../cd-search`）と連携し、検索・詳細表示・ローカルタグ書き込みを提供します。

## 画面と機能

### 1. CD情報検索（Top: `/`）
- 検索条件: タイトル / アーティスト / 規格品番 / 発売日
- ソート: タイトル / アーティスト / 規格品番 / 発売日
- 検索未入力時は発売日順の上位件数のみ表示（ページネーションなし）
- 検索実行時はページネーション表示

検索未入力時の表示件数は `src/App.jsx` の `TOP_RELEASE_LIMIT` で変更できます。

### 2. アルバム詳細（`/albums/:id`）
- アルバム情報表示（アルバム名+形態、規格品番、レーベル、発売日、リリース年 ほか）
- 各項目のクリップボードコピー
- 収録曲テーブル（Discごとに分割表示）
- 曲名/アーティスト/作詞/作曲/編曲/ジャンル/コメント表示
- アーティスト名クリックで関連楽曲ページへ遷移

### 3. ローカルタグ書き込み（アルバム詳細画面内）
- Chrome/Edge の File System Access API を利用
- 対応形式: `.mp3` / `.flac` / `.m4a`
- ファイル選択またはフォルダ選択で対象を読み込み
- トラック割り当てを確認して一括書き込み
- ジャケット埋め込み（2MB以下）
- リネームテンプレート対応（例: `$num(%track%,2) %title%`）
- 免責表示・進捗バー・結果一覧あり

#### フォルダ選択時の出力仕様
- 元ファイルの親フォルダ直下に「アルバム名」フォルダを作成
- その中にタグ更新後ファイルを出力（元ファイルは保持）
- 同名衝突時は `(1)`, `(2)` を付与

#### 単体ファイル選択時の注意
- リネーム ON の場合、タグ書き込み開始後に曲数分の保存ダイアログが表示
- ダイアログをキャンセルした曲はスキップ

### 4. アーティスト関連楽曲（`/artists/:id/tracks`）
- 指定アーティストの関連曲一覧
- `role`（`vocal` / `lyricist` / `composer` / `arranger`）で絞り込み

### 5. 曲検索（`/tracks`）
- 曲名部分一致検索
- 検索結果からアルバム詳細/アーティスト関連へ遷移

### 6. テーマ切替
- 右上ボタンでライト/ダーク切替
- 初期状態は OS 設定追従

## 技術スタック
- React 19
- Vite 7
- React Router DOM 7
- Axios
- Tailwind CSS
- lucide-react
- taglib-wasm（Web Worker 経由）

## セットアップ

### 前提
- Node.js 18 以上
- Laravel API（`../cd-search`）が利用可能であること

### インストール
```bash
npm install
```

### フロントのみ起動
```bash
npm run dev
```

### フロント + Laravel を同時起動（Windows）
```bash
npm run dev:all
```
`scripts/start-dev.bat` で `../cd-search` の `php artisan serve` と本フロントの `npm run dev` を同時起動します。

### 品質チェック
```bash
npm run lint
npm run build
```

## 環境変数
`.env` の `VITE_API_URL` で API 接続先を指定します。

```env
VITE_API_URL=http://127.0.0.1:8000
```

`/api` 有無や末尾スラッシュは内部で吸収します。

## フロントが利用する API
- `GET /api/albums`
- `GET /api/albums/{id}`
- `GET /api/artists/{artist}/tracks?role=...`
- `GET /api/tracks`

## 主要ディレクトリ
```text
src/
  api/
    albums.js
    baseUrl.js
  pages/
    AlbumDetail.jsx
    ArtistTracks.jsx
    TrackSearch.jsx
  workers/
    tagWriter.worker.js
  App.jsx
  main.jsx
public/
  cddb-favicon.svg
  taglib.wasm
scripts/
  prepare-taglib-wasm.mjs
  start-dev.bat
```
