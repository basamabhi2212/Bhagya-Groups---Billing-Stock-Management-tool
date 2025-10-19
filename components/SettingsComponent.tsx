import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { Button, Input, Card } from './common';
import { SunIcon, MoonIcon } from './icons';

interface SettingsComponentProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  isSyncing: boolean;
}

const FileInput = ({ label, currentImage, onFileChange, onRemove, name }: { label: string, currentImage: string | null, onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onRemove: () => void, name: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <div className="flex items-center space-x-4">
            {currentImage ? 
                <img src={currentImage} alt={label} className="h-16 w-auto object-contain bg-gray-200 dark:bg-gray-700 p-1 rounded-md border border-gray-300 dark:border-gray-600" /> :
                <div className="h-16 w-24 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-xs text-gray-400 rounded-md">No Image</div>
            }
            <div className="flex flex-col space-y-2">
                 <label htmlFor={name} className="cursor-pointer bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                    {currentImage ? 'Change' : 'Upload'}
                </label>
                <input id={name} name={name} type="file" className="sr-only" accept="image/*" onChange={onFileChange} />
                {currentImage && <button type="button" onClick={onRemove} className="text-left text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>}
            </div>
        </div>
    </div>
);


export const SettingsComponent: React.FC<SettingsComponentProps> = ({ settings, onSave, isSyncing }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    if (keys.length > 1) {
      setLocalSettings(prev => ({
        ...prev,
        companyDetails: {
          ...prev.companyDetails,
          [keys[1]]: value,
        },
      }));
    } else {
      setLocalSettings(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoBase64' | 'watermarkBase64') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClick = () => {
    onSave(localSettings);
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h1>

      <Card>
        <h2 className="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-700">Company Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <Input label="Company Name" name="companyDetails.name" value={localSettings.companyDetails.name} onChange={handleChange} />
          <Input label="GSTIN" name="companyDetails.gstin" value={localSettings.companyDetails.gstin} onChange={handleChange} />
          <Input label="Address Line 1" name="companyDetails.address1" value={localSettings.companyDetails.address1} onChange={handleChange} />
          <Input label="Address Line 2" name="companyDetails.address2" value={localSettings.companyDetails.address2} onChange={handleChange} />
          <Input label="Email" type="email" name="companyDetails.email" value={localSettings.companyDetails.email} onChange={handleChange} />
          <Input label="Contact Number" name="companyDetails.contact" value={localSettings.companyDetails.contact} onChange={handleChange} />
        </div>
      </Card>
      
      <Card>
        <h2 className="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-700">Branding</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
             <FileInput
                label="Company Logo"
                currentImage={localSettings.logoBase64}
                onFileChange={(e) => handleFileChange(e, 'logoBase64')}
                onRemove={() => setLocalSettings(prev => ({...prev, logoBase64: null}))}
                name="logo-upload"
             />
             <FileInput
                label="Watermark Logo"
                currentImage={localSettings.watermarkBase64}
                onFileChange={(e) => handleFileChange(e, 'watermarkBase64')}
                onRemove={() => setLocalSettings(prev => ({...prev, watermarkBase64: null}))}
                name="watermark-upload"
             />
         </div>
      </Card>
      
       <Card>
          <h2 className="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-700">Application Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              <Input label="Invoice Prefix" name="invoicePrefix" value={localSettings.invoicePrefix} onChange={handleChange} />
              <Input label="Low Stock Threshold" type="number" name="lowStockThreshold" value={localSettings.lowStockThreshold} onChange={handleNumericChange} />
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                  <div className="mt-2 flex space-x-2">
                       <Button type="button" variant={localSettings.theme === 'light' ? 'primary' : 'secondary'} onClick={() => setLocalSettings(p => ({...p, theme: 'light'}))} className="flex items-center space-x-2 w-full justify-center">
                          <SunIcon className="w-5 h-5" /> <span>Light</span>
                       </Button>
                       <Button type="button" variant={localSettings.theme === 'dark' ? 'primary' : 'secondary'} onClick={() => setLocalSettings(p => ({...p, theme: 'dark'}))} className="flex items-center space-x-2 w-full justify-center">
                          <MoonIcon className="w-5 h-5" /> <span>Dark</span>
                       </Button>
                  </div>
              </div>
          </div>
      </Card>
      
      <Card>
          <h2 className="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-700">GitHub Cloud Storage</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 my-4">
              Store all your application data securely in a private GitHub repository. You'll need to create a Personal Access Token with 'repo' scope.
          </p>
          <div className="space-y-4">
            <Input label="GitHub Personal Access Token" type="password" name="githubToken" value={localSettings.githubToken} onChange={handleChange} placeholder="Enter your token" />
            <Input label="GitHub Repository" name="githubRepo" value={localSettings.githubRepo} onChange={handleChange} placeholder="e.g., your-username/your-repo-name" />
          </div>
      </Card>
      
       <div className="flex justify-end pt-4">
          <Button onClick={handleSaveClick} disabled={isSyncing}>
              {isSyncing ? 'Saving...' : 'Save Settings'}
          </Button>
      </div>
    </div>
  );
};
