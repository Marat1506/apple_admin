import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  imageUrl?: string;
}

export default function Categories() {
  const { addNotification } = useNotification();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    translations: {
      en: { name: '', description: '' },
      ru: { name: '', description: '' },
      ar: { name: '', description: '' },
    },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      // Handle wrapped response from TransformInterceptor
      const categoriesData = response.data.data || response.data;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      translations: {
        en: { name: '', description: '' },
        ru: { name: '', description: '' },
        ar: { name: '', description: '' },
      },
    });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    const translations = (category as any).translations || {};
    setFormData({
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl || '',
      translations: {
        en: translations.en || { name: category.name, description: category.description || '' },
        ru: translations.ru || { name: category.name, description: category.description || '' },
        ar: translations.ar || { name: category.name, description: category.description || '' },
      },
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      translations: {
        en: { name: '', description: '' },
        ru: { name: '', description: '' },
        ar: { name: '', description: '' },
      },
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        name: formData.name,
        description: formData.description,
        slug: generateSlug(formData.name),
        imageUrl: formData.imageUrl || undefined,
        translations: formData.translations,
      };

      if (editingCategory) {
        // Update existing category
        await api.patch(`/categories/${editingCategory.id}`, dataToSend);
        addNotification('Category updated successfully', 'success');
      } else {
        // Create new category
        await api.post('/categories', dataToSend);
        addNotification('Category created successfully', 'success');
      }
      
      fetchCategories();
      closeModal();
    } catch (error) {
      addNotification(
        editingCategory ? 'Failed to update category' : 'Failed to create category',
        'error'
      );
      console.error('Failed to save category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    try {
      await api.delete(`/categories/${category.id}`);
      addNotification('Category deleted successfully', 'success');
      fetchCategories();
    } catch (error) {
      addNotification('Failed to delete category', 'error');
      console.error('Failed to delete category:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <button 
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow p-6">
            <img
              src={category.imageUrl || 'https://via.placeholder.com/300'}
              alt={category.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-500 mt-2">{category.description}</p>
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => openEditModal(category)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button 
                onClick={() => handleDelete(category)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (Default - English)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Default - English)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Category description"
                  required
                />
              </div>

              {/* Translations */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Translations</h3>
                
                {(['en', 'ru', 'ar'] as const).map((lang) => (
                  <div key={lang} className="mb-6 p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium mb-3 text-gray-700">
                      {lang === 'en' ? 'English' : lang === 'ru' ? 'Русский' : 'العربية'}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name ({lang.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          value={formData.translations[lang].name}
                          onChange={(e) => setFormData({
                            ...formData,
                            translations: {
                              ...formData.translations,
                              [lang]: {
                                ...formData.translations[lang],
                                name: e.target.value,
                              },
                            },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Category name in ${lang}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description ({lang.toUpperCase()})
                        </label>
                        <textarea
                          value={formData.translations[lang].description}
                          onChange={(e) => setFormData({
                            ...formData,
                            translations: {
                              ...formData.translations,
                              [lang]: {
                                ...formData.translations[lang],
                                description: e.target.value,
                              },
                            },
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Category description in ${lang}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
