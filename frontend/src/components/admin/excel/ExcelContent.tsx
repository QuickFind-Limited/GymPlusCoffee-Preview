
import React from 'react';
import { FileSpreadsheet, Upload, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ExcelFile {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  syncStatus: 'synced' | 'syncing' | 'error';
  lastSync?: string;
  syncProgress?: number;
}

interface ExcelContentProps {
  excelFiles: ExcelFile[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDelete: (id: string) => void;
}

const ExcelContent: React.FC<ExcelContentProps> = ({
  excelFiles,
  onFileUpload,
  onFileDelete
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Excel Spreadsheets</h3>
          <p className="text-gray-500 mt-1">Upload and sync Excel files for procurement data</p>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            onChange={onFileUpload} 
            className="hidden" 
            id="excel-upload" 
          />
          <Button asChild variant="ghost" className="text-gray-600 hover:text-gray-800 hover:bg-gray-50">
            <label htmlFor="excel-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </label>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {excelFiles.map(file => (
          <div key={file.id} className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="h-8 w-8 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">{file.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Uploaded: {file.uploadDate} • Size: {file.size}
                  </p>
                  {file.lastSync && (
                    <p className="text-sm text-gray-400 mt-1">Last synced: {file.lastSync}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {file.syncStatus === 'syncing' && file.syncProgress !== undefined && (
                  <div className="text-sm text-gray-500">
                    Uploading... {file.syncProgress}%
                  </div>
                )}
                {file.syncStatus === 'synced' && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Check className="h-4 w-4" />
                    Synced
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-50" 
                  onClick={() => onFileDelete(file.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
            
            {file.syncStatus === 'syncing' && file.syncProgress !== undefined && (
              <div className="mt-4">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-gray-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${file.syncProgress}%` }} 
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {excelFiles.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-lg p-12 text-center">
          <FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto mb-6" />
          <h3 className="text-lg font-medium text-gray-600 mb-3">No Excel files uploaded</h3>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto">
            Upload Excel spreadsheets to sync procurement data
          </p>
          <Input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            onChange={onFileUpload} 
            className="hidden" 
            id="excel-upload-empty" 
          />
          <Button asChild variant="ghost" className="text-gray-600 hover:text-gray-800 hover:bg-gray-50">
            <label htmlFor="excel-upload-empty" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Excel File
            </label>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExcelContent;
