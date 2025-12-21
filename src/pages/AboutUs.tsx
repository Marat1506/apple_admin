import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface AboutUs {
  id: string;
  key: string;
  translations: {
    en?: Record<string, any>;
    ru?: Record<string, any>;
    ar?: Record<string, any>;
  };
}

export default function AboutUsPage() {
  const { addNotification } = useNotification();
  const [aboutUsSections, setAboutUsSections] = useState<AboutUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<AboutUs | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    translations: {
      en: {} as Record<string, any>,
      ru: {} as Record<string, any>,
      ar: {} as Record<string, any>,
    },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAboutUs();
  }, []);

  const fetchAboutUs = async () => {
    try {
      const response = await api.get('/settings/about-us');
      const sectionsData = response.data.data || response.data;
      setAboutUsSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (error) {
      console.error('Failed to fetch About Us sections:', error);
      setAboutUsSections([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSection(null);
    setFormData({
      key: '',
      translations: {
        en: {},
        ru: {},
        ar: {},
      },
    });
    setShowModal(true);
  };

  const openEditModal = (section: AboutUs) => {
    setEditingSection(section);
    const translations = section.translations || {};
    setFormData({
      key: section.key,
      translations: {
        en: translations.en || {},
        ru: translations.ru || {},
        ar: translations.ar || {},
      },
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSection(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        key: formData.key,
        translations: formData.translations,
      };

      if (editingSection) {
        await api.put(`/settings/about-us/${editingSection.key}`, dataToSend);
        addNotification('About Us section updated successfully', 'success');
      } else {
        await api.post('/settings/about-us', dataToSend);
        addNotification('About Us section created successfully', 'success');
      }
      
      fetchAboutUs();
      closeModal();
    } catch (error) {
      addNotification(
        editingSection ? 'Failed to update About Us section' : 'Failed to create About Us section',
        'error'
      );
      console.error('Failed to save About Us section:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      await api.delete(`/settings/about-us/${key}`);
      addNotification('About Us section deleted successfully', 'success');
      fetchAboutUs();
    } catch (error) {
      addNotification('Failed to delete About Us section', 'error');
      console.error('Failed to delete About Us section:', error);
    }
  };

  const updateTranslation = (lang: 'en' | 'ru' | 'ar', field: string, value: any) => {
    setFormData({
      ...formData,
      translations: {
        ...formData.translations,
        [lang]: {
          ...formData.translations[lang],
          [field]: value,
        },
      },
    });
  };

  const getTranslationValue = (lang: 'en' | 'ru' | 'ar', field: string): string => {
    return formData.translations[lang]?.[field] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Common fields for About Us sections
  const commonFields = ['title', 'subtitle', 'description', 'content'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">About Us Management</h1>
        <p className="text-gray-600 mt-2">Manage About Us page content</p>
      </div>

      <div className="mb-6">
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Section
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title (EN)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {aboutUsSections.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No sections found
                  </td>
                </tr>
              ) : (
                aboutUsSections.map((section) => (
                  <tr key={section.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {section.key}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {section.translations?.en?.title || section.translations?.en?.subtitle || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(section)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(section.key)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingSection ? 'Edit About Us Section' : 'Add About Us Section'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key (e.g., 'main', 'features', 'services', 'contact')
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!!editingSection}
                />
              </div>

              {/* English */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">English</h3>
                <div className="space-y-4">
                  {commonFields.map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {field}
                      </label>
                      {field === 'description' || field === 'content' ? (
                        <textarea
                          value={getTranslationValue('en', field)}
                          onChange={(e) => updateTranslation('en', field, e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="text"
                          value={getTranslationValue('en', field)}
                          onChange={(e) => updateTranslation('en', field, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Russian */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Russian</h3>
                <div className="space-y-4">
                  {commonFields.map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {field}
                      </label>
                      {field === 'description' || field === 'content' ? (
                        <textarea
                          value={getTranslationValue('ru', field)}
                          onChange={(e) => updateTranslation('ru', field, e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="text"
                          value={getTranslationValue('ru', field)}
                          onChange={(e) => updateTranslation('ru', field, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Arabic */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Arabic</h3>
                <div className="space-y-4">
                  {commonFields.map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {field}
                      </label>
                      {field === 'description' || field === 'content' ? (
                        <textarea
                          value={getTranslationValue('ar', field)}
                          onChange={(e) => updateTranslation('ar', field, e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="text"
                          value={getTranslationValue('ar', field)}
                          onChange={(e) => updateTranslation('ar', field, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSection ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

