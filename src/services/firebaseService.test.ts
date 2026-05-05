import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firebaseService } from './firebaseService';
import { getDoc, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { Repository } from '../types';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection'),
  doc: vi.fn((_db, coll, id) => id ? `doc-${coll}-${id}` : 'mock-doc'),
  query: vi.fn(),
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
  auth: { currentUser: { uid: 'test-user', email: 'test@example.com' } }
}));

describe('firebaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllInteractedRepoIds', () => {
    it('should return ids from user profile if they exist', async () => {
      const mockProfile = {
        userId: 'test-user',
        interactedRepoIds: ['123', '456']
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockProfile
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const ids = await firebaseService.getAllInteractedRepoIds('test-user');

      expect(ids).toBeInstanceOf(Set);
      expect(ids.has('123')).toBe(true);
      expect(ids.has('456')).toBe(true);
      expect(getDocs).not.toHaveBeenCalled(); // Legacy query skipped
    });

    it('should fall back to legacy query and migrate if profile array missing', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ userId: 'test-user' }) // No interactedRepoIds
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          { data: () => ({ repoId: '789' }) }
        ]
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const ids = await firebaseService.getAllInteractedRepoIds('test-user');

      expect(ids.has('789')).toBe(true);
      expect(getDocs).toHaveBeenCalled(); // Legacy query used
      // Migration calls saveUserProfile
      expect(setDoc).toHaveBeenCalledWith(
        expect.stringContaining('users-test-user'),
        expect.objectContaining({
          interactedRepoIds: ['789']
        }),
        { merge: true }
      );
    });
  });

  describe('logInteraction', () => {
    it('should call updateDoc with arrayUnion', async () => {
      const mockRepo = { id: 101, name: 'test-repo' } as unknown as Repository;

      await firebaseService.logInteraction(mockRepo, 'like');

      expect(setDoc).toHaveBeenCalledWith(
        expect.stringContaining('interactions'),
        expect.objectContaining({
          repoId: '101',
          type: 'like'
        })
      );
      expect(updateDoc).toHaveBeenCalledWith(
        expect.stringContaining('users-test-user'),
        {
          interactedRepoIds: 'arrayUnion(101)'
        }
      );
    });
  });

  describe('removeInteraction', () => {
    it('should call updateDoc with arrayRemove', async () => {
      await firebaseService.removeInteraction('202');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.stringContaining('users-test-user'),
        {
          interactedRepoIds: 'arrayRemove(202)'
        }
      );
    });
  });
});
