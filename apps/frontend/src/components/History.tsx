import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Presentation {
  id?: number;
  title: string;
  templateId: number;
  slides: string;
  createdAt?: string;
  updatedAt?: string;
}

const History: React.FC = () => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPresentations = async () => {
      try {
        const response = await axios.get('http://localhost:57038/api/api/presentation');
        setPresentations(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching presentation history:', error);
        setLoading(false);
      }
    };
    fetchPresentations();
    
    // Refresh history periodically
    const interval = setInterval(fetchPresentations, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDeletePresentation = async (id: number) => {
    try {
      await axios.delete(`http://localhost:57038/api/api/presentation/${id}`);
      setPresentations(presentations.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting presentation:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Presentation History</h2>
      {presentations.length > 0 ? (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {presentations.map(presentation => (
            <li key={presentation.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
              <strong>{presentation.title}</strong>
              <div>Template ID: {presentation.templateId}</div>
              <div>Created: {presentation.createdAt}</div>
              <div>Slides: {presentation.slides}</div>
              <button onClick={() => presentation.id && handleDeletePresentation(presentation.id)}>Delete</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No presentations found in history.</p>
      )}
    </div>
  );
};

export default History;