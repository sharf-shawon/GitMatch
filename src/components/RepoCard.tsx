import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
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

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitX(1000);
      onSwipe('like');
    } else if (info.offset.x < -100) {
      setExitX(-1000);
      onSwipe('pass');
    } else if (info.offset.y < -100) {
      setExitY(-1000);
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
      animate={{ x: 0, y: 0, scale: isTop ? 1 : 0.95, opacity: 1 }}
      exit={{ x: exitX, y: exitY, opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        "absolute inset-0 bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden cursor-grab active:cursor-grabbing border border-slate-100 dark:border-slate-800",
        !isTop && "pointer-events-none"
      )}
      id={`repo-card-${repo.id}`}
    >
      {/* Theme Gradient Bar */}
      <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

      <div className="h-full flex flex-col p-8">
        {/* Header Area */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
              {repo.name}
            </h2>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-bold">
              {repo.language || 'Any'} • Updated {formatDate(repo.updated_at)}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-slate-800 text-blue-600 p-2.5 rounded-xl">
             <Code2 size={24} />
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 line-clamp-4 flex-1">
          {repo.description || "No description provided. This repository is waiting to be explored."}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
              <Calendar size={10} /> Created
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{formatDate(repo.created_at)}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
              <Star size={10} /> Stars
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{repo.stargazers_count.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
              <GitFork size={10} /> Forks
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{repo.forks_count.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
               <History size={10} /> Latest
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{formatDate(repo.updated_at)}</p>
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
