/**
 * Project Storage Service
 * Manages project metadata and thumbnails (lightweight, editable captures)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DIRECTORIES, createProject, isValidProject } from '../constants/schemas';
import { copyToStorage, deleteFile, fileExists, getFileInfo } from './cacheManager';
import { generateThumbnail } from '../utils/thumbnailGenerator';

/**
 * Save a new project
 */
export const saveProject = async (projectData) => {
  try {
    // Generate thumbnail
    const thumbnailFilename = `${Date.now()}_thumb.png`;
    const thumbnailPath = await copyToStorage(
      projectData.thumbnail,
      DIRECTORIES.THUMBNAILS,
      thumbnailFilename
    );

    // Create project record
    const project = createProject({
      ...projectData,
      thumbnail: thumbnailPath,
    });

    // Get existing projects
    const projects = await getAllProjects();
    projects.unshift(project); // Add to beginning (newest first)

    // Save to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

    return project;
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

/**
 * Get all projects
 */
export const getAllProjects = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
    const projects = data ? JSON.parse(data) : [];

    // Filter out invalid projects
    return projects.filter(isValidProject);
  } catch (error) {
    console.error('Error getting projects:', error);
    return [];
  }
};

/**
 * Get a single project by ID
 */
export const getProject = async (id) => {
  try {
    const projects = await getAllProjects();
    return projects.find((p) => p.id === id) || null;
  } catch (error) {
    console.error('Error getting project:', error);
    return null;
  }
};

/**
 * Update an existing project
 */
export const updateProject = async (id, updates) => {
  try {
    const projects = await getAllProjects();
    const projectIndex = projects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      throw new Error('Project not found');
    }

    // If thumbnail is being updated, copy new thumbnail
    if (updates.thumbnail && updates.thumbnail !== projects[projectIndex].thumbnail) {
      const thumbnailFilename = `${id}_thumb_${Date.now()}.png`;
      const thumbnailPath = await copyToStorage(
        updates.thumbnail,
        DIRECTORIES.THUMBNAILS,
        thumbnailFilename
      );

      // Delete old thumbnail
      await deleteFile(projects[projectIndex].thumbnail);

      updates.thumbnail = thumbnailPath;
    }

    // Update project
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updates,
      lastModified: new Date().toISOString(),
    };

    // Save to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

    return projects[projectIndex];
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

/**
 * Delete a project
 * Note: This will also delete all associated exports (handled by caller)
 */
export const deleteProject = async (id) => {
  try {
    const projects = await getAllProjects();
    const project = projects.find((p) => p.id === id);

    if (!project) {
      throw new Error('Project not found');
    }

    // Delete thumbnail file
    await deleteFile(project.thumbnail);

    // Remove from array
    const updatedProjects = projects.filter((p) => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects));

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

/**
 * Duplicate a project (creates a new project with same settings)
 */
export const duplicateProject = async (id) => {
  try {
    const project = await getProject(id);

    if (!project) {
      throw new Error('Project not found');
    }

    // Create new thumbnail (copy existing)
    const thumbnailExists = await fileExists(project.thumbnail);
    let newThumbnailPath;

    if (thumbnailExists) {
      const thumbnailFilename = `${Date.now()}_thumb_copy.png`;
      newThumbnailPath = await copyToStorage(
        project.thumbnail,
        DIRECTORIES.THUMBNAILS,
        thumbnailFilename
      );
    } else {
      throw new Error('Original thumbnail not found');
    }

    // Create new project with same data
    const newProject = createProject({
      region: project.region,
      location: { ...project.location, name: `${project.location.name} (Copy)` },
      settings: project.settings,
      previewTheme: project.previewTheme,
      thumbnail: newThumbnailPath,
      notes: project.notes,
    });

    // Save new project
    const projects = await getAllProjects();
    projects.unshift(newProject);
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

    return newProject;
  } catch (error) {
    console.error('Error duplicating project:', error);
    throw error;
  }
};

/**
 * Get projects filtered by criteria
 */
export const getFilteredProjects = async (filter) => {
  try {
    const projects = await getAllProjects();

    switch (filter) {
      case 'hasExports':
        // This would need to check exportStorage, return all for now
        return projects;

      case 'noExports':
        // This would need to check exportStorage, return all for now
        return projects;

      case 'recent':
        // Last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return projects.filter((p) => new Date(p.timestamp) > weekAgo);

      default:
        return projects;
    }
  } catch (error) {
    console.error('Error filtering projects:', error);
    return [];
  }
};

/**
 * Search projects by location name
 */
export const searchProjects = async (query) => {
  try {
    const projects = await getAllProjects();
    const lowerQuery = query.toLowerCase();

    return projects.filter((p) =>
      p.location.name.toLowerCase().includes(lowerQuery) ||
      (p.location.address && p.location.address.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error('Error searching projects:', error);
    return [];
  }
};

/**
 * Get project statistics
 */
export const getProjectStats = async () => {
  try {
    const projects = await getAllProjects();

    // Count by theme
    const themeCount = {};
    projects.forEach((p) => {
      if (p.previewTheme) {
        themeCount[p.previewTheme] = (themeCount[p.previewTheme] || 0) + 1;
      }
    });

    // Count by aspect ratio
    const aspectRatioCount = {};
    projects.forEach((p) => {
      const ar = p.settings.aspectRatio.value;
      aspectRatioCount[ar] = (aspectRatioCount[ar] || 0) + 1;
    });

    return {
      total: projects.length,
      byTheme: themeCount,
      byAspectRatio: aspectRatioCount,
      oldest: projects[projects.length - 1]?.timestamp || null,
      newest: projects[0]?.timestamp || null,
    };
  } catch (error) {
    console.error('Error getting project stats:', error);
    return { total: 0, byTheme: {}, byAspectRatio: {} };
  }
};
