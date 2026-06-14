'use client';

import React, { useState, useRef } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverlay,
} from '@dnd-kit/core';
import type { Modifier } from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

import type { SlideData } from '@/types/slide';
import Block from '@/components/blocks/Block';

// --- スライドサムネイル --- 
interface SlideThumbnailProps {
    slide: SlideData;
    index: number;
    isActive: boolean;
    isOverlay?: boolean;
}

const SlideThumbnail = React.forwardRef<HTMLDivElement, SlideThumbnailProps & React.HTMLAttributes<HTMLDivElement>>(
    ({ slide, index, isActive, isOverlay, ...props }, ref) => {
        const deleteSlide = useEditorStore((state) => state.deleteSlide);
        const slidesLength = useEditorStore((state) => state.slides.length);

        return (
            <div
                ref={ref}
                className={`relative group/item flex flex-col items-center shrink-0 ${isOverlay ? 'scale-105 shadow-2xl z-50 cursor-grabbing' : ''}`}
                {...props}
            >
                <div
                    className={`relative overflow-hidden w-24 aspect-video rounded-lg border-2 flex flex-col items-center justify-center bg-white transition-colors ${isActive
                        ? 'border-blue-500 ring-2 ring-blue-200/50 shadow-blue-200/40'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${isOverlay ? 'border-blue-400' : 'cursor-grab active:cursor-grabbing'}`}
                >
                    <div
                        className="absolute top-0 left-0 origin-top-left pointer-events-none bg-white flex flex-col gap-2 p-8"
                        style={{
                            width: '1024px', // 実際のエディタ画面と同じ幅を想定
                            height: '576px', // 16:9の高さ (1024 * 9 / 16)
                            transform: 'scale(0.09375)', // 96(w-24) / 1024 = 0.09375 で縮小！
                        }}
                    >
                        {slide.blocks.map(block => (
                            <div key={block.id} className="relative p-4">
                                <Block block={block} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 削除ボタン */}
                {slidesLength > 1 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteSlide(slide.id);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="absolute -top-3 -right-3 bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover/item:opacity-100 transition-opacity shadow-md z-10 scale-75 group-hover/item:scale-100"
                    >
                        ×
                    </button>
                )}
            </div>
        );
    }
);
SlideThumbnail.displayName = 'SlideThumbnail';


// --- ドラッグ可能にするためのラッパー ---
function SortableSlide({ slide, index }: { slide: SlideData; index: number }) {
    const activeSlideId = useEditorStore((state) => state.activeSlideId);
    const setActiveSlideId = useEditorStore((state) => state.setActiveSlideId);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slide.id });

    // ドラッグ中の見た目を制御
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <SlideThumbnail
            ref={setNodeRef}
            style={style}
            slide={slide}
            index={index}
            isActive={activeSlideId === slide.id}
            onClick={() => setActiveSlideId(slide.id)}
            {...attributes}
            {...listeners}
        />
    );
}

// --- メインのスライドナビゲーターコンポーネント ---
export default function SlideNavigator() {
    const slides = useEditorStore((state) => state.slides);
    const activeSlideId = useEditorStore((state) => state.activeSlideId);
    const addSlide = useEditorStore((state) => state.addSlide);
    const moveSlide = useEditorStore((state) => state.moveSlide);

    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const restrictToScrollArea: Modifier = ({ transform, draggingNodeRect }) => {
        if (!draggingNodeRect || !scrollAreaRef.current) return transform;

        // 白い枠の現在の画面上での座標を取得
        const rect = scrollAreaRef.current.getBoundingClientRect();

        return {
            ...transform,
            // 分身が白い枠の左右の端を絶対に超えないように座標をロック
            x: Math.min(
                Math.max(transform.x, rect.left - draggingNodeRect.left),
                rect.right - draggingNodeRect.right
            ),
            y: transform.y,
        };
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragId(null);
        const { active, over } = event;
        if (over && active.id !== over.id) {
            moveSlide(active.id as string, over.id as string);
        }
    };

    // ドラッグ中のスライド情報を取得
    const activeDragSlide = slides.find(s => s.id === activeDragId);
    const activeDragIndex = slides.findIndex(s => s.id === activeDragId);

    return (
        <DndContext
            id="slide-navigator"
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis, restrictToScrollArea]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">

                {/* スライド一覧 */}
                <div
                    ref={scrollAreaRef}
                    className="bg-white/90 backdrop-blur-md px-4 pt-4 rounded-2xl shadow-xl border border-gray-200 max-w-[70vw] overflow-x-scroll overflow-y-hidden custom-scrollbar h-[100px]"
                >
                    <div className="flex gap-3 w-max">
                        <SortableContext
                            items={slides.map(s => s.id)}
                            strategy={horizontalListSortingStrategy}
                        >
                            {slides.map((slide, index) => (
                                <SortableSlide key={slide.id} slide={slide} index={index} />
                            ))}
                        </SortableContext>
                    </div>
                </div>

                {/* 追加ボタン */}
                <button
                    onClick={addSlide}
                    className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 hover:border-blue-400 hover:text-blue-500 text-gray-500 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xl shrink-0"
                >
                    <span className="text-2xl leading-none">＋</span>
                </button>

            </div>

            <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                {activeDragId && activeDragSlide ? (
                    <SlideThumbnail
                        slide={activeDragSlide}
                        index={activeDragIndex}
                        isActive={activeSlideId === activeDragId}
                        isOverlay={true}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}