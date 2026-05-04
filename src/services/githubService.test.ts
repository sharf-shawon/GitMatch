import { describe, it, expect, vi, beforeEach } from "vitest";
import { githubService } from './githubService';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('githubService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTrendingRepos', () => {
    it('should fetch repos with correct query params', async () => {
      const mockRepos = {
        items: [
          { id: 1, name: 'repo1', full_name: 'user/repo1', stargazers_count: 100, forks_count: 50, pushed_at: '2026-01-01', language: 'TypeScript' }
        ]
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockRepos
      });

      const repos = await githubService.getTrendingRepos('typescript');
      
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('language:typescript'));
      expect(repos).toHaveLength(1);
      expect(repos[0].name).toBe('repo1');
    });

    it('should throw error on failed fetch', async () => {
      fetchMock.mockResolvedValue({
        ok: false
      });

      await expect(githubService.getTrendingRepos()).rejects.toThrow('Failed to fetch repos');
    });
  });

  describe('getUserRepos', () => {
    it('should fetch user repositories', async () => {
      const mockRepos = [
        { id: 2, name: 'user-repo', stargazers_count: 10 }
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockRepos
      });

      const repos = await githubService.getUserRepos('testuser');
      
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/repos'));
      expect(repos).toHaveLength(1);
    });
  });
});
