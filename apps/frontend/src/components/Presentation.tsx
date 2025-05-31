import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PptxGenJS from 'pptxgenjs';

interface Presentation {
  id?: number;
  title: string;
  templateId: number;
  slides: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Template {
  id?: number;
  name: string;
  layout: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Verse {
  id: number;
  text: string;
}

interface PresentationProps {
  bookId: number | null;
  chapterId: string | null;
}

const Presentation: React.FC<PresentationProps> = ({ bookId, chapterId }) => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [presentationRes, templateRes] = await Promise.all([
          axios.get('http://localhost:57038/api/api/presentation'),
          axios.get('http://localhost:57038/api/api/template'),
        ]);
        setPresentations(presentationRes.data);
        setTemplates(templateRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
    
    // Refresh templates periodically or on focus
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bookId && chapterId) {
      const fetchVerses = async () => {
        try {
          const response = await axios.get(`http://localhost:57038/api/api/bible/chapter/${chapterId}/verses`);
          setVerses(response.data);
        } catch (error) {
          console.error('Error fetching verses:', error);
        }
      };
      fetchVerses();
    }
  }, [bookId, chapterId]);

  const handleCreatePresentation = async () => {
    try {
      const response = await axios.post('http://localhost:57038/api/api/presentation/generate', {
        title,
        templateId: selectedTemplateId,
        verseIds: selectedVerses,
      });
      setPresentations([...presentations, response.data]);
      setTitle('');
      setSelectedVerses([]);
    } catch (error) {
      console.error('Error creating presentation:', error);
    }
  };

  const handleDownloadPresentation = () => {
    const pptx = new PptxGenJS();
    pptx.title = title || 'Bible Presentation';
    
    // Add a title slide
    let slide = pptx.addSlide();
    slide.addText(title || 'Bible Presentation', { x: 1.5, y: 2.5, fontSize: 32, color: '363636' });
    
    // Add slides for each selected verse
    const selectedVerseTexts = verses.filter(v => selectedVerses.includes(v.id)).map(v => v.text);
    selectedVerseTexts.forEach((verseText, index) => {
      slide = pptx.addSlide();
      slide.addText(`Verse ${index + 1}`, { x: 1.5, y: 1.0, fontSize: 24, color: '363636' });
      slide.addText(verseText, { x: 1.5, y: 2.0, fontSize: 18, color: '363636', breakLine: true });
    });
    
    pptx.writeFile({ fileName: `${title || 'presentation'}.pptx` });
  };

  const toggleVerseSelection = (verseId: number) => {
    setSelectedVerses(prev => 
      prev.includes(verseId) 
        ? prev.filter(id => id !== verseId) 
        : [...prev, verseId]
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Presentations</h2>
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Presentation Title"
          style={{ marginRight: '10px' }}
        />
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
          style={{ marginRight: '10px' }}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <button onClick={handleCreatePresentation} style={{ marginRight: '10px' }}>Create Presentation</button>
        <button onClick={handleDownloadPresentation} disabled={selectedVerses.length === 0}>Download PPTX</button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h3>Select Verses for Presentation</h3>
        {bookId && chapterId ? (
          <div>
            <p>Selected Book ID: {bookId}, Chapter ID: {chapterId}</p>
            {verses.length > 0 ? (
              <ul style={{ listStyleType: 'none', padding: 0, marginTop: '10px' }}>
                {verses.map((verse) => (
                  <li
                    key={verse.id}
                    onClick={() => toggleVerseSelection(verse.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '5px',
                      backgroundColor: selectedVerses.includes(verse.id) ? '#e0e0e0' : 'transparent',
                      borderRadius: '4px',
                    }}
                  >
                    {verse.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No verses available for this chapter.</p>
            )}
          </div>
        ) : (
          <p>Please select a book and chapter from the Bible Content tab to load verses.</p>
        )}
      </div>
      <ul style={{ listStyleType: 'none', padding: 0, marginTop: '20px' }}>
        {presentations.map((presentation) => (
          <li key={presentation.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
            <strong>{presentation.title}</strong>
            <div>Template ID: {presentation.templateId}</div>
            <div>Created: {presentation.createdAt}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Presentation;