import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'motion/react';
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

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const rotateTransform = useTransform(x, [-250, 250], [-35, 35]);
  
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 140) {
      setExitX(1200);
      onSwipe('like');
    } else if (info.offset.x < -140) {
      setExitX(-1200);
      onSwipe('pass');
    } else if (info.offset.y < -140) {
      setExitY(-1200);
      onSwipe('superlike');
    } else if (info.offset.y > 140) {
      setExitY(1200);
      onSwipe('open');
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
            <h2 className="text-xl text-slate-900 dark:text-white truncate tracking-tight leading-tight">
              <span className="font-medium text-slate-400 dark:text-slate-500">{repo.owner.login}/</span>
              <span className="font-extrabold">{repo.name}</span>
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <Star size={10} className="text-amber-500 fill-amber-500" /> {repo.stargazers_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <GitFork size={10} className="text-blue-500" /> {repo.forks_count.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
             <Code2 size={24} />
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 overflow-hidden">
          <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
            {repo.language || 'Any'}
          </span>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-6 text-sm font-medium">
            {repo.description || "No description provided. This repository is waiting to be explored."}
          </p>
        </div>

        {/* Footer Area with Stats and Action */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5 flex items-center gap-1">
                <Calendar size={10} /> Created
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{formatDate(repo.created_at)}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5 flex items-center gap-1">
                 <History size={10} /> Updated
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{formatDate(repo.updated_at)}</p>
            </div>
          </div>

          <a 
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 text-slate-900 dark:text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            onClick={(e) => e.stopPropagation()}
          >
            Go to Source
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
