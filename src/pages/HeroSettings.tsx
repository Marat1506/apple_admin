import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useNotification } from '../context/NotificationContext';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

interface HeroSettings {
  id: string;
  key: string;
  value: {
    image: string | null;
  };
}

const HeroSettings: React.FC = () => {
  const { addNotification } = useNotification();
  const [settings, setSettings] = useState<HeroSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/hero');
      // Handle wrapped response from TransformInterceptor
      const settingsData = response.data.data || response.data;
      console.log('Hero settings loaded:', settingsData);
      console.log('Image URL will be:', `${API_BASE_URL}${settingsData?.value?.image}`);
      setSettings(settingsData);
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      // Показываем ошибку только если это не проблема с авторизацией
      if (error.response?.status !== 401) {
        console.warn('Settings not found or error loading settings');
      }
    } finally {
      setLoading(false);
    }
  };



  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addNotification('Please select an image file', 'error');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification('Image size must be less than 5MB', 'error');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      await api.post('/settings/hero/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      addNotification('Image uploaded successfully', 'success');
      fetchSettings();
    } catch (error) {
      addNotification('Failed to upload image', 'error');
      console.error('Failed to upload image:', error);
    } finally {
      setUploading(false);
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hero Section Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage the main banner on your homepage
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Hero Image</h2>
          
          {/* Current Image */}
          {settings?.value.image && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Image:</p>
              <img
                src={`${API_BASE_URL}${settings.value.image}`}
                alt="Hero"
                className="w-full h-48 object-cover rounded-lg border"
                onError={(e) => {
                  console.error('Failed to load image:', `${API_BASE_URL}${settings.value.image}`);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Upload New Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload New Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
              >
                <div className="text-gray-600">
                  <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm">
                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-6">Preview</h2>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white relative overflow-hidden">
          {settings?.value.image && (
            <img
              src={`${API_BASE_URL}${settings.value.image}`}
              alt="Hero background"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
              onError={(e) => {
                console.error('Failed to load preview image:', `${API_BASE_URL}${settings.value.image}`);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          )}
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">Welcome to Dubliz</h1>
            <p className="text-xl mb-6 opacity-90">Discover premium Apple products</p>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Shop Now
            </button>
            <p className="text-sm mt-4 opacity-75">
              * Text content is managed through translation files and will display in the user's selected language
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSettings;