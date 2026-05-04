import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'motion/react';
import { Star, GitFork, ExternalLink, Calendar, Code2, History } from 'lucide-react';
import { Repository, InteractionType } from '../types';
import { cn } from '../lib/utils';

interface RepoCardProps {
  repo: Repository;
  onSwipe: (direction: InteractionType) => void | Promise<void>;
  isTop: boolean;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo, onSwipe, isTop }) => {
  const [exitX, setExitX] = useState(0);
  const [exitY, setExitY] = useState(0);

  const rotate = useMotionValue(0);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const rotateTransform = useTransform(x, [-250, 250], [-35, 35]);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 140) {
      setExitX(1200);
      onSwipe('like');
    } else if (info.offset.x < -140) {
      setExitX(-1200);
      onSwipe('pass');
    } else if (info.offset.y < -140) {
      setExitY(-1200);
      onSwipe('superlike');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  };

  return (
    <motion.div
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, rotate: rotateTransform, opacity: isTop ? opacity : 1 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: 1 }}
      exit={{ x: exitX, y: exitY, opacity: 0, scale: 0.5, rotate: exitX / 15 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={cn(
        "absolute inset-0 bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden cursor-grab active:cursor-grabbing border border-slate-100 dark:border-slate-800",
        !isTop && "pointer-events-none"
      )}
      id={`repo-card-${repo.id}`}
    >
      {/* Theme Gradient Bar */}
      <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

      <div className="h-full flex flex-col p-8">
        {/* Header Area */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
              {repo.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Star size={12} className="text-amber-500 fill-amber-500" /> {repo.stargazers_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <GitFork size={12} className="text-blue-500" /> {repo.forks_count.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-slate-800 text-blue-600 p-2.5 rounded-xl">
             <Code2 size={24} />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
            {repo.language || 'Any'}
          </span>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4 flex-1 text-sm">
            {repo.description || "No description provided. This repository is waiting to be explored."}
          </p>
        </div>

        {/* Stats Grid - Now with Dates */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
              <Calendar size={10} /> First Commit
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(repo.created_at)}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
               <History size={10} /> Latest Sync
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(repo.updated_at)}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <a 
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            Open Repository
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
