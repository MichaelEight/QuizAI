/**
 * Online Storage Provider
 * Cloud-based storage implementation using backend API
 */

import { SavedQuiz, UpdateQuizData, IStorageProvider } from '../../types/quizLibrary';
import { apiClient } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * OnlineStorageProvider - Stores quizzes in the cloud via backend API
 */
export class OnlineStorageProvider implements IStorageProvider {
  async initialize(): Promise<void> {
    // No initialization needed for API-based storage
    return Promise.resolve();
  }

  async getAll(): Promise<SavedQuiz[]> {
    const { data, error } = await apiClient.get<{ quizzes: SavedQuiz[]; total: number }>(
      ENDPOINTS.QUIZZES
    );

    if (error) {
      console.error('Failed to fetch quizzes from cloud:', error);
      throw new Error(error.message);
    }

    return data?.quizzes || [];
  }

  async getById(id: string): Promise<SavedQuiz | null> {
    const { data, error } = await apiClient.get<{ quiz: SavedQuiz }>(
      ENDPOINTS.QUIZ_BY_ID(id)
    );

    if (error) {
      if (error.code === 'NOT_FOUND') {
        return null;
      }
      console.error('Failed to fetch quiz from cloud:', error);
      throw new Error(error.message);
    }

    return data?.quiz || null;
  }

  async save(quiz: SavedQuiz): Promise<void> {
    const { error } = await apiClient.post<{ quiz: SavedQuiz }>(
      ENDPOINTS.QUIZZES,
      {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        teacher: quiz.teacher,
        subjectName: quiz.subjectName,
        subjectCode: quiz.subjectCode,
        tasks: quiz.tasks,
        sourceText: quiz.sourceText,
        uploadedFileNames: quiz.uploadedFileNames,
      }
    );

    if (error) {
      console.error('Failed to save quiz to cloud:', error);
      throw new Error(error.message);
    }
  }

  async update(id: string, data: UpdateQuizData): Promise<void> {
    const { error } = await apiClient.put<{ quiz: SavedQuiz }>(
      ENDPOINTS.QUIZ_BY_ID(id),
      data
    );

    if (error) {
      console.error('Failed to update quiz in cloud:', error);
      throw new Error(error.message);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await apiClient.delete(ENDPOINTS.QUIZ_BY_ID(id));

    if (error) {
      console.error('Failed to delete quiz from cloud:', error);
      throw new Error(error.message);
    }
  }

  async importBulk(quizzes: SavedQuiz[]): Promise<void> {
    // Import quizzes one by one
    // TODO: Consider adding a bulk endpoint in the backend for better performance
    for (const quiz of quizzes) {
      try {
        await this.save(quiz);
      } catch (error) {
        console.error(`Failed to import quiz "${quiz.title}":`, error);
        // Continue with other quizzes even if one fails
      }
    }
  }

  async exportAll(): Promise<SavedQuiz[]> {
    // Simply return all quizzes (same as getAll for cloud storage)
    return this.getAll();
  }
}
