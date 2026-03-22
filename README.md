# cd-search-front

`cdinfo-master.com` の公開フロントエンドです。React 19 + Vite 7 で構成されており、Laravel API `../cd-search` と連携して CD 情報検索、アルバム詳細表示、タグ書き込み、情報修正依頼を提供します。

## 概要
- アルバム公開 URL は Laravel が返す `public_id` を使います。
- 検索トップ、アルバム詳細、アーティスト別一覧、シリーズ別一覧、楽曲検索を提供します。
- アルバム詳細からローカル音源へのタグ書き込みができます。
- 文字コードは UTF-8 前提です。

## 主な画面
- `/`
  - CD 情報検索トップ
  - 形態違いアルバムはグループごとに代表 1 件だけ表示
  - ただし規格品番検索時は一致アルバムをそのまま表示
- `/albums/:id`
  - アルバム詳細
  - `:id` は `public_id` を想定
  - 旧数値 ID は互換で詳細を開けるが、表示中は canonical な `public_id` URL に寄せる
- `/albums/:id/correction-request`
  - 情報修正依頼フォーム
- `/artists/:id/tracks`
  - アーティスト別トラック一覧
- `/artists/:id/albums`
  - アルバムアーティスト別アルバム一覧
- `/series/:id/albums`
  - シリーズ別アルバム一覧
- `/tracks`
  - 楽曲検索

## アルバム詳細ページの機能
- 基本情報表示
  - アルバム名、形態切り替え、アルバムアーティスト、発売日、レーベル、規格品番、JAN、シリーズ、関連リンク
- コピー UI
  - アルバム名
  - アルバム名+形態
  - 発売日
  - リリース年のみ
  - 各種項目は hover tooltip つきアイコンボタン
- 形態切り替え
  - 同一 `variant_group_key` のアルバムが複数ある場合にプルダウン表示
- 関連導線
  - アルバムアーティストから同アーティストのアルバム一覧へ遷移
  - シリーズから同シリーズのアルバム一覧へ遷移
  - 情報修正依頼フォームへのリンク
- ジャケット表示
  - 画像がある場合のみ表示
  - 画像直下にレーベル名ベースの控えめなコピーライト表記を表示
- トラック一覧
  - Disc ごとにソート表示
  - ボーカル、作詞、作曲、編曲、ジャンル、コメントを表示

## タグ書き込み機能
- 対応ブラウザ
  - Chromium 系ブラウザを想定
  - Safari など非対応環境では理由つきで案内表示
- 対応ファイル
  - `.mp3`
  - `.flac`
  - `.m4a`
- 主な機能
  - ディレクトリを選択してファイルを一括読み込み
  - トラック番号推定で自動マッチング
  - ジャケット画像埋め込み
    - 2 MB まで
    - デフォルト ON
    - `No Image` の場合は disable
  - リネーム
    - デフォルト ON
    - テンプレートで制御
  - アルバム名に形態を含める
    - 形態が存在する場合のみ表示
    - 複数形態がある場合の初期値は OFF
  - 結果一覧、エラー、スキップ理由の表示

## 情報修正依頼フォーム
- 修正したい項目をプルダウンで選択
- 情報ソース URL を入力可能
- 補足コメントを入力可能
- 外部 reCAPTCHA ではなく、バックエンド発行の challenge で bot 対策
- アルバム詳細へ戻る導線あり

## ダークモード
- トップ、アルバム詳細、アーティスト別一覧、シリーズ別一覧、楽曲検索で共通動作
- PC 幅ではカード外右上に表示
- 狭い幅ではヘッダー内表示
- `localStorage` の `theme-preference` に保存

## 技術スタック
- React 19
- Vite 7
- React Router DOM 7
- Axios
- Tailwind CSS
- lucide-react
- taglib-wasm

## セットアップ
### 必要環境
- Node.js 18+
- Laravel API `../cd-search`

### インストール
```bash
npm install
```

### `.env`
`VITE_API_URL` で Laravel API のベース URL を指定します。

```env
VITE_API_URL=http://127.0.0.1:8000
```

### 開発起動
```bash
npm run dev
```

Windows で Laravel と同時起動する場合:
```bash
npm run dev:all
```

## 検証コマンド
```bash
npm run lint
npm run build
node scripts/verify_utf8.mjs src/pages/AlbumDetail.jsx
```

## 主要なフロント実装
- `src/App.jsx`
  - ルーティング
  - トップ検索
  - 形態違い代表表示ロジック
- `src/pages/AlbumDetail.jsx`
  - 詳細表示
  - 形態切り替え
  - コピー UI
  - タグ書き込み
  - 情報修正依頼導線
- `src/pages/AlbumCorrectionRequest.jsx`
  - 修正依頼フォーム
- `src/pages/ArtistTracks.jsx`
  - アーティスト別トラック一覧
- `src/pages/ArtistAlbums.jsx`
  - アルバムアーティスト別一覧
- `src/pages/SeriesAlbums.jsx`
  - シリーズ別一覧
- `src/pages/TrackSearch.jsx`
  - 楽曲検索
- `src/api/albums.js`
  - アルバム API 通信
- `src/api/correctionRequests.js`
  - 修正依頼 API 通信
- `src/workers/tagWriter.worker.js`
  - taglib-wasm を使ったタグ書き込み処理

## 主要ディレクトリ
```text
src/
  api/
  components/
  pages/
  utils/
  workers/
public/
scripts/
```

## 運用メモ
- 一覧の形態違い圧縮はフロント側で実施しています。
- アルバム詳細の関連リンク、シリーズ、JAN、形態情報は API 応答に依存します。
- タグ書き込みはブラウザ API 依存のため、実運用前に Chrome / Edge で確認してください。
- `taglib-wasm` 由来の Vite warning は既知です。ビルド成功自体には影響しません。

## 文字コードと検証
- すべて UTF-8 前提
- 編集後は `node scripts/verify_utf8.mjs <path>` を推奨
- リリース前は `npm run lint` と `npm run build` を通すこと