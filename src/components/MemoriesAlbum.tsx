import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen, Calendar, User } from 'lucide-react';
import type { BingoItem } from '../types';

interface MemoriesAlbumProps {
    items: BingoItem[];
    isOpen: boolean;
    onClose: () => void;
}

export const MemoriesAlbum: React.FC<MemoriesAlbumProps> = ({ items, isOpen, onClose }) => {
    const [expandedPhotoIndex, setExpandedPhotoIndex] = useState<{ memoryIdx: number; photoIdx: number } | null>(null);

    // Filter and sort completed items with photos
    const memories = useMemo(() => {
        return items
            .map((item, originalIndex) => ({ ...item, originalIndex }))
            .filter(item => item.isCompleted && item.proofPhotos && item.proofPhotos.length > 0)
            .sort((a, b) => {
                const dateA = a.completedAt?.toDate?.() || new Date(0);
                const dateB = b.completedAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime(); // Newest first
            });
    }, [items]);

    // Group by month
    const memoriesByMonth = useMemo(() => {
        const groups: { [key: string]: typeof memories } = {};
        memories.forEach(memory => {
            const date = memory.completedAt?.toDate?.() || new Date();
            const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(memory);
        });
        return groups;
    }, [memories]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-bg-dark overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-bg-dark/95 backdrop-blur-md border-b border-white/10">
                    <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-accent-gold" />
                            <h1 className="text-xl font-bold text-white">2026 Memories</h1>
                            <span className="text-sm text-slate-400">({memories.length} moments)</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-2xl mx-auto px-4 py-6">
                    {memories.length === 0 ? (
                        <div className="text-center py-20">
                            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-slate-400 mb-2">No memories yet</h2>
                            <p className="text-slate-500">Complete tasks and add photos to build your 2026 album!</p>
                        </div>
                    ) : (
                        Object.entries(memoriesByMonth).map(([month, monthMemories]) => (
                            <div key={month} className="mb-8">
                                {/* Month Header */}
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="w-4 h-4 text-accent-primary" />
                                    <h2 className="text-lg font-semibold text-accent-primary">{month}</h2>
                                    <div className="flex-1 h-px bg-gradient-to-r from-accent-primary/30 to-transparent"></div>
                                </div>

                                {/* Memory Cards */}
                                <div className="space-y-6">
                                    {monthMemories.map((memory, memIdx) => (
                                        <motion.div
                                            key={memory.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: memIdx * 0.1 }}
                                            className="bg-bg-card/80 rounded-2xl border border-white/10 overflow-hidden shadow-xl"
                                        >
                                            {/* Main Photo */}
                                            <div
                                                className="relative aspect-video bg-black cursor-pointer"
                                                onClick={() => setExpandedPhotoIndex({ memoryIdx: memories.indexOf(memory), photoIdx: 0 })}
                                            >
                                                <img
                                                    src={memory.proofPhotos![0]}
                                                    alt={memory.text}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                />
                                                {memory.proofPhotos!.length > 1 && (
                                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded-full text-white text-xs font-medium">
                                                        +{memory.proofPhotos!.length - 1} more
                                                    </div>
                                                )}
                                            </div>

                                            {/* Thumbnail Strip (if multiple photos) */}
                                            {memory.proofPhotos!.length > 1 && (
                                                <div className="flex gap-1 p-2 bg-black/30 overflow-x-auto">
                                                    {memory.proofPhotos!.map((photo, pIdx) => (
                                                        <button
                                                            key={pIdx}
                                                            onClick={() => setExpandedPhotoIndex({ memoryIdx: memories.indexOf(memory), photoIdx: pIdx })}
                                                            className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 border-transparent hover:border-accent-primary transition-all"
                                                        >
                                                            <img src={photo} alt="" className="w-full h-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="p-4">
                                                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                                    <span className="text-accent-gold">✓</span>
                                                    {memory.text}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <User size={14} />
                                                        {memory.completedBy}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {formatDate(memory.completedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Expanded Photo Viewer */}
                <AnimatePresence>
                    {expandedPhotoIndex !== null && memories[expandedPhotoIndex.memoryIdx] && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4"
                            onClick={() => setExpandedPhotoIndex(null)}
                        >
                            <button
                                onClick={() => setExpandedPhotoIndex(null)}
                                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
                            >
                                <X size={32} />
                            </button>

                            {(() => {
                                const memory = memories[expandedPhotoIndex.memoryIdx];
                                const photos = memory.proofPhotos || [];
                                const currentIdx = expandedPhotoIndex.photoIdx;

                                return (
                                    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                                        <img
                                            src={photos[currentIdx]}
                                            alt=""
                                            className="w-full max-h-[80vh] object-contain rounded-lg"
                                        />

                                        {/* Navigation */}
                                        {photos.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setExpandedPhotoIndex({
                                                        ...expandedPhotoIndex,
                                                        photoIdx: currentIdx > 0 ? currentIdx - 1 : photos.length - 1
                                                    })}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70"
                                                >
                                                    <ChevronLeft size={28} />
                                                </button>
                                                <button
                                                    onClick={() => setExpandedPhotoIndex({
                                                        ...expandedPhotoIndex,
                                                        photoIdx: currentIdx < photos.length - 1 ? currentIdx + 1 : 0
                                                    })}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70"
                                                >
                                                    <ChevronRight size={28} />
                                                </button>
                                            </>
                                        )}

                                        {/* Caption */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-white font-semibold">{memory.text}</p>
                                            <p className="text-slate-300 text-sm">
                                                {currentIdx + 1} / {photos.length} • {formatDate(memory.completedAt)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};
