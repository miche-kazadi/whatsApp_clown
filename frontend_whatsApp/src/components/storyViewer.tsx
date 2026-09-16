import { useEffect, useState } from "react";
import { markStorySeen } from "../storyApi";

// 1. On définit la structure d'une story individuelle
interface Story {
  id: number;
  image: string;
}

// 2. On définit le type des props du composant
interface StoryViewerProps {
  stories: Story[] | null; // Peut être un tableau ou null au début
  onClose: () => void;     // Une fonction qui ne retourne rien
}

export default function StoryViewer({ stories, onClose }: StoryViewerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Si stories est null ou vide, on ne fait rien
    if (!stories || stories.length === 0) return;

    // On marque la story actuelle comme vue
    markStorySeen(stories[index].id);

    const timer = setTimeout(() => {
      nextStory();
    }, 5000);

    return () => clearTimeout(timer);
  }, [index, stories]);

  const nextStory = () => {
    // On vérifie que stories existe avant d'accéder à .length
    if (stories && index < stories.length - 1) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  };

  if (!stories || stories.length === 0) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark d-flex justify-content-center align-items-center"
      style={{ zIndex: 9999 }}
    >
      <img
        src={stories[index].image}
        alt={`Story ${index}`}
        className="img-fluid"
        style={{ maxHeight: "100%", cursor: "pointer" }}
        onClick={nextStory}
      />

      <button
        className="btn btn-light position-absolute top-0 end-0 m-3"
        onClick={onClose}
      >
        ✕
      </button>

      {/* Petit indicateur de progression (optionnel mais sympa) */}
      <div className="position-absolute top-0 start-0 w-100 p-2 d-flex gap-1">
        {stories.map((_, i) => (
          <div
            key={i}
            className="flex-grow-1"
            style={{
              height: '3px',
              backgroundColor: i <= index ? 'white' : 'rgba(255,255,255,0.3)'
            }}
          />
        ))}
      </div>
    </div>
  );
}