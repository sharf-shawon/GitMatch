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

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('language%3Atypescript'));
      expect(repos).toHaveLength(1);
      expect(repos[0].name).toBe('repo1');
    });

    it('should handle custom query', async () => {
      const mockRepos = { items: [] };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockRepos
      });

      await githubService.getTrendingRepos(undefined, 'custom query');
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('custom%20query'));
    });

    it('should throw error on failed fetch', async () => {
      fetchMock.mockResolvedValue({
        ok: false
      });

      await expect(githubService.getTrendingRepos()).rejects.toThrow('Failed to fetch repos');
    });
  });

  describe('searchReposByTopic', () => {
    it('should fetch repos by topic', async () => {
      const mockRepos = { items: [{ id: 10, name: 'topic-repo' }] };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockRepos
      });

      const repos = await githubService.searchReposByTopic('react');
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('topic%3Areact'));
      expect(repos).toHaveLength(1);
    });

    it('should return empty array on failed fetch', async () => {
      fetchMock.mockResolvedValue({ ok: false });
      const repos = await githubService.searchReposByTopic('react');
      expect(repos).toEqual([]);
    });
  });

  describe('getRepoDetails', () => {
    it('should fetch repo details', async () => {
      const mockRepo = { id: 11, name: 'repo-details', language: 'Go' };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockRepo
      });

      const repo = await githubService.getRepoDetails('owner/repo');
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/repos/owner/repo'));
      expect(repo.languages).toContain('Go');
    });

    it('should throw error on failed fetch', async () => {
      fetchMock.mockResolvedValue({ ok: false });
      await expect(githubService.getRepoDetails('owner/repo')).rejects.toThrow('Failed to fetch repo details');
    });
  });

  describe('getLanguages', () => {
    it('should fetch languages', async () => {
      const mockLangs = { TypeScript: 1000, JavaScript: 500 };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockLangs
      });

      const langs = await githubService.getLanguages('owner/repo');
      expect(langs).toEqual(['TypeScript', 'JavaScript']);
    });

    it('should return empty array on failed fetch', async () => {
      fetchMock.mockResolvedValue({ ok: false });
      const langs = await githubService.getLanguages('owner/repo');
      expect(langs).toEqual([]);
    });
  });

  describe('getReadme', () => {
    it('should fetch readme text', async () => {
      const mockText = '# Hello World';
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => mockText
      });

      const text = await githubService.getReadme('owner', 'repo');
      expect(text).toBe(mockText);
    });

    it('should return empty string on failed fetch', async () => {
      fetchMock.mockResolvedValue({ ok: false });
      const text = await githubService.getReadme('owner', 'repo');
      expect(text).toBe('');
    });
  });

  describe('getRepoStats', () => {
    it('should fetch commit activity', async () => {
      const mockStats = [{ week: 1, total: 10 }];
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockStats
      });

      const stats = await githubService.getRepoStats('owner', 'repo');
      expect(stats).toEqual(mockStats);
    });

    it('should return empty array on 202 status', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 202
      });

      const stats = await githubService.getRepoStats('owner', 'repo');
      expect(stats).toEqual([]);
    });

    it('should return empty array on failed fetch', async () => {
      fetchMock.mockResolvedValue({ ok: false });
      const stats = await githubService.getRepoStats('owner', 'repo');
      expect(stats).toEqual([]);
    });
  });

  describe('getUser', () => {
    it('should fetch user profile', async () => {
      const mockUser = { login: 'testuser', id: 100 };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockUser
      });

      const user = await githubService.getUser('testuser');
      expect(user.login).toBe('testuser');
    });

    it('should throw error if user not found', async () => {
      fetchMock.mockResolvedValue({ ok: false });
      await expect(githubService.getUser('testuser')).rejects.toThrow('User not found');
    });
  });

  describe('getUserRepos', () => {
    it('should fetch user repositories', async () => {
      const mockRepos = [
        { id: 2, name: 'user-repo', stargazers_count: 10, language: 'Python' }
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockRepos
      });

      const repos = await githubService.getUserRepos('testuser');

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/repos'));
      expect(repos).toHaveLength(1);
      expect(repos[0].languages).toContain('Python');
    });

    it('should return empty array on failed fetch', async () => {
      fetchMock.mockResolvedValue({ ok: false });
      const repos = await githubService.getUserRepos('testuser');
      expect(repos).toEqual([]);
    });
  });
});
