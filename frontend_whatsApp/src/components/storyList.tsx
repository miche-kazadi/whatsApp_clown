import { useEffect, useState } from "react";
import { fetchStories } from "../storyApi";

// 1. Définir la structure de tes données
interface Story {
  id: number;
  image: string;
}

interface StoryUser {
  user_id: number;
  username: string;
  stories: Story[];
}

interface StoryListProps {
  onOpenStories: (stories: Story[]) => void;
}

export default function StoryList({ onOpenStories }: StoryListProps) {
  // 2. Dire au useState qu'il va recevoir un tableau de 'StoryUser'
  const [stories, setStories] = useState<StoryUser[]>([]);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const res = await fetchStories();
      setStories(res.data);
    } catch (error) {
      console.error("Erreur chargement stories:", error);
    }
  };

  return (
    <div className="d-flex gap-3 p-2 border-bottom overflow-auto">
      {stories.map((user) => (
        <div
          key={user.user_id} // Maintenant TypeScript sait que user_id existe !
          className="text-center"
          style={{ cursor: "pointer" }}
          onClick={() => onOpenStories(user.stories)}
        >
          <img
            src={user.stories[0].image}
            alt={user.username}
            width="60"
            height="60"
            className="rounded-circle border border-primary"
            style={{ objectFit: "cover" }}
          />
          <div className="d-block">
            <small>{user.username}</small>
          </div>
        </div>
      ))}
    </div>
  );
}