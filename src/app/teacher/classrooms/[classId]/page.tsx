// src/app/teacher/classrooms/[roomId]/page.tsx

type BlockType = 'h1' | 'h2' | 'paragraph';
type Block = {
  id: string;
  type: BlockType;
  content: string;
};

const DUMMY_BLOCKS: Block[] = [
  { id: 'b1', type: 'h1', content: '第1回：インターネットの仕組み' },
  { id: 'b2', type: 'paragraph', content: '今日はWebサイトが表示される裏側について学びましょう。' },
  { id: 'b3', type: 'h2', content: '1. クライアントとサーバー' },
  { id: 'b4', type: 'paragraph', content: '私たちが使っているスマホやPCを「クライアント」、データを持っているコンピュータを「サーバー」と呼びます。' },
  { id: 'b5', type: 'paragraph', content: 'URLを入力すると、クライアントからサーバーへ「リクエスト」が送られます。' },
];

export default async function TeacherClassroomPage({
  params,
}: {
  params: Promise<{ roomId: string }>; 
}) {
  const { roomId } = await params;

  // ここは一旦固定値です
  const activeBlockId = 'b3'; 

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-32">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between z-10">
        <div>
          <span className="text-sm text-gray-500 font-medium">クラスルームID: {roomId}</span>
          <h1 className="text-lg font-bold">授業実施画面（教員）</h1>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
          授業を終了する
        </button>
      </header>

      <main className="max-w-3xl mx-auto mt-12 px-6">
        <div className="space-y-1">
          {DUMMY_BLOCKS.map((block) => {
            const isActive = block.id === activeBlockId;
            const baseClass = `px-4 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
              isActive 
                ? "bg-blue-50 border-l-4 border-blue-500 -ml-1" 
                : "hover:bg-gray-100 border-l-4 border-transparent -ml-1"
            }`;

            switch (block.type) {
              case 'h1':
                return (
                  <div key={block.id} className={baseClass}>
                    <h1 className="text-4xl font-extrabold mt-6 mb-4">{block.content}</h1>
                  </div>
                );
              case 'h2':
                return (
                  <div key={block.id} className={baseClass}>
                    <h2 className="text-2xl font-bold mt-8 mb-2 pb-2 border-b">{block.content}</h2>
                  </div>
                );
              case 'paragraph':
                return (
                  <div key={block.id} className={baseClass}>
                    <p className="text-lg leading-relaxed text-gray-700">{block.content}</p>
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>
      </main>
    </div>
  );
}