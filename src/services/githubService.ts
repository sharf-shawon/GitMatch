import { Repository } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export const githubService = {
  async getTrendingRepos(language?: string, query?: string, page: number = 1): Promise<Repository[]> {
    // Randomize time ranges slightly to get different results
    const months = ['01', '02', '03', '04'];
    const randomMonth = months[Math.floor(Math.random() * months.length)];
    const dateQuery = `pushed:>2026-${randomMonth}-01`;

    const q = [
      query || 'stars:>50',
      language ? `language:${language}` : '',
      dateQuery
    ].filter(Boolean).join(' ');

    const response = await fetch(`${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=30&page=${page}`);
    if (!response.ok) throw new Error('Failed to fetch repos');
    
    const data = await response.json();
    return data.items.map((item: any) => ({
      ...item,
      languages: [item.language].filter(Boolean) // Basic extraction, search API only returns primary language
    }));
  },

  async getRepoDetails(fullName: string): Promise<Repository> {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${fullName}`);
    if (!response.ok) throw new Error('Failed to fetch repo details');
    const item = await response.json();
    return {
      ...item,
      languages: [item.language].filter(Boolean)
    };
  },

  async getLanguages(fullName: string): Promise<string[]> {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${fullName}/languages`);
    if (!response.ok) return [];
    const data = await response.json();
    return Object.keys(data);
  },

  async getReadme(owner: string, repo: string): Promise<string> {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`, {
      headers: { 'Accept': 'application/vnd.github.v3.raw' }
    });
    if (!response.ok) return '';
    return response.text();
  },

  async getRepoStats(owner: string, repo: string): Promise<any[]> {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/stats/commit_activity`);
    if (!response.ok) return [];
    if (response.status === 202) return [];
    return response.json();
  },

  async getUser(username: string): Promise<any> {
    const response = await fetch(`${GITHUB_API_BASE}/users/${username}`);
    if (!response.ok) throw new Error('User not found');
    return response.json();
  },

  async getUserRepos(username: string): Promise<Repository[]> {
    const response = await fetch(`${GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=10`);
    if (!response.ok) return [];
    const items = await response.json();
    return items.map((item: any) => ({
      ...item,
      languages: [item.language].filter(Boolean)
    }));
  }
};
