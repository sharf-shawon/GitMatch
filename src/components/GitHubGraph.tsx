import React from 'react';
import { motion } from 'motion/react';

interface GitHubGraphProps {
  stats: any[]; // Array of weekly commit activity
}

export const GitHubGraph: React.FC<GitHubGraphProps> = ({ stats }) => {
  if (!stats || stats.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No recent activity data available</p>
      </div>
    );
  }

  // Get max commits for scaling
  const maxWeeklyCommits = Math.max(...stats.map(s => s.total), 1);
  
  // Last 52 weeks
  const displayStats = stats.slice(-52);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-[2px] h-24">
        {displayStats.map((week, idx) => {
          const height = (week.total / maxWeeklyCommits) * 100;
          let color = 'bg-slate-100 dark:bg-slate-800';
          if (week.total > 0) color = 'bg-orange-200 dark:bg-orange-950/30';
          if (week.total > maxWeeklyCommits * 0.3) color = 'bg-orange-300 dark:bg-orange-800/50';
          if (week.total > maxWeeklyCommits * 0.6) color = 'bg-orange-500';

          return (
            <motion.div
              key={idx}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 8)}%` }}
              className={cn("flex-1 rounded-t-[2px] transition-colors", color)}
              title={`${week.total} commits in week starting ${new Date(week.week * 1000).toLocaleDateString()}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <span>1 year ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

// Simple utility for class joining if not imported
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
