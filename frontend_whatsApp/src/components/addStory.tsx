import { useState } from "react";
// On utilise 'import type' car ChangeEvent n'existe pas au moment de l'exécution (runtime)
import type { ChangeEvent } from "react";
import { uploadStory } from '../storyApi';

export default function AddStory() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      await uploadStory(formData);
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[1]);
    }
  };

  return (
    <div className="text-center">
        <input
          type="file"
          className="form-control mb-2"
          onChange={handleFileChange}
        />
   
      <button className="btn btn-primary w-100" onClick={handleUpload}>
        Publier Story
      </button>
    </div>
  );
}