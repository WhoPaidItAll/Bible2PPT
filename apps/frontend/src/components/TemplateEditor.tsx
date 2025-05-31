import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Template {
  id?: number;
  name: string;
  layout: string;
  createdAt?: string;
  updatedAt?: string;
}

const TemplateEditor: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateLayout, setNewTemplateLayout] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get('http://localhost:57038/api/api/template');
        setTemplates(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async () => {
    try {
      const response = await axios.post('http://localhost:57038/api/api/template', {
        name: newTemplateName,
        layout: newTemplateLayout,
      });
      setTemplates([...templates, response.data]);
      setNewTemplateName('');
      setNewTemplateLayout('');
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplateId(template.id || null);
    setNewTemplateName(template.name);
    setNewTemplateLayout(template.layout);
  };

  const handleUpdateTemplate = async () => {
    if (editingTemplateId !== null) {
      try {
        const response = await axios.put(`http://localhost:57038/api/api/template/${editingTemplateId}`, {
          name: newTemplateName,
          layout: newTemplateLayout,
        });
        setTemplates(templates.map(t => t.id === editingTemplateId ? response.data : t));
        setNewTemplateName('');
        setNewTemplateLayout('');
        setEditingTemplateId(null);
      } catch (error) {
        console.error('Error updating template:', error);
      }
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await axios.delete(`http://localhost:57038/api/api/template/${id}`);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Template Editor</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>{editingTemplateId ? 'Edit Template' : 'Create New Template'}</h3>
        <input
          type="text"
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
          placeholder="Template Name"
          style={{ marginRight: '10px', marginBottom: '10px' }}
        />
        <textarea
          value={newTemplateLayout}
          onChange={(e) => setNewTemplateLayout(e.target.value)}
          placeholder="Layout JSON or Description"
          rows={5}
          style={{ width: '300px', marginBottom: '10px', display: 'block' }}
        />
        {editingTemplateId ? (
          <button onClick={handleUpdateTemplate} style={{ marginRight: '10px' }}>Update Template</button>
        ) : (
          <button onClick={handleCreateTemplate} style={{ marginRight: '10px' }}>Create Template</button>
        )}
        <button onClick={() => {
          setNewTemplateName('');
          setNewTemplateLayout('');
          setEditingTemplateId(null);
        }}>Cancel</button>
      </div>
      <div>
        <h3>Existing Templates</h3>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {templates.map(template => (
            <li key={template.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
              <strong>{template.name}</strong>
              <div>Layout: {template.layout}</div>
              <button onClick={() => handleEditTemplate(template)} style={{ marginRight: '10px' }}>Edit</button>
              <button onClick={() => template.id && handleDeleteTemplate(template.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TemplateEditor;