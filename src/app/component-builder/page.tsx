"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Gauge,
    MousePointerClick,
    Plus,
    Repeat,
    RotateCw,
    Route,
    SlidersHorizontal,
    Trash2,
    Type,
    X,
    Zap,
} from "lucide-react";

// ============================================================
// 左: グリッド配置エディタ（見た目）
// roller-coasterブロックの構成（シミュレーション描画/設定値ラベル/操作スライダー/数値パネル）を参考にしたパーツ構成
// ============================================================

type PartType = "text" | "simulation" | "stat" | "slider";

type PartDef = { type: PartType; icon: React.ElementType; className: string; w: number; h: number };

const PART_DEFS: PartDef[] = [
    { type: "text", icon: Type, className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100", w: 1, h: 1 },
    { type: "simulation", icon: Route, className: "bg-sky-200 text-sky-800 dark:bg-sky-800/60 dark:text-sky-100", w: 3, h: 2 },
    { type: "stat", icon: Gauge, className: "bg-indigo-200 text-indigo-800 dark:bg-indigo-800/60 dark:text-indigo-100", w: 1, h: 1 },
    { type: "slider", icon: SlidersHorizontal, className: "bg-emerald-200 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-100", w: 2, h: 1 },
];

const GRID_COLS = 8;
const GRID_ROWS = 6;
const CELL = 48;
const GAP = 6;
const PAD = 5;
const STEP = CELL + GAP;

type PlacedPart = { id: string; type: PartType; r: number; c: number; w: number; h: number };

function cellsOf(p: { r: number; c: number; w: number; h: number }): [number, number][] {
    const cells: [number, number][] = [];
    for (let dr = 0; dr < p.h; dr++) {
        for (let dc = 0; dc < p.w; dc++) cells.push([p.r + dr, p.c + dc]);
    }
    return cells;
}

function fits(parts: PlacedPart[], candidate: { id?: string; r: number; c: number; w: number; h: number }) {
    if (candidate.r < 0 || candidate.c < 0) return false;
    if (candidate.r + candidate.h > GRID_ROWS || candidate.c + candidate.w > GRID_COLS) return false;
    const occupied = new Set<string>();
    for (const p of parts) {
        if (p.id === candidate.id) continue;
        for (const [r, c] of cellsOf(p)) occupied.add(`${r}-${c}`);
    }
    for (const [r, c] of cellsOf(candidate)) {
        if (occupied.has(`${r}-${c}`)) return false;
    }
    return true;
}

function LayoutEditor() {
    const [parts, setParts] = useState<PlacedPart[]>([]);
    const idCounter = useRef(0);

    const bounds = useMemo(() => {
        if (parts.length < 2) return null;
        let minR = GRID_ROWS;
        let maxR = -1;
        let minC = GRID_COLS;
        let maxC = -1;
        for (const p of parts) {
            minR = Math.min(minR, p.r);
            maxR = Math.max(maxR, p.r + p.h - 1);
            minC = Math.min(minC, p.c);
            maxC = Math.max(maxC, p.c + p.w - 1);
        }
        return { minR, maxR, minC, maxC };
    }, [parts]);

    function handleDrop(e: React.DragEvent, r: number, c: number) {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;
        if (data.startsWith("new:")) {
            const type = data.slice(4) as PartType;
            const def = PART_DEFS.find((d) => d.type === type)!;
            const candidate = { r, c, w: def.w, h: def.h };
            if (!fits(parts, candidate)) return;
            idCounter.current += 1;
            setParts((prev) => [...prev, { id: `p${idCounter.current}`, type, ...candidate }]);
        } else if (data.startsWith("move:")) {
            const id = data.slice(5);
            const part = parts.find((p) => p.id === id);
            if (!part) return;
            const candidate = { id, r, c, w: part.w, h: part.h };
            if (!fits(parts, candidate)) return;
            setParts((prev) => prev.map((p) => (p.id === id ? { ...p, r, c } : p)));
        }
    }

    function removePart(id: string) {
        setParts((prev) => prev.filter((p) => p.id !== id));
    }

    function startResize(e: React.PointerEvent, part: PlacedPart) {
        e.stopPropagation();
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;

        function onMove(ev: PointerEvent) {
            const dCols = Math.round((ev.clientX - startX) / STEP);
            const dRows = Math.round((ev.clientY - startY) / STEP);
            const w = Math.min(Math.max(part.w + dCols, 1), GRID_COLS - part.c);
            const h = Math.min(Math.max(part.h + dRows, 1), GRID_ROWS - part.r);
            setParts((prev) => {
                const candidate = { id: part.id, r: part.r, c: part.c, w, h };
                if (!fits(prev, candidate)) return prev;
                return prev.map((p) => (p.id === part.id ? { ...p, w, h } : p));
            });
        }
        function onUp() {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        }
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    }

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {PART_DEFS.map((def) => {
                        const Icon = def.icon;
                        return (
                            <div
                                key={def.type}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", `new:${def.type}`);
                                    e.dataTransfer.effectAllowed = "copy";
                                }}
                                className={`flex h-10 w-10 cursor-grab items-center justify-center rounded-lg shadow-sm active:cursor-grabbing ${def.className}`}
                            >
                                <Icon size={18} />
                            </div>
                        );
                    })}
                </div>
                <button
                    onClick={() => setParts([])}
                    aria-label="reset"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="flex flex-1 items-center justify-center">
                <div
                    className="relative"
                    style={{ width: GRID_COLS * STEP - GAP, height: GRID_ROWS * STEP - GAP }}
                >
                    {bounds && (
                        <div
                            className="pointer-events-none absolute rounded-2xl border-2 border-dashed border-blue-400 bg-blue-400/10"
                            style={{
                                left: bounds.minC * STEP - PAD,
                                top: bounds.minR * STEP - PAD,
                                width: (bounds.maxC - bounds.minC + 1) * CELL + (bounds.maxC - bounds.minC) * GAP + PAD * 2,
                                height: (bounds.maxR - bounds.minR + 1) * CELL + (bounds.maxR - bounds.minR) * GAP + PAD * 2,
                            }}
                        />
                    )}

                    <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL}px)`, gap: GAP }}>
                        {Array.from({ length: GRID_ROWS }).map((_, r) =>
                            Array.from({ length: GRID_COLS }).map((_, c) => (
                                <div
                                    key={`${r}-${c}`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, r, c)}
                                    className="rounded-md border border-dashed border-zinc-300 dark:border-zinc-700"
                                    style={{ width: CELL, height: CELL }}
                                />
                            )),
                        )}
                    </div>

                    {parts.map((part) => {
                        const def = PART_DEFS.find((d) => d.type === part.type)!;
                        const Icon = def.icon;
                        return (
                            <div
                                key={part.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", `move:${part.id}`);
                                    e.dataTransfer.effectAllowed = "move";
                                }}
                                className={`group absolute flex cursor-grab items-center justify-center rounded-lg active:cursor-grabbing ${def.className}`}
                                style={{
                                    left: part.c * STEP,
                                    top: part.r * STEP,
                                    width: part.w * CELL + (part.w - 1) * GAP,
                                    height: part.h * CELL + (part.h - 1) * GAP,
                                }}
                            >
                                <Icon size={18} />
                                <button
                                    onClick={() => removePart(part.id)}
                                    className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                                >
                                    <X size={10} />
                                </button>
                                <div
                                    onPointerDown={(e) => startResize(e, part)}
                                    draggable={false}
                                    className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-black/30 group-hover:bg-black/60"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// 右: ブロックプログラミングエディタ（ロジック）
// ============================================================

type LogicKind = "event-click" | "event-slide" | "cond-if" | "cond-repeat" | "act-speed-up" | "act-reset" | "act-score";

type LogicDef = { kind: LogicKind; label: string; icon: React.ElementType; className: string };

const LOGIC_DEFS: LogicDef[] = [
    { kind: "event-click", label: "クリックされたとき", icon: MousePointerClick, className: "bg-amber-200 text-amber-900 dark:bg-amber-800/60 dark:text-amber-100" },
    { kind: "event-slide", label: "スライダーが動いたとき", icon: SlidersHorizontal, className: "bg-amber-200 text-amber-900 dark:bg-amber-800/60 dark:text-amber-100" },
    { kind: "cond-if", label: "もし 条件を満たすなら", icon: ArrowRight, className: "bg-purple-200 text-purple-900 dark:bg-purple-800/60 dark:text-purple-100" },
    { kind: "cond-repeat", label: "くり返す", icon: Repeat, className: "bg-purple-200 text-purple-900 dark:bg-purple-800/60 dark:text-purple-100" },
    { kind: "act-speed-up", label: "速度を上げる", icon: Zap, className: "bg-blue-200 text-blue-900 dark:bg-blue-800/60 dark:text-blue-100" },
    { kind: "act-reset", label: "位置をリセットする", icon: RotateCw, className: "bg-blue-200 text-blue-900 dark:bg-blue-800/60 dark:text-blue-100" },
    { kind: "act-score", label: "スコアを +1 する", icon: Plus, className: "bg-blue-200 text-blue-900 dark:bg-blue-800/60 dark:text-blue-100" },
];

type WorkspaceBlock = { id: string; kind: LogicKind };

function LogicEditor() {
    const [workspace, setWorkspace] = useState<WorkspaceBlock[]>([]);
    const idCounter = useRef(0);

    function addLogicBlock(kind: LogicKind) {
        idCounter.current += 1;
        setWorkspace((prev) => [...prev, { id: `b${idCounter.current}`, kind }]);
    }

    function removeLogicBlock(id: string) {
        setWorkspace((prev) => prev.filter((b) => b.id !== id));
    }

    function moveLogicBlock(index: number, dir: -1 | 1) {
        setWorkspace((prev) => {
            const target = index + dir;
            if (target < 0 || target >= prev.length) return prev;
            const next = prev.slice();
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                    {LOGIC_DEFS.map((def) => {
                        const Icon = def.icon;
                        return (
                            <div
                                key={def.kind}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", `logic-new:${def.kind}`);
                                    e.dataTransfer.effectAllowed = "copy";
                                }}
                                onClick={() => addLogicBlock(def.kind)}
                                className={`flex cursor-grab items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-sm active:cursor-grabbing ${def.className}`}
                            >
                                <Icon size={14} />
                                {def.label}
                            </div>
                        );
                    })}
                </div>
                <button
                    onClick={() => setWorkspace([])}
                    aria-label="reset"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData("text/plain");
                    if (data.startsWith("logic-new:")) {
                        addLogicBlock(data.slice("logic-new:".length) as LogicKind);
                    }
                }}
                className="flex flex-1 flex-col gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
                {workspace.map((block, index) => {
                    const def = LOGIC_DEFS.find((d) => d.kind === block.kind)!;
                    const Icon = def.icon;
                    return (
                        <div
                            key={block.id}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm ${def.className}`}
                        >
                            <Icon size={16} />
                            <span className="flex-1">{def.label}</span>
                            <button
                                onClick={() => moveLogicBlock(index, -1)}
                                disabled={index === 0}
                                className="rounded p-0.5 hover:bg-black/10 disabled:opacity-30"
                            >
                                <ChevronUp size={14} />
                            </button>
                            <button
                                onClick={() => moveLogicBlock(index, 1)}
                                disabled={index === workspace.length - 1}
                                className="rounded p-0.5 hover:bg-black/10 disabled:opacity-30"
                            >
                                <ChevronDown size={14} />
                            </button>
                            <button onClick={() => removeLogicBlock(block.id)} className="rounded p-0.5 hover:bg-black/10">
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================
// ページ本体
// ============================================================

export default function ComponentBuilderPage() {
    return (
        <div className="relative flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-black">
            <Link
                href="/"
                aria-label="back"
                className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zinc-500 shadow hover:text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400"
            >
                <ArrowLeft size={16} />
            </Link>

            <div className="flex flex-1 flex-col p-4 pt-14">
                <LayoutEditor />
            </div>
            <div className="w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-1 flex-col p-4 pt-14">
                <LogicEditor />
            </div>
        </div>
    );
}
