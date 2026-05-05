import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firebaseService } from './firebaseService';
import {
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query
} from 'firebase/firestore';
import { auth } from '../lib/firebase';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection'),
  doc: vi.fn((_db, coll, id) => id ? `doc-${coll}-${id}` : { id: 'mock-id' }),
  query: vi.fn(() => 'mock-query'),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  arrayUnion: vi.fn((val) => `arrayUnion(${val})`),
  arrayRemove: vi.fn((val) => `arrayRemove(${val})`),
}));

// Mock Firebase Auth and db
vi.mock('../lib/firebase', () => ({
  db: { app: { options: { projectId: 'test-project' } } },
  auth: { currentUser: { uid: 'test-user', email: 'test@example.com', displayName: 'Test User', emailVerified: true } }
}));

describe('firebaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.currentUser as any) = { uid: 'test-user', email: 'test@example.com', displayName: 'Test User', emailVerified: true };
  });

  describe('Guard Clauses (No User)', () => {
    it('should return early if no user', async () => {
      (auth.currentUser as any) = null;
      expect(await firebaseService.saveUserProfile({})).toBeUndefined();
      expect(await firebaseService.logInteraction({ id: 1 } as any, 'like')).toBeUndefined();
      expect(await firebaseService.removeInteraction('1')).toBeUndefined();
      expect(await firebaseService.toggleGithubFollow('u', 'a')).toBe(false);
      expect(await firebaseService.isFollowingGithub('u')).toBe(false);
      expect(await firebaseService.createList('t', 'd', true, [], [])).toBeUndefined();
      expect(await firebaseService.getMyLists()).toEqual([]);
      expect(await firebaseService.followList('l')).toBeUndefined();
      expect(await firebaseService.getFollowedLists()).toEqual([]);
    });
  });

  describe('UserProfile Operations', () => {
    it('should save user profile', async () => {
      await firebaseService.saveUserProfile({ interests: ['React'] });
      expect(setDoc).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ interests: ['React'] }), { merge: true });
    });

    it('should handle save user profile error', async () => {
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.saveUserProfile({})).rejects.toThrow();
    });

    it('should get user profile', async () => {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ userId: 'test-user' }) } as any);
      expect(await firebaseService.getUserProfile('test-user')).toBeDefined();
    });

    it('should handle get user profile error', async () => {
      vi.mocked(getDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.getUserProfile('u')).rejects.toThrow();
    });

    it('should return null if profile does not exist', async () => {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);
      expect(await firebaseService.getUserProfile('test-user')).toBeNull();
    });
  });

  describe('getAllInteractedRepoIds', () => {
    it('should return from profile', async () => {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ interactedRepoIds: ['1'] }) } as any);
      const ids = await firebaseService.getAllInteractedRepoIds('test-user');
      expect(ids.has('1')).toBe(true);
    });

    it('should fall back and migrate', async () => {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({}) } as any);
      vi.mocked(getDocs).mockResolvedValue({ docs: [{ data: () => ({ repoId: '2' }) }] } as any);
      const ids = await firebaseService.getAllInteractedRepoIds('test-user');
      expect(ids.has('2')).toBe(true);
      expect(setDoc).toHaveBeenCalled();
    });

    it('should handle lazy migration failure', async () => {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({}) } as any);
      vi.mocked(getDocs).mockResolvedValue({ docs: [{ data: () => ({ repoId: '2' }) }] } as any);
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('migration failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await firebaseService.getAllInteractedRepoIds('test-user');

      // Wait for the async catch block
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Lazy migration failed'), expect.any(Error));
    });

    it('should handle empty legacy migration', async () => {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({}) } as any);
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      const ids = await firebaseService.getAllInteractedRepoIds('test-user');
      expect(ids.size).toBe(0);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should handle getAllInteractedRepoIds error', async () => {
      vi.mocked(getDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.getAllInteractedRepoIds('u')).rejects.toThrow();
    });
  });

  describe('Interactions', () => {
    it('should log interaction', async () => {
      await firebaseService.logInteraction({ id: 1 } as any, 'like');
      expect(setDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should handle log interaction error', async () => {
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.logInteraction({ id: 1 } as any, 'like')).rejects.toThrow();
    });

    it('should remove interaction', async () => {
      await firebaseService.removeInteraction('1');
      expect(deleteDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should handle remove interaction error', async () => {
      vi.mocked(deleteDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.removeInteraction('1')).rejects.toThrow();
    });

    it('should get passes and likes', async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [{ data: () => ({ id: '1' }) }] } as any);
      expect(await firebaseService.getUserPasses('u')).toHaveLength(1);
      expect(await firebaseService.getUserLikes('u')).toHaveLength(1);
    });

    it('should handle get user passes/likes error', async () => {
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.getUserPasses('u')).rejects.toThrow();
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.getUserLikes('u')).rejects.toThrow();
    });
  });

  describe('GitHub Follows', () => {
    it('should toggle and check follows', async () => {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);
      expect(await firebaseService.toggleGithubFollow('u', 'a')).toBe(true);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as any);
      expect(await firebaseService.toggleGithubFollow('u', 'a')).toBe(false);
      expect(await firebaseService.isFollowingGithub('u')).toBe(true);
    });

    it('should handle toggle github follow error', async () => {
      vi.mocked(getDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.toggleGithubFollow('u', 'a')).rejects.toThrow();
    });

    it('should handle isFollowingGithub error', async () => {
      vi.mocked(getDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.isFollowingGithub('u')).rejects.toThrow();
    });

    it('should listen to follows', () => {
      const cb = vi.fn();
      firebaseService.listenGithubFollows('u', cb);
      expect(onSnapshot).toHaveBeenCalled();
      const onSnapshotCall = vi.mocked(onSnapshot).mock.calls[0];
      (onSnapshotCall[1] as any)({ docs: [{ data: () => ({ username: 'u' }) }] });
      expect(cb).toHaveBeenCalledWith([{ username: 'u' }]);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => (onSnapshotCall[2] as any)(new Error('fail'))).toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Lists', () => {
    it('should create list with owner name from profile', async () => {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ githubUsername: 'dev' }) } as any);
      const list = await firebaseService.createList('t', 'd', true, [], []);
      expect(list?.ownerName).toContain('@dev');
    });

    it('should handle createList error', async () => {
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.createList('t', 'd', true, [], [])).rejects.toThrow();
    });

    it('should create list even if profile fetch fails', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('fail'));
      const list = await firebaseService.createList('t', 'd', true, [], []);
      expect(list).toBeDefined();
    });

    it('should update and delete lists', async () => {
      await firebaseService.updateList('l', {});
      await firebaseService.deleteList('l');
      expect(updateDoc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should handle update/delete list error', async () => {
      vi.mocked(updateDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.updateList('l', {})).rejects.toThrow();
      vi.mocked(deleteDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.deleteList('l')).rejects.toThrow();
    });

    it('should get public and my lists', async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [{ id: 'l', data: () => ({}) }] } as any);
      expect(await firebaseService.getMyLists()).toHaveLength(1);
      expect(await firebaseService.getPublicLists()).toHaveLength(1);
    });

    it('should handle get my/public lists error', async () => {
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.getMyLists()).rejects.toThrow();
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.getPublicLists()).rejects.toThrow();
    });

    it('should listen to my lists', () => {
      const cb = vi.fn();
      firebaseService.listenMyLists('u', cb);
      expect(onSnapshot).toHaveBeenCalled();
      const onSnapshotCall = vi.mocked(onSnapshot).mock.calls[0];
      (onSnapshotCall[1] as any)({ docs: [{ id: 'l', data: () => ({}) }] });
      expect(cb).toHaveBeenCalledWith([{ id: 'l' }]);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => (onSnapshotCall[2] as any)(new Error('fail'))).toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Follow Lists', () => {
    it('should follow and get followed lists', async () => {
      await firebaseService.followList('l');
      expect(setDoc).toHaveBeenCalled();

      vi.mocked(getDocs).mockResolvedValue({ docs: [{ data: () => ({ listId: 'l' }) }] } as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ id: 'l' }) } as any);
      expect(await firebaseService.getFollowedLists()).toHaveLength(1);
    });

    it('should handle followList error', async () => {
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.followList('l')).rejects.toThrow();
    });

    it('should handle getFollowedLists error', async () => {
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('fail'));
      await expect(firebaseService.getFollowedLists()).rejects.toThrow();
    });

    it('should return empty if no follows', async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      expect(await firebaseService.getFollowedLists()).toHaveLength(0);
    });

    it('should handle missing list in followed lists', async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [{ data: () => ({ listId: 'l' }) }] } as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);
      expect(await firebaseService.getFollowedLists()).toHaveLength(0);
    });
  });

  describe('listenUserInteractions', () => {
    it('should handle snapshots and errors', () => {
      const cb = vi.fn();
      firebaseService.listenUserInteractions('u', 'liked', cb);
      const onSnapshotCall = vi.mocked(onSnapshot).mock.calls[0];
      (onSnapshotCall[1] as any)({ docs: [{ data: () => ({ id: '1' }) }] });
      expect(cb).toHaveBeenCalledWith([{ id: '1' }]);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => (onSnapshotCall[2] as any)(new Error('fail'))).toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle passed type', () => {
      firebaseService.listenUserInteractions('u', 'passed', vi.fn());
      expect(query).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw on failure', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('fail'));
      await expect(firebaseService.getUserProfile('u')).rejects.toThrow();
    });

    it('should warn if offline', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(getDoc).mockRejectedValue(new Error('offline'));
      await expect(firebaseService.getUserProfile('u')).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
