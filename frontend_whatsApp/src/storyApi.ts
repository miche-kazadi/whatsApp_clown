import api from "./api";

// Récupérer les stories
export const fetchStories = () => {
  return api.get("stories/");
};

// Ajouter une story
// Ajouter une story
export const uploadStory = (formData: FormData) => {
  return api.post("story/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Marquer story comme vue
export const markStorySeen = (storyId: string | number) => {
  return api.post(`story/${storyId}/view/`);
};

// Voir qui a vu
export const getStoryViews = (storyId: string | number) => {
  return api.get(`story/${storyId}/views/`);
};