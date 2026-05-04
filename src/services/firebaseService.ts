import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile, Interaction, Repository, InteractionType, CuratedList } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  async saveUserProfile(profile: Partial<UserProfile>) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const path = `users/${uid}`;
    try {
      await setDoc(doc(db, 'users', uid), {
        ...profile,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? snap.data() as UserProfile : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
    return null;
  },

  async logInteraction(repo: Repository, type: InteractionType) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const interactionId = `${uid}_${repo.id}`;
    const path = `interactions/${interactionId}`;
    try {
      await setDoc(doc(db, 'interactions', interactionId), {
        userId: uid,
        repoId: repo.id.toString(),
        repoData: repo,
        type,
        timestamp: Date.now(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async removeInteraction(repoId: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const interactionId = `${uid}_${repoId}`;
    const path = `interactions/${interactionId}`;
    try {
      await deleteDoc(doc(db, 'interactions', interactionId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async getAllInteractedRepoIds(uid: string): Promise<Set<string>> {
    const path = 'interactions';
    try {
      const q = query(
        collection(db, 'interactions'),
        where('userId', '==', uid)
      );
      const snap = await getDocs(q);
      return new Set(snap.docs.map(d => (d.data() as Interaction).repoId));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
    return new Set();
  },

  async getUserPasses(uid: string): Promise<Interaction[]> {
    const path = 'interactions';
    try {
      const q = query(
        collection(db, 'interactions'),
        where('userId', '==', uid),
        where('type', '==', 'pass'),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Interaction);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
    return [];
  },

  async getUserLikes(uid: string): Promise<Interaction[]> {
    const path = 'interactions';
    try {
      const q = query(
        collection(db, 'interactions'),
        where('userId', '==', uid),
        where('type', 'in', ['like', 'superlike']),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Interaction);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
    return [];
  },

  async toggleGithubFollow(username: string, avatarUrl: string): Promise<boolean> {
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    const docId = `${uid}_${username}`;
    const docRef = doc(db, 'githubFollows', docId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      await deleteDoc(docRef);
      return false;
    } else {
      await setDoc(docRef, {
        userId: uid,
        username,
        avatarUrl,
        timestamp: serverTimestamp()
      });
      return true;
    }
  },

  listenGithubFollows(uid: string, callback: (follows: any[]) => void) {
    const q = query(collection(db, 'githubFollows'), where('userId', '==', uid));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => d.data()));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'githubFollows');
    });
  },

  listenMyLists(uid: string, callback: (lists: CuratedList[]) => void) {
    const q = query(collection(db, 'lists'), where('ownerId', '==', uid));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CuratedList)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'lists');
    });
  },

  async isFollowingGithub(username: string): Promise<boolean> {
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    const docId = `${uid}_${username}`;
    const docRef = doc(db, 'githubFollows', docId);
    const snap = await getDoc(docRef);
    return snap.exists();
  },

  async createList(title: string, description: string, isPublic: boolean, repoIds: string[], repos: Repository[]) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    // Try to get username from profile for brackets
    let ownerName = auth.currentUser?.displayName || 'Anonymous';
    try {
      const profile = await this.getUserProfile(uid);
      if (profile?.githubUsername) {
        ownerName = `${ownerName} (@${profile.githubUsername})`;
      }
    } catch (err) {
      console.warn("Failed to fetch profile for list creation", err);
    }

    const listRef = doc(collection(db, 'lists'));
    const path = `lists/${listRef.id}`;
    try {
      const newList: CuratedList = {
        id: listRef.id,
        ownerId: uid,
        ownerName,
        title,
        description,
        repoIds,
        repos,
        isPublic,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await setDoc(listRef, newList);
      return newList;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async updateList(listId: string, updates: Partial<CuratedList>) {
    const path = `lists/${listId}`;
    try {
      await updateDoc(doc(db, 'lists', listId), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteList(listId: string) {
    const path = `lists/${listId}`;
    try {
      await deleteDoc(doc(db, 'lists', listId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async getMyLists(): Promise<CuratedList[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const path = 'lists';
    try {
      const q = query(
        collection(db, 'lists'),
        where('ownerId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as CuratedList);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
    return [];
  },

  async getPublicLists(): Promise<CuratedList[]> {
    const path = 'lists';
    try {
      const q = query(
        collection(db, 'lists'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as CuratedList);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
    return [];
  },

  async followList(listId: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const followId = `${uid}_${listId}`;
    const path = `follows/${followId}`;
    try {
      await setDoc(doc(db, 'follows', followId), {
        followerId: uid,
        listId,
        timestamp: Date.now(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async getFollowedLists(): Promise<CuratedList[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    try {
      const followSnap = await getDocs(query(collection(db, 'follows'), where('followerId', '==', uid)));
      const listIds = followSnap.docs.map(d => d.data().listId);
      if (listIds.length === 0) return [];
      
      // Batch get might be limited, but for a few is fine
      const lists: CuratedList[] = [];
      for (const id of listIds) {
        const snap = await getDoc(doc(db, 'lists', id));
        if (snap.exists()) lists.push(snap.data() as CuratedList);
      }
      return lists;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'follows');
    }
    return [];
  },

  listenUserInteractions(uid: string, type: 'liked' | 'passed', callback: (data: Interaction[]) => void) {
    const types = type === 'liked' ? ['like', 'superlike'] : ['pass'];
    const q = query(
      collection(db, 'interactions'),
      where('userId', '==', uid),
      where('type', 'in', types),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => d.data() as Interaction));
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, 'interactions');
    });
  }
};
