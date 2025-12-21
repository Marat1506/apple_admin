import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface FAQ {
  id: string;
  category: string;
  order: number;
  translations: {
    en?: { question: string; answer: string; category: string };
    ru?: { question: string; answer: string; category: string };
    ar?: { question: string; answer: string; category: string };
  };
}

export default function FAQPage() {
  const { addNotification } = useNotification();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    order: 0,
    translations: {
      en: { question: '', answer: '', category: '' },
      ru: { question: '', answer: '', category: '' },
      ar: { question: '', answer: '', category: '' },
    },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await api.get('/settings/faq');
      const faqsData = response.data.data || response.data;
      setFaqs(Array.isArray(faqsData) ? faqsData : []);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingFAQ(null);
    setFormData({
      category: '',
      order: 0,
      translations: {
        en: { question: '', answer: '', category: '' },
        ru: { question: '', answer: '', category: '' },
        ar: { question: '', answer: '', category: '' },
      },
    });
    setShowModal(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFAQ(faq);
    const translations = faq.translations || {};
    setFormData({
      category: faq.category,
      order: faq.order || 0,
      translations: {
        en: translations.en || { question: '', answer: '', category: '' },
        ru: translations.ru || { question: '', answer: '', category: '' },
        ar: translations.ar || { question: '', answer: '', category: '' },
      },
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFAQ(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        category: formData.category,
        order: formData.order,
        translations: formData.translations,
      };

      if (editingFAQ) {
        await api.put(`/settings/faq/${editingFAQ.id}`, dataToSend);
        addNotification('FAQ updated successfully', 'success');
      } else {
        await api.post('/settings/faq', dataToSend);
        addNotification('FAQ created successfully', 'success');
      }
      
      fetchFAQs();
      closeModal();
    } catch (error) {
      addNotification(
        editingFAQ ? 'Failed to update FAQ' : 'Failed to create FAQ',
        'error'
      );
      console.error('Failed to save FAQ:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }

    try {
      await api.delete(`/settings/faq/${id}`);
      addNotification('FAQ deleted successfully', 'success');
      fetchFAQs();
    } catch (error) {
      addNotification('Failed to delete FAQ', 'error');
      console.error('Failed to delete FAQ:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
        <p className="text-gray-600 mt-2">Manage frequently asked questions</p>
      </div>

      <div className="mb-6">
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add FAQ
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question (EN)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No FAQs found
                  </td>
                </tr>
              ) : (
                faqs.map((faq) => (
                  <tr key={faq.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {faq.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {faq.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {faq.translations?.en?.question || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditModal(faq)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
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
                {editingFAQ ? 'Edit FAQ' : 'Add FAQ'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <input
                    type="text"
                    value={formData.order === 0 ? '' : formData.order}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData({ ...formData, order: 0 });
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue)) {
                          setFormData({ ...formData, order: numValue });
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* English */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">English</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question
                    </label>
                    <input
                      type="text"
                      value={formData.translations.en.question}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            en: {
                              ...formData.translations.en,
                              question: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer
                    </label>
                    <textarea
                      value={formData.translations.en.answer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            en: {
                              ...formData.translations.en,
                              answer: e.target.value,
                            },
                          },
                        })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category (EN)
                    </label>
                    <input
                      type="text"
                      value={formData.translations.en.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            en: {
                              ...formData.translations.en,
                              category: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Russian */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Russian</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question
                    </label>
                    <input
                      type="text"
                      value={formData.translations.ru.question}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            ru: {
                              ...formData.translations.ru,
                              question: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer
                    </label>
                    <textarea
                      value={formData.translations.ru.answer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            ru: {
                              ...formData.translations.ru,
                              answer: e.target.value,
                            },
                          },
                        })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category (RU)
                    </label>
                    <input
                      type="text"
                      value={formData.translations.ru.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            ru: {
                              ...formData.translations.ru,
                              category: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Arabic */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Arabic</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question
                    </label>
                    <input
                      type="text"
                      value={formData.translations.ar.question}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            ar: {
                              ...formData.translations.ar,
                              question: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer
                    </label>
                    <textarea
                      value={formData.translations.ar.answer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            ar: {
                              ...formData.translations.ar,
                              answer: e.target.value,
                            },
                          },
                        })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category (AR)
                    </label>
                    <input
                      type="text"
                      value={formData.translations.ar.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          translations: {
                            ...formData.translations,
                            ar: {
                              ...formData.translations.ar,
                              category: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
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
                  {saving ? 'Saving...' : editingFAQ ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

