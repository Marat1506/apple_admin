import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  categoryId?: string;
  images: string[];
  stock: number;
  featured: boolean;
  badge?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function Products() {
  const { addNotification } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    images: [''],
    stock: '',
    featured: false,
    badge: '',
    specs: {} as Record<string, any>,
    variants: {
      colors: [] as string[],
      storage: [] as string[],
      versions: [] as string[],
    },
    translations: {
      en: { name: '', description: '' },
      ru: { name: '', description: '' },
      ar: { name: '', description: '' },
    },
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      // Handle wrapped response from TransformInterceptor
      const productsData = response.data.data || response.data;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      const categoriesData = response.data.data || response.data;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      images: [''],
      stock: '',
      featured: false,
      badge: '',
      specs: {},
      variants: {
        colors: [],
        storage: [],
        versions: [],
      },
      translations: {
        en: { name: '', description: '' },
        ru: { name: '', description: '' },
        ar: { name: '', description: '' },
      },
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const translations = (product as any).translations || {};
    const specs = (product as any).specs || {};
    const variants = (product as any).variants || { colors: [], storage: [], versions: [] };
    
    // Преобразуем цвета из старого формата (объекты) в новый (строки)
    let colors = variants.colors || [];
    if (colors.length > 0 && typeof colors[0] === 'object' && colors[0].name) {
      // Старый формат: [{ id, name, hex }] -> новый формат: [name]
      colors = colors.map((color: any) => color.name);
    }
    
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      categoryId: product.categoryId || '',
      images: product.images.length > 0 ? product.images : [''],
      stock: product.stock.toString(),
      featured: product.featured,
      badge: product.badge || '',
      specs: specs,
      variants: {
        colors: colors,
        storage: variants.storage || [],
        versions: variants.versions || [],
      },
      translations: {
        en: translations.en || { name: product.name, description: product.description || '' },
        ru: translations.ru || { name: product.name, description: product.description || '' },
        ar: translations.ar || { name: product.name, description: product.description || '' },
      },
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Обрабатываем variants - разделяем строки с запятыми на отдельные элементы
      const processedVariants = {
        colors: formData.variants.colors
          .flatMap(color => color.split(',').map(c => c.trim()))
          .filter(color => color !== ''),
        storage: formData.variants.storage
          .flatMap(storage => storage.split(',').map(s => s.trim()))
          .filter(storage => storage !== ''),
        versions: formData.variants.versions
          .flatMap(version => version.split(',').map(v => v.trim()))
          .filter(version => version !== ''),
      };

      const dataToSend = {
        name: formData.name,
        description: formData.description,
        slug: generateSlug(formData.name),
        images: formData.images.filter(img => img.trim() !== ''),
        price: Number(formData.price) || 0,
        stock: Number(formData.stock) || 0,
        categoryId: formData.categoryId || undefined,
        featured: formData.featured,
        badge: formData.badge || undefined,
        specs: formData.specs,
        variants: processedVariants,
        translations: formData.translations,
      };

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, dataToSend);
        addNotification('Product updated successfully', 'success');
      } else {
        await api.post('/products', dataToSend);
        addNotification('Product created successfully', 'success');
      }
      
      fetchProducts();
      closeModal();
    } catch (error) {
      addNotification(
        editingProduct ? 'Failed to update product' : 'Failed to create product',
        'error'
      );
      console.error('Failed to save product:', error);
    } finally {
      setSaving(false);
    }
  };

  const addImageField = () => {
    setFormData({
      ...formData,
      images: [...formData.images, '']
    });
  };

  const removeImageField = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: newImages.length > 0 ? newImages : ['']
    });
  };

  const updateImageField = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({
      ...formData,
      images: newImages
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        addNotification('Please select only image files', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        addNotification('Image size must be less than 5MB', 'error');
        return;
      }
    }

    setUploadingImages(true);

    try {
      const formDataToSend = new FormData();
      Array.from(files).forEach((file) => {
        formDataToSend.append('images', file);
      });

      const response = await api.post('/products/images', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedImages = response.data.data?.images || response.data.images || [];
      const currentImages = formData.images.filter(img => img !== '');
      setFormData({
        ...formData,
        images: [...currentImages, ...uploadedImages]
      });

      addNotification(`${uploadedImages.length} image(s) uploaded successfully`, 'success');
    } catch (error) {
      addNotification('Failed to upload images', 'error');
      console.error('Failed to upload images:', error);
    } finally {
      setUploadingImages(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      addNotification('Product deleted successfully', 'success');
      fetchProducts();
    } catch (error) {
      addNotification('Failed to delete product', 'error');
      console.error('Failed to delete product:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <button 
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img
                      src={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAyMEMyNi4zODA3IDIwIDI3LjUgMTguODgwNyAyNy41IDE3LjVDMjcuNSAxNi4xMTkzIDI2LjM4MDcgMTUgMjUgMTVDMjMuNjE5MyAxNSAyMi41IDE2LjExOTMgMjIuNSAxNy41QzIyLjUgMTguODgwNyAyMy42MTkzIDIwIDI1IDIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzUgMzVIMTVMMjAgMjVMMjUgMzBMMzAgMjBMMzUgMzVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='}
                      alt={product.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">${product.price}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.stock}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button 
                    onClick={() => openEditModal(product)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
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
                  placeholder="Product description"
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
                          placeholder={`Product name in ${lang}`}
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
                          placeholder={`Product description in ${lang}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                
                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                      className="hidden"
                      id="product-images-upload"
                    />
                    <label
                      htmlFor="product-images-upload"
                      className={`cursor-pointer ${uploadingImages ? 'opacity-50' : ''}`}
                    >
                      <div className="text-gray-600">
                        <svg className="mx-auto h-8 w-8 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-sm">
                          {uploadingImages ? 'Uploading...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 5MB each (multiple files supported)
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Image URLs (for external images) */}
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or enter image URLs
                  </label>
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => updateImageField(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImageField}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add another URL
                  </button>
                </div>

                {/* Preview uploaded images */}
                {formData.images.filter(img => img !== '').length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview ({formData.images.filter(img => img !== '').length} image(s)):</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.images.filter(img => img !== '').map((image, index) => (
                        <div key={index} className="relative w-20 h-20 border border-gray-300 rounded overflow-hidden">
                          <img
                            src={image.startsWith('http') ? image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${image}`}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Badge
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New, Sale, etc."
                  />
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Featured Product
                  </label>
                </div>
              </div>

              {/* Product Specifications */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Product Specifications</h3>
                <div className="space-y-3">
                  {Object.entries(formData.specs).map(([key, value], index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newSpecs = { ...formData.specs };
                          delete newSpecs[key];
                          newSpecs[e.target.value] = value;
                          setFormData({ ...formData, specs: newSpecs });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Specification name (e.g., Display, Processor)"
                      />
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => {
                          const newSpecs = { ...formData.specs };
                          newSpecs[key] = e.target.value;
                          setFormData({ ...formData, specs: newSpecs });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Specification value"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = { ...formData.specs };
                          delete newSpecs[key];
                          setFormData({ ...formData, specs: newSpecs });
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newSpecs = { ...formData.specs };
                      newSpecs[`spec_${Date.now()}`] = '';
                      setFormData({ ...formData, specs: newSpecs });
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add specification
                  </button>
                </div>
              </div>

              {/* Product Variants */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Product Variants</h3>
                
                {/* Storage Options */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Options
                  </label>
                  <div className="space-y-2">
                    {formData.variants.storage.map((storage, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={storage}
                          onChange={(e) => {
                            const newStorage = [...formData.variants.storage];
                            newStorage[index] = e.target.value;
                            setFormData({
                              ...formData,
                              variants: { ...formData.variants, storage: newStorage }
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 128GB, 256GB, 512GB or multiple: 128GB, 256GB"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newStorage = formData.variants.storage.filter((_, i) => i !== index);
                            setFormData({
                              ...formData,
                              variants: { ...formData.variants, storage: newStorage }
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          variants: { 
                            ...formData.variants, 
                            storage: [...formData.variants.storage, ''] 
                          }
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add storage option
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Options
                  </label>
                  <div className="space-y-2">
                    {formData.variants.colors.map((color, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...formData.variants.colors];
                            newColors[index] = e.target.value;
                            setFormData({
                              ...formData,
                              variants: { ...formData.variants, colors: newColors }
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Color name (e.g., Space Gray, Silver, Gold) or multiple: Silver, Gold, Red"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newColors = formData.variants.colors.filter((_, i) => i !== index);
                            setFormData({
                              ...formData,
                              variants: { ...formData.variants, colors: newColors }
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          variants: { 
                            ...formData.variants, 
                            colors: [...formData.variants.colors, ''] 
                          }
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add color option
                    </button>
                  </div>
                </div>

                {/* Versions */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Versions
                  </label>
                  <div className="space-y-2">
                    {formData.variants.versions.map((version, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={version}
                          onChange={(e) => {
                            const newVersions = [...formData.variants.versions];
                            newVersions[index] = e.target.value;
                            setFormData({
                              ...formData,
                              variants: { ...formData.variants, versions: newVersions }
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Standard, Pro, Max or multiple: Standard, Pro"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newVersions = formData.variants.versions.filter((_, i) => i !== index);
                            setFormData({
                              ...formData,
                              variants: { ...formData.variants, versions: newVersions }
                            });
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          variants: { 
                            ...formData.variants, 
                            versions: [...formData.variants.versions, ''] 
                          }
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add version
                    </button>
                  </div>
                </div>
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
                  {saving ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
