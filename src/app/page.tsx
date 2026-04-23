import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black selection:bg-blue-200">
      <main className="mx-auto flex max-w-5xl flex-col items-center sm:items-start px-6 py-20 sm:py-32 gap-12">

        {/* ヘッダー・タイトル部分 */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-4">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            卒業研究プロジェクト
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
            操作演習を行える画面配信型教材を提供する<br className="hidden md:block" />
            授業支援システムの開発
          </h1>
        </div>
        {/*著者情報 */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 mt-4 text-base text-zinc-600 dark:text-zinc-400 border-l-4 border-blue-500 pl-4 bg-white dark:bg-zinc-900 py-2 pr-6 rounded-r-lg shadow-sm">
          <span>名城大学 情報工学部 田中研究室</span>
          <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">|</span>
          <span className="flex items-center gap-1">
            学籍番号 <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">231205066</span>
          </span>
          <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">|</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">金子 拳也</span>
        </div>
        {/* アクションボタン（デモ画面へのリンク） */}
        <div className="flex flex-col sm:flex-row w-full max-w-md gap-4 mt-8">
          <Link
            href="./teacher/classrooms/1"
            className="flex flex-1 h-14 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
            target="_blank"
          >
            教員用画面を開く
          </Link>
          <Link
            href="./student/classrooms/1"
            className="flex flex-1 h-14 items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 bg-white px-6 font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            target="_blank"
          >
            生徒用画面を開く
          </Link>
        </div>
        {/* 概要テキスト部分 */}
        <div className="max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 space-y-4">
          <p>
            本システムは、学校教育において、Webブラウザ上の単一画面内に、説明資料(静的要素)と操作演習(動的要素)を備え、操作演習を行える画面配信型教材を提供する授業支援システム、及びその教材を作成するためのオーサリングツールです。
          </p>
          <p>開発するシステムは、大きく分けて以下の3つのサブシステムで構成されます。</p>
        </div>

        {/* 3つのシステム（カードレイアウト） */}
        <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold text-xl">
              1
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">教材作成システム</h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              授業準備時、教員が利用するシステム。<br />
              テキスト、画像などの「静的コンポーネント」と、簡単なシミュレータなどの「動的コンポーネント」をドラッグ&ドロップ等で自由に組み合わせ、スライド形式の教材を作成・保存する機能を持つ。
            </p>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-bold text-xl">
              2
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">教材提示システム</h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              授業中、教員と生徒が利用するシステム。<br />
              作成された教材に生徒がアクセスし、教員の操作(ページ送り等)を生徒の端末にリアルタイムで同期する。<br />
              生徒は動的コンポーネント内のみを操作でき、また、動的コンポーネントの可否は教師が制御する。
            </p>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 font-bold text-xl">
              3
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">動的コンポーネント<br />作成システム</h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              主にサービス提供者が利用するシステム。<br />
              本システムに対応した動的コンポーネントを作成し、ライブラリに保存する。
            </p>
          </div>
        </div>



      </main>
    </div>
  );
}